import type { ReactNode } from "react";

/**
 * Dublê do `react-helmet-async` **no navegador**. Não vai para a compilação
 * SSR — lá o Helmet de verdade continua rodando.
 *
 * Por que existe: cada rota já sai do build com o `<head>` inteiro escrito no
 * HTML (ver `scripts/prerender.mjs`). No navegador, o Helmet só reaplicava
 * exatamente as mesmas tags que já estavam no documento — trabalho jogado
 * fora, e 6,1 kB comprimidos baixados em toda visita para fazer nada. Como
 * não existe navegação client-side neste site, o head nunca precisa mudar
 * depois do carregamento.
 *
 * A troca é feita por `resolve.alias` no `vite.config.ts`, e só no build do
 * navegador. Alias em vez de um `if` porque um `import` no topo do arquivo
 * entra no pacote mesmo que o código nunca rode: a única forma de garantir
 * que a biblioteca não viaje é ela não estar no grafo.
 *
 * ⚠️ Se algum dia o site ganhar navegação sem recarga, ou uma página que
 * precise mexer no `<head>` em tempo de execução, este dublê deixa de servir
 * e o alias tem de sair.
 */
export const Helmet = () => null;

export const HelmetProvider = ({ children }: { children?: ReactNode }) => <>{children}</>;
