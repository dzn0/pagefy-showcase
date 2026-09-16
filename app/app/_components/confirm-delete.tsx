"use client";

import { useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";

// Confirmação antes de apagar um lead, um site ou uma venda: a ação não tem
// volta, então "Cancelar" é o padrão (foco inicial) e "Apagar" fica na cor de
// alerta.
const KINDS = {
  lead: { title: "o lead", button: "lead" },
  site: { title: "o site", button: "site" },
  venda: { title: "a venda de", button: "venda" },
} as const;

export function ConfirmDelete({
  target,
  kind,
  detail,
  onConfirm,
  onCancel,
}: {
  /** Nome do que vai ser apagado; null = fechado. */
  target: string | null;
  kind: keyof typeof KINDS;
  /** Uma linha sobre o que se perde junto. */
  detail: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = target !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      aria-labelledby="confirm-delete-titulo"
      className="m-auto w-[min(92vw,420px)] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-frame backdrop:bg-[#0b0c0d]/55 backdrop:backdrop-blur-[2px] open:animate-[rise-in_0.3s_var(--ease-out-expo)_both]"
    >
      {target !== null && (
        <div className="relative p-7">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <span className="grid size-12 place-items-center rounded-[14px] bg-berry-soft text-berry-ink">
            <Trash2 className="size-5" aria-hidden="true" />
          </span>
          <h2 id="confirm-delete-titulo" className="mt-5 text-[1.3rem] font-semibold leading-tight tracking-[-0.02em]">
            Apagar {KINDS[kind].title} {target}?
          </h2>
          <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-2">
            {detail} <strong className="font-semibold text-ink">Essa ação não pode ser desfeita.</strong>
          </p>
          <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              autoFocus
              className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-5 text-[0.92rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-berry px-5 text-[0.92rem] font-semibold text-on-hue transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.97]"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Apagar {KINDS[kind].button}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** X de apagar: aparece com hover/foco no card (classe `group`); sempre visível em telas de toque. */
export function DeleteButton({ label, onClick, className = "" }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-7 place-items-center rounded-full border border-line bg-surface/95 text-muted opacity-0 shadow-soft transition-[opacity,color,background-color] duration-200 hover:bg-berry-soft hover:text-berry-ink focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 ${className}`}
    >
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}
