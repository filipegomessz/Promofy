import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // No NAVEGADOR o react-helmet-async vira um dublê que não faz nada: o
      // <head> de cada rota já vem escrito no HTML pelo prerender, e sem
      // navegação client-side ele nunca muda. Economiza 6,1 kB comprimidos em
      // toda visita. Na compilação SSR o Helmet de verdade continua entrando —
      // é ele que produz aquele head. Ver src/lib/helmet-vazio.tsx.
      ...(isSsrBuild
        ? {}
        : {
            "react-helmet-async": path.resolve(__dirname, "./src/lib/helmet-vazio.tsx"),
            // PREACT NO NAVEGADOR (30/08/2026). O react + react-dom custavam
            // 45,5 kB comprimidos em toda visita — mais do que TODO o resto do
            // JavaScript da página principal somado. O preact/compat faz o
            // mesmo em ~12 kB, com a mesma API. A pré-renderização continua
            // usando o React de verdade: ela roda no build e não paga nada.
            //
            // ⚠️ O que isso obriga: nada de <Suspense> no entry-server (os
            // marcadores <!--$--> confundiriam a hidratação do Preact) e
            // conferir a `/ofertas` no navegador ao mexer, porque é a única
            // página com Radix, que é o componente mais exigente do projeto.
            react: "preact/compat",
            "react-dom": "preact/compat",
            "react-dom/client": "preact/compat/client",
            "react/jsx-runtime": "preact/jsx-runtime",
          }),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    target: "es2020",
    cssTarget: "chrome90",
    // O manifesto diz qual arquivo com hash saiu de cada página. O
    // scripts/prerender.mjs lê isso para escrever, no HTML de cada rota, o
    // `modulepreload` do pedaço DAQUELA rota — sem ele o import dinâmico do
    // main.tsx viraria uma cascata de duas idas e voltas. O próprio prerender
    // apaga o manifesto do dist depois de usar; ele não vai para o ar.
    manifest: true,
    rollupOptions: {
      output: {
        // O fatiamento manual vale só para o bundle do navegador. Na compilação
        // do servidor (a que alimenta a pré-renderização) o react e o react-dom
        // são externos, e o Rollup recusa fatiar módulo externo.
        manualChunks: isSsrBuild
          ? undefined
          : {
              // Os nomes são os mesmos de sempre, mas com o alias acima eles
              // resolvem para o `preact/compat`. Manter o pedaço separado vale
              // pelo cache: é a única parte que não muda quando o site muda.
              // "react-dom/client" precisa estar listado: é ele que o main.tsx
              // importa, e sem isso o runtime inteiro caía no chunk errado
              // enquanto o "react-vendor" saía com 0,06 kB.
              "react-vendor": ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
              // NÃO juntar o lucide-react num pedaço só. Já foi assim, e o
              // efeito era a página principal baixar TODOS os ícones do site
              // (4,2 kB comprimidos) para usar dois. Deixando o Rollup decidir,
              // cada página leva só os seus, que é a regra de 28/08/2026: a
              // página secundária não pesa na principal de forma nenhuma.
            },
      },
    },
  },
}));
