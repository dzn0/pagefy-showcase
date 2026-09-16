import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Kanban,
  MapPin,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AuthCtaButton } from "./auth-cta-button";
import { CATEGORIES } from "@/lib/demo-data";
import { EDIT_PRICE } from "@/lib/site-pricing";
import { revealDelay } from "@/lib/reveal";
import { CityDemo } from "./city-demo";
import { HeroCta } from "./hero-cta";

// Chips do "costumam não ter site": ramos de rua, com o nome curto.
const STREET_RAMOS = ["restaurantes", "barbearia", "oficina", "saloes", "pet", "mercados"].map((id) => CATEGORIES[id]);

const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

/* ------------------------------------------------------------------ Hero */

export function Hero() {
  return (
    <section className="relative isolate pt-12 sm:pt-16" aria-labelledby="hero-titulo">
      <div className="hero-field absolute inset-x-0 top-0 -z-10 h-[680px]" aria-hidden="true" />
      <div className={`${container} text-center`}>
        <h1
          id="hero-titulo"
          data-reveal
          className="mx-auto max-w-[21ch] text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.04em] text-ink sm:text-[3.6rem] lg:text-[4.1rem]"
        >
          Encontre quem não tem site. <span className="text-green-ink">Apareça com o site pronto.</span>
        </h1>
        <p data-reveal style={revealDelay(90)} className="mx-auto mt-5 max-w-[58ch] text-[1.08rem] leading-relaxed text-ink-2 sm:text-[1.15rem]">
          O Pagefy encontra os comércios da sua cidade que ainda não têm site e monta a página de cada um com nome, telefone e
          avaliações reais. Você manda o link e fecha a venda, sem precisar saber programar.
        </p>
        <HeroCta />
      </div>

      <div id="demo" data-reveal style={revealDelay(320)} className={`${container} mt-10 sm:mt-14`}>
        <CityDemo />
        <p className="mt-4 text-center text-[0.84rem] text-muted">
          Amostra com comércios reais do Google Places.
        </p>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Oportunidade */

export function Opportunity() {
  return (
    <section className="py-24 sm:py-32" aria-labelledby="oportunidade-titulo">
      <div className={`${container} grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20`}>
        <h2
          id="oportunidade-titulo"
          data-reveal
          className="text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.035em] text-ink sm:text-[2.6rem]"
        >
          Muito comércio já atende pelo WhatsApp e pelo Instagram. Só falta alguém aparecer com o site.
        </h2>
        <div data-reveal style={revealDelay(120)} className="space-y-5 text-[1.06rem] leading-relaxed text-ink-2 lg:pt-2">
          <p>
            A padaria da esquina, a barbearia do bairro, a oficina que todo mundo indica: eles já entenderam que precisam estar
            na internet. O que falta é tempo e alguém que resolva por eles.
          </p>
          <p>
            Esse alguém pode ser você. Descobrir quantos comércios sem site existem na sua cidade leva menos de um minuto.
          </p>
          <ul className="flex flex-wrap gap-2 pt-1" aria-label="Alguns ramos que costumam não ter site">
            {STREET_RAMOS.map((category) => (
              <li
                key={category.id}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3.5 text-[0.88rem] font-medium text-ink-2"
              >
                <span
                  className="grid size-6 place-items-center rounded-full font-display text-[0.7rem] font-semibold text-white"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                >
                  {category.short.charAt(0)}
                </span>
                {category.short}
              </li>
            ))}
          </ul>
          <Link
            href="#demo"
            className="inline-flex items-center gap-1.5 font-semibold text-green-ink transition-[gap] hover:gap-2.5"
          >
            <ArrowUp className="size-4" aria-hidden="true" />
            Buscar a minha cidade
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Como funciona */

// Cada passo usa a cor da etapa no app: azul encontra, roxo monta, coral oferece.
const STEPS = [
  {
    well: "bg-azure-soft",
    disc: "bg-azure text-on-hue",
    title: "Busque uma região",
    text: "Digite a cidade, o bairro ou o ramo. A lista mostra os comércios que ainda não têm site, com telefone e nota no Google.",
    visual: <StepSearch />,
  },
  {
    well: "bg-grape-soft",
    disc: "bg-grape text-on-hue",
    title: "Gere e edite o site",
    text: "Escolha um comércio e a página sai pronta com nome, endereço, telefone e fotos. Ajuste cores e textos pedindo no chat, em português.",
    visual: <StepEdit />,
  },
  {
    well: "bg-coral-soft",
    disc: "bg-coral text-on-hue",
    title: "Ofereça e receba",
    text: "Ligue ou mande no WhatsApp com o site já pronto. Em vez de um orçamento, o dono recebe a página dele.",
    visual: <StepShare />,
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-line bg-surface py-24 sm:py-28" aria-labelledby="como-titulo">
      <div className={container}>
        <div data-reveal className="max-w-2xl">
          <h2 id="como-titulo" className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.6rem]">
            Da busca ao WhatsApp em três passos.
          </h2>
          <p className="mt-4 text-[1.06rem] leading-relaxed text-ink-2">
            Você não precisa desenhar nem programar. A parte difícil, que é achar quem precisa e montar a página, fica com o Pagefy.
          </p>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
          {STEPS.map((step, i) => (
            <li key={step.title} data-reveal style={revealDelay(i * 120)} className="md:px-7 md:first:pl-0 md:last:pr-0">
              <div className={`flex h-[184px] items-center justify-center overflow-hidden rounded-2xl p-5 ${step.well}`}>{step.visual}</div>
              <div className="mt-6 flex items-center gap-3">
                <span className={`grid size-7 place-items-center rounded-full font-display text-[0.8rem] font-semibold ${step.disc}`}>
                  {i + 1}
                </span>
                <h3 className="text-[1.2rem] font-semibold tracking-[-0.02em] text-ink">{step.title}</h3>
              </div>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-2">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepSearch() {
  return (
    <div className="w-full max-w-[280px] space-y-2.5" aria-hidden="true">
      <div className="flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-2.5 text-[0.84rem] text-ink">
        <Search className="size-4 text-azure" />
        Padarias em Botucatu
      </div>
      {["Padaria Trigo Dourado", "Padaria Pão de Mel"].map((name) => (
        <div key={name} className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-2.5 text-[0.8rem] shadow-soft">
          <span className="font-semibold text-ink">{name}</span>
          <span className="inline-flex items-center gap-1.5 text-muted">
            <span className="size-1.5 rounded-full bg-lime" />
            Sem site
          </span>
        </div>
      ))}
    </div>
  );
}

function StepEdit() {
  return (
    // Só o chat: não existe editor visual (cor e texto mudam pedindo à IA).
    <div className="w-full max-w-[280px] space-y-2.5" aria-hidden="true">
      <div className="ml-auto w-fit max-w-[240px] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[0.8rem] text-bg">
        Deixa a cor mais escura e coloca o horário de domingo
      </div>
      <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[0.8rem] text-ink shadow-soft">
        <Sparkles className="size-3.5 text-grape-ink" />
        Pronto, site atualizado.
      </div>
    </div>
  );
}

function StepShare() {
  return (
    <div className="w-full max-w-[280px] space-y-2.5" aria-hidden="true">
      <div className="ml-auto max-w-[250px] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3.5 py-2.5 text-[0.8rem] leading-snug text-[#111b21]">
        Oi, seu Zé! Montei um site pra barbearia, dá uma olhada:
        <span className="mt-1 block font-mono text-[0.72rem] text-[#027eb5]">pagefy.app/p/barbearia-do-seu-ze</span>
      </div>
      <div className="w-fit rounded-2xl rounded-bl-md bg-surface px-3.5 py-2.5 text-[0.8rem] text-ink shadow-soft">
        Ficou bom demais! Quanto é?
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Recursos */

const MORE_FEATURES = [
  {
    icon: MapPin,
    tile: "bg-azure-soft text-azure-ink",
    title: "Busca de comércios com dados reais",
    text: "Os comércios vêm do Google Places, já sem quem tem site próprio, com filtro de ramo e de nota no Google.",
  },
  {
    icon: Phone,
    tile: "bg-coral-soft text-coral-ink",
    title: "Telefone e WhatsApp em destaque",
    text: "O contato do comércio já aparece na lista e na página, pra você ligar e fechar na hora.",
  },
  {
    icon: Kanban,
    tile: "bg-grape-soft text-grape-ink",
    title: "CRM de leads",
    text: "Acompanhe cada abordagem: novo, contatado, proposta enviada, fechado ou perdido.",
  },
  {
    icon: Wallet,
    tile: "bg-honey-soft text-honey-ink",
    title: "Financeiro das suas vendas",
    text: "Registre cada site vendido, avulso ou mensal, e veja quanto a assinatura já te devolveu.",
  },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32" aria-labelledby="recursos-titulo">
      <div className={container}>
        <h2
          id="recursos-titulo"
          data-reveal
          className="max-w-[20ch] text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.6rem]"
        >
          Tudo o que você precisa pra vender o site, num lugar só.
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <FeaturePanel
            well="bg-coral-soft"
            title="Um link pra mostrar ao dono"
            text="Cada site tem uma página de preview que abre em qualquer celular, sem login. Mande o link pelo WhatsApp e o dono vê o site dele pronto, antes de você cobrar qualquer coisa."
          >
            <PreviewVisual />
          </FeaturePanel>
          <FeaturePanel
            well="bg-grape-soft"
            delay={120}
            title="Edite conversando com a IA"
            text="Peça em português, do jeito que o cliente pediu pra você. O custo de cada edição aparece antes, sem surpresa nos créditos."
          >
            <ChatVisual />
          </FeaturePanel>
        </div>

        <dl className="mt-16 grid gap-x-12 sm:grid-cols-2">
          {MORE_FEATURES.map(({ icon: Icon, tile, title, text }, i) => (
            <div key={title} data-reveal style={revealDelay((i % 2) * 100)} className="flex gap-4 border-t border-line py-7">
              <span className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${tile}`}>
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-display text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">{title}</dt>
                <dd className="mt-1.5 text-[0.98rem] leading-relaxed text-ink-2">{text}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FeaturePanel({
  title,
  text,
  well,
  delay = 0,
  children,
}: {
  title: string;
  text: string;
  well: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <article data-reveal style={revealDelay(delay)} className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface">
      <div className="p-7 sm:p-8">
        <h3 className="text-[1.35rem] font-semibold tracking-[-0.025em] text-ink">{title}</h3>
        <p className="mt-2.5 max-w-[46ch] text-[0.99rem] leading-relaxed text-ink-2">{text}</p>
      </div>
      <div className={`mt-auto flex min-h-[260px] items-end justify-center px-6 pt-8 ${well}`}>{children}</div>
    </article>
  );
}

function PreviewVisual() {
  return (
    <div className="relative w-full max-w-[400px] pt-[84px]" aria-hidden="true">
      <div className="absolute right-0 top-0 z-10 flex max-w-[230px] items-start gap-2.5 rounded-2xl border border-line bg-surface p-3 shadow-frame sm:-right-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-coral text-on-hue">
          <Send className="size-4" />
        </span>
        <span className="text-[0.78rem] leading-snug text-ink-2">
          Link enviado pra <span className="font-semibold text-ink">Padaria Pão de Mel</span>
          <span className="mt-0.5 block font-mono text-[0.7rem] text-muted">pagefy.app/p/padaria-pao-de-mel</span>
        </span>
      </div>
      <div className="mr-auto w-[240px] rounded-t-[26px] sm:ml-6 border border-b-0 border-line bg-surface p-2 pb-0 shadow-soft">
        <div className="overflow-hidden rounded-t-[20px] bg-white">
          <div className="bg-[#9a5a1c] px-4 pb-5 pt-6 text-white">
            <p className="font-display text-[1.15rem] font-bold leading-tight tracking-[-0.03em]">Padaria Pão de Mel</p>
            <p className="mt-1 text-[0.72rem] text-white/85">Pão quentinho toda manhã</p>
          </div>
          <div className="space-y-1 px-4 py-4 text-[0.68rem] leading-snug text-[#3c4538]">
            <p>Rua das Palmeiras, 214 · Centro</p>
            <p>Seg a sáb · 6h às 20h</p>
          </div>
          <div className="px-4 pb-4">
            <span className="flex h-9 items-center justify-center rounded-full bg-[#141a12] text-[0.76rem] font-bold text-white">
              Chamar no WhatsApp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="w-full max-w-[400px] space-y-3 pb-8" aria-hidden="true">
      <div className="ml-auto w-fit max-w-[290px] rounded-2xl rounded-br-md bg-ink px-4 py-3 text-[0.84rem] leading-snug text-bg">
        O dono pediu pra deixar o verde mais escuro e trocar a foto de capa pela da fachada
      </div>
      <div className="max-w-[300px] rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 text-[0.84rem] leading-snug text-ink shadow-soft">
        <span className="flex items-center gap-1.5 font-semibold">
          <Sparkles className="size-3.5 text-grape-ink" /> Feito
        </span>
        <span className="mt-1 block text-ink-2">Cor ajustada e capa trocada. O link de preview já mostra a nova versão.</span>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-line-strong bg-surface py-1.5 pl-4 pr-1.5 text-[0.82rem] text-muted">
        <span className="flex-1">Peça uma alteração…</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[0.7rem] text-ink-2">{EDIT_PRICE} créditos</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Comece grátis */

export function FreeStart() {
  return (
    <section className="pb-24 sm:pb-32" aria-labelledby="gratis-titulo">
      <div className={container}>
        <div data-reveal className="grid items-center gap-10 rounded-[28px] bg-honey-soft px-7 py-12 sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:py-14">
          <div>
            <h2 id="gratis-titulo" className="text-[1.9rem] font-semibold leading-[1.12] tracking-[-0.035em] text-ink sm:text-[2.3rem]">
              Veja quem precisa de site na sua cidade antes de pagar qualquer coisa.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[1.04rem] leading-relaxed text-ink-2">
              A conta grátis já abre com a sua cidade pesquisada e vem com créditos pra mais 4 buscas. Monte sua lista de comércios sem site, com
              telefone e endereço, e assine quando for gerar o primeiro.
            </p>
          </div>
          <div>
            <ul className="space-y-3">
              {["Sem cartão de crédito", "Sua cidade já pesquisada + 4 buscas", "Lista de contatos pronta pra ligar"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[1.02rem] font-medium text-ink">
                  <span className="grid size-6 place-items-center rounded-full bg-honey text-[#2a1d02]">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <AuthCtaButton
              connectingLabel="Conectando…"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97]"
            >
              Criar conta grátis
              <ArrowRight className="size-4" aria-hidden="true" />
            </AuthCtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- FAQ */

const FAQ = [
  {
    q: "Preciso saber programar?",
    a: "Não, e também não precisa saber desenhar. A página sai pronta com os dados do comércio, e o que você quiser mudar, muda pedindo no chat, em português. A habilidade que conta aqui é conversar com o dono.",
  },
  {
    q: "De onde vêm os dados dos comércios?",
    a: "Do Google Places. São as informações que o próprio comércio publicou no Google: nome, endereço, telefone, fotos, avaliações e horário de funcionamento.",
  },
  {
    q: "Onde o site fica hospedado?",
    a: "No Pagefy. Cada site ganha um link próprio que abre em qualquer celular, sem login. Enquanto não for vendido, ele não aparece no Google.",
  },
  {
    q: "Dá pra usar um domínio próprio, tipo padariadoze.com.br?",
    a: "Dá, e sai bem mais barato que contratar hospedagem. O dono do comércio registra o domínio e liga um redirecionamento pro link do site, no painel do próprio registrador. Quem digitar o domínio cai na página certa. Depois que ela abre, o endereço na barra volta a ser o do Pagefy: o domínio funciona como porta de entrada, o que já resolve pra cartão de visita, fachada e bio do Instagram.",
  },
  {
    q: "E se ninguém responder?",
    a: "Você não manda um orçamento, manda a página do comércio já pronta, o que costuma render outra conversa. E o CRM de leads te lembra de quem já foi contatado e de quem precisa de um segundo contato.",
  },
  {
    q: "Quanto dá pra cobrar por site?",
    a: "O preço é seu. Muita gente cobra um valor pela criação e uma mensalidade pela hospedagem e pelos ajustes. No Financeiro você registra cada venda e acompanha o que já entrou.",
  },
  {
    q: "E se o comércio já tiver um site?",
    a: "Ele nem entra na lista: a busca já tira quem tem site próprio no Google. E antes de gerar o site, o Pagefy confere na internet se o comércio tem um site que não está no perfil do Google, pra você não oferecer o que ele já tem.",
  },
  {
    q: "O que acontece quando meus créditos acabam?",
    a: "Nada se perde. Seus sites e leads continuam na conta, e você escolhe um plano ou faz uma recarga de créditos quando quiser continuar.",
  },
];

export function Faq() {
  return (
    <section id="perguntas" className="border-t border-line bg-surface py-24 sm:py-28" aria-labelledby="faq-titulo">
      <div className={`${container} grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20`}>
        {/* O título acompanha a rolagem enquanto as perguntas passam ao lado.
            `self-start` é o que faz o sticky valer: sem ele o item da grade
            estica até a altura da lista e não tem pra onde grudar. Só de lg pra
            cima, onde existem duas colunas; no celular ele é só um título. */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="faq-titulo" data-reveal className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.6rem]">
            Perguntas de quem está começando.
          </h2>
        </div>
        <div data-reveal style={revealDelay(120)} className="divide-y divide-line border-y border-line">
          {FAQ.map((item, i) => (
            <details key={item.q} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-[1.08rem] font-semibold tracking-[-0.02em] text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  className="size-5 shrink-0 text-muted transition-transform duration-300 ease-(--ease-out-expo) group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-[62ch] pb-6 text-[1rem] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- CTA final */

export function FinalCta() {
  return (
    <section className="bg-surface pb-8 sm:pb-10" aria-labelledby="cta-titulo">
      <div className={container}>
        <div data-reveal className="relative overflow-hidden rounded-[28px] bg-[#17191d] px-7 py-16 text-center sm:px-12 sm:py-20">
          <div className="absolute inset-x-0 top-0 flex h-1.5" aria-hidden="true">
            <span className="flex-1 bg-[#6e9ff5]" />
            <span className="flex-1 bg-[#a68af0]" />
            <span className="flex-1 bg-[#f28a63]" />
            <span className="flex-1 bg-[#f0bf4c]" />
          </div>
          <h2
            id="cta-titulo"
            className="mx-auto max-w-[18ch] text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[3rem]"
          >
            Tem comércio sem site na sua rua agora.
          </h2>
          <p className="mx-auto mt-5 max-w-[50ch] text-[1.06rem] leading-relaxed text-white/72">
            Busque a sua cidade de graça e veja quem ainda não tem site. Quando o dono abrir o link do site dele, a conversa já começou.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <AuthCtaButton
              connectingLabel="Conectando…"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-lime px-7 text-[1.02rem] font-semibold text-[#0d160b] transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.97] sm:w-auto"
            >
              Começar grátis
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </AuthCtaButton>
            <Link
              href="#demo"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full border border-white/20 px-7 text-[1.02rem] font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              <Search className="size-[18px]" aria-hidden="true" />
              Buscar a minha cidade
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
