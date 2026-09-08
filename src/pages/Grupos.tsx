import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";

/**
 * ============================================================================
 * A PORTA DA FRENTE — apromofy.online/ (08/09/2026)
 * ============================================================================
 *
 * Lista os grupos do Promofy e deixa a pessoa escolher. Substituiu a captação
 * do grupo geral na raiz; aquela continua viva e inteira em `/geral`, com o
 * pixel dela. Ver o comentário de rotas.ts para a troca completa.
 *
 * ⚠️ ESTA PÁGINA NÃO MEDE NADA, e é pedido dele: sem pixel da Meta, sem pixel
 * da OpenAI, e os botões são links comuns — não passam por `trackLead`. Duas
 * consequências que valem lembrar antes de "consertar" isso:
 *   1. clique pago que caia aqui não vira evento nenhum. As páginas de anúncio
 *      são `/geral`, `/construcao` e `/obras`, cada uma com o seu pixel;
 *   2. por não importar `lib/lead`, a raiz também não baixa aquele pedaço de
 *      JavaScript. São 3 pedaços no total, contra 6 da captação que estava aqui.
 *
 * 🎨 TODA MEDIDA VEIO DE UM MOCKUP INTERATIVO que ele fechou em 08/09/2026,
 * nestes valores exatos:
 *
 *     empilhado · largura 400 · espaço 14 · título 27 · brilho do fundo 45%
 *     cartão: cantos 18 · foto 64 · sombra 100% · cor do nicho no FUNDO
 *     botão: cor do nicho · peso 16 · cantos 14
 *     mostra: marca, selo de checado, ícone do WhatsApp, contagem de gente
 *     não mostra: aviso "entrou no grupo"
 *
 * A conta que gera os valores derivados está anotada em cada lugar — sem isso a
 * próxima mexida desbalanceia sem ninguém ver.
 *
 * ℹ️ Uma diferença de 1px em relação ao mockup, e é de propósito: a etiqueta da
 * marca tem 22px aqui, como no resto do site, e não os 21px que o mockup
 * mostrava. Aquilo foi descuido meu ao transcrever, não escolha dele.
 * ============================================================================
 */

const FUNDO = "#F8FAFC";
const AZUL = "#0143A9";
const TINTA = "#0F172A";
const SUAVE = "#64748B";

/** Brilho azul do alto: 45% do máximo do mockup, que era 0,26 de alfa. */
const BRILHO_DO_FUNDO =
  "radial-gradient(ellipse 90% 40% at 50% -6%, rgba(1, 67, 169, 0.117), transparent 62%)";

/** Sombra do cartão em 100%: 0 (peso/10)px (peso/3)px, alfa peso% de 0,18. */
const SOMBRA_CARTAO = "0 10px 33px rgba(15, 23, 42, 0.18)";

const RAIO_CARTAO = 18;
const RAIO_BOTAO = 14;
const ESPACO = 14;
const FOTO = 64;

/**
 * O "peso do botão" que ele escolheu (16) é UM controle que vira DOIS valores,
 * pela mesma conta da /construcao:
 *   brilho de fora  → alfa = peso × 2,2 ÷ 255 → 16 × 2,2 = 35,2 → 0,14
 *   relevo de baixo → altura = peso ÷ 5       → 16 ÷ 5 ≈ 3px
 * O relevo é o que faz o botão parecer tecla física em vez de retângulo pintado.
 */
const PESO_BOTAO = 16;
const RELEVO_BOTAO = 3;

/**
 * Os links dos dois grupos. Estão escritos AQUI, e não importados de
 * `lib/lead`, para a raiz não arrastar aquele pedaço de JavaScript inteiro —
 * com todo o código de pixel que esta página justamente não usa — só por duas
 * strings.
 *
 * ⚠️ TROCOU O GRUPO EM UM LUGAR, TROCAR NOS OUTROS. Um teste em
 * `src/test/pixels.test.ts` compara estas duas constantes com as de
 * `lib/lead.ts` e `lib/lead-openai.ts`, e quebra se divergirem — senão metade
 * do site mandaria gente para um grupo abandonado sem erro nenhum aparecer.
 */
