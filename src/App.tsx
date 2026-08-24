import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
// A raiz é a landing simples. A home antiga (src/pages/Index.tsx — hero, FAQ,
// esteira de marcas, rodapé) continua no repo, íntegra e sem rota: para voltar
// a usá-la basta reimportá-la aqui e devolver a rota, mandando a landing para
// outro caminho. Nada mais depende dela.
//   import Index from "./pages/Index.tsx";
//   <Route path="/" element={<Index />} />
import LandingSimples from "./pages/LandingSimples.tsx";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));

// Saíram daqui, em 21/08/2026, três provedores que vieram do scaffold do
// Lovable e que NENHUMA página usava: QueryClientProvider (nenhum useQuery no
// projeto), <Toaster /> + <Sonner /> (ninguém dispara toast) e TooltipProvider
// (nenhum Tooltip). Custavam ~26 kB comprimidos no primeiro carregamento de uma
// página cuja única função é ter um botão clicado.
// Os componentes seguem em src/components/ui/ — se um dia alguém precisar de
// toast ou tooltip, é só montar o provedor de volta aqui.
const App = () => (
  <BrowserRouter>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingSimples />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/contato" element={<Contact />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
