"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  KeyRound,
  LoaderCircle,
  PiggyBank,
  ReceiptText,
  Search,
  Zap,
} from "lucide-react";
import { useAuth } from "@/app/_components/auth-provider";
import { loadAdminKey, saveAdminKey } from "@/lib/admin";
import { API_URL } from "@/lib/api";
import { CREDIT_PACKS, PLANS } from "@/lib/plans";
import { CREDIT_COSTS } from "@/lib/store/credits";
import { Badge, HueTile, PageHeader, Panel, StatCard } from "../../_components/ui";

// Tela de admin: o livro-caixa das APIs pagas (backend /admin/usage). Os
// valores do Google são estimativas pela tabela de preço, sem a cota grátis
// mensal; a conferência de verdade é o faturamento do Google Cloud.

/** Câmbio de referência pra mostrar em reais. Ajuste quando o dólar mudar muito. */
const USD_BRL = 5.5;

type Period = "hoje" | "7d" | "30d";

type Usage = {
  period: Period;
  since: string;
  totals: { costUsd: number; savedUsd: number };
  origins: Array<{
    origin: string;
    costUsd: number;
    savedUsd: number;
    calls: number;
    cacheHits: number;
    requests: number;
    avgPerRequestUsd: number | null;
  }>;
  skus: Array<{ provider: string; sku: string; calls: number; costUsd: number }>;
  daily: Array<{ day: string; provider: string; costUsd: number }>;
  prices: Record<string, number>;
  month: {
    since: string;
    billUsd: number;
    skus: Array<{ sku: string; calls: number; free: number; billable: number; costUsd: number }>;
  };
};

const PERIODS: Array<{ id: Period; label: string; days: number }> = [
  { id: "hoje", label: "Hoje", days: 1 },
  { id: "7d", label: "7 dias", days: 7 },
  { id: "30d", label: "30 dias", days: 30 },
];

const ORIGIN_LABELS: Record<string, string> = {
  busca: "Busca de leads",
  "busca-inicio": "Cidade da Início (1ª busca grátis)",
  demo: "Demo da landing",
  vitrine: "Mapa da Início (lugar fixo)",
  fotos: "Fotos dos comércios (no app)",
  // Custo que se repete a cada 24 h enquanto o site publicado estiver no ar.
  "fotos-site": "Fotos dos sites publicados",
  "gerar-site": "Gerar site",
  "ajustar-site": "Ajuste com IA",
  "conferir-site": "Conferir se já tem site",
  "mensagem-dono": "Mensagem pro dono",
  sistema: "Sistema",
};

const SKU_LABELS: Record<string, string> = {
  text_search_enterprise: "Busca por texto (com site)",
  text_search_pro: "Localizar a cidade",
  nearby_search_enterprise: "Busca por raio",
  place_photo: "Foto",
  place_details_atmosphere: "Detalhes do comércio (gerar site)",
};

// Quanto um crédito rende em reais: do mais barato (plano semestral com mais
// créditos) ao mais caro (recarga pequena).
const PAID_PLANS = PLANS.filter((plan) => plan.price.semiannual > 0);
const CREDIT_BRL_MIN = Math.min(...PAID_PLANS.map((plan) => plan.price.semiannual / plan.credits));
const CREDIT_BRL_MAX = Math.max(...CREDIT_PACKS.map((pack) => pack.price / pack.credits));

const brl = (usd: number) =>
  (usd * USD_BRL).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brlValue = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const usd = (value: number) => `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
const int = (value: number) => value.toLocaleString("pt-BR");

export default function CustosPage() {
  const { profile } = useAuth();
  const [key, setKey] = useState(loadAdminKey);
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (adminKey: string, which: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/usage?periodo=${which}`, { headers: { "x-admin-key": adminKey } });
      const body = (await res.json().catch(() => null)) as (Usage & { error?: string }) | null;
      if (res.status === 401) {
        saveAdminKey("");
        setKey("");
        setError("Chave de admin inválida. Confira a ADMIN_KEY no .env do backend.");
        return;
      }
      if (!res.ok || !body || body.error) {
        setError(body?.error ?? "O backend não respondeu.");
        return;
      }
      setData(body);
    } catch {
      setError("Não deu para falar com o backend. Ele está rodando?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!key) return;
    const id = setTimeout(() => void load(key, period), 0);
    return () => clearTimeout(id);
  }, [key, period, load]);

  if (!profile) return null;
  if (!profile.admin) {
    return (
      <Panel className="p-6">
        <p className="text-[0.95rem] text-ink-2">Esta área é só para administradores do Pagefy.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/app/config"
        className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Configurações
      </Link>
      <PageHeader
        icon={ReceiptText}
        hue="honey"
        title="Custos da API"
        description="O que cada busca, foto e (em breve) site gerado está custando. Valores do Google são estimativas pela tabela de preço."
        action={key ? <PeriodToggle value={period} onChange={setPeriod} disabled={loading} /> : null}
      />

      {!key ? (
        <KeyGate
          error={error}
          onSubmit={(value) => {
            saveAdminKey(value);
            setKey(value);
          }}
        />
      ) : error ? (
        <Panel className="flex flex-col items-start gap-3 p-6">
          <p role="alert" className="text-[0.95rem] text-ink-2">{error}</p>
          <button
            type="button"
            onClick={() => void load(key, period)}
            className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Tentar de novo
          </button>
        </Panel>
      ) : !data ? (
        <Panel className="flex items-center gap-3 p-6 text-[0.92rem] text-muted">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Somando os custos…
        </Panel>
      ) : (
        <Report data={data} loading={loading} onForgetKey={() => {
          saveAdminKey("");
          setKey("");
          setData(null);
        }} />
      )}
    </div>
  );
}

