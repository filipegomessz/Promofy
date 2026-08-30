import { renderToString } from "react-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { Suspense, type ReactNode } from "react";
import Index from "./pages/Index.tsx";
import LandingSimples from "./pages/LandingSimples.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";
import { chaveDaRota, type ChaveDeRota } from "./rotas.ts";

// Reexportado para o scripts/prerender.mjs consumir do mesmo bundle: com uma
// entrada só, o Rollup embute rotas.ts aqui dentro e não emite arquivo separado.
export { ARQUIVO_DA_ROTA, CLASSE_DO_BODY } from "./rotas.ts";

// Aqui as páginas entram de forma NORMAL, sem lazy: `renderToString` não espera
// um componente suspenso — ele renderizaria o fallback (vazio) e a página sairia
// em branco. A tabela de caminhos vem de rotas.ts, então cliente e servidor não
// podem divergir sobre quais rotas existem.
//
// ⚠️ `captacao` e `captacaoLp` são a MESMA página em dois endereços; a segunda
// recebe `duplicada` para o head sair com noindex + canonical para a raiz.
// O mapa do cliente (main.tsx) passa exatamente a mesma prop — se divergirem,
// a hidratação acusa mismatch.
const PAGINAS: Record<ChaveDeRota, ReactNode> = {
  // O `false` é explícito de propósito: o cliente passa `duplicada={false}` e
  // os dois lados precisam produzir a MESMA árvore, senão a hidratação acusa.
  captacao: <LandingSimples duplicada={false} />,
  captacaoLp: <LandingSimples duplicada />,
  completa: <Index />,
  termos: <Terms />,
  privacidade: <Privacy />,
  contato: <Contact />,
  404: <NotFound />,
};

type ContextoHelmet = { helmet?: HelmetServerState };

/**
 * Renderiza uma rota para HTML puro, em tempo de build.
 *
 * Isto existe por um motivo só: sem ele, o navegador recebe uma
 * `<div id="root">` vazia e não pinta NADA até baixar, interpretar e executar
 * o JavaScript inteiro. Numa conexão móvel lenta isso são segundos de tela
 * branca. Com o HTML já pronto, a primeira pintura acontece na leitura do
 * documento e o React apenas hidrata por cima.
 *
 * Devolve também as tags de <head> que o Helmet produziu, para o
 * scripts/prerender.mjs escrevê-las no HTML de cada rota — assim cada página
 * tem o próprio título e a própria canonical mesmo para quem não roda JS.
 */
export const render = (caminho: string) => {
  const contexto: ContextoHelmet = {};
  const corpo = renderToString(
    <HelmetProvider context={contexto}>
      <Suspense fallback={null}>{PAGINAS[chaveDaRota(caminho)]}</Suspense>
    </HelmetProvider>,
  );

  const h = contexto.helmet;
  const head = h
    ? [h.title.toString(), h.meta.toString(), h.link.toString()].filter(Boolean).join("\n    ")
    : "";

  return { corpo, head };
};
