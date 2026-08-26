import type { MouseEvent } from "react";

declare global {
  interface Window {
    /** Pixel da Meta. O index.html cria o stub com fila de forma SÍNCRONA, então
     *  daqui isto é sempre uma função — mesmo antes de o SDK ter chegado. */
    fbq?: (...args: unknown[]) => void;
    /** Pixel do OpenAI Ads. Mesma coisa: stub com fila criado de forma síncrona
     *  no index.html; enquanto o SDK não chega, empilha as chamadas em oaiq.q. */
    oaiq?: (...args: unknown[]) => void;
    /** Posto pelo index.html: diz se o SDK de cada pixel já terminou de carregar.
     *  Existe só para o log abaixo poder separar "enfileirado" de "entregue" —
     *  com o stub sempre no ar, `typeof window.fbq === "function"` virou sempre
     *  verdadeiro e sozinho não informa mais nada. */
    __promofyPixels?: { meta: boolean; openai: boolean };
  }
}

// Grupo vigente, confirmado por ele em 24/08/2026. O anterior
// (CeIkFA6dIzIKN91j5dzS7o) está morto — não voltar a usar.
// Por alguns dias existiu um WHATSAPP_GROUP_LANDING separado, criado porque
// não estava claro se o link novo valia para o site inteiro ou só para a
// landing. Vale para tudo, então voltou a ser uma constante só.
export const WHATSAPP_GROUP = "https://chat.whatsapp.com/ByF67GiEh9k3gq2XfoyUBs";
export const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7qoOCFXUuQyXWHEV0U";

// Contador global para auditoria — garante que cada clique dispare exatamente 1 Lead
let __leadFireCount = 0;

/**
 * Janela que a gente segura antes de abrir o WhatsApp, para os beacons dos
 * pixels saírem. Existe porque no celular a troca de app pode descartar
 * requisição pendente.
 *
 * Os dois pixels se comportam de forma BEM diferente aqui, medido no
 * navegador em 24/08/2026 — vale saber antes de estranhar o painel de rede:
 *
 * - Meta: dispara na hora, ~14 ms depois do clique. Cabe folgado nos 250 ms.
 * - OpenAI: acumula em lote e só descarrega num temporizador de ~1 s, ou
 *   seja, MAIS TARDE que os 250 ms. Parece perda de evento, mas não é: o SDK
 *   deles descarrega na hora (~2 ms) quando a aba fica oculta, que é
 *   exatamente o que o navegador faz ao abrir o WhatsApp. Testado forçando
 *   visibilitychange/pagehide.
 *
 * Por isso NÃO esticamos a espera para ~1,3 s: não resolveria nada que o
 * flush por visibilidade já não resolva, e custaria mais de um segundo de
 * tela parada depois do toque — o pior lugar possível para uma pausa.
 *
 * E não precisamos esticar nem para o caso do SDK ainda não ter chegado: o
 * index.html começa a baixar os dois no primeiro `pointerdown`, que acontece
 * ANTES do clique. Quando estes 250 ms terminam, o download já teve o tempo
 * do toque inteiro de vantagem. E se mesmo assim não tiver chegado, a chamada
 * fica na fila do stub e sobe quando ele carregar — não se perde.
 */
const ESPERA_ANTES_DE_NAVEGAR_MS = 250;

const BEACONS = [
  { plataforma: "meta", padrao: /facebook\.com\/tr/ },
  { plataforma: "openai", padrao: /bzr\.openai\.com/ },
];

/** Quanto tempo esperamos pelo beacon antes de desistir de observar. */
const OBSERVAR_BEACON_POR_MS = 4000;

/**
 * Estágio 2 da auditoria: registra no console QUANDO a requisição de cada
 * pixel de fato termina, e não apenas quando a função foi chamada.
 *
 * A distinção não é preciosismo. Entre "chamei o SDK" e "a plataforma
 * contabilizou a conversão" existem, no mínimo: o lote do SDK, o envio, a
 * ingestão da plataforma, a deduplicação e a janela de atribuição. Daqui de
 * dentro do navegador dá para observar SÓ até o envio — e nem o status HTTP,
 * porque as duas respostas são cross-origin sem Timing-Allow-Origin. Por isso
 * o log fala "requisição concluída", nunca "conversão registrada": afirmar o
 * segundo a partir do primeiro seria inventar.
 *
 * É diagnóstico de desenvolvimento: no celular a aba já foi para o fundo e
 * ninguém está lendo console. Não altera o disparo em nada.
 */
