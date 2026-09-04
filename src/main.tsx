import type { ComponentType } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { chaveDaRota, normalizar, type ChaveDeRota } from "./rotas.ts";
import "./index.css";

/**
 * Cada rota traz SÓ o seu próprio pedaço de JavaScript.
 *
 * Isto é a regra que ele deu em 28/08/2026 — "a página secundária não pode
 * pesar na principal de nenhuma forma" — virada em código. Antes as duas
 * páginas eram importadas de forma normal aqui, e o Rollup as juntava num
 * pedaço só: quem abrisse a captação baixava, interpretava e executava a
 * página completa inteira junto, ~30 kB comprimidos que nunca seriam usados.
 * Com `import()` cada uma vira um pedaço separado e a outra nem é pedida.
 *
 * ⚠️ Sem `modulepreload` isto criaria uma cascata: o navegador baixaria este
 * arquivo, só então descobriria o pedaço da página e faria uma segunda ida e
 * volta. Quem evita isso é o `scripts/prerender.mjs`, que escreve no HTML de
 * cada rota o `modulepreload` do pedaço daquela rota — assim os dois descem
 * em paralelo. Mexeu aqui? Conferir se o prerender ainda acha o pedaço certo.
 */
const CARREGAR: Record<ChaveDeRota, () => Promise<{ default: ComponentType }>> = {
  captacao: () => import("./pages/LandingSimples.tsx"),
  construcao: () => import("./pages/Construcao.tsx"),
  completa: () => import("./pages/Index.tsx"),
  termos: () => import("./pages/Terms.tsx"),
  privacidade: () => import("./pages/Privacy.tsx"),
  contato: () => import("./pages/Contact.tsx"),
  404: () => import("./pages/NotFound.tsx"),
};

const raiz = document.getElementById("root")!;
const chave = chaveDaRota(window.location.pathname);

CARREGAR[chave]().then(({ default: Pagina }) => {
  const arvore = (
    <HelmetProvider>
      <Pagina />
    </HelmetProvider>
  );

  // Toda rota chega com o HTML já pronto dentro da raiz (ver
  // scripts/prerender.mjs), então aqui a gente HIDRATA em vez de renderizar do
  // zero: o React aproveita o que já está pintado na tela em vez de jogar fora
  // e refazer.
  //
  // O `else` cobre o caso de alguém cair num caminho sem arquivo
  // pré-renderizado (o 404.html do GitHub Pages). Aí a raiz vem com o conteúdo
  // da página de erro, hidratar seria mismatch garantido, e renderizar do zero
  // é o certo.
  if (raiz.firstChild && raiz.dataset.rota === normalizar(window.location.pathname)) {
    hydrateRoot(raiz, arvore);
  } else {
    raiz.innerHTML = "";
    createRoot(raiz).render(arvore);
  }
});
