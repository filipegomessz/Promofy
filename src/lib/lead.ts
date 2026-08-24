import type { MouseEvent } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    /** Pixel do OpenAI Ads. Carregado no index.html; enquanto o SDK não chega,
     *  é um stub que empilha as chamadas numa fila e as envia depois. */
    oaiq?: (...args: unknown[]) => void;
  }
}

export const WHATSAPP_GROUP = "https://chat.whatsapp.com/CeIkFA6dIzIKN91j5dzS7o";
export const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7qoOCFXUuQyXWHEV0U";

/**
 * Grupo usado SÓ pela landing de captação (/grupo).
 * Está separado de propósito: o pedido foi trocar o link "do botão" dessa
 * tela, e mexer em WHATSAPP_GROUP mudaria também os dois CTAs da home.
 * Se na verdade o grupo mudou para todo mundo, apagar esta constante e
 * atualizar WHATSAPP_GROUP acima.
 */
export const WHATSAPP_GROUP_LANDING =
  "https://chat.whatsapp.com/ByF67GiEh9k3gq2XfoyUBs";

// Contador global para auditoria — garante que cada clique dispare exatamente 1 Lead
let __leadFireCount = 0;

/**
 * Janela que a gente segura antes de abrir o WhatsApp, para os beacons dos
 * pixels saírem. Existe porque no celular a troca de app pode descartar
 * requisição pendente.
 *
 * Os dois pixels se comportam de forma BEM diferente aqui, medido no
 * navegador em 24/08/2026 — vale saber antes de estranhar o painel de rede:
 *
 * - Meta: dispara na hora, ~14 ms depois do clique. Cabe folgado nos 250 ms.
 * - OpenAI: acumula em lote e só descarrega num temporizador de ~1 s, ou
 *   seja, MAIS TARDE que os 250 ms. Parece perda de evento, mas não é: o SDK
 *   deles descarrega na hora (~2 ms) quando a aba fica oculta, que é
 *   exatamente o que o navegador faz ao abrir o WhatsApp. Testado forçando
 *   visibilitychange/pagehide.
 *
 * Por isso NÃO esticamos a espera para ~1,3 s: não resolveria nada que o
 * flush por visibilidade já não resolva, e custaria mais de um segundo de
 * tela parada depois do toque — o pior lugar possível para uma pausa.
 */
const ESPERA_ANTES_DE_NAVEGAR_MS = 250;

/**
 * Dispara a conversão nos dois pixels e só então abre o link.
 *
 * A conversão do site é UMA só — "clicou no botão para entrar no grupo" —
 * e é reportada com o nome que cada plataforma espera: "Lead" na Meta,
 * "lead_created" na OpenAI. Ter os dois disparos aqui, num ponto único,
 * é o que impede que um evolua e o outro fique para trás.
 *
 * Não há envio pela Conversions API de nenhuma das duas: seria server-side
 * e exigiria uma chave secreta, que num site estático ficaria exposta no
 * código-fonte para qualquer visitante forjar conversões.
 */
export const trackLead = (
  e?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  href?: string,
) => {
  const temFbq = typeof window !== "undefined" && typeof window.fbq === "function";
  const temOaiq = typeof window !== "undefined" && typeof window.oaiq === "function";
  let eventID: string | null = null;

  if (temFbq) {
    eventID = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.fbq!("track", "Lead", { content_name: href ?? "unknown" }, { eventID });
  }

  if (temOaiq) {
    window.oaiq!("measure", "lead_created", { type: "customer_action" });
  }

  if (temFbq || temOaiq) {
    __leadFireCount += 1;
  }

  // Verificação no console (Pixel Helper e afins).
  // Esperado: os dois "sim", uma vez por clique, antes do redirect ao WhatsApp.
  console.info(
    `[Lead] meta=${temFbq ? "sim" : "NAO"} openai=${temOaiq ? "sim" : "NAO"} eventID=${eventID ?? "n/a"} cliquesNaSessao=${__leadFireCount} href=${href ?? "n/a"}`,
  );

  if (!temFbq) {
    console.warn("[Lead] fbq indisponível — verifique o script do Pixel da Meta no index.html");
  }
  if (!temOaiq) {
    console.warn("[Lead] oaiq indisponível — verifique o script do Pixel da OpenAI no index.html");
  }

  // Garante que os eventos sejam enviados antes de navegar (especialmente no
  // mobile, onde abrir o WhatsApp pode descartar requisições pendentes).
  if (e && href) {
    e.preventDefault();
    window.setTimeout(() => {
      window.open(href, "_blank", "noopener,noreferrer");
    }, ESPERA_ANTES_DE_NAVEGAR_MS);
  }
};
