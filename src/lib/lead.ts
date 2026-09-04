import type { MouseEvent } from "react";

/**
 * ============================================================================
 * COMO O PIXEL DA META CARREGA — e por que é assim
 * ============================================================================
 *
 * O contrato mora aqui, e não no index.html, por um motivo prático: o Vite
 * **não minifica script inline**, então cada linha escrita naquele bloco viaja
 * comprimida em TODA página, para sempre. Aqui é código compilado — comentário
 * some no build e sai de graça. Mexeu no bloco do index.html? A explicação
 * atualizada é esta.
 *
 * A REGRA: a fila existe desde o primeiro instante; o SDK pesado chega depois.
 *
 * O stub — o objeto `fbq` que só empilha chamadas numa fila — é criado de
 * forma SÍNCRONA no index.html. Só a inserção do `<script src=…>` fica
 * adiada, para o SDK não disputar banda e processador com a primeira pintura.
 *
 * POR QUE É ASSIM (26/08/2026). Até essa data o stub era criado DENTRO da
 * função adiada. Enquanto ela não rodava, `window.fbq` não existia — e o
 * `trackLead`, logo abaixo, checa `typeof window.fbq === "function"` antes de
 * disparar. Resultado: quem caísse na página e apertasse o botão do WhatsApp
 * antes do respiro do navegador tinha a conversão **descartada em silêncio**.
 * Sem erro no console, sem teste caindo: só um lead a menos no painel,
 * semanas depois. E atinge justamente o visitante que chega convencido e
 * aperta na hora — o melhor que o anúncio compra.
 *
 * Ter fila é como a Meta projetou o próprio trecho: o `n.queue` existe para
 * isto. O que estava errado era só o LUGAR dele.
 * ⚠️ Adiar pixel é adiar o SDK, nunca o stub.
 *
 * QUANDO O SDK É BAIXADO — no que vier primeiro, uma vez só:
 *
 *  1. o primeiro `pointerdown`. O toque é o aviso de que um clique no botão do
 *     WhatsApp vem a caminho; adiantar o download ali dá ao SDK o tempo do
 *     toque inteiro de vantagem sobre os 250 ms que seguramos antes de abrir
 *     o WhatsApp (ver ESPERA_ANTES_DE_NAVEGAR_MS);
 *  2. o `requestIdleCallback`;
 *  3. um `setTimeout` de 3 s. Rede de segurança: **em aba oculta o
 *     `requestIdleCallback` pode simplesmente nunca rodar**, e sem o relógio
 *     até o `PageView` se perdia.
 *
 * Guardado por src/test/pixels.test.ts, que roda o script inline LIDO DO
 * index.html de verdade — testar uma cópia do trecho não pegaria nada, porque
 * o defeito estava no arquivo.
 *
 * ----------------------------------------------------------------------------
 * O PIXEL DO OPENAI ADS SAIU DAQUI em 28/08/2026, a pedido dele, ao parar de
 * anunciar pela OpenAI. Se um dia voltar: o histórico do git tem o código
 * inteiro, e o [[promofy-gotchas]] guarda as armadilhas que já custaram caro —
 * em especial o `oppref`, o identificador de clique sem o qual a conversão é
 * aceita com HTTP 202 e mesmo assim fica órfã, sem alimentar a campanha.
 * ============================================================================
 */

declare global {
  interface Window {
    /** Pixel da Meta. O index.html cria o stub com fila de forma SÍNCRONA, então
     *  daqui isto é sempre uma função — mesmo antes de o SDK ter chegado. */
    fbq?: (...args: unknown[]) => void;
    /** Posto pelo index.html: diz se o SDK já terminou de carregar. Existe só
     *  para o log abaixo poder separar "enfileirado" de "entregue" — com o stub
     *  sempre no ar, `typeof window.fbq === "function"` virou sempre verdadeiro
     *  e sozinho não informa mais nada. */
    __promofyPixels?: { meta: boolean };
  }
}

// Grupo vigente, confirmado por ele em 24/08/2026. O anterior
// (CeIkFA6dIzIKN91j5dzS7o) está morto — não voltar a usar.
// Por alguns dias existiu um WHATSAPP_GROUP_LANDING separado, criado porque
// não estava claro se o link novo valia para o site inteiro ou só para a
// landing. Vale para tudo, então voltou a ser uma constante só.
export const WHATSAPP_GROUP = "https://chat.whatsapp.com/ByF67GiEh9k3gq2XfoyUBs";

/**
 * Grupo do nicho de casa e construção, mandado por ele em 03/09/2026 — é um
 * grupo DIFERENTE do geral, e é essa separação que dá sentido à página própria.
 * Por algumas horas esta constante apontou para o WHATSAPP_GROUP enquanto o
 * grupo não existia; não voltar a fazer isso, porque despejaria o público de
 * obra no grupo geral sem ninguém perceber.
 */
export const WHATSAPP_GROUP_CONSTRUCAO = "https://chat.whatsapp.com/CtzBP0DO22h3xYCtyopQTj";
export const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7qoOCFXUuQyXWHEV0U";

// Contador global para auditoria — garante que cada clique dispare exatamente 1 Lead
let __leadFireCount = 0;

