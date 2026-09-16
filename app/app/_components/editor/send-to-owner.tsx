"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, LoaderCircle, X } from "lucide-react";
import { publicUrl } from "@/lib/site-publish";
import { fallbackPitch, writePitch } from "@/lib/site-pitch";
import { WhatsAppIcon, whatsappUrl } from "../whatsapp-link";

// "Enviar pro dono": a mensagem de WhatsApp com o link do site, escrita pela
// IA com o nome do comércio (sem custo em créditos). A pessoa lê, ajusta se
// quiser e abre a conversa já com o texto. Sem telefone no Google, só copia.
export function SendToOwner({
  open,
  business,
  slug,
  onSent,
  onClose,
}: {
  open: boolean;
  business: { name: string; kind: string | null; neighborhood: string | null; phone: string | null };
  /** Slug público do site (/p/<slug>). */
  slug: string;
  /** A mensagem saiu daqui (copiada ou aberta no WhatsApp): o lead vira "Contatado". */
  onSent: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // A mensagem fica com o slug dela: reabrir noutro site não mostra a anterior.
  const [pitch, setPitch] = useState<{ slug: string; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const url = publicUrl(slug);
  const ready = pitch?.slug === slug;
  const message = ready ? pitch.text : fallbackPitch(business.name, url);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Abriu: pede a mensagem (o backend guarda por comércio + link, então reabrir é instantâneo).
  useEffect(() => {
    if (!open || ready) return;
    const controller = new AbortController();
    void writePitch(business, url, controller.signal).then((text) => {
      if (!controller.signal.aborted) setPitch({ slug, text });
    });
    return () => controller.abort();
    // Uma vez por abertura deste site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, slug]);

  function copy() {
    void navigator.clipboard?.writeText(message).then(() => {
      setCopied(true);
      onSent();
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="enviar-dono-titulo"
      className="m-auto w-[min(92vw,480px)] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-frame backdrop:bg-[#0b0c0d]/55 backdrop:backdrop-blur-[2px] open:animate-[rise-in_0.3s_var(--ease-out-expo)_both]"
    >
      {open && (
        <div className="relative p-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <span className="grid size-12 place-items-center rounded-[14px] bg-[#25D366] text-[#05361a]" aria-hidden="true">
            <WhatsAppIcon className="size-6" />
          </span>
          <h2 id="enviar-dono-titulo" className="mt-5 pr-8 text-[1.3rem] font-semibold leading-tight tracking-[-0.02em]">
            Enviar para o dono
          </h2>
          <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-2">
            {business.phone
              ? `A conversa abre no WhatsApp ${business.phone} com esta mensagem. Ajuste como quiser antes de mandar.`
              : "O Google não tem o WhatsApp deste comércio. Copie a mensagem e mande pelo número que você tiver."}
          </p>

          <label htmlFor="pitch" className="mt-5 flex items-center gap-2 text-[0.84rem] font-semibold text-ink">
            Mensagem
            {open && !ready && <LoaderCircle className="size-3.5 animate-spin text-muted" aria-label="Escrevendo a mensagem" />}
          </label>
          <textarea
            id="pitch"
            value={message}
            onChange={(event) => setPitch({ slug, text: event.target.value })}
            rows={7}
            className="mt-2 block w-full resize-none rounded-[16px] border border-line-strong bg-bg px-4 py-3 text-[0.92rem] leading-relaxed text-ink outline-none transition-[border-color,box-shadow] duration-200 focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)]"
          />
          <p className="mt-2 text-[0.8rem] leading-snug text-muted">O link do site já está na mensagem. Nada é cobrado por isso.</p>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-[0.92rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2"
            >
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copiada" : "Copiar mensagem"}
            </button>
            {business.phone && (
              <a
                href={`${whatsappUrl(business.phone)}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  onSent();
                  onClose();
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-[0.92rem] font-semibold text-[#05361a] transition-[background-color,transform] duration-200 hover:bg-[#1fc05b] active:scale-[0.97]"
              >
                <WhatsAppIcon className="size-[18px]" />
                Abrir WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
