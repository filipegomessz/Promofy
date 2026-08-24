import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
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
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: "es2020",
    cssTarget: "chrome90",
    rollupOptions: {
      output: {
        manualChunks: {
          // "react-dom/client" precisa estar listado: é ele que o main.tsx
          // importa, e sem isso o react-dom inteiro caía no chunk "router"
          // (que ficava com 154 kB) enquanto o "react-vendor" saía com 0,06 kB.
          "react-vendor": ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
          "router": ["react-router-dom"],
          "icons": ["lucide-react"],
        },
      },
    },
  },
}));
