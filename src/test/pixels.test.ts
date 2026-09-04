/**
 * Guarda o conserto de 26/08/2026 no pixel da Meta.
 *
 * O defeito que estes testes existem para impedir: até aquela data o stub era
 * criado DENTRO da função adiada para o ocioso. Enquanto ela não rodava,
 * `window.fbq` não existia — e o `trackLead` checa `typeof window.fbq ===
 * "function"` antes de disparar. Quem apertasse o botão do WhatsApp cedo
 * demais tinha a conversão descartada em silêncio. Sem cair um teste, sem um
 * erro no console: só um lead a menos no painel, semanas depois.
 *
 * Por isso o teste roda o script inline do `index.html` DE VERDADE, lido do
 * arquivo. Testar uma cópia do trecho não pegaria nada — o defeito estava no
 * arquivo, não numa abstração nossa.
 *
 * O pixel do OpenAI Ads saiu do site em 28/08/2026 e por isso saiu daqui
 * também. Se voltar, o histórico do git tem os testes dele.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { aplicarPixel } from "../../scripts/pixel.mjs";
import { PIXEL_PRINCIPAL, PIXEL_DA_ROTA, CHAVES_DE_ROTA } from "../rotas.ts";

const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");

/** Os `<script>` sem atributo nenhum — ou seja, os inline, sem o do Vite. */
const scriptsInline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

const SRC_META = "connect.facebook.net";

const carregados = () =>
  [...document.getElementsByTagName("script")].map((s) => s.src).filter((src) => src.includes(SRC_META));

/**
 * Cada execução do script deixa um ouvinte de `pointerdown` no `document`, e
 * limpar `document.head` não o remove. Sem desarmar, o ouvinte de um teste
 * dispara no teste seguinte e baixa o SDK uma segunda vez — o que já me
 * custou uma falha confusa em "baixa uma vez só". Anotamos o que foi
 * registrado para poder remover no afterEach.
 */
const ouvintesRegistrados: Array<[string, EventListenerOrEventListenerObject, unknown]> = [];

/**
 * Executa o script inline no mesmo `window` do teste.
 *
 * O `<script>` de mentira que entra antes existe porque o trecho insere o SDK
 * com `insertBefore` no primeiro script da página — na página real esse
 * primeiro script é ele próprio, mas um documento de jsdom nasce sem nenhum.
 */
const rodarScriptInline = () => {
  document.head.appendChild(document.createElement("script"));
  const original = document.addEventListener.bind(document);
  document.addEventListener = ((tipo: string, fn: EventListenerOrEventListenerObject, opts: unknown) => {
    ouvintesRegistrados.push([tipo, fn, opts]);
    return original(tipo, fn as EventListener, opts as AddEventListenerOptions);
  }) as typeof document.addEventListener;
  try {
    new Function(scriptsInline[0])();
  } finally {
    document.addEventListener = original;
  }
};

