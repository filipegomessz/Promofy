/**
 * Fonte única dos caminhos do site.
 *
 * Cliente e pré-renderização precisam concordar sobre quais caminhos existem,
 * mas montam os componentes de formas diferentes: no navegador as páginas
 * secundárias entram por `lazy()`, para não pesarem no carregamento da landing;
 * na pré-renderização elas têm de ser importadas de forma normal, porque
 * `renderToString` não espera um componente suspenso — ele renderizaria vazio.
 * Por isso a TABELA mora aqui e cada lado traz o seu próprio mapa.
 */
export const CHAVES_DE_ROTA = ["landing", "termos", "privacidade", "contato", "404"] as const;

export type ChaveDeRota = (typeof CHAVES_DE_ROTA)[number];

/** Ignora barra final, querystring e âncora. A raiz vira "". */
export const normalizar = (caminho: string) =>
  caminho.split("?")[0].split("#")[0].replace(/\/+$/, "");

export const chaveDaRota = (caminho: string): ChaveDeRota => {
  switch (normalizar(caminho)) {
    case "":
      return "landing";
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
 * Servir `/termos/index.html` em vez de depender do fallback 404.html é o que
 * faz essas páginas responderem HTTP 200 no GitHub Pages, e não 404.
 */
export const ARQUIVO_DA_ROTA: Record<ChaveDeRota, { caminho: string; arquivo: string }> = {
  landing: { caminho: "/", arquivo: "index.html" },
  termos: { caminho: "/termos", arquivo: "termos/index.html" },
  privacidade: { caminho: "/privacidade", arquivo: "privacidade/index.html" },
  contato: { caminho: "/contato", arquivo: "contato/index.html" },
  404: { caminho: "/__404__", arquivo: "404.html" },
};
