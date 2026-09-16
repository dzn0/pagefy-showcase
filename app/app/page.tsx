"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { ArrowRight, Kanban, MapPin, Search, Send, Sparkles, Wallet, X, type LucideIcon } from "lucide-react";
import { limparBonusNegado, temBonusNegado, useAuth } from "@/app/_components/auth-provider";
import { formatBRL } from "@/lib/currency";
import type { Hue } from "@/lib/dashboard-nav";
import { CATEGORIES, EXAMPLE_CITIES } from "@/lib/demo-data";
import { LEAD_STAGES, leadsStore } from "@/lib/store/leads";
import { salesStore } from "@/lib/store/sales";
import { loadDraftHtml } from "@/lib/store/site-drafts";
import { sitesStore, type SiteStatus } from "@/lib/store/sites";
import { BusinessPhoto } from "./_components/business-photo";
import { ShowcaseMap } from "./_components/showcase-map";
import { SitePreview } from "./_components/site-preview";
import { SiteThumb } from "./_components/site-thumb";
import { Badge, HUE, HueTile, Panel } from "./_components/ui";

const SITE_STATUS: Record<SiteStatus, { label: string; hue: Hue }> = {
  rascunho: { label: "Rascunho", hue: "neutral" },
  publicado: { label: "Publicado", hue: "green" },
  vendido: { label: "Vendido", hue: "honey" },
};

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

export default function DashboardHome() {
  const { profile } = useAuth();
  const leads = leadsStore.useAll();
  const sites = sitesStore.useAll();
  const sales = salesStore.useAll();

  if (!profile) return null;

  const firstName = profile.name.split(" ")[0];
  const revenue = sales.reduce((sum, sale) => sum + sale.value, 0);
  const pitched = leads.filter((lead) => lead.stage !== "novo").length;

  const message =
    sales.length > 0
      ? `${sales.length} ${plural(sales.length, "venda registrada", "vendas registradas")}. Bora achar o próximo comércio.`
      : sites.length > 0
        ? `Você já tem ${sites.length} ${plural(sites.length, "site pronto", "sites prontos")}. Agora é mandar o link e fechar a venda.`
        : "Digite sua cidade e veja quais comércios ainda não têm site. O primeiro vira o seu primeiro cliente.";

  const steps: JourneyStep[] = [
    {
      hue: "azure",
      icon: Search,
      title: "Encontrar",
      text: "Busque comércios sem site na sua região.",
      value: String(leads.length),
      unit: plural(leads.length, "lead salvo", "leads salvos"),
      cta: "Buscar comércios",
      href: "/app/buscar",
      done: leads.length > 0 || sites.length > 0,
    },
    {
      hue: "grape",
      icon: Sparkles,
      title: "Montar",
      text: "Gere o site com os dados reais do comércio.",
      value: String(sites.length),
      unit: plural(sites.length, "site gerado", "sites gerados"),
      cta: sites.length > 0 ? "Ver meus sites" : "Gerar um site",
      href: sites.length > 0 ? "/app/sites" : "/app/buscar",
      done: sites.length > 0,
    },
    {
      hue: "coral",
      icon: Send,
      title: "Oferecer",
      text: "Mande o link pro dono por WhatsApp ou ligação.",
      value: String(pitched),
      unit: plural(pitched, "abordagem", "abordagens"),
      cta: "Abrir leads",
      href: "/app/leads",
      done: pitched > 0,
    },
    {
      hue: "honey",
      icon: Wallet,
      title: "Receber",
      text: "Registre a venda e veja o retorno.",
      value: formatBRL(revenue),
      unit: `${sales.length} ${plural(sales.length, "venda", "vendas")}`,
      cta: "Registrar venda",
      href: "/app/financeiro",
      done: sales.length > 0,
    },
  ];

  return (
    <div className="space-y-5">
      <BonusNegado />
      <Hero firstName={firstName} message={message} />
      <Journey steps={steps} restart={sales.length > 0} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Funnel />
        <RecentSites />
      </div>

    </div>
  );
}