function PeriodToggle({ value, onChange, disabled }: { value: Period; onChange: (period: Period) => void; disabled: boolean }) {
  return (
    <div role="radiogroup" aria-label="Período" className="inline-flex rounded-full border border-line-strong bg-surface p-1">
      {PERIODS.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled && !active}
            onClick={() => onChange(option.id)}
            className={`h-9 rounded-full px-4 text-[0.86rem] font-semibold transition-colors duration-200 ${
              active ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function KeyGate({ error, onSubmit }: { error: string | null; onSubmit: (key: string) => void }) {
  const [value, setValue] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }
  return (
    <Panel className="max-w-xl p-6">
      <HueTile icon={KeyRound} hue="honey" />
      <h2 className="mt-4 text-[1.1rem] font-semibold tracking-[-0.02em] text-ink">Chave de admin</h2>
      <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">
        Cole a <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8rem]">ADMIN_KEY</code> do{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8rem]">backend/.env</code>. Ela fica guardada só neste navegador.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          aria-label="Chave de admin"
          aria-invalid={error ? true : undefined}
          className={`h-11 flex-1 rounded-full border bg-bg px-4 font-mono text-[0.86rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)] ${
            error ? "border-danger" : "border-line-strong"
          }`}
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-green px-5 text-[0.9rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
        >
          Ver custos
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 pl-4 text-[0.84rem] font-medium text-danger">
          {error}
        </p>
      )}
    </Panel>
  );
}

function Report({ data, loading, onForgetKey }: { data: Usage; loading: boolean; onForgetKey: () => void }) {
  const search = data.origins.find((o) => o.origin === "busca");
  const paidCalls = data.origins.reduce((sum, o) => sum + o.calls, 0);
  const cacheHits = data.origins.reduce((sum, o) => sum + o.cacheHits, 0);
  const days = PERIODS.find((p) => p.id === data.period)?.days ?? 7;

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${loading ? "opacity-50" : ""}`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} hue="honey" label="Gasto no período" value={brl(data.totals.costUsd)} hint={usd(data.totals.costUsd)} />
        <StatCard
          icon={Search}
          hue="azure"
          label="Custo médio por busca"
          value={search?.avgPerRequestUsd != null ? brl(search.avgPerRequestUsd) : "–"}
          hint={search?.requests ? `${int(search.requests)} ${search.requests === 1 ? "busca nova" : "buscas novas"}` : "Nenhuma busca nova"}
        />
        <StatCard
          icon={PiggyBank}
          hue="green"
          label="Economizado pelo cache"
          value={brl(data.totals.savedUsd)}
          hint={`${int(cacheHits)} ${cacheHits === 1 ? "chamada evitada" : "chamadas evitadas"}`}
        />
        <StatCard icon={Zap} hue="neutral" label="Chamadas pagas" value={int(paidCalls)} hint="Google e Claude, somadas" />
      </div>

      <MonthBill month={data.month} />

      <ActionMargins
        searchAvgUsd={search?.avgPerRequestUsd ?? null}
        siteAvgUsd={data.origins.find((o) => o.origin === "gerar-site")?.avgPerRequestUsd ?? null}
        editAvgUsd={data.origins.find((o) => o.origin === "ajustar-site")?.avgPerRequestUsd ?? null}
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel className="overflow-hidden">
          <PanelTitle title="Por origem" hint="De onde veio cada gasto" />
          {data.origins.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-left text-[0.88rem]">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-[0.78rem] font-semibold text-muted">
                    <th className="px-5 py-2.5 font-semibold">Origem</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Pagas</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Do cache</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Média por ação</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Custo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.origins.map((o) => (
                    <tr key={o.origin}>
                      <td className="px-5 py-3 font-medium text-ink">{ORIGIN_LABELS[o.origin] ?? o.origin}</td>
                      <td className="px-3 py-3 text-right text-ink-2 tabular">{int(o.calls)}</td>
                      <td className="px-3 py-3 text-right text-ink-2 tabular">{int(o.cacheHits)}</td>
                      <td className="px-3 py-3 text-right text-ink-2 tabular">{o.avgPerRequestUsd != null ? brl(o.avgPerRequestUsd) : "–"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-ink tabular">{brl(o.costUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden">
          <PanelTitle title="Por produto" hint="O que o provedor cobra" />
          {data.skus.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {data.skus.map((s) => (
                <li key={`${s.provider}-${s.sku}`} className="flex items-center gap-3 px-5 py-3">
                  <Badge hue={s.provider === "claude" ? "grape" : "azure"}>{s.provider === "claude" ? "Claude" : "Google"}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{SKU_LABELS[s.sku] ?? s.sku}</p>
                    <p className="text-[0.8rem] text-muted tabular">
                      {int(s.calls)} × {data.prices[s.sku] != null ? usd(data.prices[s.sku]) : "por tokens"}
                    </p>
                  </div>
                  <p className="font-semibold text-ink tabular">{brl(s.costUsd)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <DailyChart daily={data.daily} days={days} since={data.since} />

      <div className="flex flex-col gap-3 text-[0.82rem] leading-relaxed text-muted sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-[80ch]">
          Contagem de chamadas conferida com o gráfico de tráfego do Google Cloud; preços da tabela oficial (faixa até 100 mil chamadas
          por mês), a US$ 1 = R$ {USD_BRL.toFixed(2).replace(".", ",")}. Os blocos do período mostram o custo cheio, sem a cota grátis; a
          fatura estimada do mês desconta a cota. O valor final é o do faturamento do Google Cloud. Custos da Claude aparecem aqui assim
          que o gerador de sites existir, calculados pelos tokens de cada resposta.
        </p>
        <button type="button" onClick={onForgetKey} className="shrink-0 font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
          Esquecer a chave neste navegador
        </button>
      </div>
    </div>
  );
}

// Mês corrente: quanto da cota grátis de cada produto já foi usado e o que
// passou dela (o que o Google deve cobrar de fato).
function MonthBill({ month }: { month: Usage["month"] }) {
  const monthName = new Date(new Date(month.since).getTime() - 3 * 60 * 60 * 1000).toLocaleDateString("pt-BR", {
    month: "long",
    timeZone: "UTC",
  });
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pb-4 pt-4">
        <div>
          <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-ink">Fatura estimada de {monthName}</h2>
          <p className="mt-0.5 text-[0.84rem] text-muted">Chamadas do mês, descontada a cota grátis de cada produto do Google.</p>
        </div>
        <p className="font-display text-[1.7rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular">
          {brl(month.billUsd)}
          <span className="ml-2 text-[0.84rem] font-medium tracking-normal text-muted">{usd(month.billUsd)}</span>
        </p>
      </div>
      {month.skus.length === 0 ? (
        <Empty />
      ) : (
        <ul className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
          {month.skus.map((row) => {
            const used = Math.min(1, row.calls / row.free);
            const over = row.billable > 0;
            return (
              <li key={row.sku} className="bg-surface px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[0.9rem] font-semibold text-ink">{SKU_LABELS[row.sku] ?? row.sku}</p>
                  <p className={`shrink-0 text-[0.86rem] font-semibold tabular ${over ? "text-danger" : "text-green-ink"}`}>
                    {over ? brl(row.costUsd) : "grátis"}
                  </p>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                  <div className={`h-full rounded-full ${over ? "bg-berry" : used > 0.8 ? "bg-honey" : "bg-green"}`} style={{ width: `${Math.max(2, used * 100)}%` }} />
                </div>
                <p className="mt-1.5 text-[0.8rem] text-muted tabular">
                  {int(row.calls)} de {int(row.free)} grátis
                  {over ? ` · ${int(row.billable)} cobradas` : ` · sobram ${int(row.free - row.calls)}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function PanelTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-4">
      <h2 className="text-[1.02rem] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      <p className="text-[0.8rem] text-muted">{hint}</p>
    </div>
  );
}

function Empty() {
  return <p className="border-t border-line px-5 py-8 text-center text-[0.88rem] text-muted">Nenhum custo registrado no período.</p>;
}

// Cada ação: o que ela rende em créditos (do plano mais barato à recarga mais
// cara) contra o que custa de API, pela média real do período. Cada ação tem a
// sua origem no livro-caixa, então criar um site nunca entra na média do
// ajuste (a diferença entre os dois é de dez vezes).
function ActionMargins({
  searchAvgUsd,
  siteAvgUsd,
  editAvgUsd,
}: {
  searchAvgUsd: number | null;
  siteAvgUsd: number | null;
  editAvgUsd: number | null;
}) {
  const actions = [
    { label: "Busca", credits: CREDIT_COSTS.search, costUsd: searchAvgUsd, pending: "Faça uma busca nova para medir" },
    { label: "Gerar site", credits: CREDIT_COSTS.site, costUsd: siteAvgUsd, pending: "Gere um site para medir" },
    { label: "Ajuste com IA", credits: CREDIT_COSTS.edit, costUsd: editAvgUsd, pending: "Peça um ajuste para medir" },
  ];
  return (
    <Panel className="overflow-hidden">
      <PanelTitle title="Custo × preço por ação" hint="Receita de 1 ação, do crédito mais barato ao mais caro" />
      <div className="grid gap-px border-t border-line bg-line sm:grid-cols-3">
        {actions.map((action) => {
          const low = action.credits * CREDIT_BRL_MIN;
          const high = action.credits * CREDIT_BRL_MAX;
          const cost = action.costUsd != null ? action.costUsd * USD_BRL : null;
          const tight = cost != null && cost > low;
          return (
            <div key={action.label} className="bg-surface px-5 py-4">
              <p className="flex items-center justify-between gap-2 text-[0.92rem] font-semibold text-ink">
                {action.label}
                <span className="text-[0.78rem] font-medium text-muted tabular">{action.credits} créditos</span>
              </p>
              <p className="mt-2 text-[0.84rem] text-muted tabular">
                Rende {brlValue(low)} a {brlValue(high)}
              </p>
              {cost != null ? (
                <p className={`mt-1 text-[0.9rem] font-semibold tabular ${tight ? "text-danger" : "text-green-ink"}`}>
                  Custa {brlValue(cost)} · {tight ? "prejuízo no crédito mais barato" : `sobra de ${brlValue(low - cost)} ou mais`}
                </p>
              ) : (
                <p className="mt-1 text-[0.86rem] text-muted">{action.pending}</p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function DailyChart({ daily, days, since }: { daily: Usage["daily"]; days: number; since: string }) {
  // Todos os dias do período, inclusive os sem gasto. `since` é a meia-noite
  // de Brasília do primeiro dia (em UTC), então tirando 3 h sai a data certa.
  const start = new Date(since).getTime() - 3 * 60 * 60 * 1000;
  const series = Array.from({ length: days }, (_, i) => {
    const key = new Date(start + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const google = daily.filter((d) => d.day === key && d.provider === "google").reduce((s, d) => s + d.costUsd, 0);
    const claude = daily.filter((d) => d.day === key && d.provider === "claude").reduce((s, d) => s + d.costUsd, 0);
    return { key, label: `${key.slice(8, 10)}/${key.slice(5, 7)}`, google, claude };
  });
  const max = Math.max(...series.map((d) => d.google + d.claude), 0.000001);
  const labelEvery = days > 14 ? 5 : 1;

  return (
    <Panel className="overflow-hidden">
      <PanelTitle title="Gasto por dia" hint="Google em azul, Claude em roxo" />
      <div className="border-t border-line px-5 pb-4 pt-5">
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Gasto por dia no período">
          {series.map((d) => {
            const total = d.google + d.claude;
            return (
              <div key={d.key} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${d.label}: ${brl(total)}`}>
                <div className="flex w-full flex-col overflow-hidden rounded-t-[6px]" style={{ height: `${(total / max) * 100}%` }}>
                  <div className="bg-grape" style={{ flexGrow: d.claude }} />
                  <div className="bg-azure" style={{ flexGrow: d.google }} />
                </div>
                {total === 0 && <div className="h-0.5 w-full rounded-full bg-line-strong" />}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1.5">
          {series.map((d, i) => (
            <span key={d.key} className="min-w-0 flex-1 text-center text-[0.7rem] text-muted tabular">
              {i % labelEvery === 0 || i === series.length - 1 ? d.label : ""}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}
