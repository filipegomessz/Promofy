/**
 * Fonte única dos caminhos do site.
 *
 * ⚠️ EM 28/08/2026 AS DUAS PÁGINAS TROCARAM DE LUGAR, a pedido dele. Antes a
 * raiz era a página completa e a captação morava em `/lp`. Agora é o inverso:
 *
 *   `/`         → captação (LandingSimples). É a PRINCIPAL.
 *   `/lp`       → a MESMA captação. O endereço antigo continua vivo de
 *                 propósito, para não quebrar anúncio que já esteja no ar
 *                 apontando para lá. Leva `noindex` + canonical para `/`,
 *                 porque é conteúdo duplicado.
 *   `/ofertas`  → página completa (Index), a que era a home. Leva `noindex`.
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
 * Para acrescentar ou religar uma rota são QUATRO lugares — e o tipo
 * `ChaveDeRota` obriga: esquecer um dos mapas quebra o `tsc`, não o site.
 *   1. a chave em CHAVES_DE_ROTA;
 *   2. o `case` em chaveDaRota;
 *   3. a linha em ARQUIVO_DA_ROTA;
 *   4. a entrada em PAGINAS, nos DOIS mapas (main.tsx e entry-server.tsx).
 *
 * Um caminho sem arquivo responde 404 de verdade, que é o sinal correto para
 * buscadores tratarem uma página como removida.
 */
export const CHAVES_DE_ROTA = [
  "captacao",
  "captacaoLp",
  "completa",
  "termos",
  "privacidade",
  "contato",
  "404",
] as const;

export type ChaveDeRota = (typeof CHAVES_DE_ROTA)[number];

/**
 * `duplicada` diz à captação que ela está sendo servida no endereço antigo
 * (`/lp`) e não na raiz. O único efeito é no `<head>`: ali ela leva `noindex`
 * e canonical apontando para `/`, porque é o mesmo conteúdo em dois endereços
 * e sem isso os dois disputariam a mesma posição no Google.
 */
export type PropsDePagina = { duplicada?: boolean };

/** Ignora barra final, querystring e âncora. A raiz vira "". */
export const normalizar = (caminho: string) =>
  caminho.split("?")[0].split("#")[0].replace(/\/+$/, "");

export const chaveDaRota = (caminho: string): ChaveDeRota => {
  switch (normalizar(caminho)) {
    case "":
      return "captacao";
    case "/lp":
      return "captacaoLp";
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
 * SOBRE O `alias` — medido no ar em 24/08/2026: uma rota servida por
 * `pasta/index.html` faz o GitHub Pages responder **301 para a versão com
 * barra no fim** (`/lp` → `/lp/`). Numa página de anúncio isso é uma ida e
 * volta desperdiçada em cada clique pago, antes de a página começar a
 * carregar. Gravando TAMBÉM um `lp.html` na raiz, as duas grafias respondem
 * 200 direto e não importa qual delas acabe colada no gerenciador de
 * anúncios. Só a `/lp` precisa disso: a raiz nunca redireciona, e nas demais
 * o redirecionamento não custa nada porque ninguém chega nelas por link pago.
 */
export const ARQUIVO_DA_ROTA: Record<
  ChaveDeRota,
  { caminho: string; arquivo: string; alias?: string }
> = {
  captacao: { caminho: "/", arquivo: "index.html" },
  captacaoLp: { caminho: "/lp", arquivo: "lp/index.html", alias: "lp.html" },
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
  captacaoLp: "lp-clara",
};