const LINK_GERAL = "https://chat.whatsapp.com/ByF67GiEh9k3gq2XfoyUBs";
const LINK_OBRAS = "https://chat.whatsapp.com/CtzBP0DO22h3xYCtyopQTj";

/**
 * TEXTOS APROVADOS POR ELE em 08/09/2026, palavra por palavra.
 *
 * 🔤 O `*` marca negrito: `*CUPONS*` vira <strong>CUPONS</strong>. Foi pedido
 * dele, e a marcação fica viva — para destacar outra palavra depois, basta
 * cercá-la de asteriscos aqui, sem mexer no JSX. Quem converte é `comDestaque`.
 *
 * 🔴 OS DOIS NÚMEROS DE GENTE SÃO INVENTADOS, e ele sabe: são os mesmos que já
 * estavam no ar na captação e na /construcao. Trocar pelos reais, ou apagar a
 * linha `gente` do grupo para a contagem sumir daquele cartão.
 */
const TEXTO = {
  marca: "Promofy",
  titulo: "Venha ECONOMIZAR",
  apoio:
    "Avisamos de *CUPONS* e *PREÇOS BAIXOS*, e você pode até chamar a gente no privado quando quiser algo específico.",
  botao: "Entrar no grupo",
  rodape:
    "Buscamos ofertas reais de sites confiáveis como Mercado Livre, Amazon e Shopee - sem spam, só oportunidade de pagar barato de verdade.",
};

type Grupo = {
  id: string;
  nome: string;
  desc: string;
  gente: string;
  link: string;
  foto: string;
  /** Cor do nicho: tinge o fundo do cartão e a borda da foto. */
  acento: string;
  /** As duas pontas do degradê do botão. */
  botao: [string, string];
  /** O fundo do cartão e a borda, já com a cor do nicho diluída. */
  fundo: string;
  borda: string;
};

/**
 * ⚠️ `fundo` e `borda` são a cor do nicho diluída em branco — 7% e 35% —, a
 * mesma conta que o mockup fazia ao vivo. Estão cravadas em vez de calculadas
 * porque são dois valores fixos: uma função de mistura de cor no navegador
 * seria código no caminho crítico da página principal para produzir sempre o
 * mesmo resultado. Mudou o acento? Recalcular: 255 − (255 − canal) × força.
 */
const GRUPOS: Grupo[] = [
  {
    id: "geral",
    nome: "Promofy",
    desc: "Cupons e preços baixos de todas as categorias.",
    gente: "30 mil pessoas",
    link: LINK_GERAL,
    foto: "/promofy-avatar.webp",
    acento: AZUL,
    botao: ["#21C45D", "#13AE61"],
    fundo: "rgb(237, 242, 249)",
    borda: "rgb(166, 189, 225)",
  },
  {
    id: "obras",
    nome: "Promofy Obras e Ferramentas",
    desc: "Material de reforma, ferramenta, itens pra casa e cupons!",
    gente: "2 mil pessoas",
    link: LINK_OBRAS,
    foto: "/construcao-avatar.webp",
    acento: "#B45309",
    botao: ["#E0752D", "#C9631F"],
    fundo: "rgb(250, 243, 238)",
    borda: "rgb(229, 195, 169)",
  },
];

/**
 * Converte `*assim*` em negrito, sem passar HTML por string.
 *
 * Sai um array de pedaços em vez de `dangerouslySetInnerHTML`: o texto vem de
 * uma constante nossa hoje, mas a marcação existe para ele reescrever à
 * vontade, e nenhum texto que alguém edita depois deveria virar HTML cru.
 */
const comDestaque = (texto: string): ReactNode[] =>
  texto.split("*").map((pedaco, i) =>
    // Índice ímpar = estava entre asteriscos.
    i % 2 === 1 ? <strong key={i} className="font-extrabold">{pedaco}</strong> : <span key={i}>{pedaco}</span>,
  );

