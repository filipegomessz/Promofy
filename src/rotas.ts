/**
 * Fonte única dos caminhos do site.
 *
 * Cliente e pré-renderização precisam concordar sobre quais caminhos existem,
 * mas montam os componentes de formas diferentes: no navegador as páginas
 * secundárias entram por `lazy()`, para não pesarem no carregamento das duas
 * principais; na pré-renderização elas têm de ser importadas de forma normal,
 * porque `renderToString` não espera um componente suspenso — ele renderizaria
 * vazio. Por isso a TABELA mora aqui e cada lado traz o seu próprio mapa.
 *
 * Para acrescentar ou religar uma rota são QUATRO lugares — e o tipo
 * `ChaveDeRota` obriga: esquecer um dos mapas quebra o `tsc`, não o site.
 *   1. a chave em CHAVES_DE_ROTA;
 *   2. o `case` em chaveDaRota;
 *   3. a linha em ARQUIVO_DA_ROTA;
 *   4. a entrada em PAGINAS, nos DOIS mapas (App.tsx e entry-server.tsx).
 *
 * Um caminho sem arquivo responde 404 de verdade, que é o sinal correto para
 * buscadores tratarem uma página como removida.
 */
export const CHAVES_DE_ROTA = [
  "home",
  "landing",
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
      return "home";
    case "/lp":
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
 * Servir um arquivo por rota, em vez de depender do fallback 404.html, é o que
 * faz cada página responder HTTP 200 no GitHub Pages.
 *
 * `/` é a home completa (hero, FAQ, esteira, rodapé), que é o que aparece na
 * busca. `/lp` é a tela única de captação, destino dos anúncios pagos.
 *
 * SOBRE O `alias` — medido no ar em 24/08/2026: uma rota servida por
 * `pasta/index.html` faz o GitHub Pages responder **301 para a versão com
 * barra no fim** (`/lp` → `/lp/`). Numa página de anúncio isso é uma ida e
 * volta desperdiçada em cada clique pago, antes de a página começar a
 * carregar. Gravando TAMBÉM um `lp.html` na raiz, as duas grafias respondem
 * 200 direto e não importa qual delas acabe colada no gerenciador de
 * anúncios. Só a `/lp` precisa disso: nas páginas legais o redirecionamento
 * não custa nada, porque ninguém chega nelas por link pago.
 */
export const ARQUIVO_DA_ROTA: Record<
  ChaveDeRota,
  { caminho: string; arquivo: string; alias?: string }
> = {
  home: { caminho: "/", arquivo: "index.html" },
  landing: { caminho: "/lp", arquivo: "lp/index.html", alias: "lp.html" },
  termos: { caminho: "/termos", arquivo: "termos/index.html" },
  privacidade: { caminho: "/privacidade", arquivo: "privacidade/index.html" },
  contato: { caminho: "/contato", arquivo: "contato/index.html" },
  404: { caminho: "/__404__", arquivo: "404.html" },
};
