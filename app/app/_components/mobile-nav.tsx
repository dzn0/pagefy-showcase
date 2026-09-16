"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu as MoreIcon } from "lucide-react";
import { useAuth } from "@/app/_components/auth-provider";
import { HELP_NAV, MOBILE_TABS, SECONDARY_NAV } from "@/lib/dashboard-nav";
import { HUE } from "./ui";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-[4.75rem] items-stretch border-t border-line bg-bg/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Navegação principal"
      >
        {MOBILE_TABS.map(({ href, label, icon: Icon, hue }) => {
          const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[0.7rem] ${active ? "font-semibold text-ink" : "font-medium text-muted"}`}
            >
              <span
                className={`grid h-8 w-12 place-items-center rounded-full transition-colors duration-200 ${active ? HUE[hue].solid : HUE[hue].ink}`}
              >
                <Icon className="size-[19px]" aria-hidden="true" />
              </span>
              {label === "Buscar leads" ? "Buscar" : label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-muted"
        >
          <span className="grid h-8 w-12 place-items-center rounded-full text-ink-2">
            <MoreIcon className="size-[19px]" aria-hidden="true" />
          </span>
          Mais
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />
          <div
            role="menu"
            className="absolute inset-x-0 bottom-0 rounded-t-[24px] border-t border-line bg-bg p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" aria-hidden="true" />
            <ul className="space-y-1">
              {[...SECONDARY_NAV, ...HELP_NAV].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-[0.98rem] font-medium text-ink transition-colors hover:bg-surface-2"
                  >
                    <Icon className="size-5 text-ink-2" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[0.98rem] font-medium text-danger transition-colors hover:bg-surface-2"
            >
              <LogOut className="size-5" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      )}
    </>
  );
}
