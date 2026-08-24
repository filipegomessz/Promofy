import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const raiz = document.getElementById("root")!;

const arvore = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Toda rota chega com o HTML já pronto dentro da raiz (ver scripts/prerender.mjs),
// então aqui a gente HIDRATA em vez de renderizar do zero: o React aproveita o
// que já está pintado na tela em vez de jogar fora e refazer.
//
// O `else` cobre o caso de alguém cair num caminho sem arquivo pré-renderizado
// (o 404.html do GitHub Pages). Aí a raiz vem com o conteúdo da página de erro,
// hidratar seria mismatch garantido, e renderizar do zero é o certo.
if (raiz.firstChild && raiz.dataset.rota === window.location.pathname.replace(/\/+$/, "")) {
  hydrateRoot(raiz, arvore);
} else {
  raiz.innerHTML = "";
  createRoot(raiz).render(arvore);
}
