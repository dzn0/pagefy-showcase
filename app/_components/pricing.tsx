"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Check, Rocket, Sparkles, Sprout, type LucideIcon } from "lucide-react";
import { useAuth } from "./auth-provider";
import { SIGNUP_REQUEST, useLoginDialog } from "./login-dialog";
import { revealDelay } from "@/lib/reveal";
import { CREDIT_PACKS, formatPrice, PLANS, SEMIANNUAL_DISCOUNT, type Plan } from "@/lib/plans";
import { FeatureText } from "./feature-text";

type Cycle = "monthly" | "semiannual";

// Mesmo ícone e cor de cada plano no app (/app/plano).
const PLAN_LOOK: Record<Plan["id"], { icon: LucideIcon; tile: string; check: string }> = {
  gratis: { icon: Sprout, tile: "bg-surface-2 text-ink-2", check: "text-green-ink" },
  inicio: { icon: Rocket, tile: "bg-azure-soft text-azure-ink", check: "text-azure-ink" },
  escala: { icon: Sparkles, tile: "bg-lime text-[#0d160b]", check: "text-lime" },
  agencia: { icon: Building2, tile: "bg-grape-soft text-grape-ink", check: "text-grape-ink" },
};

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <section id="precos" className="border-t border-line py-24 sm:py-28" aria-labelledby="precos-titulo">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div data-reveal className="max-w-2xl">
            <h2 id="precos-titulo" className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.6rem]">
              Busque grátis. Assine quando for gerar o primeiro site.
            </h2>
            <p className="mt-4 text-[1.04rem] leading-relaxed text-ink-2">
              Cada busca, site e edição com IA usa créditos, e o custo aparece antes de você confirmar.
            </p>
          </div>

          <div role="radiogroup" aria-label="Forma de cobrança" className="inline-flex w-fit rounded-full border border-line-strong bg-surface p-1">
            {(
              [
                ["monthly", "Mensal"],
                ["semiannual", "Semestral"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={cycle === value}
                onClick={() => setCycle(value)}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4.5 text-[0.92rem] font-semibold transition-colors duration-200 ${
                  cycle === value ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"
                }`}
              >
                {label}
                {value === "semiannual" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[0.7rem] ${
                      cycle === value ? "bg-lime text-[#0d160b]" : "bg-lime-soft text-green-ink"
                    }`}
                  >
                    −{SEMIANNUAL_DISCOUNT}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} cycle={cycle} delay={i * 90} />
          ))}
        </div>

        <p className="mt-6 text-[0.92rem] text-muted">
          Precisa de mais créditos sem assinar? Recargas a partir de {formatPrice(CREDIT_PACKS[0].price)}, sem mensalidade.
          {" "}Nada é ilimitado: cada busca, site e edição mostra o custo em créditos antes.
        </p>
      </div>
    </section>
  );
}

function paidButton(dark: boolean | undefined) {
  return dark ? "bg-lime text-[#0d160b] hover:brightness-105" : "border border-line-strong text-ink hover:border-ink/30";
}

function PlanCard({ plan, cycle, delay }: { plan: Plan; cycle: Cycle; delay: number }) {
  const price = plan.price[cycle];
  const dark = plan.highlight;
  const { status, profile } = useAuth();
  const openLogin = useLoginDialog();
  const connecting = status === "connecting";
  const isFree = plan.id === "gratis";
  const look = PLAN_LOOK[plan.id];

  return (
    <article
      data-reveal
      style={revealDelay(delay)}
      className={`relative flex flex-col rounded-[22px] p-6 ${
        dark ? "bg-forest text-white shadow-frame" : "border border-line bg-surface text-ink"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`grid size-10 place-items-center rounded-[12px] ${look.tile}`}>
          <look.icon className="size-[18px]" aria-hidden="true" />
        </span>
        {dark && <span className="rounded-full bg-lime px-2.5 py-1 text-[0.72rem] font-bold text-[#0d160b]">Recomendado</span>}
      </div>
      <h3 className="mt-4 text-[1.15rem] font-semibold tracking-[-0.02em]">{plan.name}</h3>
      <p className={`mt-1.5 min-h-[2.75em] text-[0.9rem] leading-snug ${dark ? "text-white/70" : "text-muted"}`}>{plan.summary}</p>

      <div className="mt-6 flex h-12 items-baseline gap-1.5">
        <span className="font-display text-[2.2rem] font-semibold tracking-[-0.04em] tabular">{formatPrice(price)}</span>
        <span className={`text-[0.9rem] ${dark ? "text-white/70" : "text-muted"}`}>{price === 0 ? "para sempre" : "/mês"}</span>
      </div>
      {/* Duas linhas reservadas: o Grátis tem uma só e desalinhava os botões. */}
      <p className={`min-h-[2.8em] text-[0.82rem] leading-snug ${dark ? "text-white/65" : "text-muted"}`}>
        {plan.id === "gratis"
          ? `${plan.credits} créditos de boas-vindas`
          : cycle === "monthly"
            ? `${plan.credits.toLocaleString("pt-BR")} créditos/mês · cobrado todo mês`
            : `${plan.credits.toLocaleString("pt-BR")} créditos/mês · ${formatPrice(price * 6)} a cada 6 meses`}
      </p>

      {isFree && profile ? (
        <span className="mt-4 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-surface-2 text-[0.94rem] font-semibold text-ink-2">
          <Check className="size-4 text-green-ink" aria-hidden="true" />
          Seu plano atual
        </span>
      ) : isFree ? (
        <button
          type="button"
          onClick={() => openLogin(SIGNUP_REQUEST)}
          disabled={connecting}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-green text-[0.94rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] disabled:opacity-70"
        >
          {connecting ? "Conectando…" : plan.cta}
        </button>
      ) : profile ? (
        // A assinatura acontece dentro do app, na tela de Créditos e plano.
        <Link href="/app/plano" className={`mt-4 inline-flex h-11 items-center justify-center rounded-full text-[0.94rem] font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97] ${paidButton(dark)}`}>
          {plan.cta}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => openLogin({ ...SIGNUP_REQUEST, redirectTo: "/app/plano" })}
          disabled={connecting}
          className={`mt-4 inline-flex h-11 items-center justify-center rounded-full text-[0.94rem] font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97] disabled:opacity-70 ${paidButton(dark)}`}
        >
          {connecting ? "Conectando…" : plan.cta}
        </button>
      )}

      <ul className={`mt-6 space-y-3 border-t pt-6 ${dark ? "border-white/15" : "border-line"}`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-[0.9rem] leading-snug">
            <Check className={`mt-0.5 size-4 shrink-0 ${look.check}`} aria-hidden="true" />
            <span className={dark ? "text-white/80" : "text-ink-2"}>
              <FeatureText text={feature} strongClassName={dark ? "text-white" : "text-ink"} />
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
