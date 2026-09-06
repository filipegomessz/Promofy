import type { MouseEvent } from "react";

/**
 * ============================================================================
 * O LEAD DA /obras — o lado OpenAI da conversão (06/09/2026)
 * ============================================================================
 *
 * Este arquivo é o gêmeo de `lead.ts` para a página que mede no OpenAI Ads.
 * Faz a mesma coisa que o `trackLead` de lá: dispara a conversão e só então
 * abre o WhatsApp.
 *
 * POR QUE NÃO É A MESMA FUNÇÃO, com um `if` dentro. Duas razões, e nenhuma é
 * gosto:
 *
 *  1. O `lead.ts` é um pedaço de JavaScript COMPARTILHADO — a captação
 *     principal, a /ofertas e a /construcao carregam todas ele. Acrescentar o
 *     código da OpenAI ali colocaria bytes no caminho crítico da página
 *     principal, que está medida em 100/100 no PageSpeed, para servir a uma
 *     rota que ela nunca visita. A regra dele, de 28/08/2026, é justamente
 *     essa: página secundária não pesa na principal de forma nenhuma.
 *  2. Na /obras não existe `fbq`. O `trackLead` de lá acabaria caindo no
 *     `console.warn` de "pixel indisponível" em toda conversão bem-sucedida —
 *     um alarme falso permanente, gravado no lugar onde a gente vai procurar
 *     quando faltar lead de verdade.
 *
 * O preço é duplicação: a espera de 250 ms, o log e o observador existem duas
 * vezes. É pouco código, e cada cópia é mais simples do que a função única com
 * dois caminhos seria.
 *
 * ----------------------------------------------------------------------------
 * ⚠️ `oppref` — LEIA ISTO ANTES DE INVESTIGAR "A OPENAI NÃO RECEBE CONVERSÃO"
 * ----------------------------------------------------------------------------
 * Já custou caro uma vez, em 28/08/2026: o envio estava 100% certo e o que
 * faltava era ATRIBUIÇÃO. A OpenAI pendura um `?oppref=…` na URL de destino do
 * anúncio; o SDK lê `location.search` NO MOMENTO EM QUE CARREGA, guarda no
 * cookie `__oppref` por 30 dias e passa a mandar esse valor junto do evento.
 * Sem ele o evento é aceito com HTTP 202 e fica ÓRFÃO: não conta para a
 * campanha, não alimenta a otimização, e de fora parece tudo perfeito.
 *
 * Duas consequências permanentes:
 *  - o SDK NÃO pode ser adiado (ver scripts/pixel-openai.mjs). Adiar o SDK é
 *    pendurar a atribuição num detalhe de performance;
 *  - `oppref` é PARÂMETRO RESERVADO: a OpenAI anexa sozinha e o painel RECUSA
 *    quem tenta anexar à mão ("Reserved query parameters are not supported").
 *    O campo de parâmetros da campanha fica VAZIO. E nunca aceitar o contorno
 *    `campaign_id=oppref={oppref}`, que o painel deixa passar e que seria
 *    atribuição zero com cara de resolvido — o SDK procura por `oppref`.
 *
 * ⚠️ RÉGUA DE HONESTIDADE, em quatro estágios: "chamei o SDK" ≠ "a requisição
 * saiu" ≠ "a plataforma aceitou" ≠ "a plataforma ATRIBUIU". O endpoint deles
 * responde 202 até para evento órfão. Nunca dizer "a conversão foi registrada"
 * a partir de um 202 — nem a partir do log daqui, que só vê o segundo estágio.
 * ============================================================================
 */

declare global {
  interface Window {
    /** Pixel do OpenAI Ads. O bloco do <head> cria o stub com fila de forma
     *  SÍNCRONA, então daqui isto é sempre uma função na /obras — mesmo antes
     *  de o SDK ter chegado. Nas outras rotas não existe, e é para não existir. */
    oaiq?: (...args: unknown[]) => void;
    /** Posto pelo bloco do <head>: diz se o SDK já terminou de carregar. Serve
     *  só para o log abaixo separar "enfileirado" de "entregue ao SDK".
     *  ℹ️ É um campo próprio, e não o `__promofyPixels` da Meta, porque
     *  nenhuma página carrega os dois pixels: dois campos separados evitam
     *  duas declarações do mesmo global com formatos diferentes. */
    __promofyOpenai?: { pronto: boolean };
  }
}

/**
 * O MESMO grupo da /construcao — as duas páginas vendem a mesma coisa para o
 * mesmo público; o que muda é a plataforma que paga o clique. Está escrito
 * aqui, e não importado de `lead.ts`, para a /obras não arrastar o pedaço
 * compartilhado inteiro (com todo o código da Meta) só por uma string.
 *
 * ⚠️ TROCOU O GRUPO NUM LADO, TROCAR NO OUTRO. Um teste em
 * src/test/pixels.test.ts compara as duas constantes e quebra se divergirem —
 * senão metade do dinheiro de anúncio cairia num grupo abandonado, sem erro
 * nenhum aparecendo.
 */
