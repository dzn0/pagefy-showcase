import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./_components/logo";

// No lugar da 404 padrão do Next (em inglês e fora do visual do Pagefy).
export const metadata: Metadata = {
  title: "Página não encontrada | Pagefy",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-24 text-center">
      <Link href="/" aria-label="Pagefy, página inicial" className="rounded-md">
        <Logo />
      </Link>
      <p className="mt-12 font-mono text-[0.84rem] text-muted">404</p>
      <h1 className="mt-3 max-w-[20ch] text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.4rem]">
        Essa página não existe.
      </h1>
      <p className="mt-4 max-w-[44ch] text-[1.02rem] leading-relaxed text-ink-2">
        O link pode estar errado ou a página saiu do ar. Na página inicial você busca os comércios sem site da sua cidade.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition-[background-color,transform] duration-200 hover:bg-ink-2 active:scale-[0.97]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar pro início
      </Link>
    </main>
  );
}
