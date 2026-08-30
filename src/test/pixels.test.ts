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
    expect(scriptsInline[0]).toContain("1561896425355572"); // pixel da Meta

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
