"use client";

import { useEffect, useState } from "react";

/**
 * Índice lateral dos documentos legais. Acompanha a leitura: a seção que está
 * na tela fica em destaque, com o mesmo ponto verde que marca o item ativo no
 * menu do app.
 *
 * Sem JS o índice continua sendo uma lista de links que funciona; só o
 * destaque deixa de acompanhar.
 */
export function LegalIndex({ secoes }: { secoes: { id: string; titulo: string }[] }) {
  const [ativa, setAtiva] = useState(secoes[0]?.id ?? "");

  useEffect(() => {
    const alvos = secoes
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (alvos.length === 0) return;

    // Vistas por id: a seção ativa é a primeira do documento que está visível.
    // Sem esse mapa, uma seção curta saindo da tela apagava o destaque.
    const visiveis = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visiveis.add(entry.target.id);
          else visiveis.delete(entry.target.id);
        }
        const primeira = secoes.find((s) => visiveis.has(s.id));
        if (primeira) setAtiva(primeira.id);
      },
      // Faixa de leitura: começa abaixo do cabeçalho fixo e termina no meio da
      // tela, então a seção acende quando o título passa por ali.
      { rootMargin: "-100px 0px -55% 0px", threshold: 0 },
    );

    for (const alvo of alvos) observer.observe(alvo);
    return () => observer.disconnect();
  }, [secoes]);

  return (
    <nav aria-label="Seções deste documento" className="lg:sticky lg:top-28">
      <p className="text-[0.86rem] font-semibold text-muted">Nesta página</p>
      <ol className="mt-3 space-y-0.5">
        {secoes.map((secao, i) => {
          const atual = secao.id === ativa;
          return (
            <li key={secao.id}>
              <a
                href={`#${secao.id}`}
                aria-current={atual ? "location" : undefined}
                className={`flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-3.5 text-[0.88rem] leading-snug transition-colors duration-200 hover:bg-surface-2 hover:text-ink ${
                  atual ? "font-semibold text-ink" : "text-muted"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full bg-green transition-[transform,opacity] duration-300 ease-(--ease-out-expo) ${
                    atual ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                />
                <span className="tabular text-[0.78rem] font-semibold text-muted/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {secao.titulo}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