/**
 * Os três glifos são SVG escrito à mão, e NÃO o `lucide-react`, pela mesma
 * razão registrada na /construcao: importar os ícones que as outras páginas
 * usam faria o Rollup criar um pedaço compartilhado e mudar o grafo de chunks
 * delas. Uns poucos bytes duplicados compram o isolamento — e esta é a página
 * principal, a que menos pode depender das outras.
 */
const GlifoWhatsApp = ({ tamanho }: { tamanho: number }) => (
  <svg viewBox="0 0 512 512" width={tamanho} height={tamanho} fill="currentColor" className="shrink-0" aria-hidden>
    <path d="M256 16C123 16 16 123 16 256c0 42 11 83 33 119L16 496l125-33c34 19 74 29 115 29 133 0 240-107 240-240S389 16 256 16zm0 438c-37 0-73-10-104-29l-7-4-74 19 20-72-5-8c-21-33-32-71-32-110 0-112 91-203 202-203s203 91 203 203-91 204-203 204zm115-152c-6-3-37-18-43-20s-10-3-14 3-16 20-19 24-7 5-13 2c-6-3-27-10-51-32-19-17-32-37-35-43s0-9 3-12c3-3 6-7 9-10 3-4 4-6 6-10s1-8 0-11c-2-3-14-33-19-46-5-12-10-10-14-11h-12c-4 0-10 1-15 7s-21 20-21 50 22 58 25 62c3 4 43 66 105 92 15 6 26 10 35 13 15 5 28 4 39 2 12-2 37-15 42-29s5-27 4-29c-2-3-6-5-12-8z" />
  </svg>
);

