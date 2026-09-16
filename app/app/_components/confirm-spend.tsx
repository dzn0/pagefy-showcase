"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Coins, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { Hue } from "@/lib/dashboard-nav";
import { HUE, HueTile } from "./ui";

// Toda ação que gasta créditos passa por aqui: os botões não mostram custo;
// este pop-up mostra o custo, o saldo de agora e o que sobra depois. Sem
// saldo suficiente, não deixa confirmar (e nunca mostra saldo negativo):
// explica o que falta e leva pra conseguir créditos.

export type SpendRequest = {
  title: string;
  description: string;
  cost: number;
  confirmLabel: string;
  icon: LucideIcon;
  hue: Hue;
  /**
   * Ressalva que a pessoa precisa ver ANTES de confirmar, e que se perde no
   * meio de um parágrafo (o download, por exemplo, não leva as fotos do
   * Google). Ganha um bloco próprio, em mel, acima do custo.
   */
  note?: string;
  onConfirm: () => void;
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR");
}

export function ConfirmSpend({ request, balance, onClose }: { request: SpendRequest | null; balance: number | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = request !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Saldo ainda desconhecido (servidor não respondeu): deixa confirmar. Quem
  // barra de verdade é o backend, que responde 402 quando não cobre.
  const enough = request ? balance === null || balance >= request.cost : false;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="confirm-spend-titulo"
      className="m-auto w-[min(92vw,420px)] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-frame backdrop:bg-[#0b0c0d]/55 backdrop:backdrop-blur-[2px] open:animate-[rise-in_0.3s_var(--ease-out-expo)_both]"
    >
      {request && (
        <div className="relative p-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <HueTile icon={request.icon} hue={request.hue} size="lg" />
          <h2 id="confirm-spend-titulo" className="mt-5 pr-8 text-[1.3rem] font-semibold leading-tight tracking-[-0.02em]">
            {request.title}
          </h2>
          <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-2">{request.description}</p>

          {request.note && (
            <p className="mt-4 flex gap-2.5 rounded-[18px] bg-honey-soft px-4 py-3 text-[0.9rem] leading-snug text-honey-ink">
              <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>{request.note}</span>
            </p>
          )}

          {/* Custo e saldo */}
          <dl className="mt-6 divide-y divide-line rounded-[18px] border border-line bg-surface-2/60">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="flex items-center gap-2 text-[0.9rem] text-ink-2">
                <Coins className={`size-4 ${HUE[request.hue].ink}`} aria-hidden="true" />
                Custo
              </dt>
              <dd className="font-display text-[1.05rem] font-semibold text-ink tabular">{fmt(request.cost)} créditos</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-[0.9rem] text-ink-2">Seu saldo agora</dt>
              <dd className="text-[0.98rem] font-semibold text-ink tabular">{balance === null ? "—" : `${fmt(balance)} créditos`}</dd>
            </div>
            {balance === null ? null : enough ? (
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-[0.9rem] text-ink-2">Depois desta ação</dt>
                <dd className="text-[0.98rem] font-semibold text-green-ink tabular">{fmt(balance - request.cost)} créditos</dd>
              </div>
            ) : (
              <div className="px-4 py-3">
                <dt className="sr-only">Saldo insuficiente</dt>
                <dd className="text-[0.9rem] leading-snug text-honey-ink">
                  Seu saldo não cobre esta ação. Faltam <strong className="font-semibold">{fmt(request.cost - balance)} créditos</strong>.
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              autoFocus={!enough}
              className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-5 text-[0.92rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
            >
              Cancelar
            </button>
            {enough ? (
              <button
                type="button"
                autoFocus
                onClick={() => {
                  request.onConfirm();
                  onClose();
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-green px-5 text-[0.92rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
              >
                {request.confirmLabel}
              </button>
            ) : (
              <Link
                href="/app/plano"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-green px-5 text-[0.92rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
              >
                Conseguir créditos <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
