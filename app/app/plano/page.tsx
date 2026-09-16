"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, apiPost } from "@/lib/api";
import { Building2, Check, CreditCard, Download, FlaskConical, Package, PenLine, Rocket, Search, Sparkles, Sprout, X, type LucideIcon } from "lucide-react";
import type { Hue } from "@/lib/dashboard-nav";
import { CREDIT_PACKS, formatPrice, PACK_VALIDITY_MONTHS, PLANS, SEMIANNUAL_DISCOUNT, type Plan } from "@/lib/plans";
import { CREDIT_COSTS, refreshCredits, setCredits, useBilling, useCredits, type Billing } from "@/lib/store/credits";
import { usePlan } from "@/lib/store/plan";
import { Badge, CreditMeter, HUE, HueTile, PageHeader, Panel } from "../_components/ui";
import { CheckoutSheet, type CheckoutItem } from "../_components/checkout-sheet";
import { FeatureText } from "@/app/_components/feature-text";

const PLAN_LOOK: Record<Plan["id"], { icon: LucideIcon; hue: Hue }> = {
  gratis: { icon: Sprout, hue: "neutral" },
  inicio: { icon: Rocket, hue: "azure" },
  escala: { icon: Sparkles, hue: "green" },
  agencia: { icon: Building2, hue: "grape" },
};

const ACTIONS: Array<{ icon: LucideIcon; hue: Hue; label: string; cost: number }> = [
  { icon: Search, hue: "azure", label: "Busca de comércios", cost: CREDIT_COSTS.search },
  { icon: Sparkles, hue: "grape", label: "Gerar um site", cost: CREDIT_COSTS.site },
  { icon: PenLine, hue: "coral", label: "Ajuste com IA (sobe se a conversa ficar longa)", cost: CREDIT_COSTS.edit },
  // Sem "e imagens": as fotos do Google não vão no .zip, e prometer isso aqui
  // vira frustração na hora de abrir o arquivo.
  { icon: Download, hue: "grape", label: "Baixar o site em arquivos (por versão)", cost: CREDIT_COSTS.export },
];

type Cycle = "monthly" | "semiannual";

type BuyBody = { kind: "plano"; plan: Plan["id"]; cycle: "mensal" | "semestral" } | { kind: "recarga"; credits: number };

async function postOrThrow(path: string, body: unknown, fallback: string) {
  const res = await apiPost(path, body);
  const data = (await res.json().catch(() => null)) as { credits?: number; invoiceUrl?: string | null; error?: string } | null;
  if (!res.ok) throw new Error(data?.error ?? fallback);
  return data ?? {};
}

// Comprar. No Asaas: o servidor cria a cobrança e devolve a fatura (Pix ou
// cartão), que abre numa aba nova; os créditos entram pelo webhook quando o
// pagamento é confirmado. No modo de teste, o servidor já soma na hora.
// Preço e créditos nunca saem daqui: só o que a pessoa escolheu.
async function buy(mode: Billing["mode"], body: BuyBody, document: string | undefined, tab: Window | null) {
  if (mode === "asaas") {
    const data = await postOrThrow("/pagamentos/checkout", { ...body, document }, "Não deu pra criar a cobrança agora.");
    if (!data.invoiceUrl) throw new Error("A cobrança foi criada, mas a fatura não veio. Tente de novo em instantes.");
    if (tab) tab.location.href = data.invoiceUrl;
    else window.location.href = data.invoiceUrl;
    return "aguardando" as const;
  }
  if (mode === "teste") {
    const data = await postOrThrow("/credits/teste", body, "Não deu pra concluir a compra de teste.");
    setCredits(data.credits);
    await refreshCredits();
    return "pronto" as const;
  }
  throw new Error("Pagamentos ainda não estão disponíveis.");
}

