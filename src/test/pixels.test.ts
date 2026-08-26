/**
 * Guarda o conserto de 26/08/2026 nos dois pixels.
 *
 * O defeito que estes testes existem para impedir: até aquela data o stub de
 * cada pixel era criado DENTRO da função adiada para o ocioso. Enquanto ela
 * não rodava, `window.fbq` e `window.oaiq` não existiam — e o `trackLead`
 * checa `typeof window.fbq === "function"` antes de disparar. Quem apertasse
 * o botão do WhatsApp cedo demais tinha a conversão descartada em silêncio,
 * nas duas plataformas. Sem cair um teste, sem um erro no console: só um lead
 * a menos no painel, semanas depois.
 *
 * Por isso o teste roda o script inline do `index.html` DE VERDADE, lido do
 * arquivo. Testar uma cópia do trecho não pegaria nada — o defeito estava no
 * arquivo, não numa abstração nossa.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const html = readFileSync(resolve(__dirname, "../../index.html"), "utf8");

/** Os `<script>` sem atributo nenhum — ou seja, os inline, sem o do Vite. */
const scriptsInline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

const SRC_META = "connect.facebook.net";
const SRC_OPENAI = "bzrcdn.openai.com";

const carregados = () =>
  [...document.getElementsByTagName("script")]
    .map((s) => s.src)
    .filter((src) => src.includes(SRC_META) || src.includes(SRC_OPENAI));

/**
 * Executa o script inline no mesmo `window` do teste.
 *
 * O `<script>` de mentira que entra antes existe porque o trecho insere os
 * SDKs com `insertBefore` no primeiro script da página — na página real esse
 * primeiro script é ele próprio, mas um documento de jsdom nasce sem nenhum.
 */
const rodarScriptInline = () => {
  document.head.appendChild(document.createElement("script"));
  new Function(scriptsInline[0])();
};

describe("pixels: o stub existe antes do SDK", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete window.fbq;
    delete window.oaiq;
    delete window.__promofyPixels;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("o index.html tem UM bloco inline de pixel, não dois soltos", () => {
    // Se este número mudar, alguém dividiu ou colou trecho novo: os testes
    // abaixo passam a olhar o bloco errado e param de guardar coisa nenhuma.
    expect(scriptsInline).toHaveLength(1);
    expect(scriptsInline[0]).toContain("1561896425355572"); // pixel da Meta
    expect(scriptsInline[0]).toContain("45eXnE333nLqBeWBfwzcL4"); // pixel da OpenAI
  });

  it("cria fbq e oaiq NA HORA, sem esperar ocioso nem toque", () => {
    rodarScriptInline();

    // Este é o teste que importa. Nada de avançar relógio, nada de disparar
    // evento: no instante seguinte ao script, os dois já têm de existir.
    expect(typeof window.fbq).toBe("function");
    expect(typeof window.oaiq).toBe("function");
  });

  it("enfileira init e PageView em vez de perdê-los", () => {
    rodarScriptInline();

    const fila = (window.fbq as unknown as { queue: unknown[][] }).queue;
    expect(fila.map((c) => [c[0], c[1]])).toEqual([
      ["init", "1561896425355572"],
      ["track", "PageView"],
    ]);

    const filaOpenai = (window.oaiq as unknown as { q: unknown[][] }).q;
    expect(filaOpenai).toHaveLength(1);
    expect(filaOpenai[0][0]).toBe("init");
  });

  it("um clique adiantado entra na fila em vez de ser descartado", () => {
    rodarScriptInline();

    // Exatamente o que o trackLead faz, antes de qualquer SDK ter chegado.
    window.fbq!("track", "Lead", { content_name: "/lp" }, { eventID: "lead_teste" });
    window.oaiq!("measure", "lead_created", { type: "customer_action" });

    const fila = (window.fbq as unknown as { queue: unknown[][] }).queue;
    expect(fila[fila.length - 1][1]).toBe("Lead");

    const filaOpenai = (window.oaiq as unknown as { q: unknown[][] }).q;
    expect(filaOpenai[filaOpenai.length - 1][1]).toBe("lead_created");
  });

  it("NÃO baixa os SDKs junto com o stub — o adiamento continua de pé", () => {
    rodarScriptInline();
    expect(carregados()).toEqual([]);
  });

  it("o primeiro toque adianta o download", () => {
    rodarScriptInline();
    document.dispatchEvent(new Event("pointerdown"));

    const srcs = carregados();
    expect(srcs.some((s) => s.includes(SRC_META))).toBe(true);
    expect(srcs.some((s) => s.includes(SRC_OPENAI))).toBe(true);
  });

  it("sem toque nenhum, os 3 s de rede de segurança baixam assim mesmo", () => {
    // jsdom não tem requestIdleCallback, então este teste cobre justamente o
    // caminho do relógio — o mesmo que salva a aba oculta, onde o
    // requestIdleCallback pode nunca rodar.
    rodarScriptInline();
    expect(carregados()).toEqual([]);

    vi.advanceTimersByTime(3000);
    expect(carregados()).toHaveLength(2);
  });

  it("baixa uma vez só, mesmo com toque e relógio juntos", () => {
    rodarScriptInline();
    document.dispatchEvent(new Event("pointerdown"));
    document.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(10000);

    expect(carregados()).toHaveLength(2);
  });
});
