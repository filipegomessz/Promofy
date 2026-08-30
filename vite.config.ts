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
              // "react-dom/client" precisa estar listado: é ele que o main.tsx
              // importa, e sem isso o react-dom inteiro caía no chunk errado
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
