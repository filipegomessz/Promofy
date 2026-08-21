import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import {
  Tag,
  Shield,
  MessageCircle,
  Phone,
  Users,
  Gift,
  BellOff,
  Instagram,
  Sparkles,
} from "lucide-react";
import promofyLogo from "@/assets/promofy-logo.webp";
import promofyFooterLogo from "@/assets/promofy-footer-logo.webp";
import PartnersMarquee from "@/components/PartnersMarquee";
import { WHATSAPP_GROUP, trackLead } from "@/lib/lead";
import whatsappIcon from "@/assets/whatsapp-icon.webp";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "A Promofy é uma loja?",
    a: "Não. Somos parceiros afiliados dos principais marketplaces do Brasil, apenas divulgamos ofertas, cupons e achadinhos que passam por uma curadoria feita pela nossa equipe antes de chegar a você, garantindo ótimos preços.",
  },
  {
    q: "As ofertas são confiáveis?",
    a: "Sim! Todas as ofertas são de sites confiáveis; Amazon, Mercado Livre, Shopee, Magalu entre outros. Você ainda conta com todo o suporte dessas plataformas para que sua compra seja ainda mais segura.",
  },
  {
    q: "Cliquei e o preço está diferente, por quê?",
    a: "As ofertas e cupons podem acabar a qualquer momento! Por isso, recomendados que ativem as notificações para não perder nada!",
  },
  {
    q: "Posso sugerir produtos que quero ver em oferta?",
    a: "Sim! Nossa equipe adora sugestões, pode mandar à vontade!",
  },
  {
    q: "Posso compartilhar o grupo com amigos?",
    a: "Com certeza! Traga sua família e amigos para todos economizarem!",
  },
];

// A home precisa do seu próprio <Helmet> com os MESMOS valores que estão no
// index.html: as tags de lá agora são `data-rh`, ou seja, o Helmet passou a
// gerenciá-las. Sem isto, voltar de /termos para / (navegação client-side)
// apagaria description/canonical/og da home ao desmontar o Helmet da outra
// página. Mudou algo aqui? Mudar no index.html também.
const IndexHead = () => (
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

// TikTok icon (lucide doesn't ship one)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M19.5 8.4a6.3 6.3 0 0 1-3.7-1.2v7.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.7a2.9 2.9 0 1 0 2 2.8V2h2.6a3.7 3.7 0 0 0 3.8 3.7v2.7Z" />
  </svg>
);

// Official WhatsApp icon (uploaded asset with chat bubble)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <img src={whatsappIcon} alt="" aria-hidden className={className} />
);

// WhatsApp glyph (monochrome, herda currentColor)
const WhatsAppGlyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden>
    <path d="M256 16C123 16 16 123 16 256c0 42 11 83 33 119L16 496l125-33c34 19 74 29 115 29 133 0 240-107 240-240S389 16 256 16zm0 438c-37 0-73-10-104-29l-7-4-74 19 20-72-5-8c-21-33-32-71-32-110 0-112 91-203 202-203s203 91 203 203-91 204-203 204zm115-152c-6-3-37-18-43-20s-10-3-14 3-16 20-19 24-7 5-13 2c-6-3-27-10-51-32-19-17-32-37-35-43s0-9 3-12c3-3 6-7 9-10 3-4 4-6 6-10s1-8 0-11c-2-3-14-33-19-46-5-12-10-10-14-11h-12c-4 0-10 1-15 7s-21 20-21 50 22 58 25 62c3 4 43 66 105 92 15 6 26 10 35 13 15 5 28 4 39 2 12-2 37-15 42-29s5-27 4-29c-2-3-6-5-12-8z"/>
  </svg>
);