export default function PlanoPage() {
  const credits = useCredits();
  const currentPlan = usePlan();
  const billing = useBilling();
  const mode = billing?.mode ?? null;
  const [cycle, setCycle] = useState<Cycle>("monthly");
  // "Voltar ao Grátis" aguardando confirmação no pop-up.
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  // Compra aberta na folha de pagamento (plano pago ou recarga).
  const [checkout, setCheckout] = useState<CheckoutItem | null>(null);
  // Fatura aberta noutra aba: confere o saldo até o pagamento entrar.
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    void refreshCredits();
    // Voltou da fatura (o Asaas redireciona com ?pagamento=ok).
    if (new URLSearchParams(window.location.search).get("pagamento") === "ok") {
      const id = setTimeout(() => setWaiting(true), 0);
      return () => clearTimeout(id);
    }
  }, []);

  // Saldo quando a espera começou: mudou, o webhook creditou.
  const waitFrom = useRef<number | null>(null);
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    const id = setInterval(() => {
      tries++;
      void refreshCredits();
      if (tries >= 60) setWaiting(false);
    }, 4000);
    return () => clearInterval(id);
  }, [waiting]);

  useEffect(() => {
    if (!waiting) {
      waitFrom.current = null;
      return;
    }
    if (credits === null) return;
    if (waitFrom.current === null) waitFrom.current = credits;
    else if (credits !== waitFrom.current) {
      const id = setTimeout(() => setWaiting(false), 0);
      return () => clearTimeout(id);
    }
  }, [waiting, credits]);

  const paidUntil = billing?.paidUntil ? new Date(billing.paidUntil).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : null;
  const cycleName = cycle === "semiannual" ? "semestral" : "mensal";
  // Cancelou: o plano pago vale até o fim do período e a conta volta sozinha pro
  // Grátis. Sem isso a tela parecia não ter mudado nada depois de cancelar.
  const cancelled = currentPlan.id !== "gratis" && billing?.renewing === false;

  function askSubscribe(plan: Plan) {
    const toFree = plan.id === "gratis";
    if (toFree) {
      setPurchase({
        title: "Voltar ao plano Grátis?",
        description:
          mode === "asaas"
            ? `A assinatura para de cobrar.${paidUntil ? ` O plano ${currentPlan.name} continua valendo até ${paidUntil}` : " O plano atual vale até o fim do período pago"}, e o saldo que sobrar continua seu.`
            : "Seu saldo atual continua o mesmo. O Grátis não renova créditos.",
        confirmLabel: "Voltar ao Grátis",
        needsDocument: false,
        onConfirm: async () => {
          if (mode === "asaas") await postOrThrow("/pagamentos/cancelar", {}, "Não deu pra cancelar agora.");
          else await buy(mode, { kind: "plano", plan: "gratis", cycle: "mensal" }, undefined, null);
          await refreshCredits();
          return "pronto";
        },
      });
      return;
    }
    setCheckout({ kind: "plano", plan, cycle: cycleName });
  }

  function askPack(credits: number, price: number) {
    setCheckout({ kind: "recarga", credits, price });
  }
  const balance = credits ?? 0;
  const rende = [
    { hue: "azure" as Hue, value: Math.floor(balance / CREDIT_COSTS.search), one: "busca", many: "buscas" },
    { hue: "grape" as Hue, value: Math.floor(balance / CREDIT_COSTS.site), one: "site", many: "sites" },
    { hue: "coral" as Hue, value: Math.floor(balance / CREDIT_COSTS.edit), one: "edição", many: "edições" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader icon={CreditCard} hue="green" title="Créditos e plano" description="Seu saldo, quanto custa cada ação e como conseguir mais créditos." />

      {/* Saldo + custo das ações */}
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Panel className="flex flex-col p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.9rem] font-semibold text-ink-2">Saldo atual</p>
            <Badge hue="neutral">
              plano {currentPlan.name}
              {currentPlan.id !== "gratis" && paidUntil && !billing?.renewing ? ` · até ${paidUntil}` : ""}
            </Badge>
          </div>
          {waiting && (
            <p role="status" className="mt-4 flex items-center gap-2.5 rounded-[14px] bg-azure-soft px-3.5 py-2.5 text-[0.86rem] leading-snug text-azure-ink">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-current" aria-hidden="true" />
              Esperando o pagamento. Com Pix, os créditos entram em segundos depois de pagar.
            </p>
          )}
          <p className="mt-3 font-display text-[3rem] font-semibold leading-none tracking-[-0.04em] text-ink tabular">
            {credits === null ? "–" : credits.toLocaleString("pt-BR")}
            {/* Recarga soma no saldo, não na franquia: 610 / 600. */}
            <span className="ml-2 text-[1.05rem] font-medium tracking-normal text-muted">
              / {currentPlan.credits.toLocaleString("pt-BR")} créditos
            </span>
          </p>
          <CreditMeter value={balance} max={currentPlan.credits} className="mt-5 max-w-sm" />
          <p className="mt-5 text-[0.84rem] font-semibold text-ink-2">Seu saldo rende</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {rende.map((item, i) => (
              <span key={item.one} className="inline-flex items-center gap-2 text-[0.9rem] text-ink-2">
                {i > 0 && <span className="text-muted">ou</span>}
                <span className={`rounded-full px-3 py-1 font-semibold tabular ${HUE[item.hue].soft} ${HUE[item.hue].ink}`}>
                  {item.value} {item.value === 1 ? item.one : item.many}
                </span>
              </span>
            ))}
          </div>
          <RecentMoves balance={credits} />
        </Panel>

        <Panel className="p-6 sm:p-7">
          <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">Quanto custa cada ação</h2>
          <p className="mt-1 text-[0.86rem] text-muted">O custo aparece antes de você confirmar. Publicar e mandar o link é grátis.</p>
          <ul className="mt-5 divide-y divide-line">
            {ACTIONS.map((action) => (
              <li key={action.label} className="flex items-center gap-3 py-3">
                <HueTile icon={action.icon} hue={action.hue} size="sm" />
                <span className="flex-1 text-[0.94rem] font-medium text-ink">{action.label}</span>
                <span className="font-display text-[1.15rem] font-semibold text-ink tabular">{action.cost}</span>
                <span className="w-14 text-[0.82rem] text-muted">créditos</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Planos mensais */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">Planos</h2>
            <p className="mt-0.5 text-[0.88rem] text-muted">Créditos todo mês, mais baratos por crédito. Pra quem busca e vende com frequência.</p>
          </div>
          <div role="radiogroup" aria-label="Forma de cobrança" className="inline-flex rounded-full border border-line-strong bg-surface p-1">
            {(
              [
                ["monthly", "Mensal"],
                ["semiannual", `Semestral −${SEMIANNUAL_DISCOUNT}%`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={cycle === value}
                onClick={() => setCycle(value)}
                className={`h-9 rounded-full px-4 text-[0.86rem] font-semibold transition-colors duration-200 ${cycle === value ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const look = PLAN_LOOK[plan.id];
            const current = plan.id === currentPlan.id;
            const pendingFree = cancelled && plan.id === "gratis";
            const price = plan.price[cycle];
            const dark = plan.highlight;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[22px] p-5 ${
                  dark ? "border border-transparent bg-forest text-white shadow-frame" : `border border-line bg-surface text-ink shadow-card ${current ? "ring-2 ring-line-strong" : ""}`
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {dark ? (
                    <span className="grid size-10 place-items-center rounded-[12px] bg-lime text-[#0d160b]">
                      <look.icon className="size-[18px]" aria-hidden="true" />
                    </span>
                  ) : (
                    <HueTile icon={look.icon} hue={look.hue} />
                  )}
                  {current ? (
                    <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${dark ? "bg-white/15 text-white" : "bg-surface-2 text-ink-2"}`}>
                      {cancelled ? "Cancelado" : "Seu plano"}
                    </span>
                  ) : (
                    dark && <span className="rounded-full bg-lime px-2.5 py-1 text-[0.72rem] font-bold text-[#0d160b]">Recomendado</span>
                  )}
                </div>
                <p className="mt-4 text-[1.05rem] font-semibold">{plan.name}</p>
                {/* Duas linhas reservadas no resumo e na cobrança: preço e vantagens começam na mesma altura nos quatro cartões. */}
                <p className={`mt-1 min-h-[2.75em] text-[0.84rem] leading-snug ${dark ? "text-white/72" : "text-muted"}`}>{plan.summary}</p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-[1.9rem] font-semibold tracking-[-0.035em] tabular">{formatPrice(price)}</span>
                  {price > 0 && <span className={`text-[0.84rem] ${dark ? "text-white/70" : "text-muted"}`}>/mês</span>}
                </p>
                <p className={`mt-0.5 min-h-[2.75em] text-[0.8rem] leading-snug ${dark ? "text-white/70" : "text-muted"}`}>
                  {price === 0
                    ? "Pra sempre, sem cartão de crédito."
                    : cycle === "semiannual"
                      ? `${formatPrice(price * 6)} a cada 6 meses. Cancele quando quiser.`
                      : "Cobrado todo mês. Cancele quando quiser."}
                </p>
                <ul className={`mb-5 mt-4 space-y-2.5 border-t pt-4 ${dark ? "border-white/15" : "border-line"}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex gap-2 text-[0.84rem] leading-snug ${dark ? "text-white/80" : "text-ink-2"}`}>
                      <Check
                        className={`mt-0.5 size-3.5 shrink-0 ${dark ? "text-lime" : look.hue === "neutral" ? "text-green-ink" : HUE[look.hue].ink}`}
                        aria-hidden="true"
                      />
                      <span>
                        <FeatureText text={feature} strongClassName={dark ? "text-white" : "text-ink"} />
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={current || pendingFree}
                  onClick={() => askSubscribe(plan)}
                  className={`mt-auto inline-flex h-10 items-center justify-center rounded-full text-[0.86rem] font-semibold transition-[background-color,border-color,transform,filter] duration-200 active:scale-[0.97] disabled:cursor-default disabled:active:scale-100 ${
                    current || pendingFree
                      ? dark
                        ? "bg-white/10 text-white/80"
                        : "bg-surface-2 text-muted"
                      : dark
                        ? "bg-lime text-[#0d160b] hover:brightness-105"
                        : "border border-line-strong text-ink hover:border-ink/30 hover:bg-surface-2"
                  }`}
                >
                  {current
                    ? cancelled
                      ? paidUntil
                        ? `Vale até ${paidUntil}`
                        : "Cancelado"
                      : "Plano atual"
                    : pendingFree
                      ? paidUntil
                        ? `Volta em ${paidUntil}`
                        : "Volta no fim do período"
                      : plan.id === "gratis"
                        ? "Voltar ao Grátis"
                        : plan.cta}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[0.8rem] leading-relaxed text-muted">
          Site novo = {CREDIT_COSTS.site} créditos; cada ajuste com IA, a partir de {CREDIT_COSTS.edit}.
          Todo mês a franquia do plano soma ao saldo, e o que sobra acumula.
        </p>
      </section>

      {/* Recargas de créditos */}
      <section>
        <div className="mb-4">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">Recargas</h2>
          <p className="mt-0.5 text-[0.88rem] text-muted">
            Créditos extras sem mensalidade, válidos por {PACK_VALIDITY_MONTHS} meses. Somam ao saldo mesmo acima do limite do seu plano.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack, i) => (
            <Panel key={pack.credits} className="flex items-center gap-4 p-5">
              <HueTile icon={Package} hue={i === 2 ? "honey" : "neutral"} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[1.3rem] font-semibold leading-tight tracking-[-0.02em] text-ink tabular">
                  {pack.credits.toLocaleString("pt-BR")} <span className="text-[0.9rem] font-medium tracking-normal text-muted">créditos</span>
                </p>
                <p className="text-[0.8rem] text-muted">Pagamento único</p>
              </div>
              <button
                type="button"
                onClick={() => askPack(pack.credits, pack.price)}
                className="inline-flex h-10 shrink-0 items-center rounded-full bg-ink px-4 text-[0.88rem] font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97]"
              >
                {formatPrice(pack.price)}
              </button>
            </Panel>
          ))}
        </div>
      </section>

      <PurchaseDialog purchase={purchase} mode={mode} onClose={() => setPurchase(null)} onWaiting={() => setWaiting(true)} />
      <CheckoutSheet item={checkout} billing={billing} balance={credits} onClose={() => setCheckout(null)} onWaiting={() => setWaiting(true)} />
    </div>
  );
}

type Move = { id: string; amount: number; reason: string; createdAt: string };

const MOVE_LABEL: Record<string, string> = {
  boas_vindas: "Boas-vindas",
  renovacao: "Renovação do plano",
  recarga: "Recarga",
  busca: "Busca de comércios",
  site: "Site gerado",
  edicao: "Ajuste com IA",
  ajuste: "Ajuste com IA",
  download: "Download do site",
};

// Últimas entradas e saídas (extrato do servidor). Recarrega quando o saldo
// muda, pra compra ou cobrança aparecer na hora.
function RecentMoves({ balance }: { balance: number | null }) {
  const [moves, setMoves] = useState<Move[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/credits/extrato", { signal: controller.signal, cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ entries: Move[] }>) : { entries: [] }))
      .then((data) => setMoves(data.entries.slice(0, 4)))
      .catch(() => {});
    return () => controller.abort();
  }, [balance]);

  return (
    <div className="mt-auto pt-6">
      <p className="border-t border-line pt-5 text-[0.84rem] font-semibold text-ink-2">Últimas movimentações</p>
      {moves === null ? (
        <div className="mt-3 space-y-2.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded-full bg-surface-2" />
          ))}
        </div>
      ) : moves.length === 0 ? (
        <p className="mt-2 text-[0.86rem] text-muted">Nada por aqui ainda. Cada busca, site e recarga aparece nesta lista.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {moves.map((move) => (
            <li key={move.id} className="flex items-center gap-3 py-2.5 text-[0.88rem]">
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{MOVE_LABEL[move.reason] ?? "Movimento"}</span>
              <span className="text-[0.8rem] text-muted tabular">
                {new Date(move.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </span>
              <span className={`w-16 text-right font-semibold tabular ${move.amount > 0 ? "text-green-ink" : "text-ink"}`}>
                {move.amount > 0 ? "+" : "−"}
                {Math.abs(move.amount).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Purchase = {
  title: string;
  description: string;
  confirmLabel: string;
  /** Primeira compra no Asaas: pede CPF/CNPJ (vai só pro Asaas, pra emitir a cobrança). */
  needsDocument: boolean;
  onConfirm: (document: string | undefined, tab: Window | null) => Promise<"pronto" | "aguardando">;
};

// Confirmação de compra. No Asaas, o pagamento acontece na fatura dele (aba
// nova); no modo de teste (ALLOW_TEST_PURCHASES), nada é cobrado e o pop-up avisa.
function PurchaseDialog({
  purchase,
  mode,
  onClose,
  onWaiting,
}: {
  purchase: Purchase | null;
  mode: Billing["mode"];
  onClose: () => void;
  onWaiting: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = purchase !== null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState("");
  const docDigits = document.replace(/[^0-9a-zA-Z]/g, "");
  const docMissing = Boolean(purchase?.needsDocument) && docDigits.length !== 11 && docDigits.length !== 14;

  function close() {
    setError(null);
    onClose();
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) close();
      }}
      aria-labelledby="test-purchase-titulo"
      className="m-auto w-[min(92vw,420px)] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-frame backdrop:bg-[#0b0c0d]/55 backdrop:backdrop-blur-[2px] open:animate-[rise-in_0.3s_var(--ease-out-expo)_both]"
    >
      {purchase && (
        <div className="relative p-7">
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <HueTile icon={CreditCard} hue="green" size="lg" />
          <h2 id="test-purchase-titulo" className="mt-5 pr-8 text-[1.3rem] font-semibold leading-tight tracking-[-0.02em]">
            {purchase.title}
          </h2>
          <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-2">{purchase.description}</p>
          {purchase.needsDocument && (
            <label className="mt-5 block">
              <span className="text-[0.86rem] font-semibold text-ink-2">CPF ou CNPJ de quem paga</span>
              <input
                value={document}
                onChange={(event) => setDocument(event.target.value)}
                inputMode="text"
                autoComplete="off"
                maxLength={18}
                placeholder="000.000.000-00"
                className="mt-1.5 h-11 w-full rounded-[12px] border border-line-strong bg-surface px-3.5 text-[0.95rem] text-ink tabular outline-none transition-colors focus:border-ink/40"
              />
              <span className="mt-1.5 block text-[0.78rem] leading-snug text-muted">Só pra emitir a cobrança e a nota. Fica com o Asaas, não no Pagefy, e é pedido uma vez só.</span>
            </label>
          )}
          {mode === "asaas" ? (
            <p className="mt-4 flex items-start gap-2.5 rounded-[14px] bg-surface-2 px-3.5 py-3 text-[0.86rem] leading-snug text-ink-2">
              <CreditCard className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Você paga com Pix ou cartão na página segura do Asaas, que abre numa aba nova. Os créditos entram assim que o pagamento é confirmado.
            </p>
          ) : (
            <p className="mt-4 flex items-start gap-2.5 rounded-[14px] bg-azure-soft px-3.5 py-3 text-[0.86rem] leading-snug text-azure-ink">
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Modo de teste: nada é cobrado. O pagamento de verdade entra no lançamento.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-[14px] bg-coral-soft px-3.5 py-3 text-[0.86rem] leading-snug text-coral-ink">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-5 text-[0.92rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              autoFocus
              disabled={busy || docMissing}
              onClick={async () => {
                setBusy(true);
                setError(null);
                // A aba da fatura abre já no clique (depois de esperar o servidor, o navegador bloquearia o pop-up).
                const opensTab = mode === "asaas" && purchase.confirmLabel.startsWith("Pagar");
                const tab = opensTab ? window.open("about:blank", "_blank") : null;
                try {
                  const result = await purchase.onConfirm(purchase.needsDocument ? document : undefined, tab);
                  if (result === "aguardando") onWaiting();
                  close();
                } catch (err) {
                  tab?.close();
                  setError(err instanceof Error ? err.message : "Não deu pra concluir a compra.");
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-green px-5 text-[0.92rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] disabled:opacity-60"
            >
              {purchase.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
