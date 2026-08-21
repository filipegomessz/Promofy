import type { MouseEvent } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const WHATSAPP_GROUP = "https://chat.whatsapp.com/CeIkFA6dIzIKN91j5dzS7o";
export const WHATSAPP_CHANNEL =
  "https://whatsapp.com/channel/0029Vb7qoOCFXUuQyXWHEV0U";

// Contador global para auditoria — garante que cada clique dispare exatamente 1 Lead
let __leadFireCount = 0;

export const trackLead = (
  e?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  href?: string,
) => {
  const hasFbq = typeof window !== "undefined" && typeof window.fbq === "function";
  let eventID: string | null = null;
  let firedCount = 0;

  if (hasFbq) {
    eventID = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.fbq!("track", "Lead", { content_name: href ?? "unknown" }, { eventID });
    firedCount = 1;
    __leadFireCount += 1;
  }

  // Pixel Helper / verificação no console
  // Esperado: "fired=1" para cada clique, antes do redirect ao WhatsApp.
  console.info(
    `[MetaPixel] Lead fired=${firedCount} eventID=${eventID ?? "n/a"} totalSession=${__leadFireCount} href=${href ?? "n/a"} fbqLoaded=${hasFbq}`,
  );

  if (!hasFbq) {
    console.warn("[MetaPixel] fbq não está disponível — verifique o script do Pixel no index.html");
  }

  // Garante que o evento seja enviado antes de navegar (especialmente no mobile,
  // onde abrir o WhatsApp pode descartar requisições pendentes).
  if (e && href) {
    e.preventDefault();
    window.setTimeout(() => {
      window.open(href, "_blank", "noopener,noreferrer");
    }, 250);
  }
};
