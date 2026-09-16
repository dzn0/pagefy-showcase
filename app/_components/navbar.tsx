"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { Avatar, firstName } from "./avatar";
import { useAuth } from "./auth-provider";
import { SIGNUP_REQUEST, useLoginDialog } from "./login-dialog";
import { GoogleIcon } from "./google-icon";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

// Só o que existe: Tutoriais volta quando a página for feita.
const LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#precos", label: "Preços" },
  { href: "/#perguntas", label: "Perguntas" },
  { href: "/ajuda", label: "Ajuda" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { status, profile, signOut } = useAuth();
  const openLogin = useLoginDialog();
  const connecting = status === "connecting";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-line-strong/70 backdrop-blur-md transition-[background-color,box-shadow] duration-300 ${
        scrolled || open ? "bg-bg/90 shadow-[0_1px_12px_-6px_rgb(20_26_18/0.18)]" : "bg-bg/70"
      }`}
    >
      <nav className="mx-auto flex h-[4.75rem] max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Principal">
        <Link href="/" aria-label="Pagefy, página inicial" className="flex items-center rounded-md">
          <Logo className="gap-[9px]" markClassName="-ml-[5px] size-10" textClassName="text-[1.45rem] leading-none" />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3.5 py-2 text-[0.94rem] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {profile ? (
            <AccountMenu name={profile.name} email={profile.email} picture={profile.picture} onSignOut={signOut} />
          ) : (
            <>
              <button
                type="button"
                onClick={() => openLogin()}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.94rem] font-semibold text-ink transition-colors hover:bg-surface-2 disabled:opacity-60"
              >
                <GoogleIcon className="size-4" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => openLogin(SIGNUP_REQUEST)}
                disabled={connecting}
                className="rounded-full bg-ink px-4.5 py-2.5 text-[0.94rem] font-semibold text-bg transition-[transform,background-color] duration-200 hover:bg-ink-2 active:scale-[0.97] disabled:opacity-70"
              >
                {connecting ? "Conectando…" : "Começar grátis"}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-surface-2"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="menu-mobile" className="h-[calc(100dvh-4.75rem)] overflow-y-auto border-t border-line bg-bg px-5 pb-8 md:hidden">
          <ul className="flex flex-col py-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line py-4 font-display text-xl font-semibold tracking-[-0.02em] text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            {profile ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3">
                <span className="flex items-center gap-2.5">
                  <Avatar name={profile.name} picture={profile.picture} size={36} />
                  <span className="font-semibold text-ink">{firstName(profile.name)}</span>
                </span>
                <button type="button" onClick={signOut} className="text-[0.9rem] font-semibold text-muted underline underline-offset-4">
                  Sair
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openLogin(SIGNUP_REQUEST);
                  }}
                  disabled={connecting}
                  className="rounded-full bg-green py-3.5 text-center font-semibold text-on-green disabled:opacity-70"
                >
                  {connecting ? "Conectando…" : "Começar grátis"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    openLogin();
                  }}
                  disabled={connecting}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong py-3.5 text-center font-semibold text-ink disabled:opacity-70"
                >
                  <GoogleIcon className="size-4" />
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
