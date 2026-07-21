import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Instagram, MessageCircle } from "lucide-react";
import promofyLogo from "@/assets/promofy-logo.webp";
import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Helmet>
        <title>Contato — Fale com a Promofy</title>
        <meta name="description" content="Fale com a equipe da Promofy. Tire dúvidas, envie sugestões de produtos ou converse sobre parcerias pelo WhatsApp ou Instagram." />
        <link rel="canonical" href="https://apromofy.online/contato" />
        <meta property="og:title" content="Contato — Fale com a Promofy" />
        <meta property="og:description" content="Tire dúvidas, envie sugestões de produtos ou converse sobre parcerias com a equipe da Promofy." />
        <meta property="og:url" content="https://apromofy.online/contato" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Contato — Fale com a Promofy" />
        <meta name="twitter:description" content="Tire dúvidas, envie sugestões de produtos ou converse sobre parcerias com a equipe da Promofy." />
      </Helmet>
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-6 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={promofyLogo} alt="Promofy" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-black tracking-tight text-foreground">
            Promo<span className="text-foreground">fy</span>
          </span>
        </Link>
        <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Fale com a Promofy
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Tem uma sugestão de produto, dúvida sobre uma oferta ou gostaria de discutir uma
          parceria? Estamos por aqui para ouvir você.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href="https://wa.me/message/NM6WUKCBDFJQO1"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-[hsl(var(--whatsapp))]/60"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/60 text-[hsl(var(--whatsapp))]">
              <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-foreground">WhatsApp</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Resposta mais rápida. Mande sua mensagem direto pelo nosso atendimento.
            </p>
          </a>

          <a
            href="https://www.instagram.com/promofy.inc/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-foreground/60"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-background/60 text-foreground">
              <Instagram className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-foreground">Instagram</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Mande uma DM para @promofy.inc — também respondemos por lá.
            </p>
          </a>
        </div>

        <section className="mt-10 rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur">
          <h2 className="text-xl font-black text-foreground">Sugestões e parcerias</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Quer indicar um produto que merece entrar para a curadoria? É uma marca interessada
            em divulgar ofertas com a gente? Use o botão abaixo para nos enviar uma mensagem no
            Whatsapp que retornamos o quanto antes.
          </p>
          <div className="mt-5">
            <Button asChild variant="whatsapp" size="lg" className="font-extrabold uppercase">
              <a href="https://wa.me/message/NM6WUKCBDFJQO1" target="_blank" rel="noopener noreferrer">
                Falar agora no WhatsApp
              </a>
            </Button>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Para solicitações relacionadas a dados pessoais (LGPD), vá para a página de{" "}
          <Link to="/privacidade" className="underline hover:text-foreground">
            Privacidade
          </Link>
          .
        </p>
      </main>
    </div>
  );
};

export default Contact;
