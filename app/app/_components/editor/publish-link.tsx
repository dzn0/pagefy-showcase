"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Globe, LoaderCircle, RotateCw } from "lucide-react";
import { publicUrl, publicUrlLabel } from "@/lib/site-publish";

// O link público do site, na barra de cima da mesa (ao lado de Computador /
// Celular). O próprio botão diz em que pé está: sem site ainda, publicando,
// deu erro (tentar de novo) ou publicado (copiar e abrir).
export type PublishState = "none" | "publishing" | "failed" | "published";

export function PublishLink({ state, slug, onRetry }: { state: PublishState; slug?: string; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);

  if (state === "published" && slug) {
    const url = publicUrl(slug);
    return (
      <div className="inline-flex h-11 min-w-0 max-w-full items-center rounded-full border border-line-strong bg-surface p-1">
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            });
          }}
          title="Copiar o link pra mandar ao dono"
          className={`inline-flex h-9 min-w-0 items-center gap-2 rounded-full px-3.5 transition-colors duration-200 ${
            copied ? "bg-lime-soft text-green-ink" : "text-ink hover:bg-surface-2"
          }`}
        >
          {copied ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Copy className="size-4 shrink-0" aria-hidden="true" />}
          <span className="truncate font-mono text-[0.76rem]">{copied ? "Link copiado" : publicUrlLabel(slug)}</span>
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir o site em outra aba"
          title="Abrir o site em outra aba"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-honey-soft px-4 text-[0.84rem] font-semibold text-honey-ink transition-[filter] hover:brightness-95"
      >
        <RotateCw className="size-4" aria-hidden="true" />
        Não publicou · Tentar de novo
      </button>
    );
  }

  return (
    <span
      className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-[0.84rem] text-muted"
      aria-live="polite"
    >
      {state === "publishing" ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {slug ? "Atualizando o link…" : "Publicando o link…"}
        </>
      ) : (
        <>
          <Globe className="size-4" aria-hidden="true" />
          O link aparece quando o site ficar pronto
        </>
      )}
    </span>
  );
}
