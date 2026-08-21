import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { CircleCheckBig, Users } from "lucide-react";
import promofyAvatar from "@/assets/promofy-avatar.jpg";
import { WHATSAPP_GROUP_LANDING, trackLead } from "@/lib/lead";

// Nada de VISUAL nesta tela depende do <Helmet>: o fundo claro e as animações
// moram em index.css. É de propósito — o Helmet só aplica no `requestAnimation-
// Frame` seguinte (`defer` é true por padrão), e CSS chegando um quadro depois
// significaria a página piscando escura antes de clarear.

const BENEFITS = [
  "Cupons e achadinhos todo dia",
  "Só ofertas selecionadas",
  "Pode sair quando quiser",
];

// Aviso de prova social: os nomes são FICTÍCIOS e rodam em loop, como no
// modelo que serviu de referência. Se um dia isso deixar de ser aceitável,
// basta remover <AvisoEntrada /> do JSX — nada mais depende dele.
const AVISO_NOMES = ["Patrícia", "Rafael", "Juliana", "Marcos", "Camila", "Thiago"];
const AVISO_INTERVALO_MS = 9000;

// Glifo oficial do WhatsApp (monocromático, herda currentColor)
const WhatsAppGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden>
    <path d="M256 16C123 16 16 123 16 256c0 42 11 83 33 119L16 496l125-33c34 19 74 29 115 29 133 0 240-107 240-240S389 16 256 16zm0 438c-37 0-73-10-104-29l-7-4-74 19 20-72-5-8c-21-33-32-71-32-110 0-112 91-203 202-203s203 91 203 203-91 204-203 204zm115-152c-6-3-37-18-43-20s-10-3-14 3-16 20-19 24-7 5-13 2c-6-3-27-10-51-32-19-17-32-37-35-43s0-9 3-12c3-3 6-7 9-10 3-4 4-6 6-10s1-8 0-11c-2-3-14-33-19-46-5-12-10-10-14-11h-12c-4 0-10 1-15 7s-21 20-21 50 22 58 25 62c3 4 43 66 105 92 15 6 26 10 35 13 15 5 28 4 39 2 12-2 37-15 42-29s5-27 4-29c-2-3-6-5-12-8z" />
  </svg>
);

// Esta tela é a raiz do site, então o head aqui repete EXATAMENTE o que está
// escrito no index.html. É de propósito: o GitHub Pages entrega o index.html
// estático, e quem não roda JS (parte dos crawlers, preview de link) só vê
// aquilo. Se os dois divergirem, cada visitante vê um texto diferente.
// Mudou aqui? Mudar no index.html também.
const LandingSimplesHead = () => (
  <Helmet>
    <title>Promofy — Ofertas e Cupons que Valem a Pena</title>
    <meta
      name="description"
      content="Receba ofertas e cupons exclusivos no WhatsApp gratuitamente. Curadoria real, sem spam."
    />
    <link rel="canonical" href="https://apromofy.online/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://apromofy.online/" />
    <meta property="og:title" content="Promofy — Ofertas e Cupons que Valem a Pena" />
    <meta
      property="og:description"
      content="Receba ofertas e cupons exclusivos no WhatsApp gratuitamente. Curadoria real, sem spam."
    />
    <meta name="twitter:title" content="Promofy — Ofertas e Cupons que Valem a Pena" />
    <meta
      name="twitter:description"
      content="Receba ofertas e cupons exclusivos no WhatsApp gratuitamente. Curadoria real, sem spam."
    />
  </Helmet>
);

// O resto do site é escuro; enquanto esta rota estiver montada o body fica claro.
// A regra `body.lp-clara` mora em index.css, junto das animações `.lp-*`.
const useBodyClaro = () => {
  useEffect(() => {
    document.body.classList.add("lp-clara");
    return () => document.body.classList.remove("lp-clara");
  }, []);
};

