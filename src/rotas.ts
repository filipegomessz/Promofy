/**
 * Fonte única dos caminhos do site.
 *
 * ⚠️ EM 28/08/2026 AS DUAS PÁGINAS TROCARAM DE LUGAR, a pedido dele. Antes a
 * raiz era a página completa e a captação morava em `/lp`. Agora:
 *
 *   `/`         → captação (LandingSimples). É a PRINCIPAL do público geral.
 *   `/ofertas`  → página completa (Index), a que era a home. Leva `noindex`.
 *
 * ➕ EM 03/09/2026 ENTROU UMA TERCEIRA PORTA, `/construcao`
 * (src/pages/Construcao.tsx): captação do público de casa e construção, com
 * grupo de WhatsApp próprio e pixel da Meta próprio. Ela É indexável — ao
 * contrário da `/ofertas`, fala de outro assunto e não disputa posição com a
 * raiz. Ver PIXEL_DA_ROTA lá embaixo para o porquê de um pixel por página.
 *
 * 🗑️ **A rota `/lp` foi REMOVIDA em 30/08/2026.** Por dois dias ela serviu a
 * mesma captação da raiz, para não quebrar anúncio que já estivesse no ar. Ele
 * mandou tirar: "se /lp é a mesma coisa que a principal, não tem pq existir".
 * Hoje `/lp` responde **404**. Se aparecer clique pago perdido vindo de lá, o
 * conserto é ressuscitar a rota, não inventar redirecionamento — o GitHub
 * Pages não faz redirecionamento configurável.
 *
 * A regra que ele deu para a página secundária: **não pode pesar nem
 * atrapalhar a principal de nenhuma forma.** Isso tem duas consequências, e
 * as duas são obrigatórias:
 *
 *   1. PESO: cada página vive no próprio pedaço de JavaScript e a principal
 *      não baixa uma linha da outra. Ver `main.tsx` (import dinâmico) e o
 *      `modulepreload` que o `scripts/prerender.mjs` injeta por rota.
 *   2. ATRAPALHAR: `/ofertas` leva `noindex`. Sem isso as duas disputariam a
 *      mesma posição no Google — falam do mesmo assunto — e as duas perderiam.
 *
 * Cliente e pré-renderização precisam concordar sobre quais caminhos existem,
 * mas montam as páginas de formas diferentes: no navegador tudo entra por
 * `import()` dinâmico, para uma rota não carregar o código da outra; na
 * pré-renderização as páginas têm de ser importadas de forma normal, porque
 * `renderToString` não espera um componente suspenso — ele renderizaria vazio.
 * Por isso a TABELA mora aqui e cada lado traz o seu próprio mapa.
 *
 * Para acrescentar ou religar uma rota são SEIS lugares — e o tipo
 * `ChaveDeRota` obriga: esquecer um dos mapas quebra o `tsc`, não o site.
 *   1. a chave em CHAVES_DE_ROTA;
 *   2. o `case` em chaveDaRota;
 *   3. a linha em ARQUIVO_DA_ROTA;
 *   4. a linha em PIXEL_DA_ROTA — decidir explicitamente, inclusive `null`;
 *   5. a entrada em PAGINAS (entry-server.tsx) e em CARREGAR (main.tsx);
 *   6. a linha em MODULO_DA_ROTA (scripts/prerender.mjs).
 *
 * O sétimo lugar NÃO é obrigatório e não quebra o `tsc`: se a página usar o
 * avatar, ela precisa entrar em ROTAS_COM_AVATAR (scripts/prerender.mjs), ou
 * o pré-carregamento da imagem de LCP não é escrito e o LCP piora em silêncio.
 *
 * Um caminho sem arquivo responde 404 de verdade, que é o sinal correto para
 * buscadores tratarem uma página como removida.
 */
/**
 * O pixel que o site tem desde sempre. Está escrito no `index.html` também, e
 * de propósito: aquele é o valor que roda em `npm run dev`, onde não existe
 * pré-renderização para trocar nada. Mudou aqui, mudar lá — o
 * `src/test/pixels.test.ts` compara os dois e quebra se divergirem.
 */
export const PIXEL_PRINCIPAL = "1561896425355572";

export const CHAVES_DE_ROTA = [
  "captacao",
  "construcao",
  "completa",
  "termos",
  "privacidade",
  "contato",
  "404",
] as const;

export type ChaveDeRota = (typeof CHAVES_DE_ROTA)[number];

/** Ignora barra final, querystring e âncora. A raiz vira "". */
export const normalizar = (caminho: string) =>
  caminho.split("?")[0].split("#")[0].replace(/\/+$/, "");

export const chaveDaRota = (caminho: string): ChaveDeRota => {
  switch (normalizar(caminho)) {
    case "":
      return "captacao";
    case "/construcao":
      return "construcao";
    case "/ofertas":
      return "completa";
    case "/termos":
      return "termos";
    case "/privacidade":
      return "privacidade";
    case "/contato":
      return "contato";
    default:
      return "404";
  }
};

