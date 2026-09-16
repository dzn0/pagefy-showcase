"use client";

import { useEffect, useRef } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { HueTile } from "../ui";

// Confirmação do "Recriar site" no gerador: refazer uma seção inteira ou o
// site todo não cabe num ajuste, então vira a próxima versão do site do
// comércio ("Ernesto Café/Bar 2"), um site separado onde a pessoa faz o fluxo
// normal de site novo. O site atual não muda e nada é cobrado aqui.
export function ConfirmRecreate({
  open,
  nextTitle,
  currentTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** Nome da versão nova ("Ernesto Café/Bar 2"). */
  nextTitle: string;
  /** Nome do site aberto agora. */
  currentTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

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
      aria-labelledby="confirm-recreate-titulo"
      className="m-auto w-[min(92vw,440px)] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-frame backdrop:bg-[#0b0c0d]/55 backdrop:backdrop-blur-[2px] open:animate-[rise-in_0.3s_var(--ease-out-expo)_both]"
    >
      {open && (
        <div className="relative p-7">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <HueTile icon={RotateCcw} hue="grape" size="lg" />
          <h2 id="confirm-recreate-titulo" className="mt-5 pr-8 text-[1.3rem] font-semibold leading-tight tracking-[-0.02em]">
            Recriar o site do zero?
          </h2>
          <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-2">
            Refazer uma seção inteira ou o site todo é grande demais para um ajuste. Recriar abre{" "}
            <strong className="font-semibold text-ink">{nextTitle}</strong>, um site novo do mesmo comércio, onde você escreve o pedido como no
            primeiro site.
          </p>

          <ul className="mt-5 space-y-3 text-[0.9rem] leading-snug">
            <li className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime-soft text-green-ink">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-ink-2">
                <strong className="font-semibold text-ink">{currentTitle} fica como está,</strong> com o link e a conversa, na lista de Sites.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-lime-soft text-green-ink">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-ink-2">
                <strong className="font-semibold text-ink">Nada é cobrado agora.</strong> O preço aparece quando você enviar o pedido no site novo.
              </span>
            </li>
          </ul>

          <div className="mt-7 flex justify-end">
            <button type="button" autoFocus onClick={onConfirm} className="pf-magic h-11 w-full px-5 text-[0.92rem] sm:w-auto">
              <RotateCcw className="size-4" aria-hidden="true" />
              Recriar site
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