// Conta criada numa rede que já tinha usado o bônus nas últimas 24 h. O saldo
// zerado sem explicação pareceria defeito; aqui ele ganha motivo e saída.
//
// A frase fala da REDE, nunca da pessoa: num 4G ou num Wi-Fi compartilhado,
// quem cai aqui costuma não ter outra conta — dizer que tem seria mentira, e
// ainda entregaria que existe outra conta naquele endereço.
function BonusNegado() {
  // O shell do app só monta no cliente, então dá pra ler no estado inicial —
  // mesmo caminho dos rascunhos em Sites. O efeito só apaga o recado guardado.
  const [mostrar, setMostrar] = useState(temBonusNegado);
  useEffect(() => {
    if (mostrar) limparBonusNegado();
  }, [mostrar]);
  if (!mostrar) return null;

  return (
    <Panel className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <button
        type="button"
        onClick={() => setMostrar(false)}
        aria-label="Fechar aviso"
        className="absolute right-4 top-4 grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:static sm:order-3 sm:shrink-0"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
      <HueTile icon={Sparkles} hue="honey" />
      <div className="min-w-0 flex-1 pr-8 sm:pr-0">
        <p className="text-[1.02rem] font-semibold text-ink">Sua conta começou sem créditos de boas-vindas</p>
        <p className="mt-1 max-w-[62ch] text-[0.9rem] leading-relaxed text-muted">
          Esta rede de internet já recebeu o bônus nas últimas 24 horas — ele vale uma vez por rede, e é o que segura
          conta criada em série. Se você divide a internet com outras pessoas, tente de novo amanhã ou comece com uma recarga.
        </p>
      </div>
      <Link
        href="/app/plano"
        className="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full bg-ink px-4 text-[0.86rem] font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97] sm:self-auto"
      >
        Ver créditos
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Panel>
  );
}

function Hero({ firstName, message }: { firstName: string; message: string }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (city.trim().length < 2) {
      setError("Digite uma cidade ou bairro para buscar.");
      return;
    }
    router.push(`/app/buscar?cidade=${encodeURIComponent(city.trim())}`);
  }

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-[28px] border border-line bg-surface shadow-card lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <div className="flex flex-col justify-center p-6 sm:p-9">
        <h1 className="font-display text-[1.9rem] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[2.35rem]">
          Olá, {firstName}.
          <br />
          <span className="text-green-ink">Qual cidade hoje?</span>
        </h1>
        <p className="mt-3 max-w-[46ch] text-[0.98rem] leading-relaxed text-ink-2">{message}</p>

        <form onSubmit={submit} className="mt-6" noValidate>
          <label htmlFor="home-cidade" className="sr-only">
            Cidade ou bairro
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-azure" aria-hidden="true" />
            <input
              id="home-cidade"
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Cidade ou bairro, ex.: Botucatu"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "home-cidade-erro" : undefined}
              className={`h-[3.25rem] w-full rounded-full border bg-bg pl-11 pr-[8.5rem] text-[0.98rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)] ${
                error ? "border-danger" : "border-line-strong"
              }`}
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-full bg-green px-5 text-[0.92rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
            >
              <Search className="size-4" aria-hidden="true" />
              Buscar
            </button>
          </div>
          {error && (
            <p id="home-cidade-erro" role="alert" className="mt-2 pl-4 text-[0.86rem] font-medium text-danger">
              {error}
            </p>
          )}
        </form>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-[0.84rem] text-muted">Tente:</span>
          {EXAMPLE_CITIES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setCity(example);
                setError(null);
              }}
              className="rounded-full border border-line-strong px-3 py-1 text-[0.84rem] font-medium text-ink-2 transition-colors duration-200 hover:border-azure hover:bg-azure-soft hover:text-azure-ink"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="relative isolate min-h-72 overflow-hidden border-t border-line lg:min-h-0 lg:border-l lg:border-t-0">
        <ShowcaseMap />
      </div>
    </section>
  );
}

type JourneyStep = {
  hue: Hue;
  icon: LucideIcon;
  title: string;
  text: string;
  value: string;
  unit: string;
  cta: string;
  href: string;
  done: boolean;
};

