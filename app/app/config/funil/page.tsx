"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Filter, KeyRound, LoaderCircle, TrendingDown } from "lucide-react";
import { useAuth } from "@/app/_components/auth-provider";
import { loadAdminKey, saveAdminKey } from "@/lib/admin";
import { API_URL } from "@/lib/api";
import { HUE, HueTile, PageHeader, Panel } from "../../_components/ui";
import type { Hue } from "@/lib/dashboard-nav";

// Onde o funil vaza (backend /admin/funil). A tela de Custos diz quanto cada
// ação custa; esta diz quantas pessoas chegam até ela. São as duas metades da
// mesma pergunta — se vale a pena comprar tráfego.
//
// A conta é por coorte: cada pessoa entra na semana em que criou a conta, e os
// passos seguintes contam quando aconteceram, mesmo que semanas depois. Somar
// "os últimos 30 dias" misturaria quem entrou ontem com quem entrou no mês
// passado e faria toda taxa parecer pior do que é.

type Janela = "30d" | "90d" | "tudo";

type Funil = {
  janela: Janela;
  desde: string;
  topo: { visitantes: number; cadastraram: number };
  etapas: {
    contas: number;
    buscaram: number;
    buscaram2mais: number;
    checkout: number;
    geraram: number;
    pagaram: number;
    venderam: number;
  };
  canais: Array<{ canal: string; contas: number; geraram: number; pagaram: number }>;
  semanas: Array<{ semana: string; contas: number; geraram: number; pagaram: number }>;
  medianaHoras: { ateSite: number | null; atePagar: number | null };
  eventos: Array<{ nome: string; total: number }>;
};

const JANELAS: Array<{ id: Janela; label: string }> = [
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "tudo", label: "Tudo" },
];

const EVENTO_LABELS: Record<string, string> = {
  landing_vista: "Landing vista",
  cadastro_iniciado: "Clicou pra criar conta",
  login_aberto: "Pop-up do Google aberto",
  checkout_aberto: "Checkout aberto",
  checkout_pix_gerado: "QR Code do Pix gerado",
  checkout_cartao_recusado: "Cartão recusado",
  checkout_abandonado: "Fechou sem pagar",
};

const int = (value: number) => value.toLocaleString("pt-BR");
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const pctLabel = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "–";

