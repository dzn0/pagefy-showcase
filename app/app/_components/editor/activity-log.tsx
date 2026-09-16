"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, LoaderCircle } from "lucide-react";
import { formatDuration, type ActivityStep } from "@/lib/site-activity";

// O que a IA está fazendo, etapa por etapa (estilo Claude Code): as feitas
// com um check, a atual girando com o tempo correndo. Enquanto gera, mostra
// as últimas etapas; as anteriores ficam num "+N".
const VISIBLE = 6;

export function LiveActivity({ steps, startedAt }: { steps: ActivityStep[]; startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const hidden = Math.max(0, steps.length - VISIBLE);
  const shown = steps.slice(hidden);
  const current = shown[shown.length - 1];

  return (
    <div aria-live="polite" aria-label="Etapas da geração">
      <div className="mb-2 flex items-center justify-between gap-3 text-[0.76rem] text-muted">
        <span className="font-semibold">Trabalhando no site</span>
        <span className="font-mono tabular">{formatDuration(now - startedAt)}</span>
      </div>
      {hidden > 0 && <p className="mb-1 pl-6 text-[0.76rem] text-muted">+{hidden} etapas anteriores</p>}
      <ol className="space-y-1">
        {shown.length === 0 && <StepRow label="Começando…" active />}
        {shown.map((step) => (
          <StepRow key={step.id} label={step.label} active={step === current} />
        ))}
      </ol>
    </div>
  );
}

function StepRow({ label, active }: { label: string; active: boolean }) {
  return (
    <li className={`flex items-start gap-2 text-[0.84rem] leading-snug ${active ? "rise-in text-ink" : "text-muted"}`}>
      {active ? (
        <LoaderCircle className="mt-[1px] size-4 shrink-0 animate-spin text-grape-ink" aria-hidden="true" />
      ) : (
        <Check className="mt-[1px] size-4 shrink-0 text-green-ink" aria-hidden="true" />
      )}
      <span className={active ? "font-medium" : ""}>{label}</span>
    </li>
  );
}

/** Depois de pronto: as etapas guardadas na mensagem, recolhidas. */
export function DoneActivity({ steps, durationMs }: { steps: string[]; durationMs?: number }) {
  if (steps.length === 0) return null;
  return (
    <details className="group mt-2.5 border-t border-line pt-2">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[0.76rem] font-semibold text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
        {steps.length} {steps.length === 1 ? "etapa" : "etapas"}
        {durationMs ? <span className="font-mono font-normal tabular">· {formatDuration(durationMs)}</span> : null}
      </summary>
      <ol className="mt-2 space-y-1">
        {steps.map((label, i) => (
          <li key={i} className="flex items-start gap-2 text-[0.8rem] leading-snug text-muted">
            <Check className="mt-[1px] size-3.5 shrink-0 text-green-ink" aria-hidden="true" />
            {label}
          </li>
        ))}
      </ol>
    </details>
  );
}