// As quatro etapas até a primeira venda. Com tudo feito o painel para de se
// comportar como checklist: some o "4 de 4", somem as barras de progresso e os
// selos de "Feito", e o que sobra é o resumo da operação com um atalho em cada
// card. Quem já vendeu não precisa de um roteiro na frente todo dia.
function Journey({ steps, restart }: { steps: JourneyStep[]; restart: boolean }) {
  const doneCount = steps.filter((step) => step.done).length;
  const currentIndex = steps.findIndex((step) => !step.done);
  const complete = currentIndex === -1;

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[1.12rem] font-semibold tracking-[-0.02em] text-ink">
          {complete ? "Seu dia a dia" : restart ? "Seu caminho até a próxima venda" : "Seu caminho até a primeira venda"}
        </h2>
        {complete ? (
          <p className="text-[0.86rem] text-muted">Atalho pra cada etapa</p>
        ) : (
          <p className="text-[0.86rem] text-muted">
            <span className="font-semibold text-ink tabular">{doneCount}</span> de {steps.length} etapas
          </p>
        )}
      </div>

      {!complete && (
        <div className="mt-4 flex gap-1.5 px-5 sm:px-6" aria-hidden="true">
          {steps.map((step) => (
            <span key={step.title} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span
                className={`block h-full rounded-full transition-[width] duration-700 ease-(--ease-out-expo) ${HUE[step.hue].fill}`}
                style={{ width: step.done ? "100%" : "0%" }}
              />
            </span>
          ))}
        </div>
      )}

      <ol className="mt-5 grid gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const current = i === currentIndex;
          return (
            <li key={step.title} className={current ? HUE[step.hue].soft : "bg-surface"}>
              <Link href={step.href} className="group flex h-full flex-col p-5 transition-colors duration-200 hover:bg-surface-2/60 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <HueTile icon={step.icon} hue={step.hue} solid={step.done || current} />
                  {complete ? null : step.done ? (
                    <Badge hue={step.hue} dot>
                      Feito
                    </Badge>
                  ) : current ? (
                    <span className={`text-[0.78rem] font-semibold ${HUE[step.hue].ink}`}>Próximo passo</span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-[1.02rem] font-semibold tracking-[-0.02em] text-ink">{step.title}</h3>
                <p className="mt-1 text-[0.86rem] leading-snug text-muted">{step.text}</p>
                <p className="mt-5 font-display text-[1.6rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular">
                  {step.value}
                </p>
                <p className="mt-1.5 text-[0.8rem] text-muted">{step.unit}</p>
                <span className={`mt-auto inline-flex items-center gap-1 pt-5 text-[0.86rem] font-semibold ${HUE[step.hue].ink}`}>
                  {step.cta}
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function Funnel() {
  const leads = leadsStore.useAll();
  const total = leads.length;
  const counts = LEAD_STAGES.map((stage) => ({ ...stage, count: leads.filter((lead) => lead.stage === stage.id).length }));

  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HueTile icon={Kanban} hue="coral" size="sm" />
          <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">Funil de leads</h2>
        </div>
        <Link href="/app/leads" className="group inline-flex items-center gap-1 text-[0.88rem] font-semibold text-coral-ink">
          Abrir quadro <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 flex h-3 gap-1" aria-hidden="true">
        {total === 0
          ? counts.map((stage) => <span key={stage.id} className={`flex-1 rounded-full ${HUE[stage.hue].soft}`} />)
          : counts
              .filter((stage) => stage.count > 0)
              .map((stage) => (
                <span
                  key={stage.id}
                  className={`rounded-full transition-[flex-grow] duration-500 ${HUE[stage.hue].fill}`}
                  style={{ flexGrow: stage.count }}
                />
              ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-3 sm:grid-cols-5">
        {counts.map((stage) => (
          <div key={stage.id} className="min-w-0">
            <dt className="flex items-center gap-1.5 truncate text-[0.78rem] font-medium text-muted">
              <span className={`size-2 shrink-0 rounded-full ${HUE[stage.hue].fill}`} aria-hidden="true" />
              {stage.label === "Proposta enviada" ? "Proposta" : stage.label}
            </dt>
            <dd className="mt-0.5 pl-3.5 font-display text-[1.25rem] font-semibold tracking-[-0.02em] text-ink tabular">{stage.count}</dd>
          </div>
        ))}
      </dl>

      {total === 0 ? (
        <div className="mt-5 flex flex-1 flex-col items-start justify-end gap-3 rounded-[16px] bg-surface-2 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-[0.88rem] leading-relaxed text-ink-2">
            Os comércios que você salvar na busca entram aqui como <strong className="font-semibold text-azure-ink">Novo</strong> e
            andam até <strong className="font-semibold text-green-ink">Fechado</strong>.
          </p>
          <Link
            href="/app/buscar"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-[0.86rem] font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97]"
          >
            <Search className="size-4" aria-hidden="true" /> Buscar leads
          </Link>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-line border-t border-line">
          {leads
            .slice(-4)
            .reverse()
            .map((lead) => {
              const stage = LEAD_STAGES.find((s) => s.id === lead.stage) ?? LEAD_STAGES[0];
              return (
                <li key={lead.id} className="flex items-center gap-3 py-3">
                  <BusinessPhoto
                    photo={lead.photo}
                    name={lead.businessName}
                    color={lead.color}
                    size={36}
                    className="rounded-[10px]"
                    initialClassName="text-[0.85rem]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.92rem] font-semibold text-ink">{lead.businessName}</p>
                    <p className="truncate text-[0.8rem] text-muted">
                      {lead.category} · {lead.neighborhood}
                    </p>
                  </div>
                  <Badge hue={stage.hue} dot>
                    {stage.label}
                  </Badge>
                </li>
              );
            })}
        </ul>
      )}
    </Panel>
  );
}

// Os sites mais recentes, com a prévia de verdade (o HTML gerado) quando existe.
function RecentSites() {
  const sites = sitesStore.useAll();
  const [htmlBySlug] = useState(loadDraftHtml);
  const recent = sites.slice(0, 3);

  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HueTile icon={Sparkles} hue="grape" size="sm" />
          <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">Sites recentes</h2>
        </div>
        {sites.length > 0 && (
          <Link href="/app/sites" className="group inline-flex items-center gap-1 text-[0.88rem] font-semibold text-grape-ink">
            Ver todos <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col">
          <p className="text-[0.9rem] leading-relaxed text-muted">
            Os sites que você gerar aparecem aqui, com o link pra mandar ao dono do comércio.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 [mask-image:linear-gradient(180deg,#000_40%,transparent_100%)]" aria-hidden="true">
            <SiteThumb name={CATEGORIES.restaurantes.short} color={CATEGORIES.restaurantes.color} />
            <SiteThumb name={CATEGORIES.saloes.short} color={CATEGORIES.saloes.color} className="translate-y-3" />
          </div>
          <Link
            href="/app/buscar"
            className="relative -mt-4 inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-grape px-5 text-[0.9rem] font-semibold text-on-hue transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.97]"
          >
            Gerar o primeiro site
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {recent.map((site) => (
            <li key={site.id}>
              <Link href={`/app/sites/${site.slug}`} className="group -mx-2 flex items-center gap-3.5 rounded-[12px] px-2 py-3 transition-colors hover:bg-surface-2">
                <div className="w-28 shrink-0">
                  {htmlBySlug[site.slug] ? (
                    <SitePreview html={htmlBySlug[site.slug]!} title={site.businessName} className="rounded-[10px]" />
                  ) : (
                    <SiteThumb name={site.businessName} color={site.color} className="rounded-[10px]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.94rem] font-semibold text-ink">{site.businessName}</p>
                  <p className="mt-0.5 truncate text-[0.82rem] text-muted">{site.category}</p>
                  <div className="mt-1.5">
                    <Badge hue={SITE_STATUS[site.status].hue} dot>
                      {SITE_STATUS[site.status].label}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
