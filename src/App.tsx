import { lazy, Suspense, type ReactNode } from "react";
// A raiz é a landing simples. A home antiga (src/pages/Index.tsx — hero, FAQ,
// esteira de marcas, rodapé) continua no repo, íntegra e sem rota: para voltar
// a usá-la basta importá-la aqui e trocar o caso "landing" abaixo, mandando a
// landing para outro caminho. Nada mais depende dela.
import LandingSimples from "./pages/LandingSimples.tsx";
import { chaveDaRota, type ChaveDeRota } from "./rotas.ts";

// A landing entra de forma normal por ser a página de entrada; o 404 é lazy
// para não pesar no carregamento dela. Terms/Privacy/Contact saíram daqui em
// 24/08/2026 junto com as rotas — ver o quadro em src/rotas.ts.
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Saíram daqui, em 24/08/2026, três provedores que vieram do scaffold do
// Lovable e que NENHUMA página usava: QueryClientProvider (nenhum useQuery no
// projeto), <Toaster /> + <Sonner /> (ninguém dispara toast) e TooltipProvider
// (nenhum Tooltip). Custavam ~26 kB comprimidos no primeiro carregamento de uma
// página cuja única função é ter um botão clicado.
// Os componentes seguem em src/components/ui/ — se um dia alguém precisar de
// toast ou tooltip, é só montar o provedor de volta aqui.
//
// E saiu também, no mesmo dia, o react-router: pesava em TODA visita para
// servir quatro rotas sem nenhuma navegação interna de verdade. Todos os links
// entre páginas são <a href> comuns, ou seja, recarregam a página — o que é
// adequado para páginas legais que quase ninguém abre, ainda mais agora que
// cada uma tem o próprio HTML pré-renderizado. Se algum dia o site precisar de
// navegação sem recarga, é aqui que o roteador volta.
const PAGINAS: Record<ChaveDeRota, ReactNode> = {
  landing: <LandingSimples />,
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
