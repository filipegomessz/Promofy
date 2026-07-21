import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import promofyLogo from "@/assets/promofy-logo.webp";

const TermsHead = () => (
  <Helmet>
    <title>Termos de Uso — Promofy</title>
    <meta name="description" content="Leia os Termos de Uso da Promofy: regras sobre links de afiliados, isenção de responsabilidade por preços e o funcionamento do nosso serviço gratuito de ofertas." />
    <link rel="canonical" href="https://apromofy.online/termos" />
    <meta property="og:title" content="Termos de Uso — Promofy" />
    <meta property="og:description" content="Regras de uso do serviço gratuito de curadoria de ofertas e cupons da Promofy." />
    <meta property="og:url" content="https://apromofy.online/termos" />
    <meta property="og:type" content="article" />
    <meta name="twitter:title" content="Termos de Uso — Promofy" />
    <meta name="twitter:description" content="Regras de uso do serviço gratuito de curadoria de ofertas e cupons da Promofy." />
  </Helmet>
);

const sections = [
  {
    title: "Sobre a Promofy",
    content: (
      <p>
        A Promofy é um serviço gratuito de curadoria e divulgação de ofertas, cupons e
        promoções de marketplaces parceiros (como Amazon, Mercado Livre, Shopee, Magalu,
        entre outros), distribuídas principalmente por meio de grupos e canais no WhatsApp.
        A Promofy não é uma loja, não comercializa produtos e não é responsável por vendas,
        entregas ou pós-venda — essas responsabilidades são exclusivas das plataformas onde
        a compra é finalizada.
      </p>
    ),
  },
  {
    title: "Aceitação dos termos",
    content: (
      <p>
        Ao acessar este site, entrar em nossos grupos/canais ou utilizar qualquer link
        divulgado pela Promofy, você concorda integralmente com estes Termos de Uso e com a
        nossa Política de Privacidade. Caso não concorde, pedimos que não utilize o serviço.
      </p>
    ),
  },
  {
    title: "Links de afiliados",
    content: (
      <p>
        Os links divulgados pela Promofy podem ser links de afiliados. Isso significa que
        podemos receber uma pequena comissão quando você realiza uma compra, sem qualquer
        custo adicional para você. Essa comissão é o que mantém o serviço gratuito.
      </p>
    ),
  },
  {
    title: "Preços e disponibilidade",
    content: (
      <p>
        Preços, cupons e estoques são definidos exclusivamente pelas lojas anunciantes e
        podem mudar ou se esgotar a qualquer momento, sem aviso prévio. A Promofy não se
        responsabiliza por divergências de preço, indisponibilidade de produtos ou
        alterações nas condições de venda após a publicação da oferta.
      </p>
    ),
  },
  {
    title: "Limitação de responsabilidade",
    content: (
      <p>
        A Promofy seleciona apenas ofertas verificadas e confiáveis para você. Toda compra é
        realizada diretamente na loja ou marketplace parceiro, que conta com suporte
        dedicado para garantir uma experiência de compra tranquila e segura — nossa
        responsabilidade é levar você até a melhor oferta, o resto fica em boas mãos. A
        Promofy não se responsabiliza por questões relacionadas a pagamento, entrega, troca
        ou devolução dos produtos adquiridos.
      </p>
    ),
  },
  {
    title: "Alterações",
    content: (
      <p>
        Estes Termos podem ser atualizados a qualquer momento. A versão vigente será sempre
        a publicada nesta página.
      </p>
    ),
  },
  {
    title: "Contato",
    content: (
      <p>
        Em caso de dúvidas, acesse nossa{" "}
        <Link to="/contato" className="text-foreground underline">
          página de contato
        </Link>
        .
      </p>
    ),
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <TermsHead />
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
          Termos de Uso
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <div className="mt-8 space-y-4">
          {sections.map((section, idx) => (
            <section
              key={idx}
              className="rounded-3xl border border-border/70 bg-card/60 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--primary-glow))]/50 sm:p-6"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--accent))]/15 text-sm font-black leading-none text-[hsl(var(--accent))] sm:h-10 sm:w-10 sm:text-base">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-base font-black leading-tight text-foreground sm:text-xl">
                    {section.title}
                  </h2>
                  <div className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {section.content}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Terms;