export const WHATSAPP_GROUP_OBRAS = "https://chat.whatsapp.com/CtzBP0DO22h3xYCtyopQTj";

/**
 * Janela que a gente segura antes de abrir o WhatsApp, para o evento sair.
 * Mesmos 250 ms da /construcao, e isso é decisão consciente:
 *
 * O SDK da OpenAI NÃO manda na hora — ele junta os eventos e descarrega o lote
 * num temporizador de ~1 s. Medido no ar em 28/08/2026: clique em 0 ms,
 * WhatsApp abrindo em 268 ms, evento saindo em 1019 ms. Ou seja, a requisição
 * parte DEPOIS de a aba ir para o fundo — e mesmo assim chega, porque o SDK
 * usa `fetch` com `keepalive`, que sobrevive ao page-hide.
 *
 * ⚠️ Não esticar esta espera para mais de 1 s tentando "garantir" o envio: o
 * `keepalive` já garante, e um segundo de tela parada logo depois do toque é o
 * pior lugar possível para uma pausa. Também não existe API pública de flush
 * no SDK deles — o `measureSingle` da 0.1.32 não envia na hora, é só `measure`
 * com pixel específico.
 */
const ESPERA_ANTES_DE_NAVEGAR_MS = 250;

const BEACON_OPENAI = /bzr\.openai\.com/;

/** Quanto tempo esperamos pelo evento antes de desistir de observar. */
const OBSERVAR_BEACON_POR_MS = 4000;

let __leadFireCount = 0;

/**
 * Registra no console QUANDO a requisição de fato saiu, e não apenas quando a
 * função foi chamada. É diagnóstico de desenvolvimento e não altera o disparo.
 *
 * ⚠️ O status HTTP NÃO é visível daqui: o SDK deles envia com `mode:"no-cors"`,
 * então a resposta é opaca. Para ver o código de verdade só replicando a
 * requisição com `curl`, fora do navegador.
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
        `[Lead] openai: nenhuma requisição observada em ${OBSERVAR_BEACON_POR_MS} ms. Pode ter saído depois de a aba ficar oculta — o que é o normal no celular, e o \`keepalive\` do SDK cobre.`,
      );
    }
  };

  const observador = new PerformanceObserver((lista) => {
    for (const entrada of lista.getEntries()) {
      if (!BEACON_OPENAI.test(entrada.name)) continue;
      console.info(
        `[Lead] openai: requisição concluída ${Math.round(entrada.startTime - t0)} ms após o clique (status HTTP não é visível daqui — o SDK envia em no-cors). Aceito ≠ atribuído: quem diz isso é o painel.`,
      );
      encerrar(observador, true);
      return;
    }
  });

  observador.observe({ type: "resource", buffered: false });
  window.setTimeout(() => encerrar(observador, false), OBSERVAR_BEACON_POR_MS);
};

/**
 * Dispara a conversão no pixel da OpenAI e só então abre o link.
 *
 * A conversão do site é UMA só — "clicou no botão para entrar no grupo" — e na
 * OpenAI ela se chama `lead_created`, com `type: "customer_action"`. É o mesmo
 * evento que a página media antes de 28/08/2026, com o nome que eles pedem.
 *
 * Não há envio pela Conversions API deles pelo mesmo motivo da Meta: seria
 * server-side e exigiria uma chave secreta, que num site estático ficaria
 * exposta no código-fonte para qualquer visitante forjar conversão.
 */
export const trackLeadObras = (
  e?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  href?: string,
) => {
  const temOaiq = typeof window !== "undefined" && typeof window.oaiq === "function";

  if (temOaiq) {
    window.oaiq!("measure", "lead_created", { type: "customer_action" });
    __leadFireCount += 1;
  }

  // Com o stub síncrono no <head>, "o pixel existe?" virou sempre sim. O que
  // ainda varia — e é o que interessa quando faltar lead no painel — é se a
  // chamada foi PARA O SDK ou apenas para a fila. Fila não é perda: sobe assim
  // que o SDK carrega. Em nenhum dos casos algo já saiu do navegador; quem vê
  // isso é o observarBeacons().
  const sdkPronto = window.__promofyOpenai?.pronto;
  const situacao = !temOaiq ? "INDISPONIVEL" : sdkPronto ? "entregue ao SDK" : "enfileirado";

  console.info(`[Lead] clique #${__leadFireCount} — openai=${situacao} href=${href ?? "n/a"}`);
  observarBeacons();

  // Cair aqui não é questão de tempo: significa que o bloco do <head> NÃO
  // rodou. Bloqueador de anúncios, CSP, ou alguém publicou esta página sem o
  // pixel (PIXEL_OPENAI_DA_ROTA em rotas.ts).
  if (!temOaiq) {
    console.warn("[Lead] oaiq indisponível — o bloco do <head> não rodou (bloqueador? CSP?)");
  }

  if (e && href) {
    e.preventDefault();
    window.setTimeout(() => {
      window.open(href, "_blank", "noopener,noreferrer");
    }, ESPERA_ANTES_DE_NAVEGAR_MS);
  }
};
