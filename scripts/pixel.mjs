// Troca (ou apaga) o bloco do pixel da Meta no HTML de uma rota.
//
// POR QUE ISTO EXISTE. Até 03/09/2026 o site tinha um pixel só, escrito à mão
// no `index.html`. Como aquele arquivo é o template de TODAS as rotas, o pixel
// caía em toda página — não por escolha, por construção. Aí ele quis um pixel
// separado para o público de casa e construção, e a pergunta virou "dá pra
// colocar o pixel só em uma página?".
//
// Dá, e barato: aqui não existe servidor nem roteador, e o prerender já grava
// um HTML pronto por rota. Só faltava, na hora de gravar, trocar o número.
//
// ⚠️ NUNCA DOIS PIXELS NO MESMO DOCUMENTO. `fbq('track', …)` dispara para todo
// pixel que tenha feito `init` naquela página — o `trackLead` não escolhe
// destino. Duas campanhas contariam a conversão uma da outra. Por isso a
// função recebe UM id, ou `null`, e nunca uma lista.
//
// Testado por src/test/pixels.test.ts contra o index.html de verdade.

const ABRE_BLOCO = "<!-- INICIO DO PIXEL -->";
const FECHA_BLOCO = "<!-- FIM DO PIXEL -->";
const ABRE_DICAS = "<!-- INICIO DICAS DO PIXEL -->";
const FECHA_DICAS = "<!-- FIM DICAS DO PIXEL -->";

/**
 * Acha uma região marcada e devolve o pedaço a recortar.
 *
 * O recorte come também a indentação antes da marca de abertura e a quebra de
 * linha depois da de fechamento. Sem isso, apagar o bloco deixaria uma linha de
 * espaços órfã em cada HTML — sujeira que ninguém vê revisando o código e todo
 * mundo vê olhando o fonte da página.
 */
const regiao = (html, abre, fecha, onde) => {
  const i = html.indexOf(abre);
  const fim = html.indexOf(fecha);
  if (i === -1 || fim === -1 || fim < i) {
    throw new Error(
      `pixel: não achei a região ${abre} … ${fecha} no ${onde}. Alguém apagou os comentários que servem de âncora — sem eles não dá para saber o que é pixel e o que é o resto da página.`,
    );
  }

  let inicio = i;
  while (inicio > 0 && (html[inicio - 1] === " " || html[inicio - 1] === "\t")) inicio -= 1;

  let j = fim + fecha.length;
  if (html[j] === "\r") j += 1;
  if (html[j] === "\n") j += 1;

  return { inicio, j, texto: html.slice(i, fim + fecha.length) };
};

/**
 * Devolve o HTML daquela rota com o pixel certo.
 *
 * `id` vem de PIXEL_DA_ROTA (src/rotas.ts):
 *   - uma string → o bloco fica, com aquele número no lugar do principal;
 *   - `null`     → o bloco sai inteiro, com o <noscript> e as dicas de DNS.
 *     Página sem pixel não tem por que resolver o DNS do facebook.net.
 *
 * `principal` é o id escrito no index.html — o valor que roda em `npm run dev`,
 * onde não existe pré-renderização para trocar nada.
 */
export const aplicarPixel = (html, { id, principal, rota = "?" }) => {
  const bloco = regiao(html, ABRE_BLOCO, FECHA_BLOCO, "template");
  const dicas = regiao(html, ABRE_DICAS, FECHA_DICAS, "template");

  if (id === null) {
    // De trás para a frente: recortar a região de cima primeiro invalidaria os
    // índices já calculados da de baixo.
    return [bloco, dicas]
      .sort((a, b) => b.inicio - a.inicio)
      .reduce((h, r) => h.slice(0, r.inicio) + h.slice(r.j), html);
  }

  const quantos = bloco.texto.split(principal).length - 1;
  // São dois: o `fbq('init', …)` e a URL do <noscript>. Se o número mudar,
  // alguém mexeu no bloco e a troca sairia pela metade — meia troca é a pior
  // saída possível, porque a página sobe medindo no pixel errado sem avisar.
  if (quantos !== 2) {
    throw new Error(
      `pixel: esperava o id principal (${principal}) 2 vezes dentro do bloco e achei ${quantos} (rota ${rota}). O PIXEL_PRINCIPAL de src/rotas.ts saiu de sincronia com o index.html, ou o bloco mudou de forma.`,
    );
  }

  const i = html.indexOf(bloco.texto);
  return html.slice(0, i) + bloco.texto.split(principal).join(id) + html.slice(i + bloco.texto.length);
};
