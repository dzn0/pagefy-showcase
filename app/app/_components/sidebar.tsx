"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Logo, LogoMark } from "@/app/_components/logo";
import { HELP_NAV, isFocusRoute, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "@/lib/dashboard-nav";
import { CREDIT_COSTS, useCredits } from "@/lib/store/credits";
import { usePlan } from "@/lib/store/plan";
import { CreditMeter, HUE } from "./ui";

export function Sidebar() {
  const pathname = usePathname();
  const credits = useCredits();
  const plan = usePlan();

  // Gerador de site: trilho só de ícones, pra dar a largura aos aparelhos.
  if (isFocusRoute(pathname)) return <SidebarRail pathname={pathname} />;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg md:flex">
      {/* Mesma altura da topbar (centro alinhado com os créditos) e presa na
          coluna dos ícones da navegação (px-3 + px-2 dos itens): o símbolo
          fica em cima do quadrado do Início. O desenho da marca ocupa ~76% do
          SVG, por isso a caixa de 40px (desenho ≈ 30px, como os ícones) e o
          -ml-[5px], que tira a sobra da esquerda. */}
      <div className="flex h-[4.75rem] shrink-0 items-center px-3">
        <Link href="/" aria-label="Pagefy, página inicial" className="flex items-center rounded-[14px] px-2 py-1">
          <Logo className="gap-[9px]" markClassName="-ml-[5px] size-10" textClassName="text-[1.45rem] leading-none" />
        </Link>
      </div>

      {/* Rola em telas baixas, mas sem trilha visível: a barra de rolagem
          comeria a lateral dos botões e tiraria eles do centro da logo. */}
      <nav
        className="flex-1 overflow-y-auto px-3 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Navegação do app"
      >
        <NavGroup items={PRIMARY_NAV} pathname={pathname} />
        <p className="mb-2 mt-6 px-3 text-[0.76rem] font-semibold text-muted">Conta</p>
        <NavGroup items={SECONDARY_NAV} pathname={pathname} />
        <p className="mb-2 mt-6 px-3 text-[0.76rem] font-semibold text-muted">Aprender e falar</p>
        <NavGroup items={HELP_NAV} pathname={pathname} />
      </nav>

      <div className="shrink-0 p-3">
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[0.82rem] font-medium text-ink-2">Créditos</p>
            <p className="text-[0.74rem] text-muted">plano {plan.name}</p>
          </div>
          <p className="mt-1 font-display text-[1.9rem] font-semibold leading-none tracking-[-0.035em] text-ink tabular">
            {credits === null ? "—" : credits.toLocaleString("pt-BR")}
            {/* Recarga soma no saldo, não na franquia: 610 / 600. */}
            <span className="ml-1 text-[0.95rem] font-medium tracking-normal text-muted">/ {plan.credits.toLocaleString("pt-BR")}</span>
          </p>
          <CreditMeter value={credits ?? 0} max={plan.credits} className="mt-3" />
          <p className="mt-2.5 text-[0.8rem] text-muted">{credits === null ? "Consultando seu saldo…" : creditHint(credits)}</p>
          <Link
            href="/app/plano"
            className="mt-3.5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-green text-[0.88rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
          >
            Aumentar créditos
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

// O que o saldo ainda rende, em ações (busca e site custam o mesmo).
function creditHint(credits: number) {
  const searches = Math.floor(credits / CREDIT_COSTS.search);
  const sites = Math.floor(credits / CREDIT_COSTS.site);
  if (searches === 0) return "Sem saldo para buscar ou gerar sites";
  if (sites === 0) return `Rende ${searches} ${searches === 1 ? "busca" : "buscas"}`;
  return `Rende ${searches} ${searches === 1 ? "busca" : "buscas"} ou ${sites} ${sites === 1 ? "site" : "sites"}`;
}

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon: Icon, hue }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        const tile =
          hue === "neutral"
            ? "bg-surface-2 text-ink-2"
            : active
              ? HUE[hue].solid
              : `${HUE[hue].soft} ${HUE[hue].ink}`;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-[14px] px-2 py-1.5 text-[0.93rem] transition-colors duration-200 ${
                active ? "bg-surface font-semibold text-ink shadow-soft" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-[10px] transition-colors duration-200 ${tile}`}>
                <Icon className="size-[17px]" aria-hidden="true" />
              </span>
              {label}
              {active && <span className="ml-auto mr-1.5 size-1.5 rounded-full bg-green" aria-hidden="true" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Trilho compacto (5rem) do gerador: a marca e os ícones da navegação, com o
// nome no hover e no leitor de tela. O saldo continua na topbar.
function SidebarRail({ pathname }: { pathname: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center border-r border-line bg-bg md:flex">
      <div className="flex h-[4.75rem] shrink-0 items-center">
        <Link href="/" aria-label="Pagefy, página inicial" className="grid size-12 place-items-center rounded-[14px]">
          <LogoMark className="size-10" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Navegação do app">
        {[PRIMARY_NAV, SECONDARY_NAV, HELP_NAV].map((items, group) => (
          <ul key={group} className={`space-y-1.5 ${group ? "mt-4 border-t border-line pt-4" : ""}`}>
            {items.map(({ href, label, icon: Icon, hue }) => {
              const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
              const tile = hue === "neutral" ? "bg-surface-2 text-ink-2" : active ? HUE[hue].solid : `${HUE[hue].soft} ${HUE[hue].ink}`;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    title={label}
                    aria-current={active ? "page" : undefined}
                    className={`grid size-12 place-items-center rounded-[14px] transition-colors duration-200 ${active ? "bg-surface shadow-soft" : "hover:bg-surface-2"}`}
                  >
                    <span className={`grid size-8 place-items-center rounded-[10px] ${tile}`}>
                      <Icon className="size-[17px]" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ))}
      </nav>
    </aside>
  );
}
