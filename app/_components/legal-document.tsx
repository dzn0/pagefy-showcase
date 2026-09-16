import type { ReactNode } from "react";
import Link from "next/link";
import { Footer } from "./footer";
import { LegalIndex } from "./legal-index";
import { Navbar } from "./navbar";
import { OPERADOR } from "@/lib/legal";

export type LegalSection = { id: string; titulo: string; corpo: ReactNode };

const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";

/* -------------------------------------------------- peças do texto corrido */

/** Parágrafo do documento. A medida fica em 68ch: linha longa cansa. */
export function P({ children }: { children: ReactNode }) {
  return <p className="max-w-[68ch] text-[1.02rem] leading-[1.7] text-ink-2">{children}</p>;
}

/** Lista de itens, separada por marcadores discretos em vez de bolinhas. */
export function Lista({ children }: { children: ReactNode }) {
  return (
    <ul className="max-w-[68ch] space-y-2.5 text-[1.02rem] leading-[1.7] text-ink-2">{children}</ul>
  );
}

export function Item({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-5 before:absolute before:left-0 before:top-[0.72em] before:size-1.5 before:rounded-full before:bg-line-strong">
      {children}
    </li>
  );
}

/** Termo e definição: o formato de "o que guardamos" e "quem processa". */
export function Definicoes({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-line border-y border-line">{children}</dl>;
}

export function Definicao({ termo, children }: { termo: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6">
      <dt className="font-display text-[0.98rem] font-semibold tracking-[-0.02em] text-ink">{termo}</dt>
      <dd className="max-w-[58ch] text-[0.98rem] leading-[1.65] text-ink-2">{children}</dd>
    </div>
  );
}

/** Link dentro do texto: verde de texto com sublinhado fino. */
export function A({ href, children }: { href: string; children: ReactNode }) {
  const externo = href.startsWith("http") || href.startsWith("mailto:");
  const className =
    "font-semibold text-green-ink underline decoration-green/30 transition-colors hover:decoration-green";
  return externo ? (
    <a href={href} className={className} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------- documento */

type Props = {
  titulo: string;
  /** Uma frase em português comum: o que este documento diz, sem juridiquês. */
  resumo: string;
  atualizado: { iso: string; extenso: string };
  /** Os três ou quatro pontos que respondem à dúvida de quem não vai ler tudo. */
  essencial: string[];
  secoes: LegalSection[];
  /** O outro documento do par, no rodapé e no cabeçalho. */
  irmao: { href: string; label: string };
};

export function LegalDocument({ titulo, resumo, atualizado, essencial, secoes, irmao }: Props) {
  const indice = secoes.map(({ id, titulo: t }) => ({ id, titulo: t }));

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <header className="border-b border-line bg-surface pb-14 pt-14 sm:pb-16 sm:pt-16">
          <div className={container}>
            <h1 className="max-w-[16ch] text-[2.3rem] font-semibold leading-[1.06] tracking-[-0.04em] text-ink sm:text-[3.1rem]">
              {titulo}
            </h1>
            <p className="mt-5 max-w-[56ch] text-[1.08rem] leading-relaxed text-ink-2">{resumo}</p>
            <p className="mt-7 flex flex-col gap-y-1.5 text-[0.88rem] text-muted sm:flex-row sm:items-center sm:gap-x-3">
              <span>
                Atualizado em <time dateTime={atualizado.iso}>{atualizado.extenso}</time>
              </span>
              <span aria-hidden="true" className="hidden text-line-strong sm:inline">
                ·
              </span>
              <Link href={irmao.href} className="transition-colors hover:text-ink">
                {irmao.label}
              </Link>
            </p>
          </div>
        </header>

        <div className={`${container} py-12 sm:py-16`}>
          {/* No celular a ordem de leitura é título, resumo, índice, texto: um
              índice de 14 itens antes do resumo seria um muro. No desktop o
              índice volta pra coluna da esquerda, acompanhando as duas linhas. */}
          <div className="grid gap-y-10 lg:grid-cols-[15rem_1fr] lg:gap-x-16 lg:gap-y-12">
            <div className="order-2 lg:order-none lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <LegalIndex secoes={indice} />
            </div>

            <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
              {/* O resumo honesto, antes do texto longo: quem não vai ler tudo
                  merece sair sabendo o principal. */}
              <section aria-label="Resumo" className="rounded-2xl bg-surface-2 px-6 py-6 sm:px-7">
                <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
                  Em resumo
                </h2>
                <ul className="mt-4 space-y-3">
                  {essencial.map((linha) => (
                    <li
                      key={linha}
                      className="relative max-w-[62ch] pl-5 text-[0.98rem] leading-[1.6] text-ink-2 before:absolute before:left-0 before:top-[0.66em] before:size-1.5 before:rounded-full before:bg-green"
                    >
                      {linha}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[0.86rem] text-muted">
                  O resumo não substitui o texto abaixo, que é o que vale.
                </p>
              </section>
            </div>

            <div className="order-3 lg:order-none lg:col-start-2 lg:row-start-2">
              <div className="space-y-11 sm:space-y-12">
                {secoes.map((secao, i) => (
                  <section
                    key={secao.id}
                    id={secao.id}
                    className="scroll-mt-28 border-t border-line pt-9 first:border-t-0 first:pt-0"
                  >
                    <h2 className="flex items-baseline gap-3 text-[1.25rem] font-semibold tracking-[-0.025em] text-ink sm:text-[1.35rem]">
                      <a
                        href={`#${secao.id}`}
                        aria-label={`Link direto para a seção ${i + 1}, ${secao.titulo}`}
                        className="tabular text-[0.92rem] font-semibold text-muted transition-colors hover:text-green-ink"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </a>
                      {secao.titulo}
                    </h2>
                    <div className="mt-4 space-y-4">{secao.corpo}</div>
                  </section>
                ))}
              </div>

              <div className="mt-14 border-t border-line pt-7">
                <p className="max-w-[62ch] text-[0.94rem] leading-relaxed text-muted">
                  Dúvida sobre este documento? Escreva para{" "}
                  <A href={`mailto:${OPERADOR.email}`}>{OPERADOR.email}</A>. Também vale ler{" "}
                  <A href={irmao.href}>{irmao.label.toLowerCase()}</A>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
