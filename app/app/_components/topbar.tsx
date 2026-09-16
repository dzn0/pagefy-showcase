"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Sparkles } from "lucide-react";
import { AccountMenu } from "@/app/_components/account-menu";
import { useAuth } from "@/app/_components/auth-provider";
import { ThemeToggle } from "@/app/_components/theme-toggle";
import { isFocusRoute } from "@/lib/dashboard-nav";
import { useCredits } from "@/lib/store/credits";

export function Topbar() {
  const { profile, signOut } = useAuth();
  const credits = useCredits();
  const focus = isFocusRoute(usePathname());

  if (!profile) return null;

  return (
    <header className={`sticky top-0 z-20 flex h-[4.75rem] items-center gap-3 border-b border-line bg-bg/90 px-5 backdrop-blur-md sm:px-8 ${focus ? "md:pl-[calc(5rem+2rem)]" : "md:pl-[calc(16rem+2rem)]"}`}>
      <span className="inline-flex items-center gap-2 rounded-full bg-lime-soft py-1 pl-1 pr-3.5 text-[0.86rem] font-semibold text-ink">
        <span className="grid size-7 place-items-center rounded-full bg-green text-on-green">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <span className="tabular">{credits}</span>
        <span className="-ml-1 hidden font-medium text-green-ink sm:inline">créditos</span>
      </span>
      <Link
        href="/app/plano"
        className="hidden h-9 items-center rounded-full bg-ink px-4 text-[0.84rem] font-semibold text-bg transition-colors hover:bg-ink-2 sm:inline-flex"
      >
        Upgrade
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Notificações"
          className="grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
        </button>
        <ThemeToggle />
        <AccountMenu name={profile.name} email={profile.email} picture={profile.picture} onSignOut={signOut} />
      </div>
    </header>
  );
}
