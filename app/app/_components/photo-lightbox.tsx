"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export type LightboxPhoto = {
  src: string;
  alt: string;
  author?: string | null;
  authorUrl?: string | null;
};

// Foto em tela cheia. <dialog> nativo: Esc fecha e o foco fica preso nele.
// Clicar em qualquer lugar fora da imagem (fundo, margem) também fecha.
export function PhotoLightbox({ photo, onClose }: { photo: LightboxPhoto | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = photo !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-lightbox-keep]")) onClose();
      }}
      aria-label={photo?.alt ?? "Foto"}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[#0b0c0d]/85 backdrop:backdrop-blur-[3px] open:animate-[fade-in_0.25s_var(--ease-out-expo)_both]"
    >
      {photo && (
        <div className="grid h-full w-full place-items-center p-4 sm:p-10">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Fechar foto"
            className="fixed right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/12 text-white transition-[background-color,transform] duration-200 hover:bg-white/22 active:scale-95 sm:right-6 sm:top-6"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <figure data-lightbox-keep className="relative max-h-full max-w-full animate-[zoom-in_0.35s_var(--ease-out-expo)_both]">
            {/* eslint-disable-next-line @next/next/no-img-element -- redirect pro Google; next/image não ajuda aqui */}
            <img
              src={photo.src}
              alt={photo.alt}
              className="block max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-2rem)] rounded-[16px] object-contain shadow-[0_24px_60px_-20px_rgb(0_0_0/0.7)] sm:max-h-[calc(100dvh-8rem)] sm:max-w-[calc(100vw-10rem)]"
            />
            {photo.author && (
              <figcaption className="absolute bottom-3 right-3 max-w-[80%] truncate rounded-full bg-black/60 px-3 py-1 text-[0.76rem] text-white">
                Foto:{" "}
                {photo.authorUrl ? (
                  <a href={photo.authorUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {photo.author}
                  </a>
                ) : (
                  photo.author
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </dialog>
  );
}
