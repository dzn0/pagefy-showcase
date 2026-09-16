"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar, firstName } from "./avatar";

// Chip de conta com um menuzinho (nome, e-mail, Sair). Usado no navbar do site
// e no topo do dashboard — clicar nunca sai direto, só abre as opções.
export function AccountMenu({
  name,
  email,
  picture,
  onSignOut,
}: {
  name: string;
  email: string;
  picture?: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-[0.94rem] font-semibold text-ink transition-colors hover:bg-surface-2"
      >
        <Avatar name={name} picture={picture} size={28} />
        <span className="hidden sm:inline">{firstName(name)}</span>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-200 ease-(--ease-out-expo) ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-frame">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <Avatar name={name} picture={picture} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-[0.9rem] font-semibold text-ink">{name}</span>
              <span className="block truncate text-[0.78rem] text-muted">{email}</span>
            </span>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[0.9rem] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