const benefits = [
  {
    icon: Shield,
    title: "Curadoria",
    text: "Anúncios verificados pela nossa equipe, seguros e com descontos reais.",
    accent: "text-[hsl(var(--primary-glow))]",
  },
  {
    icon: Users,
    title: "Comunidade Ativa",
    text: "+1000 pessoas economizando com a gente, todos os dias.",
    accent: "text-[hsl(var(--accent))]",
  },
  {
    icon: Gift,
    title: "100% Gratuito",
    text: "Sem mensalidade, sem pegadinha. As ofertas incríveis serão sua única surpresa ao entrar no grupo.",
    accent: "text-[hsl(var(--primary-glow))]",
  },
  {
    icon: BellOff,
    title: "Sem Spam",
    text: "Só enviamos ofertas que realmente valem a pena. Nada de lotar seu chat.",
    accent: "text-[hsl(var(--accent))]",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <IndexHead />
      {/* Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <img src={promofyLogo} alt="Promofy" width="40" height="40" fetchPriority="high" decoding="async" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-black tracking-tight text-foreground">
            Promo<span className="text-foreground">fy</span>
          </span>
        </a>

        <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--whatsapp))] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--whatsapp))]" />
          </span>
          Online agora
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        <div className="grid items-center gap-10">
          <section className="text-center">


            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block text-foreground">Cansou de pagar</span>
              <span className="block text-foreground">caro</span>
              <span className="block text-foreground">nos produtos?</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Receba <strong className="font-bold text-[hsl(var(--accent))]">ofertas e cupons exclusivos</strong> diretamente no seu{" "}
              <strong className="font-bold text-[hsl(var(--accent))]">WhatsApp</strong> de forma totalmente{" "}
              <strong className="font-bold text-[hsl(var(--accent))]">GRATUITA!</strong>
            </p>

            <div className="mt-7 flex items-center justify-center gap-6 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[hsl(var(--primary-glow))]" /> Seguro
              </span>
              <span className="flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-[hsl(var(--accent))]" /> Grátis
              </span>
              <span className="flex items-center gap-1.5">
                <BellOff className="h-4 w-4 text-[hsl(var(--primary-glow))]" /> Sem spam
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-col gap-4">
              <Button
                asChild
                variant="whatsapp"
                size="xl"
                className="relative w-full pl-16 pr-6 text-base font-extrabold uppercase tracking-wide [&_img]:!h-9 [&_img]:!w-9 sm:text-lg"
              >
                <a
                  href={WHATSAPP_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => trackLead(e, WHATSAPP_GROUP)}
                >
                  <WhatsAppIcon className="absolute left-5" />
                  Quero economizar
                </a>
              </Button>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground sm:text-base">
              Ainda tem dúvida? Veja mais sobre nós abaixo.
            </p>
          </section>

          {/* Partners marquee */}
          <PartnersMarquee />
        </div>

        {/* Benefits grid */}
        <section id="beneficios" className="cv-auto scroll-mt-6 mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <article
              key={b.title}
              className="group rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-[hsl(var(--primary-glow))]/50 hover:bg-card/80"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/60 ${b.accent} transition-transform group-hover:scale-110`}
              >
                <b.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-foreground">{b.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
            </article>
          ))}
        </section>

        {/* FAQ */}
        <section className="cv-auto mt-16">
          <h2 className="text-center text-2xl font-black text-foreground sm:text-3xl">
            Perguntas Frequentes
          </h2>
          <div className="mx-auto mt-6 max-w-2xl rounded-3xl border border-border/70 bg-card/60 p-2 backdrop-blur sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-border/60 last:border-b-0"
                >
                  <AccordionTrigger className="px-3 text-left text-sm font-semibold text-foreground hover:no-underline sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-3 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="cv-auto mt-16 rounded-3xl border border-border/70 bg-[image:var(--gradient-hero)] p-1">
          <div className="rounded-[calc(1.5rem-4px)] bg-background/85 p-6 text-center sm:p-10">
            <h2 className="text-2xl font-black leading-tight text-foreground sm:text-4xl">
              VAGAS LIMITADAS!
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Entre agora e comece a economizar!
            </p>
            <div className="mx-auto mt-6 flex max-w-md flex-col gap-3">
              <Button asChild variant="whatsapp" size="xl" className="relative pl-16 pr-6 font-extrabold uppercase [&_img]:!h-9 [&_img]:!w-9">
                <a href={WHATSAPP_GROUP} target="_blank" rel="noopener noreferrer" onClick={(e) => trackLead(e, WHATSAPP_GROUP)}>
                  <WhatsAppIcon className="absolute left-5" />
                  Quero economizar
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <a href="/" className="flex items-center gap-2">
              <img src={promofyFooterLogo} alt="Promofy" width="32" height="32" loading="lazy" decoding="async" className="h-8 w-auto object-contain" />
              <span className="text-lg font-black">
                Promo<span className="text-foreground">fy</span>
              </span>
            </a>

            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
              <a href="/termos" className="transition-colors hover:text-foreground">Termos</a>
              <a href="/privacidade" className="transition-colors hover:text-foreground">Privacidade</a>
              <a href="/contato" className="transition-colors hover:text-foreground">Contato</a>
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/promofy.inc/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-muted-foreground transition-all hover:scale-110 hover:border-foreground/60 hover:text-foreground"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@promofy.inc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-muted-foreground transition-all hover:scale-110 hover:border-foreground/60 hover:text-foreground"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/message/NM6WUKCBDFJQO1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-muted-foreground transition-all hover:scale-110 hover:border-foreground/60 hover:text-foreground"
              >
                <WhatsAppGlyph className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="mt-8 space-y-2 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
            <p>
              Links podem conter comissão para afiliado sem custo adicional para você.
            </p>
            <p>© {new Date().getFullYear()} Promofy. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