/** Horas viram a unidade que a pessoa usaria pra falar disso em voz alta. */
function duracao(horas: number | null) {
  if (horas === null) return "–";
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`;
  return `${(horas / 24).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;
}

export default function FunilPage() {
  const { profile } = useAuth();
  const [key, setKey] = useState(loadAdminKey);
  const [janela, setJanela] = useState<Janela>("30d");
  const [data, setData] = useState<Funil | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (adminKey: string, qual: Janela) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/funil?janela=${qual}`, { headers: { "x-admin-key": adminKey } });
      const body = (await res.json().catch(() => null)) as (Funil & { error?: string }) | null;
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
    const id = setTimeout(() => void load(key, janela), 0);
    return () => clearTimeout(id);
  }, [key, janela, load]);

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
        icon={Filter}
        hue="azure"
        title="Funil"
        description="De quem chega, quantos passam por cada etapa até pagar — e por qual canal vieram. Cada pessoa conta na semana em que criou a conta."
        action={key ? <JanelaToggle value={janela} onChange={setJanela} disabled={loading} /> : null}
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
          <p role="alert" className="text-[0.95rem] text-ink-2">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void load(key, janela)}
            className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Tentar de novo
          </button>
        </Panel>
      ) : !data ? (
        <Panel className="flex items-center gap-3 p-6 text-[0.92rem] text-muted">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Montando o funil…
        </Panel>
      ) : (
        <Relatorio data={data} loading={loading} />
      )}
    </div>
  );
}

type Etapa = { label: string; hint: string; valor: number; hue: Hue };

function Relatorio({ data, loading }: { data: Funil; loading: boolean }) {
  const e = data.etapas;
  const etapas: Etapa[] = [
    { label: "Criou conta", hint: "cadastros no período", valor: e.contas, hue: "neutral" },
    { label: "Fez uma busca", hint: "usou a primeira busca", valor: e.buscaram, hue: "azure" },
    { label: "Buscou de novo", hint: "duas ou mais buscas", valor: e.buscaram2mais, hue: "azure" },
    { label: "Abriu o checkout", hint: "viu o preço na frente", valor: e.checkout, hue: "honey" },
    { label: "Pagou", hint: "plano ou recarga creditado", valor: e.pagaram, hue: "green" },
    { label: "Gerou um site", hint: "a parte que só o Pagefy faz", valor: e.geraram, hue: "grape" },
    { label: "Registrou uma venda", hint: "fechou com um comércio", valor: e.venderam, hue: "coral" },
  ];

  // A maior queda é o que a tela precisa gritar: é onde o próximo real gasto
  // rende mais. Comparada em pontos percentuais perdidos, não em pessoas, pra
  // uma etapa lá embaixo não parecer ótima só por ter pouca gente sobrando.
  let piorIndice = -1;
  let piorQueda = -1;
  etapas.forEach((etapa, i) => {
    if (i === 0) return;
    const anterior = etapas[i - 1]!.valor;
    if (anterior === 0) return;
    const queda = 100 - pct(etapa.valor, anterior);
    if (queda > piorQueda) {
      piorQueda = queda;
      piorIndice = i;
    }
  });

  return (
    <div className={`space-y-6 transition-opacity duration-200 ${loading ? "opacity-60" : ""}`}>
      <Topo topo={data.topo} contas={e.contas} />

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">Depois da conta</h2>
          <p className="text-[0.82rem] text-muted">
            % da etapa anterior · {int(e.contas)} {e.contas === 1 ? "conta" : "contas"} na janela
          </p>
        </div>

        <ol className="mt-5 space-y-1">
          {etapas.map((etapa, i) => (
            <FunilLinha
              key={etapa.label}
              etapa={etapa}
              topo={etapas[0]!.valor}
              anterior={i === 0 ? null : etapas[i - 1]!.valor}
              pior={i === piorIndice}
            />
          ))}
        </ol>

        <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
          <Mediana label="Do cadastro ao primeiro site" valor={duracao(data.medianaHoras.ateSite)} />
          <Mediana label="Do cadastro ao primeiro pagamento" valor={duracao(data.medianaHoras.atePagar)} />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Canais canais={data.canais} />
        <Semanas semanas={data.semanas} />
      </div>

      <Eventos eventos={data.eventos} desde={data.desde} />
    </div>
  );
}

/**
 * O topo é medido por cookie de visitante, e só existe desde que a
 * instrumentação entrou. As contas criadas antes disso não têm visita
 * registrada, então a taxa aqui sai menor do que a real enquanto as duas
 * fontes não cobrirem o mesmo período. A tela diz isso em vez de esconder.
 */
function Topo({ topo, contas }: { topo: { visitantes: number; cadastraram: number }; contas: number }) {
  const parcial = topo.visitantes > 0 && topo.cadastraram < contas;
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">Antes da conta</h2>
      {topo.visitantes === 0 ? (
        <p className="mt-2 max-w-[62ch] text-[0.9rem] leading-relaxed text-muted">
          Nenhuma visita registrada ainda. O topo começa a contar quando alguém abre a landing com esta versão no ar.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="font-display text-[2.2rem] font-semibold leading-none tracking-[-0.035em] text-ink tabular">
                {int(topo.visitantes)}
              </p>
              <p className="mt-1.5 text-[0.86rem] text-muted">viram a landing</p>
            </div>
            <div className="flex items-center gap-3">
              <TrendingDown className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <p className="font-display text-[2.2rem] font-semibold leading-none tracking-[-0.035em] text-ink tabular">
                  {pctLabel(topo.cadastraram, topo.visitantes)}
                </p>
                <p className="mt-1.5 text-[0.86rem] text-muted">criaram conta ({int(topo.cadastraram)})</p>
              </div>
            </div>
          </div>
          {parcial && (
            <p className="mt-4 max-w-[62ch] text-[0.82rem] leading-relaxed text-muted">
              Só as visitas registradas desde que esta medição entrou no ar contam aqui. Enquanto houver contas criadas antes disso, esta taxa
              sai menor do que a real.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

function FunilLinha({ etapa, topo, anterior, pior }: { etapa: Etapa; topo: number; anterior: number | null; pior: boolean }) {
  const largura = topo > 0 ? Math.max(pct(etapa.valor, topo), etapa.valor > 0 ? 2 : 0) : 0;
  const hue = HUE[etapa.hue];
  return (
    <li className="relative">
      {anterior !== null && (
        <p className={`flex items-center gap-1.5 py-1 pl-1 text-[0.78rem] font-semibold ${pior ? "text-coral-ink" : "text-muted"}`}>
          <TrendingDown className="size-3.5" aria-hidden="true" />
          {anterior > 0
            ? `${(100 - pct(etapa.valor, anterior)).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% param aqui`
            : "sem base"}
          {pior && <span className="font-medium text-coral-ink/80">· maior queda</span>}
        </p>
      )}
      <div className="relative overflow-hidden rounded-[14px] bg-surface-2">
        <div
          className={`absolute inset-y-0 left-0 ${hue.soft} transition-[width] duration-500 ease-[var(--ease-out-expo)]`}
          style={{ width: `${largura}%` }}
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[0.94rem] font-semibold text-ink">{etapa.label}</p>
            <p className="truncate text-[0.8rem] text-muted">{etapa.hint}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-[1.25rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular">{int(etapa.valor)}</p>
            {anterior !== null && <p className="mt-1 text-[0.78rem] font-semibold text-ink-2 tabular">{pctLabel(etapa.valor, anterior)}</p>}
          </div>
        </div>
      </div>
    </li>
  );
}

function Mediana({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-[14px] bg-surface-2 px-4 py-3">
      <p className="text-[0.82rem] text-muted">{label}</p>
      <p className="mt-1 font-display text-[1.3rem] font-semibold leading-none tracking-[-0.03em] text-ink tabular">{valor}</p>
    </div>
  );
}

const CANAL_LABELS: Record<string, string> = {
  direto: "Direto (digitou ou salvou)",
};

function Canais({ canais }: { canais: Funil["canais"] }) {
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">Por canal</h2>
      <p className="mt-1 text-[0.86rem] leading-relaxed text-muted">
        O <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.78rem]">utm_source</code> do link, gravado na primeira visita.
        É o que diz qual campanha desligar.
      </p>
      {canais.length === 0 ? (
        <p className="mt-5 text-[0.9rem] text-muted">Nenhuma conta na janela.</p>
      ) : (
        <table className="mt-5 w-full text-[0.88rem]">
          <thead>
            <tr className="border-b border-line text-left text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-muted">
              <th className="pb-2">Canal</th>
              <th className="pb-2 text-right">Contas</th>
              <th className="pb-2 text-right">Pagaram</th>
              <th className="pb-2 text-right">Taxa</th>
            </tr>
          </thead>
          <tbody>
            {canais.map((row) => (
              <tr key={row.canal} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3 font-medium text-ink">{CANAL_LABELS[row.canal] ?? row.canal}</td>
                <td className="py-2.5 text-right text-ink-2 tabular">{int(row.contas)}</td>
                <td className="py-2.5 text-right text-ink-2 tabular">{int(row.pagaram)}</td>
                <td className="py-2.5 text-right font-semibold text-ink tabular">{pctLabel(row.pagaram, row.contas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function Semanas({ semanas }: { semanas: Funil["semanas"] }) {
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">Semana a semana</h2>
      <p className="mt-1 text-[0.86rem] leading-relaxed text-muted">
        Cada linha é a turma que entrou naquela semana. A mais recente ainda não teve tempo de pagar — não compare com ela.
      </p>
      {semanas.length === 0 ? (
        <p className="mt-5 text-[0.9rem] text-muted">Nenhuma conta na janela.</p>
      ) : (
        <table className="mt-5 w-full text-[0.88rem]">
          <thead>
            <tr className="border-b border-line text-left text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-muted">
              <th className="pb-2">Entraram em</th>
              <th className="pb-2 text-right">Contas</th>
              <th className="pb-2 text-right">Sites</th>
              <th className="pb-2 text-right">Pagaram</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((row, i) => (
              <tr key={row.semana} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3 font-medium text-ink tabular">
                  {new Date(`${row.semana}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  {i === semanas.length - 1 && <span className="ml-2 text-[0.78rem] font-normal text-muted">em curso</span>}
                </td>
                <td className="py-2.5 text-right text-ink-2 tabular">{int(row.contas)}</td>
                <td className="py-2.5 text-right text-ink-2 tabular">{int(row.geraram)}</td>
                <td className="py-2.5 text-right font-semibold text-ink tabular">{int(row.pagaram)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/** Contagem crua, pra saber se a medição está viva antes de confiar no resto. */
function Eventos({ eventos, desde }: { eventos: Funil["eventos"]; desde: string }) {
  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">Eventos registrados</h2>
      <p className="mt-1 text-[0.86rem] text-muted">
        Desde {new Date(desde).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}. Um zero onde devia haver número é problema de
        medição, não de produto.
      </p>
      {eventos.length === 0 ? (
        <p className="mt-5 text-[0.9rem] text-muted">Nada registrado ainda.</p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-2">
          {eventos.map((evento) => (
            <li key={evento.nome} className="inline-flex items-center gap-2 rounded-full bg-surface-2 py-1.5 pl-3.5 pr-2.5 text-[0.84rem]">
              <span className="text-ink-2">{EVENTO_LABELS[evento.nome] ?? evento.nome}</span>
              <span className="rounded-full bg-surface px-2 py-0.5 font-semibold text-ink tabular">{int(evento.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function JanelaToggle({ value, onChange, disabled }: { value: Janela; onChange: (janela: Janela) => void; disabled: boolean }) {
  return (
    <div role="radiogroup" aria-label="Janela" className="inline-flex rounded-full border border-line-strong bg-surface p-1">
      {JANELAS.map((option) => {
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
      <HueTile icon={KeyRound} hue="azure" />
      <h2 className="mt-4 text-[1.1rem] font-semibold tracking-[-0.02em] text-ink">Chave de admin</h2>
      <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">
        A mesma <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8rem]">ADMIN_KEY</code> da tela de Custos. Ela fica
        guardada só neste navegador.
      </p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ADMIN_KEY"
          autoComplete="off"
          className="h-11 flex-1 rounded-full border border-line-strong bg-surface px-4 text-[0.92rem] text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-azure"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-[0.9rem] font-semibold text-bg transition-transform duration-200 active:scale-[0.97]"
        >
          Abrir
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-[0.86rem] text-coral-ink">{error}</p>}
    </Panel>
  );
}
