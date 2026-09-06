// Põe (ou não) o bloco do pixel do OpenAI Ads no HTML de uma rota.
//
// POR QUE É UM ARQUIVO SEPARADO, e não mais um pedaço do index.html como o da
// Meta. O `index.html` é o template de TODAS as rotas: o que se escreve lá cai
// em toda página por construção. Com o pixel da Meta isso já foi resolvido
// trocando o id na hora de gravar (scripts/pixel.mjs), mas ali o bloco JÁ
// existia em todo mundo — a troca só mudava um número.
//
// Aqui o caso é o contrário: **uma rota só** mede na OpenAI (a /obras,
// 06/09/2026), e o SDK deles pesa ~79 kB. Deixar o bloco no template para
// depois arrancá-lo de seis rotas seria pagar em bytes e em risco por uma
// coisa que só uma página quer. Então o bloco mora aqui, fora do template, e
// entra pelo prerender apenas onde PIXEL_OPENAI_DA_ROTA (src/rotas.ts) manda.
//
// EFEITO COLATERAL BOM: em `npm run dev` nenhuma rota tem pixel da OpenAI, e
// nenhum `page_view` de localhost suja o painel de um pixel recém-criado — foi
// exatamente o cuidado que se tomou à mão quando o pixel da /construcao nasceu.
// EFEITO COLATERAL RUIM, e assumido: o disparo do lead não dá para ser
// conferido rodando o site local. O que guarda o comportamento são os testes
// em src/test/pixels.test.ts, que executam ESTE bloco de verdade.
//
// ⚠️ O SDK DA OPENAI NÃO É ADIADO, e isto não é para ser "otimizado". Ele entra
// `async`, mas o `<script>` é inserido na hora, como a instrução deles pede
// ("perto do topo"). O motivo está inteiro em src/lib/lead-openai.ts: é no
// momento em que o SDK carrega que ele lê o `oppref` da URL — o identificador
// de clique sem o qual a conversão é aceita com HTTP 202 e mesmo assim fica
// órfã, sem alimentar a campanha. Adiar o SDK penduraria a ATRIBUIÇÃO num
// detalhe de performance. Custa PageSpeed de propósito.

/** A âncora no `<head>` do index.html. Some nas rotas sem pixel da OpenAI. */
const MARCADOR = "<!-- MARCADOR: PIXEL DA OPENAI";

/**
 * O bloco, com `__PIXEL__` no lugar do id.
 *
 * Comentário curto DE PROPÓSITO, pela mesma razão do bloco da Meta: o Vite não
 * minifica script inline, então cada linha escrita aqui viaja comprimida na
 * página. A explicação inteira mora em src/lib/lead-openai.ts, que é compilado
 * e onde comentário sai de graça.
 *
 * O stub é o trecho oficial da OpenAI menos o rabo que insere o `<script>` —
 * essa parte vem logo abaixo, à mão, só para pendurar o `onload` que avisa
 * quando o SDK chegou. Fora isso é o mesmo código que eles mandam.
 */
const BLOCO = `<link rel="dns-prefetch" href="https://bzrcdn.openai.com" />
    <link rel="dns-prefetch" href="https://bzr.openai.com" />
    <!-- PIXEL DO OPENAI ADS. Stub com fila na hora; o SDK vem async e SEM
         adiamento, senão o \`oppref\` se perde. Detalhes em lib/lead-openai.ts. -->
    <script>
      (function () {
        var estado = (window.__promofyOpenai = { pronto: false });

        /* A fila (oaiq.q) existe desde o primeiro instante: clique adiantado
           espera o SDK em vez de sumir. Adiar pixel é adiar o SDK, nunca o stub. */
        !function(w){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q}(window);

        /* debug liga sozinho fora do site publicado; em apromofy.online é sempre false. */
        oaiq("init", {
          pixelId: "__PIXEL__",
          debug: location.hostname === "localhost" || location.hostname === "127.0.0.1"
        });

        var j = document.createElement("script");
        j.async = true;
        j.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
        j.onload = function () { estado.pronto = true; };
        var primeiro = document.getElementsByTagName("script")[0];
        primeiro.parentNode.insertBefore(j, primeiro);
      })();
    </script>`;

/**
 * Acha a âncora (um comentário HTML de várias linhas) e devolve os três
 * índices que interessam: onde começa a indentação dela, onde começa o `<!--`
 * e onde termina o `-->`.
 *
 * O recorte come também a indentação antes do `<!--` e a quebra de linha
 * depois do `-->`. Sem isso, apagar a âncora deixaria uma linha de espaços
 * órfã no HTML de SEIS rotas — sujeira que ninguém vê revisando o código e
 * todo mundo vê olhando o fonte da página. E, mais importante: é o que faz o
 * HTML das rotas antigas sair BYTE A BYTE igual ao de antes de a /obras
 * existir, que é a promessa desta mudança.
 */
const ancora = (html, onde) => {
  const i = html.indexOf(MARCADOR);
  if (i === -1) {
    throw new Error(
      `pixel-openai: não achei a âncora "${MARCADOR}" no ${onde}. Alguém apagou o comentário do index.html — sem ele não há onde escrever o bloco, e a /obras subiria sem medir nada.`,
    );
  }

  const fecha = html.indexOf("-->", i);
  if (fecha === -1) {
    throw new Error(
      `pixel-openai: a âncora do ${onde} começa e não fecha. O comentário do index.html ficou pela metade?`,
    );
  }

  let inicio = i;
  while (inicio > 0 && (html[inicio - 1] === " " || html[inicio - 1] === "\t")) inicio -= 1;

  const depois = fecha + "-->".length;
  let semQuebra = depois;
  if (html[semQuebra] === "\r") semQuebra += 1;
  if (html[semQuebra] === "\n") semQuebra += 1;

  return { inicio, i, depois, semQuebra };
};

/**
 * Devolve o HTML daquela rota com o pixel da OpenAI — ou sem vestígio dele.
 *
 * `id` vem de PIXEL_OPENAI_DA_ROTA (src/rotas.ts):
 *   - uma string → a âncora vira o bloco, com aquele id;
 *   - `null`     → a âncora some inteira, e o documento fica exatamente como
 *     era antes de esta funcionalidade existir. Página que não mede na OpenAI
 *     não tem por que resolver o DNS deles nem baixar 79 kB de SDK.
 */
export const aplicarPixelOpenai = (html, { id, rota = "?" }) => {
  const { inicio, i, depois, semQuebra } = ancora(html, `template (rota ${rota})`);

  if (id === null) return html.slice(0, inicio) + html.slice(semQuebra);

  // Recorta de `i` (e não de `inicio`) para reaproveitar a indentação da
  // âncora: o bloco já vem escrito com quatro espaços nas linhas seguintes,
  // que é onde ele vive — dentro do <head>. A quebra de linha do fim fica de
  // pé, então o que vinha depois continua na própria linha.
  return html.slice(0, i) + BLOCO.replace("__PIXEL__", id) + html.slice(depois);
};

/** Exportado só para os testes conferirem o bloco sem ter de reescrevê-lo. */
export const BLOCO_OPENAI = BLOCO;