describe("pixel da Meta: o stub existe antes do SDK", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
    delete window.fbq;
    delete window.__promofyPixels;
  });

  afterEach(() => {
    vi.useRealTimers();
    for (const [tipo, fn, opts] of ouvintesRegistrados) {
      document.removeEventListener(tipo, fn, opts as EventListenerOptions);
    }
    ouvintesRegistrados.length = 0;
  });

  it("o index.html tem UM bloco inline de pixel, e nada da OpenAI", () => {
    // Se este número mudar, alguém dividiu ou colou trecho novo: os testes
    // abaixo passam a olhar o bloco errado e param de guardar coisa nenhuma.
    expect(scriptsInline).toHaveLength(1);
    expect(scriptsInline[0]).toContain(PIXEL_PRINCIPAL); // pixel da Meta

    // O pixel da OpenAI foi removido em 28/08/2026. Isto impede que ele volte
    // sem querer, num merge ou num copiar-colar de versão antiga.
    //
    // A asserção é sobre o CÓDIGO, não sobre o arquivo inteiro: o comentário
    // do index.html cita a OpenAI de propósito, para quem for reintroduzir o
    // pixel um dia saber onde estão as armadilhas.
    expect(scriptsInline[0]).not.toContain("oaiq");
    expect(scriptsInline[0]).not.toContain("openai");
    expect(html).not.toContain("bzrcdn"); // o CDN do SDK, em qualquer forma
  });

  it("cria fbq NA HORA, sem esperar ocioso nem toque", () => {
    rodarScriptInline();

    // Este é o teste que importa. Nada de avançar relógio, nada de disparar
    // evento: no instante seguinte ao script, o fbq já tem de existir.
    expect(typeof window.fbq).toBe("function");
  });

  it("enfileira init e PageView em vez de perdê-los", () => {
    rodarScriptInline();

    const fila = (window.fbq as unknown as { queue: unknown[][] }).queue;
    expect(fila.map((c) => [c[0], c[1]])).toEqual([
      ["init", "1561896425355572"],
      ["track", "PageView"],
    ]);
  });

  it("um clique adiantado entra na fila em vez de ser descartado", () => {
    rodarScriptInline();

    // Exatamente o que o trackLead faz, antes de o SDK ter chegado.
    window.fbq!("track", "Lead", { content_name: "/" }, { eventID: "lead_teste" });

    const fila = (window.fbq as unknown as { queue: unknown[][] }).queue;
    expect(fila[fila.length - 1][1]).toBe("Lead");
  });

  it("NÃO baixa o SDK junto com o stub — o adiamento continua de pé", () => {
    rodarScriptInline();
    expect(carregados()).toEqual([]);
  });

  it("o primeiro toque adianta o download", () => {
    rodarScriptInline();
    document.dispatchEvent(new Event("pointerdown"));
    expect(carregados()).toHaveLength(1);
  });

  it("sem toque nenhum, os 3 s de rede de segurança baixam assim mesmo", () => {
    // jsdom não tem requestIdleCallback, então este teste cobre justamente o
    // caminho do relógio — o mesmo que salva a aba oculta, onde o
    // requestIdleCallback pode nunca rodar.
    rodarScriptInline();
    expect(carregados()).toEqual([]);

    vi.advanceTimersByTime(3000);
    expect(carregados()).toHaveLength(1);
  });

  it("baixa uma vez só, mesmo com toque e relógio juntos", () => {
    rodarScriptInline();
    document.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(10000);

    expect(carregados()).toHaveLength(1);
  });
});

/**
 * ============================================================================
 * UM PIXEL POR PÁGINA (03/09/2026)
 * ============================================================================
 *
 * Ele quis um pixel separado para o público de casa e construção. Antes o id
 * vivia cravado no `index.html`, que é o template de TODAS as rotas — ou seja,
 * o pixel caía em toda página por construção, não por escolha.
 *
 * O que estes testes guardam é a troca feita em tempo de build pelo
 * `scripts/pixel.mjs`. Rodam contra o `index.html` DE VERDADE, pelo mesmo
 * motivo dos testes lá de cima: o defeito, se vier, vai estar no arquivo.
 *
 * O risco que justifica cada um: uma troca que sai pela metade sobe a página
 * medindo no pixel errado, sem erro nenhum, e a campanha só denuncia isso
 * semanas depois — no painel vazio.
 */
