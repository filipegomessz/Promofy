import { Helmet } from "react-helmet-async";
import promofyLogo from "@/assets/promofy-logo.webp";

const PrivacyHead = () => (
  <Helmet>
    <title>Política de Privacidade — Promofy</title>
    <meta name="description" content="Saiba como a Promofy coleta e utiliza dados de navegação, cookies e o pixel da Meta, em conformidade com a LGPD (Lei 13.709/2018)." />
    <link rel="canonical" href="https://apromofy.online/privacidade" />
    <meta property="og:title" content="Política de Privacidade — Promofy" />
    <meta property="og:description" content="Como a Promofy trata seus dados de navegação, cookies e o pixel da Meta, em conformidade com a LGPD." />
    <meta property="og:url" content="https://apromofy.online/privacidade" />
    <meta property="og:type" content="article" />
    <meta name="twitter:title" content="Política de Privacidade — Promofy" />
    <meta name="twitter:description" content="Como a Promofy trata seus dados de navegação, cookies e o pixel da Meta, em conformidade com a LGPD." />
  </Helmet>
);

// Data em que o TEXTO desta página mudou pela última vez. Antes isto era
// `new Date()`, que renderizava sempre o dia de hoje do visitante — uma
// política que se diz atualizada todo dia não marca versão nenhuma.
// Mexeu no texto? Atualize esta data no mesmo commit.
const ULTIMA_ATUALIZACAO = "28/08/2026";

const sections = [
  {
    title: "Quem somos",
    content: (
      <p>
        A Promofy é um serviço gratuito de divulgação de ofertas e cupons via WhatsApp. Esta
        política descreve, de forma transparente, quais dados coletamos quando você navega
        em nosso site e como eles são utilizados, em conformidade com a Lei Geral de
        Proteção de Dados (LGPD – Lei nº 13.709/2018).
      </p>
    ),
  },
  {
    title: "Dados que coletamos",
    content: (
      <>
        <p>
          Não solicitamos cadastro, e-mail, telefone, CPF ou qualquer dado pessoal
          identificável diretamente em nosso site. Os dados coletados são apenas técnicos e
          estatísticos, por meio de cookies e ferramentas de análise:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>Endereço IP aproximado e localização geográfica genérica;</li>
          <li>Tipo de dispositivo, sistema operacional e navegador;</li>
          <li>Páginas visitadas, tempo de permanência e cliques nos botões;</li>
          <li>Origem do tráfego (campanha, rede social ou link de referência).</li>
        </ul>
      </>
    ),
  },
  {
    title: "Meta Pixel (Facebook Pixel)",
    content: (
      <>
        <p>
          Utilizamos o <strong className="text-foreground">Meta Pixel</strong>, ferramenta da
          Meta Platforms (Facebook/Instagram), para mensurar a eficácia de nossas campanhas
          publicitárias e entender como os visitantes interagem com o site. O Pixel registra
          eventos como visualização de página e cliques em botões (evento "Lead"), de forma
          anônima e agregada, sem identificar você pessoalmente.
        </p>
        <p className="mt-2">
          Esses dados podem ser utilizados pela Meta para exibir anúncios mais relevantes em
          suas plataformas. Você pode controlar suas preferências de anúncios diretamente em{" "}
          <a
            href="https://www.facebook.com/adpreferences"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline"
          >
            facebook.com/adpreferences
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "Cookies",
    content: (
      <p>
        Utilizamos cookies próprios e de terceiros (Meta) para fins de análise e remarketing.
        Você pode bloquear ou apagar cookies a qualquer momento nas configurações do seu
        navegador. A desativação pode afetar a sua experiência em outros sites, mas não
        impacta o funcionamento da Promofy.
      </p>
    ),
  },
  {
    title: "WhatsApp",
    content: (
      <p>
        Ao entrar em nossos grupos ou canais do WhatsApp, sua participação é regida pelos{" "}
        <a
          href="https://www.whatsapp.com/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline"
        >
          Termos e Política de Privacidade do WhatsApp
        </a>
        . A Promofy não coleta seu número de telefone, mas ele pode ficar visível para outros
        participantes em grupos abertos — recomendamos optar pelo canal caso prefira
        anonimato.
      </p>
    ),
  },
  {
    title: "Compartilhamento de dados",
    content: (
      <p>
        Não vendemos, alugamos ou cedemos dados a terceiros. As únicas integrações que
        recebem dados técnicos são: Meta (Pixel) e o
        provedor de hospedagem do site, todos dentro dos limites estritos descritos acima.
      </p>
    ),
  },
  {
    title: "Seus direitos (LGPD)",
    content: (
      <p>
        Você tem o direito de solicitar acesso, correção, anonimização ou exclusão de
        quaisquer dados que possam estar associados a você, bem como revogar consentimentos.
        Para exercer esses direitos, acesse o Centro de Privacidade da Meta em{" "}
        <a
          href="https://www.facebook.com/privacy/center"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline"
        >
          facebook.com/privacy/center
        </a>
        .
      </p>
    ),
  },
  {
    title: "Alterações",
    content: (
      <p>
        Esta política pode ser atualizada periodicamente. A versão vigente será sempre a
        publicada nesta página.
      </p>
    ),
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <PrivacyHead />
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-6 sm:px-8">
        <a href="/" className="flex items-center gap-2.5">
          <img src={promofyLogo} alt="Promofy" className="h-10 w-auto object-contain" />
          <span className="text-2xl font-black tracking-tight text-foreground">
            Promo<span className="text-foreground">fy</span>
          </span>
        </a>
        <a href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← Voltar
        </a>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {ULTIMA_ATUALIZACAO}
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

export default Privacy;