/**
 * Onde o arquivo de cada rota é gravado no build (ver scripts/prerender.mjs).
 * Servir um arquivo por rota, em vez de depender do fallback 404.html, é o que
 * faz cada página responder HTTP 200 no GitHub Pages.
 *
 * SOBRE O `alias`, que hoje ninguém usa: uma rota servida por
 * `pasta/index.html` faz o GitHub Pages responder **301 para a versão com
 * barra no fim** (`/x` → `/x/`). Numa página de anúncio isso seria uma ida e
 * volta desperdiçada em cada clique pago; gravar TAMBÉM um `<nome>.html` na
 * raiz do dist resolve. A principal é a raiz, que nunca redireciona, e nas
 * demais o redirecionamento não custa nada porque ninguém chega nelas por
 * link pago. O campo fica aqui para quando voltar a fazer falta.
 */
export const ARQUIVO_DA_ROTA: Record<
  ChaveDeRota,
  { caminho: string; arquivo: string; alias?: string }
> = {
  captacao: { caminho: "/", arquivo: "index.html" },
  construcao: {
    caminho: "/construcao",
    arquivo: "construcao/index.html",
    // O `alias` que dormia nesta tabela ACORDOU AQUI, e este é o primeiro uso
    // dele. Esta rota é página de ANÚNCIO: todo visitante chega por clique
    // pago. Sem o `construcao.html` na raiz do dist, o GitHub Pages responde
    // 301 de `/construcao` para `/construcao/` — uma ida e volta inteira paga
    // em cada clique, antes de o navegador ver o primeiro byte. Ver o
    // comentário grande logo acima.
    alias: "construcao.html",
  },
  completa: { caminho: "/ofertas", arquivo: "ofertas/index.html" },
  termos: { caminho: "/termos", arquivo: "termos/index.html" },
  privacidade: { caminho: "/privacidade", arquivo: "privacidade/index.html" },
  contato: { caminho: "/contato", arquivo: "contato/index.html" },
  404: { caminho: "/__404__", arquivo: "404.html" },
};

/**
 * Classe que o `<body>` recebe naquela rota, escrita direto no HTML estático.
 *
 * Existe porque a captação é a única tela CLARA de um site escuro, e a classe
 * vinha de um `useEffect` — ou seja, só entrava depois de baixar e hidratar o
 * JavaScript. A página pintava ESCURA e clareava depois, um flash de tema
 * errado bem na primeira dobra. Agora a classe já vem no documento e a
 * primeira pintura sai certa. A regra `body.lp-clara` mora em `index.css`.
 */
export const CLASSE_DO_BODY: Partial<Record<ChaveDeRota, string>> = {
  captacao: "lp-clara",
  construcao: "construcao-clara",
};

/**
 * QUAL PIXEL DA META CADA ROTA CARREGA — um por página, nunca dois.
 *
 * Criado em 03/09/2026, quando ele quis um pixel separado para o público de
 * casa e construção. Antes o id vivia cravado no `index.html`, que é o
 * template de TODAS as rotas: um pixel só, obrigatoriamente em todo lugar.
 *
 * Só saiu barato porque aqui não existe servidor nem roteador. O
 * `scripts/prerender.mjs` já gravava um HTML pronto por rota; ensinar ele a
 * trocar o id enquanto grava foi o trabalho inteiro. Quem troca é o
 * `scripts/pixel.mjs`.
 *
 * ⚠️ UM POR PÁGINA É REGRA, não acaso. Dois `fbq('init', …)` no mesmo
 * documento fazem TODO `fbq('track', …)` disparar nos dois painéis — o
 * `trackLead` não escolhe destino, ele fala com o `fbq` da página. As duas
 * campanhas contariam a conversão uma da outra e nenhum dos números prestaria.
 * Por isso a tabela é `string | null`, e não uma lista.
 *
 * `null` significa PÁGINA SEM PIXEL NENHUM: o bloco inteiro sai do HTML
 * daquela rota, com o `<noscript>` e as dicas de DNS junto. É o estado em que
 * a `/construcao` nasce — o pixel dela ainda não existe (03/09/2026). Melhor
 * no ar sem medir do que mandando `PageView` para o pixel errado.
 *
 * Decisão dele em 03/09: as demais rotas continuam TODAS no pixel principal.
 * A campanha estava no ar e ele ainda apurava Eventos × Resultados; mexer no
 * que já rodava seria risco sem ganho.
 */
export const PIXEL_DA_ROTA: Record<ChaveDeRota, string | null> = {
  captacao: PIXEL_PRINCIPAL,
  // Pixel do nicho de casa e construção, criado por ele em 03/09/2026 dentro do
  // PORTFÓLIO EMPRESARIAL — o antigo mora no perfil pessoal, e a diferença é
  // posse: ativo de perfil pessoal cai junto se a conta for restringida.
  // Nasceu sem histórico nenhum; a campanha de construção começa a fase de
  // aprendizado do zero, e isso é o preço, aceito, de separar os públicos.
  construcao: "1577370160750579",
  completa: PIXEL_PRINCIPAL,
  termos: PIXEL_PRINCIPAL,
  privacidade: PIXEL_PRINCIPAL,
  contato: PIXEL_PRINCIPAL,
  404: PIXEL_PRINCIPAL,
};
