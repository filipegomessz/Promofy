import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { WHATSAPP_GROUP_CONSTRUCAO, trackLead } from "@/lib/lead";

/**
 * ============================================================================
 * CAPTAÇÃO DE CASA E CONSTRUÇÃO — /construcao (03/09/2026)
 * ============================================================================
 *
 * Terceira porta do site, ao lado da captação geral (`/`) e da página completa
 * (`/ofertas`). Existe porque ele quis anunciar para um público nichado, com
 * grupo de WhatsApp próprio e PIXEL PRÓPRIO — ver PIXEL_DA_ROTA em rotas.ts.
 *
 * FEITA PARA CELULAR, e isso é decisão, não descuido: ele pediu assim, e o
 * tráfego chega inteiro de anúncio no feed. Não existe versão de computador —
 * nenhuma medida cresce em tela grande, a página só fica centralizada. Se um
 * dia entrar tráfego de desktop, é aqui que se olha.
 *
 * TODA MEDIDA E TODA COR VIERAM DE UM MOCKUP INTERATIVO que ele fechou em
 * 03/09/2026, nestes valores exatos:
 *
 *     fundo #FAF7F2 · botão #E0752D · acento #B45309
 *     cantos 22px · altura do botão 22px · título 26px · peso do botão 50%
 *     mostra: marca no topo, foto redonda, selo de checado, vantagens,
 *             contagem de gente, aviso "entrou no grupo"
 *     não mostra: frase-selo, botão fixo embaixo
 *
 * ⚠️ Não "arrumar" nenhum desses números no olho. São a resposta dele, e a
 * conta que gera os dois derivados está anotada em BRILHO_DO_BOTAO.
 *
 * O que NÃO veio do mockup e é palpite meu, esperando aprovação: os textos.
 * Estão todos juntos em TEXTO, logo abaixo, justamente para ele reescrever sem
 * caçar string no meio do JSX.
 * ============================================================================
 */

const FUNDO = "#FAF7F2";
const BOTAO = "#E0752D";
const ACENTO = "#B45309";
const TINTA = "#0F172A";
const SUAVE = "#64748B";
const BORDA = "#E6E8EC";
const RAIO = 22;

/**
 * O "peso do botão" que ele escolheu (50%) é UM controle que vira DOIS valores.
 * A conta é a do mockup, e fica anotada porque foi exatamente o tipo de coisa
 * que desbalanceia na próxima mexida sem ninguém ver:
 *
 *   brilho de fora  → alfa = peso × 2,2 ÷ 255  →  50 × 2,2 = 110 → 0,43
 *   relevo de baixo → altura = peso ÷ 18       →  50 ÷ 18 ≈ 3px
 *
 * O relevo interno é o que faz o botão parecer tecla física em vez de retângulo
 * colorido, e é a metade que mais pesa no toque.
 */
const BRILHO_DO_BOTAO =
  "0 8px 30px rgba(224, 117, 45, 0.43), inset 0 -3px 0 rgba(0, 0, 0, 0.2)";

const TEXTO = {
  marca: "Promofy Construção",
  titulo: "Eu acho o material da sua obra mais barato",
  vantagens: [
    "Material e ferramenta com desconto",
    "Cupons das maiores lojas",
    "Pode sair quando quiser",
  ],
  botao: "Quero economizar na obra",
  // 🔴 O NÚMERO AQUI É INVENTADO, e ele sabe: ligou a contagem de gente no
  // mockup sabendo que o grupo ainda não existe. Trocar pelo número real antes
  // de anunciar, ou desligar removendo <Contagem /> do JSX — nada mais depende
  // dela. Mesma família da prova social fabricada da página principal.
  contagem: "Mais de 2 mil pessoas já economizam na obra",
};

// Nomes FICTÍCIOS, em loop, igual à captação principal — ele ligou este aviso
// no mockup de propósito. Para tirar, basta remover <AvisoEntrada /> do JSX.
const AVISO_NOMES = ["Rafael", "Juliana", "Marcos", "Patrícia", "Thiago", "Camila"];
const AVISO_INTERVALO_MS = 9000;

/**
 * Os quatro ícones são SVG escrito à mão, e NÃO o `lucide-react` que a captação
 * principal usa. Não é preferência: os dois ícones de lá (CircleCheckBig,
 * Users) são justamente os que esta página precisaria, e importar os mesmos
 * faria o Rollup juntá-los num pedaço compartilhado — mudando o grafo de chunks
 * da página PRINCIPAL, que está medida em 100/100 e cuja regra é não ser tocada
 * pela secundária. Uns 400 bytes duplicados compram esse sossego.
 */
