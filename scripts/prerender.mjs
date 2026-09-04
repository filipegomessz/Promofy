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

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  render,
  ARQUIVO_DA_ROTA,
  CLASSE_DO_BODY,
  PIXEL_DA_ROTA,
  PIXEL_PRINCIPAL,
} from "../dist-ssr/entry-server.js";
import { aplicarPixel } from "./pixel.mjs";

/**
 * Qual módulo de página cada rota carrega no navegador. Precisa bater com o
 * mapa CARREGAR do src/main.tsx — é a partir daqui que se descobre, no
 * manifesto do Vite, o nome com hash do pedaço de cada rota.
 */
const MODULO_DA_ROTA = {
  captacao: "src/pages/LandingSimples.tsx",
  construcao: "src/pages/Construcao.tsx",
  completa: "src/pages/Index.tsx",
  termos: "src/pages/Terms.tsx",
  privacidade: "src/pages/Privacy.tsx",
  contato: "src/pages/Contact.tsx",
  404: "src/pages/NotFound.tsx",
};

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

/**
 * O manifesto do Vite: diz qual arquivo com hash saiu de cada módulo-fonte.
 * Usamos para descobrir o pedaço de JavaScript de cada página.
 */
const caminhoDoManifesto = join(dist, ".vite", "manifest.json");
const manifesto = JSON.parse(readFileSync(caminhoDoManifesto, "utf8"));

/**
 * Escreve o `modulepreload` do pedaço DAQUELA rota (e das dependências dele).
 *
 * Sem isto o import dinâmico do main.tsx viraria uma cascata: o navegador
 * baixaria o main, só então descobriria qual pedaço pedir, e faria uma segunda
 * ida e volta antes de conseguir hidratar. Com o preload no documento, os dois
 * descem em paralelo — o isolamento entre as páginas sai de graça.
 */
const preloadDaPagina = (chave, htmlAteAgora) => {
  const fonte = MODULO_DA_ROTA[chave];
  const entrada = manifesto[fonte];
  if (!entrada) {
    throw new Error(
      `prerender: o manifesto não tem "${fonte}" (rota ${chave}). O mapa MODULO_DA_ROTA saiu de sincronia com o CARREGAR do main.tsx?`,
    );
  }

  // `imports` traz os pedaços compartilhados de que esta página depende
  // (react-vendor, lead...). Pré-carregar todos evita cascata em série.
  const arquivos = [entrada.file, ...(entrada.imports ?? []).map((i) => manifesto[i]?.file)];

  return [...new Set(arquivos.filter(Boolean))]
    // O Vite já escreveu no template o modulepreload dos pedaços que a entrada
    // importa de forma estática. Repetir não quebra nada, mas são bytes à toa
    // em cada HTML — e a duplicata confunde quem for ler o documento depois.
    .filter((f) => !htmlAteAgora.includes(f))
    .map((f) => `<link rel="modulepreload" crossorigin href="/${f}">`)
    .join("\n    ");
};

const MARCADOR_PRELOAD = "<!-- MARCADOR: PRELOAD DA CAPTACAO";
if (!template.includes(MARCADOR_PRELOAD)) {
  throw new Error(
    "prerender: não achei o marcador do preload da captação no index.html. Alguém apagou o comentário que serve de âncora.",
  );
}

/**
 * O avatar é o elemento de LCP das páginas de captação, e só delas.
 * Pré-carregar em TODAS as rotas seriam 5 kB em prioridade alta desperdiçados
 * nas outras — item que o próprio Lighthouse aponta. Por isso ele entra aqui,
 * por rota.
 *
 * ⚠️ ATÉ 03/09/2026 ISTO PEGAVA CARONA NO CLASSE_DO_BODY: "tem classe no body"
 * valia como "usa o avatar" porque, com uma captação só, as duas coisas
 * coincidiam. Com a /construcao — que também é clara E também usa avatar — a
 * carona continuaria certa por acidente, e a próxima página clara SEM avatar
 * ganharia um preload que ninguém usa, sem quebrar nada e sem ninguém perceber.
 *
 * ⚠️ E CADA PÁGINA TEM A SUA IMAGEM, não a mesma. Isto nasceu como um `Set` de
 * rotas com o arquivo cravado numa constante; quando a /construcao ganhou arte
 * própria, aquele desenho teria pré-carregado a foto da OUTRA página — 5 kB
 * baixados em prioridade alta e jamais usados, e o LCP de verdade sem preload
 * nenhum. Falha silenciosa perfeita: nada quebra, a página só fica mais lenta.
 * Por isso é mapa de rota → arquivo, e não lista de rotas.
 */
const AVATAR_DA_ROTA = {
  captacao: "/promofy-avatar.webp",
  construcao: "/construcao-avatar.webp",
};

const preloadDoAvatar = (chave) =>
  AVATAR_DA_ROTA[chave]
    ? '<link rel="preload" as="image" href="' + AVATAR_DA_ROTA[chave] + '" fetchpriority="high">'
    : "";

let gravados = 0;
for (const [chave, { caminho, arquivo, alias }] of Object.entries(ARQUIVO_DA_ROTA)) {
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

  // A classe do <body> vem escrita no documento, e não de um useEffect: a
  // captação é a única tela clara de um site escuro, e vindo do efeito ela
  // pintava ESCURA até o JavaScript hidratar — flash de tema errado na
  // primeira dobra, justo na página principal.
  const classeDoBody = CLASSE_DO_BODY[chave];

  // data-rota diz ao main.tsx que este HTML corresponde à URL atual e que dá
  // para hidratar em vez de renderizar do zero.
  // O pixel é POR ROTA desde 03/09/2026: cada página leva o seu, ou nenhum.
  // Ver PIXEL_DA_ROTA em src/rotas.ts e a explicação em scripts/pixel.mjs.
  const comPixel = aplicarPixel(template, {
    id: PIXEL_DA_ROTA[chave],
    principal: PIXEL_PRINCIPAL,
    rota: chave,
  });

  const base = embutirCss(limparHead(comPixel)).replace(
    MARCADOR_PRELOAD,
    `${preloadDoAvatar(chave) ? preloadDoAvatar(chave) + "\n    " : ""}${MARCADOR_PRELOAD}`,
  );

  const html = base
    .replace("</head>", `  ${preloadDaPagina(chave, base)}\n  ${head}\n  </head>`)
    .replace("<body>", classeDoBody ? `<body class="${classeDoBody}">` : "<body>")
    .replace(MARCADOR_RAIZ, `<div id="root" data-rota="${normalizar(caminho)}">${corpo}</div>`);

  for (const nome of alias ? [arquivo, alias] : [arquivo]) {
    const destino = join(dist, nome);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, html, "utf8");
    gravados += 1;
    const nota = nome === alias ? "  (alias, evita o 301 do Pages)" : "";
    const pixel = PIXEL_DA_ROTA[chave] ? `pixel ${PIXEL_DA_ROTA[chave]}` : "SEM PIXEL";
    console.log(
      `prerender: ${nome.padEnd(24)} ${(corpo.length / 1024).toFixed(1).padStart(5)} kB  ${pixel.padEnd(22)}${nota}`,
    );
  }
}

// O manifesto era só para montar os preloads; não tem por que ir para o ar.
rmSync(join(dist, ".vite"), { recursive: true, force: true });

console.log(`prerender: ${gravados} rotas gravadas.`);
