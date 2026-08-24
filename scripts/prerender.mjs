// Grava um HTML pronto para cada rota, depois do `vite build`.
//
// Duas coisas mudam com isto:
//
// 1. A primeira pintura deixa de esperar o JavaScript. Antes o navegador
//    recebia `<div id="root"></div>` e ficava com a tela branca até baixar,
//    interpretar e executar o bundle inteiro — no 4G lento do PageSpeed, isso
//    são segundos. Agora o conteúdo já vem no documento e o React hidrata.
//
// 2. `/termos`, `/privacidade` e `/contato` passam a ter arquivo próprio, em
//    vez de dependerem do fallback `404.html` do GitHub Pages. Isso faz elas
//    responderem **HTTP 200** em vez de 404 — que era um problema real para
//    indexação e para revisão de anúncio.
//
// O script falha alto se o template não tiver a cara esperada. É de propósito:
// é melhor quebrar o build do que publicar um HTML meio montado.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { render, ARQUIVO_DA_ROTA } from "../dist-ssr/entry-server.js";

const raizDoProjeto = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raizDoProjeto, "dist");
const template = readFileSync(join(dist, "index.html"), "utf8");

const MARCADOR_RAIZ = '<div id="root"></div>';
if (!template.includes(MARCADOR_RAIZ)) {
  throw new Error(
    `prerender: não achei ${MARCADOR_RAIZ} no dist/index.html. O template mudou? Sem esse ponto não há onde injetar o HTML.`,
  );
}

/**
 * Tira do <head> do template as tags que o Helmet gerencia, para que cada rota
 * receba as suas. As do template são as da raiz e vêm marcadas com data-rh
 * (ver o comentário no index.html); o <title> não é marcado, então sai à parte.
 */
const limparHead = (html) =>
  html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/[ \t]*<(?:meta|link)\b[^>]*\bdata-rh="true"[^>]*>\s*/gi, "");

const normalizar = (caminho) => caminho.split("?")[0].split("#")[0].replace(/\/+$/, "");

/**
 * Embute a folha de estilo no próprio HTML.
 *
 * Um `<link rel="stylesheet">` bloqueia a renderização: o navegador não pinta
 * nada enquanto não baixar o arquivo. Como é uma ida e volta a mais logo no
 * começo do carregamento, e a folha inteira cabe em ~8 kB comprimidos, sai mais
 * barato mandá-la dentro do documento — que o navegador já tem em mãos.
 *
 * O preço é que a folha deixa de ser cacheada entre páginas e viaja em cada
 * HTML. Para este site compensa: a esmagadora maioria das visitas é uma pessoa
 * caindo na landing por um anúncio, vendo uma página só.
 */
const embutirCss = (html) => {
  const link = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/i);
  if (!link) {
    throw new Error(
      "prerender: não achei o <link rel=stylesheet> no dist/index.html. O Vite mudou a forma de emitir o CSS?",
    );
  }

  const css = readFileSync(join(dist, link[1].replace(/^\//, "")), "utf8");
  if (css.includes("</style")) {
    throw new Error("prerender: o CSS contém '</style' e fecharia a tag antes da hora.");
  }

  return html.replace(link[0], `<style>${css}</style>`);
};

let gravados = 0;
for (const [chave, { caminho, arquivo }] of Object.entries(ARQUIVO_DA_ROTA)) {
  const { corpo, head } = render(caminho);

  if (!corpo || corpo.length < 200) {
    throw new Error(
      `prerender: a rota "${caminho}" (${chave}) renderizou ${corpo.length} caracteres, o que não é uma página. Componente suspenso ou erro silencioso?`,
    );
  }
  if (!head.includes("<title")) {
    throw new Error(
      `prerender: a rota "${caminho}" (${chave}) não produziu <title>. O <Helmet> dessa página sumiu?`,
    );
  }

  // data-rota diz ao main.tsx que este HTML corresponde à URL atual e que dá
  // para hidratar em vez de renderizar do zero.
  const html = embutirCss(limparHead(template))
    .replace("</head>", `  ${head}\n  </head>`)
    .replace(MARCADOR_RAIZ, `<div id="root" data-rota="${normalizar(caminho)}">${corpo}</div>`);

  const destino = join(dist, arquivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, html, "utf8");
  gravados += 1;
  console.log(`prerender: ${arquivo.padEnd(24)} ${(corpo.length / 1024).toFixed(1)} kB de HTML`);
}

console.log(`prerender: ${gravados} rotas gravadas.`);
