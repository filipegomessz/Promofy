/**
 * Fonte única dos caminhos do site.
 *
 * Cliente e pré-renderização precisam concordar sobre quais caminhos existem,
 * mas montam os componentes de formas diferentes: no navegador as páginas
 * secundárias entrariam por `lazy()`, para não pesarem no carregamento da
 * landing; na pré-renderização elas têm de ser importadas de forma normal,
 * porque `renderToString` não espera um componente suspenso — ele renderizaria
 * vazio. Por isso a TABELA mora aqui e cada lado traz o seu próprio mapa.
 *
 * ┌─ FORA DO AR desde 24/08/2026, por decisão do dono do site ─────────────┐
 * │ /termos, /privacidade e /contato saíram daqui. Os componentes         │
 * │ continuam no repo (src/pages/Terms.tsx, Privacy.tsx, Contact.tsx),    │
 * │ íntegros e sem rota — nada foi apagado. Para religar qualquer uma:    │
 * │   1. devolva a chave em CHAVES_DE_ROTA;                               │
 * │   2. devolva o `case` em chaveDaRota;                                 │
 * │   3. devolva a linha em ARQUIVO_DA_ROTA;                              │
 * │   4. devolva a entrada em PAGINAS, nos DOIS mapas (App.tsx com        │
 * │      lazy(), entry-server.tsx com import normal).                     │
 * │ Enquanto estiverem fora, essas URLs respondem 404, que é o sinal      │
 * │ correto para buscadores tratarem como removidas.                      │
 * └───────────────────────────────────────────────────────────────────────┘
 */
export const CHAVES_DE_ROTA = ["landing", "404"] as const;

export type ChaveDeRota = (typeof CHAVES_DE_ROTA)[number];

/** Ignora barra final, querystring e âncora. A raiz vira "". */
export const normalizar = (caminho: string) =>
  caminho.split("?")[0].split("#")[0].replace(/\/+$/, "");

export const chaveDaRota = (caminho: string): ChaveDeRota =>
  normalizar(caminho) === "" ? "landing" : "404";

/**
 * Onde o arquivo de cada rota é gravado no build (ver scripts/prerender.mjs).
 * Servir um arquivo por rota, em vez de depender do fallback 404.html, é o que
 * faz cada página responder HTTP 200 no GitHub Pages — e o que faz uma URL sem
 * arquivo responder 404 de verdade.
 */
export const ARQUIVO_DA_ROTA: Record<ChaveDeRota, { caminho: string; arquivo: string }> = {
  landing: { caminho: "/", arquivo: "index.html" },
  404: { caminho: "/__404__", arquivo: "404.html" },
};