/**
 * Janela que a gente segura antes de abrir o WhatsApp, para o beacon do pixel
 * sair. Existe porque no celular a troca de app pode descartar requisição
 * pendente.
 *
 * Medido no navegador: a Meta dispara na hora, **~10-14 ms depois do clique**,
 * então cabe folgado nos 250 ms. Não esticamos essa espera: mais de um segundo
 * de tela parada logo depois do toque é o pior lugar possível para uma pausa.
 *
 * E não precisamos esticar nem para o caso de o SDK ainda não ter chegado: o
 * index.html começa a baixar no primeiro `pointerdown`, que acontece ANTES do
 * clique. E se mesmo assim não tiver chegado, a chamada fica na fila do stub e
 * sobe quando ele carregar — não se perde.
 */
const ESPERA_ANTES_DE_NAVEGAR_MS = 250;

const BEACON_META = /facebook\.com\/tr/;

/** Quanto tempo esperamos pelo beacon antes de desistir de observar. */
const OBSERVAR_BEACON_POR_MS = 4000;

/**
 * Estágio 2 da auditoria: registra no console QUANDO a requisição do pixel de
 * fato termina, e não apenas quando a função foi chamada.
 *
 * A distinção não é preciosismo. Entre "chamei o SDK" e "a plataforma
 * contabilizou a conversão" existem, no mínimo: o envio, a ingestão da
 * plataforma, a deduplicação e a janela de atribuição. Daqui de dentro do
 * navegador dá para observar SÓ até o envio — e nem o status HTTP, porque a
 * resposta é cross-origin sem Timing-Allow-Origin. Por isso o log fala
 * "requisição concluída", nunca "conversão registrada": afirmar o segundo a
 * partir do primeiro seria inventar.
 *
 * É diagnóstico de desenvolvimento: no celular a aba já foi para o fundo e
 * ninguém está lendo console. Não altera o disparo em nada.
 */
const observarBeacons = () => {
  if (typeof PerformanceObserver === "undefined") return;

  const t0 = performance.now();
  let encerrado = false;

  const encerrar = (observador: PerformanceObserver, viu: boolean) => {
    if (encerrado) return;
    encerrado = true;
    observador.disconnect();
    if (!viu) {
      console.info(
        `[Lead] meta: nenhuma requisição observada em ${OBSERVAR_BEACON_POR_MS} ms. Pode ter saído depois da aba ficar oculta — o que é o normal no celular.`,
      );
    }
  };

  const observador = new PerformanceObserver((lista) => {
    for (const entrada of lista.getEntries()) {
      if (!BEACON_META.test(entrada.name)) continue;
      console.info(
        `[Lead] meta: requisição concluída ${Math.round(entrada.startTime - t0)} ms após o clique (status HTTP não é visível daqui — cross-origin).`,
      );
      encerrar(observador, true);
      return;
    }
  });

  observador.observe({ type: "resource", buffered: false });
  window.setTimeout(() => encerrar(observador, false), OBSERVAR_BEACON_POR_MS);
};

/**
 * Dispara a conversão no pixel e só então abre o link.
 *
 * A conversão do site é UMA só — "clicou no botão para entrar no grupo" — e é
 * reportada como "Lead" na Meta. Manter o disparo num ponto único é o que
 * impede que uma página evolua e a outra fique para trás.
 *
 * Não há envio pela Conversions API: seria server-side e exigiria uma chave
 * secreta, que num site estático ficaria exposta no código-fonte para qualquer
 * visitante forjar conversões.
 */
export const trackLead = (
  e?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  href?: string,
) => {
  const temFbq = typeof window !== "undefined" && typeof window.fbq === "function";
  let eventID: string | null = null;

  if (temFbq) {
    eventID = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.fbq!("track", "Lead", { content_name: href ?? "unknown" }, { eventID });
    __leadFireCount += 1;
  }

  // Com o stub síncrono no index.html, a pergunta "o pixel existe?" virou
  // sempre sim. O que ainda varia — e é o que interessa quando faltar lead no
  // painel — é se a chamada FOI PARA O SDK ou apenas para a fila, esperando
  // ele chegar. Fila não é perda: ela sobe assim que o SDK carrega. Perda era
  // o que acontecia antes, quando não havia nem stub nem fila e a chamada era
  // descartada aqui mesmo. Nos três casos, nada saiu do navegador ainda — ver
  // observarBeacons().
  const sdkPronto = window.__promofyPixels?.meta;
  const situacao = !temFbq ? "INDISPONIVEL" : sdkPronto ? "entregue ao SDK" : "enfileirado";

  console.info(
    `[Lead] clique #${__leadFireCount} — meta=${situacao} eventID=${eventID ?? "n/a"} href=${href ?? "n/a"}`,
  );
  observarBeacons();

  // Com o stub síncrono no index.html, cair aqui deixou de ser questão de
  // tempo e passou a significar que o script inline NÃO RODOU: bloqueador de
  // anúncios, CSP, ou alguém mexeu no index.html.
  if (!temFbq) {
    console.warn("[Lead] fbq indisponível — o stub do index.html não rodou (bloqueador? CSP?)");
  }

  // Garante que o evento seja enviado antes de navegar (especialmente no
  // mobile, onde abrir o WhatsApp pode descartar requisições pendentes).
  if (e && href) {
    e.preventDefault();
    window.setTimeout(() => {
      window.open(href, "_blank", "noopener,noreferrer");
    }, ESPERA_ANTES_DE_NAVEGAR_MS);
  }
};
