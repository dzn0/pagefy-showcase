import Link from "next/link";
import { ChevronDown, Mail } from "lucide-react";
import { FooterAccountLinks } from "./footer-account-links";
import { Logo } from "./logo";
import { OPERADOR } from "@/lib/legal";

// Só páginas que existem. Exemplos por cidade e Tutoriais voltam quando forem
// publicados. Termos e Privacidade ficam na barra de baixo, junto do copyright
// (é lá que todo mundo procura, e o Google pede os dois links pra publicar a
// tela de login).
const COLUMNS = [
  {
    title: "Produto",
    links: [
      { href: "/#como-funciona", label: "Como funciona" },
      { href: "/#precos", label: "Preços" },
      { href: "/#perguntas", label: "Perguntas frequentes" },
      { href: "/ajuda", label: "Central de ajuda" },
    ],
  },
  // Links da conta dependem da sessão: ver FooterAccountLinks.
  { title: "Conta", links: [] },
];

const linkClass = "text-[0.92rem] text-muted transition-colors hover:text-ink";

const selectClass =
  "h-9 appearance-none rounded-full border border-line-strong bg-surface pl-3.5 pr-9 text-[0.86rem] font-medium text-ink outline-none transition-colors hover:border-ink/30 focus-visible:border-green";

export function Footer() {
  return (
    <footer className="bg-surface pt-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[34ch] text-[0.95rem] leading-relaxed text-muted">
              Encontra os comércios da sua região que ainda não têm site e monta a página de cada um com dados reais.
            </p>
            {/* Endereço único de contato: é o mesmo dos Termos, da Privacidade
                e da Central de ajuda, e sai de lib/legal.ts. */}
            <a
              href={`mailto:${OPERADOR.email}`}
              className="mt-6 inline-flex items-center gap-2 rounded-full text-[0.92rem] font-medium text-ink-2 transition-colors hover:text-ink"
            >
              <Mail className="size-4 text-muted" aria-hidden="true" />
              {OPERADOR.email}
            </a>
          </div>
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 lg:justify-self-end lg:gap-20">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="font-display text-[0.92rem] font-semibold text-ink">{col.title}</h2>
                <ul className="mt-4 space-y-3">
                  {col.title === "Conta" && <FooterAccountLinks linkClass={linkClass} />}
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-line py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[0.86rem] text-muted">
            <span>© 2026 Pagefy</span>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <Link href="/termos" className="transition-colors hover:text-ink">
              Termos de uso
            </Link>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <Link href="/privacidade" className="transition-colors hover:text-ink">
              Privacidade
            </Link>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <span>Dados de comércios via Google Places</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="idioma">
              Idioma
            </label>
            <span className="relative">
            <select id="idioma" defaultValue="pt-BR" className={selectClass}>
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en" disabled>
                English (em breve)
              </option>
              <option value="es" disabled>
                Español (em breve)
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            </span>
            <label className="sr-only" htmlFor="moeda">
              Moeda
            </label>
            <span className="relative">
            <select id="moeda" defaultValue="BRL" className={selectClass}>
              <option value="BRL">R$ BRL</option>
              <option value="USD" disabled>
                US$ USD (em breve)
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