describe("um pixel por página", () => {
  const PIXEL_FALSO = "9999999999999999";

  it("o PIXEL_PRINCIPAL do rotas.ts é o mesmo que está escrito no index.html", () => {
    // Se divergirem, o aplicarPixel não acha o que trocar e o build quebra —
    // mas quebrar no build é tarde: aqui quebra em 40 ms.
    expect(html).toContain(PIXEL_PRINCIPAL);
  });

  it("toda rota decidiu o seu pixel — inclusive decidir que não tem", () => {
    // O `tsc` já obriga a chave a existir. Isto pega o outro caso: alguém
    // acrescentar uma rota e deixar `undefined` por descuido de tipo.
    for (const chave of CHAVES_DE_ROTA) {
      expect(PIXEL_DA_ROTA[chave] === null || typeof PIXEL_DA_ROTA[chave] === "string").toBe(true);
    }
  });

  it("troca o id nos DOIS lugares: o fbq('init') e a URL do <noscript>", () => {
    const saida = aplicarPixel(html, { id: PIXEL_FALSO, principal: PIXEL_PRINCIPAL });

    expect(saida).not.toContain(PIXEL_PRINCIPAL);
    expect(saida.split(PIXEL_FALSO).length - 1).toBe(2);
    expect(saida).toContain(`fbq('init', '${PIXEL_FALSO}')`);
    expect(saida).toContain(`facebook.com/tr?id=${PIXEL_FALSO}`);
  });

  it("trocar o pixel não mexe em mais nada do documento", () => {
    const saida = aplicarPixel(html, { id: PIXEL_FALSO, principal: PIXEL_PRINCIPAL });

    // Mesmo tamanho: os dois ids têm 16 dígitos. Se isto falhar, a função
    // comeu ou acrescentou alguma coisa fora do bloco.
    expect(saida).toHaveLength(html.length);
    expect(saida.replaceAll(PIXEL_FALSO, PIXEL_PRINCIPAL)).toBe(html);
  });

  it("com id null, o bloco inteiro sai — script, noscript e dicas de DNS", () => {
    const saida = aplicarPixel(html, { id: null, principal: PIXEL_PRINCIPAL });

    expect(saida).not.toContain(PIXEL_PRINCIPAL);
    expect(saida).not.toContain("fbq");
    expect(saida).not.toContain("connect.facebook.net");
    expect(saida).not.toContain("facebook.com/tr");
    // Página sem pixel não tem por que resolver o DNS do facebook.
    expect(saida).not.toContain("dns-prefetch");
    // E o resto da página continua de pé.
    expect(saida).toContain('<div id="root"></div>');
    expect(saida).toContain("inter-latin-var.woff2");
  });

  it("a /construcao mede no pixel DELA, que não é o da página principal", () => {
    // Este teste já foi o contrário: por algumas horas em 03/09/2026 ele
    // afirmava `toBeNull()`, porque o pixel do nicho ainda não existia e a
    // página subia sem medir de propósito. Virou isto quando ele criou o pixel.
    //
    // A asserção que importa é a SEGUNDA. Se um dia as duas rotas apontarem
    // para o mesmo id, as duas campanhas passam a contar a conversão uma da
    // outra e nenhum dos dois painéis presta — e nada mais no projeto avisaria.
    expect(PIXEL_DA_ROTA.construcao).toBe("1577370160750579");
    expect(PIXEL_DA_ROTA.construcao).not.toBe(PIXEL_DA_ROTA.captacao);
  });

  it("o pixel do nicho entra nos dois lugares do HTML, e o principal some", () => {
    const saida = aplicarPixel(html, {
      id: PIXEL_DA_ROTA.construcao,
      principal: PIXEL_PRINCIPAL,
      rota: "construcao",
    });

    expect(saida).toContain(`fbq('init', '${PIXEL_DA_ROTA.construcao}')`);
    expect(saida).toContain(`facebook.com/tr?id=${PIXEL_DA_ROTA.construcao}`);
    expect(saida).not.toContain(PIXEL_PRINCIPAL);
  });

  it("a captação principal continua no pixel de sempre", () => {
    // A campanha dele está no ar. Nenhuma mexida no pixel novo pode encostar
    // nesta rota.
    expect(PIXEL_DA_ROTA.captacao).toBe(PIXEL_PRINCIPAL);

    const saida = aplicarPixel(html, { id: PIXEL_DA_ROTA.captacao, principal: PIXEL_PRINCIPAL });
    expect(saida).toBe(html);
  });

  it("explode se o id principal sair de sincronia, em vez de trocar pela metade", () => {
    expect(() => aplicarPixel(html, { id: PIXEL_FALSO, principal: "0000000000" })).toThrow(
      /saiu de sincronia/,
    );
  });

  it("explode se alguém apagar os comentários que marcam o bloco", () => {
    const semMarca = html.replace("<!-- FIM DO PIXEL -->", "");
    expect(() => aplicarPixel(semMarca, { id: PIXEL_FALSO, principal: PIXEL_PRINCIPAL })).toThrow(
      /não achei a região/,
    );
  });
});