const observarBeacons = () => {
  if (typeof PerformanceObserver === "undefined") return;

  const t0 = performance.now();
  const pendentes = new Set(BEACONS.map((b) => b.plataforma));
  let encerrado = false;

  const encerrar = (observador: PerformanceObserver) => {
    if (encerrado) return;
    encerrado = true;
    observador.disconnect();
    pendentes.forEach((p) => {
      console.info(
        `[Lead] ${p}: nenhuma requisição observada em ${OBSERVAR_BEACON_POR_MS} ms. Pode ter saído depois da aba ficar oculta — o que é o normal no celular.`,
      );
    });
  };

  const observador = new PerformanceObserver((lista) => {
    for (const entrada of lista.getEntries()) {
      const alvo = BEACONS.find((b) => b.padrao.test(entrada.name));
      if (!alvo || !pendentes.has(alvo.plataforma)) continue;
      pendentes.delete(alvo.plataforma);
      console.info(
        `[Lead] ${alvo.plataforma}: requisição concluída ${Math.round(entrada.startTime - t0)} ms após o clique (status HTTP não é visível daqui — cross-origin).`,
      );
    }
    if (pendentes.size === 0) encerrar(observador);
  });

  observador.observe({ type: "resource", buffered: false });
  window.setTimeout(() => encerrar(observador), OBSERVAR_BEACON_POR_MS);
};

/**
 * Dispara a conversão nos dois pixels e só então abre o link.
 *
 * A conversão do site é UMA só — "clicou no botão para entrar no grupo" —
 * e é reportada com o nome que cada plataforma espera: "Lead" na Meta,
 * "lead_created" na OpenAI. Ter os dois disparos aqui, num ponto único,
 * é o que impede que um evolua e o outro fique para trás.
 *
 * Não há envio pela Conversions API de nenhuma das duas: seria server-side
 * e exigiria uma chave secreta, que num site estático ficaria exposta no
 * código-fonte para qualquer visitante forjar conversões.
 */
export const trackLead = (
  e?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  href?: string,
) => {
  const temFbq = typeof window !== "undefined" && typeof window.fbq === "function";
  const temOaiq = typeof window !== "undefined" && typeof window.oaiq === "function";
  let eventID: string | null = null;

  if (temFbq) {
    eventID = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.fbq!("track", "Lead", { content_name: href ?? "unknown" }, { eventID });
  }

  if (temOaiq) {
    window.oaiq!("measure", "lead_created", { type: "customer_action" });
  }

  if (temFbq || temOaiq) {
    __leadFireCount += 1;
  }

  // Estágio 1. Desde 26/08/2026 o index.html cria os stubs de forma síncrona, e
  // com isso a pergunta "o pixel existe?" virou sempre sim. O que ainda varia —
  // e é o que interessa quando faltar lead no painel — é se a chamada FOI PARA
  // O SDK ou apenas para a fila, esperando ele chegar. Fila não é perda: ela
  // sobe assim que o SDK carrega. Perda era o que acontecia antes, quando não
  // havia nem stub nem fila e a chamada era descartada aqui mesmo.
  // Nos três casos, nada saiu do navegador ainda — ver observarBeacons().
  const sdks = window.__promofyPixels;
  const situacao = (existe: boolean, sdkPronto: boolean | undefined) =>
    !existe ? "INDISPONIVEL" : sdkPronto ? "entregue ao SDK" : "enfileirado";

  console.info(
    `[Lead] clique #${__leadFireCount} — meta=${situacao(temFbq, sdks?.meta)} openai=${situacao(temOaiq, sdks?.openai)} eventID=${eventID ?? "n/a"} href=${href ?? "n/a"}`,
  );
  observarBeacons();

  // Com o stub síncrono no index.html, cair aqui deixou de ser questão de
  // tempo e passou a significar que o script inline NÃO RODOU: bloqueador de
  // anúncios, CSP, ou alguém mexeu no index.html.
  if (!temFbq) {
    console.warn("[Lead] fbq indisponível — o stub do index.html não rodou (bloqueador? CSP?)");
  }
  if (!temOaiq) {
    console.warn("[Lead] oaiq indisponível — o stub do index.html não rodou (bloqueador? CSP?)");
  }

  // Garante que os eventos sejam enviados antes de navegar (especialmente no
  // mobile, onde abrir o WhatsApp pode descartar requisições pendentes).
  if (e && href) {
    e.preventDefault();
    window.setTimeout(() => {
      window.open(href, "_blank", "noopener,noreferrer");
    }, ESPERA_ANTES_DE_NAVEGAR_MS);
  }
};