const GlifoWhatsApp = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="currentColor" aria-hidden>
    <path d="M256 16C123 16 16 123 16 256c0 42 11 83 33 119L16 496l125-33c34 19 74 29 115 29 133 0 240-107 240-240S389 16 256 16zm0 438c-37 0-73-10-104-29l-7-4-74 19 20-72-5-8c-21-33-32-71-32-110 0-112 91-203 202-203s203 91 203 203-91 204-203 204zm115-152c-6-3-37-18-43-20s-10-3-14 3-16 20-19 24-7 5-13 2c-6-3-27-10-51-32-19-17-32-37-35-43s0-9 3-12c3-3 6-7 9-10 3-4 4-6 6-10s1-8 0-11c-2-3-14-33-19-46-5-12-10-10-14-11h-12c-4 0-10 1-15 7s-21 20-21 50 22 58 25 62c3 4 43 66 105 92 15 6 26 10 35 13 15 5 28 4 39 2 12-2 37-15 42-29s5-27 4-29c-2-3-6-5-12-8z" />
  </svg>
);

/** Círculo cheio com o tique dentro — o mesmo desenho do selo e do aviso. */
const GlifoSelo = ({ tamanho, cor }: { tamanho: number; cor: string }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill={cor} />
    <path
      d="M16 9L10.5 14.5L8 12"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Círculo vazado com o tique — o da lista de vantagens. */
const GlifoTique = ({ className, cor }: { className?: string; cor: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={{ color: cor }} aria-hidden>
    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M8.25 12.2L10.9 14.8L15.9 9.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GlifoGente = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.4 4.2a3.5 3.5 0 0 1 0 6.6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * ⚠️ Este head PRECISA continuar batendo com o que o prerender grava: o
 * `limparHead` tira do template as tags da RAIZ e escreve estas no lugar. Quem
 * não roda JavaScript — parte dos robôs, a prévia de link no WhatsApp — só vê
 * o que sai daqui.
 *
 * Sem `noindex`, ao contrário da /ofertas: aquela leva porque fala do MESMO
 * assunto da raiz e as duas disputariam a mesma posição. Construção é outro
 * assunto e não canibaliza nada.
 */
const ConstrucaoHead = () => (
  <Helmet>
    <title>Promofy Construção — Ofertas de material de obra no WhatsApp</title>
    <meta
      name="description"
      content="Material, ferramenta e cupom das maiores lojas de construção, com curadoria, direto no seu WhatsApp. Grátis, sem spam, e você sai quando quiser."
    />
    <link rel="canonical" href="https://apromofy.online/construcao" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://apromofy.online/construcao" />
    <meta
      property="og:title"
      content="Promofy Construção — Ofertas de material de obra no WhatsApp"
    />
    <meta
      property="og:description"
      content="Material, ferramenta e cupom das maiores lojas de construção direto no seu WhatsApp. Grátis, sem spam."
    />
    <meta
      name="twitter:title"
      content="Promofy Construção — Ofertas de material de obra no WhatsApp"
    />
    <meta
      name="twitter:description"
      content="Material, ferramenta e cupom das maiores lojas de construção direto no seu WhatsApp. Grátis, sem spam."
    />
  </Helmet>
);

/**
 * O resto do site é escuro; enquanto esta rota estiver montada o body fica na
 * cor areia. A classe também já vem escrita no HTML estático (CLASSE_DO_BODY em
 * rotas.ts) — este efeito só existe para o caso de o React ter renderizado do
 * zero, e para limpar ao desmontar.
 */
const useBodyAreia = () => {
  useEffect(() => {
    document.body.classList.add("construcao-clara");
    return () => document.body.classList.remove("construcao-clara");
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
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center">
      <div
        key={indice}
        className="lp-aviso flex w-full max-w-[320px] items-center gap-3 rounded-[10px] border-l-[5px] bg-white px-[18px] py-3 text-sm font-semibold shadow-[0_8px_25px_rgba(0,0,0,0.15)]"
        style={{ borderLeftColor: BOTAO, color: TINTA }}
      >
        <GlifoSelo tamanho={18} cor={BOTAO} />
        <span>
          <strong className="font-extrabold">{AVISO_NOMES[indice]}</strong> entrou no grupo
        </span>
      </div>
    </div>
  );
};

const Construcao = () => {
  useBodyAreia();

  return (
    <>
      <ConstrucaoHead />
      <div
        className="min-h-[100dvh] w-full overflow-x-hidden px-[15px] pb-24 pt-9"
        style={{ backgroundColor: FUNDO, color: TINTA }}
      >
        {/* max-w fixo, sem breakpoint: página de celular, por pedido dele. */}
        <main className="mx-auto flex w-full max-w-[400px] flex-col items-center text-center">
          <p
            className="mb-5 rounded-[30px] border bg-white px-[18px] py-1.5 text-[19px] font-bold italic tracking-[-0.4px] shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
            style={{ borderColor: "#E5C6AC", color: ACENTO }}
          >
            {TEXTO.marca}
          </p>

          <div className="relative mb-[22px]">
            <div
              className="h-[132px] w-[132px] rounded-full border-[3px] bg-white p-[5px] shadow-[0_10px_30px_rgba(180,83,9,0.16),0_0_0_4px_#FFFFFF]"
              style={{ borderColor: ACENTO }}
            >
              {/* Arte do nicho, mandada por ele em 03/09/2026. Substituiu a
                  etiqueta azul da marca, que era o único elemento brigando com
                  a paleta areia/laranja — e era também o objeto mais chamativo
                  da página, logo acima do título.

                  ⚠️ CUSTO ACEITO: 15,6 kB contra 5,0 kB da etiqueta. Não é
                  desleixo de compressão, é o assunto: render 3D com pele,
                  tijolo e reflexo não comprime como logo chapada. Já está no
                  mínimo que continua nítido (280px, WebP q76, para 122px de
                  tela). Este arquivo É o elemento de LCP — se um dia a página
                  precisar de mais velocidade, é o primeiro lugar para olhar, e
                  o caminho é uma arte mais simples, não mais compressão.

                  O pré-carregamento dele sai do AVATAR_DA_ROTA, em
                  scripts/prerender.mjs. Trocou o arquivo aqui? Trocar lá. */}
              <img
                src="/construcao-avatar.webp"
                alt="Ofertas de ferramentas, construção e casa"
                width="122"
                height="122"
                className="block h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-[3px] right-[3px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
              <GlifoSelo tamanho={24} cor={BOTAO} />
            </div>
          </div>

          {/* A cor vai CRAVADA aqui, e não herdada do contêiner. Em 03/09/2026
              o mockup interativo pintou este título de branco sobre o fundo
              areia — a folha do host tinha uma regra própria para `h1` que
              ganhava da cor do pai, e ele fechou o layout sem nunca ter visto a
              frase. Aqui não existe folha de terceiro, mas title invisível é
              barato demais de prevenir para ficar dependendo de herança. */}
          <h1
            className="mb-[26px] max-w-[340px] text-[26px] font-extrabold leading-[1.25] tracking-[-0.5px] text-pretty"
            style={{ color: TINTA }}
          >
            {TEXTO.titulo}
          </h1>

          <ul className="mb-[30px] flex w-full list-none flex-col items-start gap-[13px] px-1">
            {TEXTO.vantagens.map((item) => (
              <li key={item} className="flex items-center gap-3 text-left text-[15px] font-semibold">
                <GlifoTique className="h-5 w-5 shrink-0" cor={BOTAO} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href={WHATSAPP_GROUP_CONSTRUCAO}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => trackLead(e, WHATSAPP_GROUP_CONSTRUCAO)}
            className="lp-cta flex w-full items-center justify-center gap-[11px] px-[18px] py-[22px] text-[19px] font-bold tracking-[0.3px] text-white"
            style={{ backgroundColor: BOTAO, borderRadius: RAIO, boxShadow: BRILHO_DO_BOTAO }}
          >
            <GlifoWhatsApp className="h-[25px] w-[25px] shrink-0" />
            {TEXTO.botao}
          </a>

          <div
            className="mt-6 flex w-full items-center justify-center gap-[9px] border bg-white px-4 py-3 text-[13px]"
            style={{ borderColor: BORDA, borderRadius: RAIO, color: SUAVE }}
          >
            <GlifoGente className="h-[17px] w-[17px] shrink-0" />
            <span>{TEXTO.contagem}</span>
          </div>
        </main>

        <AvisoEntrada />
      </div>
    </>
  );
};

export default Construcao;
