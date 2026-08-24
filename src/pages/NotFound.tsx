import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

// O 404 precisa do próprio <Helmet> porque o index.html estático carrega as
// tags da raiz; sem isto, uma URL inexistente serviria o título e a canonical
// da home. Aqui não se declara canonical de propósito — página inexistente não
// é conteúdo canônico —, e o noindex mantém isso fora do índice.
const NotFoundHead = () => (
  <Helmet>
    <title>Página não encontrada — Promofy</title>
    <meta name="robots" content="noindex, follow" />
    <meta name="description" content="Esta página não existe. Volte para a Promofy." />
  </Helmet>
);

const NotFound = () => {
  const caminho = typeof window === "undefined" ? "" : window.location.pathname;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", caminho);
  }, [caminho]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <NotFoundHead />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
