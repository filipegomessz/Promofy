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
              icons: ["lucide-react"],
            },
      },
    },
  },
}));
