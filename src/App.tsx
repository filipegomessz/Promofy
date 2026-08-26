import { lazy, Suspense, type ReactNode } from "react";
import Index from "./pages/Index.tsx";
import LandingSimples from "./pages/LandingSimples.tsx";
import { chaveDaRota, type ChaveDeRota } from "./rotas.ts";

// As DUAS páginas que recebem tráfego entram de forma normal: a home, que é a
// raiz e o que aparece na busca, e a landing de /lp, que é o destino dos
// anúncios pagos. Nenhuma das duas pode esperar um chunk extra para ficar
// interativa. As demais são lazy — quase ninguém as abre, e assim não pesam.
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));

// Saíram daqui, em 24/08/2026, três provedores que vieram do scaffold do
// Lovable e que NENHUMA página usava: QueryClientProvider (nenhum useQuery no
// projeto), <Toaster /> + <Sonner /> (ninguém dispara toast) e TooltipProvider
// (nenhum Tooltip). Custavam ~26 kB comprimidos em todo carregamento.
// Os componentes seguem em src/components/ui/ — se um dia alguém precisar de
// toast ou tooltip, é só montar o provedor de volta aqui.
//
// E saiu também, no mesmo dia, o react-router: pesava em TODA visita para
// servir um punhado de rotas sem nenhuma navegação interna de verdade. Os
// links entre páginas são <a href> comuns, ou seja, recarregam a página — o
// que é adequado aqui, ainda mais com cada rota tendo o próprio HTML
// pré-renderizado. Se algum dia o site precisar de navegação sem recarga, é
// aqui que o roteador volta.
const PAGINAS: Record<ChaveDeRota, ReactNode> = {
  home: <Index />,
  landing: <LandingSimples />,
  termos: <Terms />,
  privacidade: <Privacy />,
  contato: <Contact />,
  404: <NotFound />,
};

/**
 * `caminho` só é passado na pré-renderização, onde não existe `window`.
 * No navegador ele é lido de location na montagem — e não muda depois,
 * porque não há navegação client-side.
 */
const App = ({ caminho }: { caminho?: string }) => (
  <Suspense fallback={null}>
    {PAGINAS[chaveDaRota(caminho ?? (typeof window === "undefined" ? "/" : window.location.pathname))]}
  </Suspense>
);

export default App;