const GlifoSelo = ({ tamanho, cor }: { tamanho: number; cor: string }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="10" fill={cor} />
    <path d="M16 9L10.5 14.5L8 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlifoGente = ({ tamanho }: { tamanho: number }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
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
 * ⚠️ Este head PRECISA continuar batendo com o que está escrito no index.html:
 * o GitHub Pages entrega aquele HTML estático, e quem não roda JavaScript —
 * parte dos robôs, a prévia de link no WhatsApp — só vê o que está lá. Mudou
 * aqui? Mudar lá também, e vice-versa.
 *
 * Esta é a ÚNICA página indexável do site que fala de ofertas: a `/geral`, a
 * `/ofertas` e a `/obras` levam `noindex` para não disputarem a mesma busca
 * entre si. Quem representa o Promofy no orgânico é esta.
 */
const GruposHead = () => (
  <Helmet>
    <title>Promofy — Grupos de ofertas e cupons no WhatsApp</title>
    <meta
      name="description"
      content="Escolha o grupo do Promofy que combina com você: ofertas e cupons de todas as categorias, ou material de obra e ferramenta. Grátis, sem spam, e você sai quando quiser."
    />
    <link rel="canonical" href="https://apromofy.online/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://apromofy.online/" />
    <meta property="og:title" content="Promofy — Grupos de ofertas e cupons no WhatsApp" />
    <meta
      property="og:description"
      content="Escolha o grupo do Promofy que combina com você: ofertas de todas as categorias, ou material de obra e ferramenta."
    />
    <meta name="twitter:title" content="Promofy — Grupos de ofertas e cupons no WhatsApp" />
    <meta
      name="twitter:description"
      content="Escolha o grupo do Promofy que combina com você: ofertas de todas as categorias, ou material de obra e ferramenta."
    />
  </Helmet>
);

const CartaoDoGrupo = ({ grupo }: { grupo: Grupo }) => (
  <li
    className="border"
    style={{
      backgroundColor: grupo.fundo,
      borderColor: grupo.borda,
      borderRadius: RAIO_CARTAO,
      boxShadow: SOMBRA_CARTAO,
    }}
  >
    <div className="flex items-center gap-[13px] p-[15px] text-left">
      <div className="relative shrink-0" style={{ color: grupo.acento }}>
        <img
          src={grupo.foto}
          alt=""
          width={FOTO}
          height={FOTO}
          className="block rounded-full border-2 border-current bg-white object-cover p-[3px]"
          style={{ width: FOTO, height: FOTO }}
        />
        {/* Selo de checado: o tamanho sai da foto (30%), com a caixa branca 5px
            maior — a mesma proporção que ele fechou na /construcao. */}
        <span
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-white"
          style={{ width: 24, height: 24, boxShadow: "0 3px 8px rgba(0, 0, 0, 0.16)" }}
        >
          <GlifoSelo tamanho={19} cor={grupo.botao[0]} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        {/* Os três tamanhos saem do título (27): nome 62%, descrição 50%. */}
        <h2 className="text-[17px] font-extrabold leading-[1.2] tracking-[-0.3px]" style={{ color: TINTA }}>
          {grupo.nome}
        </h2>
        <p className="mt-[3px] text-[14px] font-medium leading-snug" style={{ color: SUAVE }}>
          {grupo.desc}
        </p>
        {grupo.gente ? (
          <p className="mt-[7px] flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: SUAVE }}>
            <GlifoGente tamanho={15} />
            <span>{grupo.gente}</span>
          </p>
        ) : null}
      </div>
    </div>

    <div className="px-[15px] pb-[15px]">
      <a
        href={grupo.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-[9px] text-[15px] font-extrabold tracking-[0.2px] text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, ${grupo.botao[0]} 0%, ${grupo.botao[1]} 100%)`,
          borderRadius: RAIO_BOTAO,
          padding: `${PESO_BOTAO}px 16px`,
          boxShadow: `0 8px 26px ${grupo.botao[0]}24, inset 0 -${RELEVO_BOTAO}px 0 rgba(0, 0, 0, 0.18)`,
        }}
      >
        <GlifoWhatsApp tamanho={19} />
        {TEXTO.botao}
      </a>
    </div>
  </li>
);

const Grupos = () => (
  <>
    <GruposHead />
    <div
      className="min-h-[100dvh] w-full overflow-x-hidden px-[15px] pb-16 pt-9"
      style={{ backgroundColor: FUNDO, backgroundImage: BRILHO_DO_FUNDO, color: TINTA }}
    >
      {/* max-w fixo, sem breakpoint: ele fechou a página no celular e nenhuma
          medida cresce em tela grande — só centraliza, como as outras. */}
      <main className="mx-auto flex w-full max-w-[400px] flex-col items-center text-center">
        <p
          className="mb-6 rounded-[30px] border bg-white px-5 py-1.5 text-[22px] font-black italic uppercase tracking-[-0.5px] shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
          style={{ borderColor: "rgba(1, 67, 169, 0.3)", color: AZUL }}
        >
          {TEXTO.marca}
        </p>

        <h1 className="mb-[10px] text-[27px] font-black leading-[1.22] tracking-[-0.5px] text-pretty">
          {TEXTO.titulo}
        </h1>

        {/* A linha de apoio e o rodapé compartilham a tipografia de propósito:
            ele pediu o rodapé "igual ao apoio". Mexeu numa, mexer na outra. */}
        <p className="mb-[26px] max-w-[320px] text-[14.5px] font-medium leading-snug" style={{ color: SUAVE }}>
          {comDestaque(TEXTO.apoio)}
        </p>

        <ul className="flex w-full list-none flex-col" style={{ gap: ESPACO }}>
          {GRUPOS.map((grupo) => (
            <CartaoDoGrupo key={grupo.id} grupo={grupo} />
          ))}
        </ul>

        <p className="mt-8 max-w-[320px] text-[14.5px] font-medium leading-snug" style={{ color: SUAVE }}>
          {comDestaque(TEXTO.rodape)}
        </p>
      </main>
    </div>
  </>
);

export default Grupos;