const AvisoEntrada = () => {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndice((n) => (n + 1) % AVISO_NOMES.length),
      AVISO_INTERVALO_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:left-5 sm:justify-start">
      <div
        key={indice}
        className="lp-aviso flex w-full max-w-[320px] items-center justify-center gap-3 rounded-[10px] border-l-[5px] border-[#21C45D] bg-white px-[18px] py-3 text-sm font-semibold text-[#0F172A] shadow-[0_8px_25px_rgba(0,0,0,0.15)] sm:justify-start"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#21C45D" />
          <path
            d="M16 9L10.5 14.5L8 12"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          <strong className="font-black">{AVISO_NOMES[indice]}</strong> entrou no grupo
        </span>
      </div>
    </div>
  );
};

const LandingSimples = () => {
  useBodyClaro();

  return (
    <>
      <LandingSimplesHead />
      <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[#F8FAFC] bg-[radial-gradient(ellipse_90%_40%_at_50%_-6%,rgba(1,67,169,0.13),transparent_62%)] px-[15px] pb-24 pt-10 text-[#0F172A] sm:px-5 sm:pt-[50px]">
        <main className="mx-auto flex w-full max-w-[360px] flex-col items-center text-center sm:max-w-[480px]">
          <p className="mb-6 rounded-[30px] border border-[rgba(1,67,169,0.3)] bg-white px-5 py-1.5 text-[22px] font-black italic uppercase tracking-[-0.5px] text-[#0143A9] shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
            Promofy
          </p>

          <div className="relative mb-7">
            <div className="h-[150px] w-[150px] rounded-full border-[3px] border-[#0143A9] bg-white p-[5px] shadow-[0_10px_30px_rgba(1,67,169,0.16),0_0_0_4px_#FFFFFF]">
              <img
                src={promofyAvatar}
                alt="Promofy"
                width="140"
                height="140"
                decoding="async"
                className="block h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-[5px] right-[5px] flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="#21C45D" />
                <path
                  d="M16 9L10.5 14.5L8 12"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h1 className="mb-4 text-[26px] font-black leading-[1.25] tracking-[-0.5px] text-pretty sm:text-[28px]">
            Eu encontro as <span className="font-black">melhores ofertas</span> da internet pra você.
          </h1>

          <div className="mb-[35px] rounded-[30px] border border-[#E2E8F0] bg-white px-5 py-2 text-sm font-semibold text-[#64748B] shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            Chegou a hora de economizar 💰
          </div>

          <ul className="mb-[45px] flex w-full max-w-[400px] list-none flex-col items-start gap-3.5">
            {BENEFITS.map((texto) => (
              <li
                key={texto}
                className="flex items-center gap-3.5 text-left text-[15px] font-semibold sm:text-base"
              >
                <CircleCheckBig className="h-5 w-5 shrink-0 text-[#21C45D]" strokeWidth={2} />
                <span>{texto}</span>
              </li>
            ))}
          </ul>

          <div className="mb-[30px] w-full max-w-[400px]">
            <a
              href={WHATSAPP_GROUP_LANDING}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => trackLead(e, WHATSAPP_GROUP_LANDING)}
              className="lp-cta flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#21C45D_0%,#13AE61_100%)] px-5 py-[22px] text-[19px] font-extrabold uppercase tracking-[0.5px] text-white shadow-[0_10px_40px_rgba(33,196,93,0.45),inset_0_-5px_0_rgba(0,0,0,0.18)] sm:text-[21px]"
            >
              <WhatsAppGlyph className="h-7 w-7 shrink-0" />
              Quero economizar
            </a>
          </div>

          <div className="flex w-full max-w-[400px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#F1F5F9] bg-white px-6 py-3.5 text-[13px] text-[#64748B] shadow-[0_4px_15px_rgba(0,0,0,0.02)] sm:flex-row sm:gap-2.5 sm:rounded-[50px] sm:py-3 sm:text-sm">
            <Users className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            <span>
              Mais de <strong className="font-bold text-[#0F172A]">30 mil pessoas</strong> já
              economizam todo dia no grupo
            </span>
          </div>
        </main>

        <AvisoEntrada />
      </div>
    </>
  );
};

export default LandingSimples;
