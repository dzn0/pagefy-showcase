"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

// Toda troca de página por link abre no topo. Sem isto, o Next mantém a
// rolagem da página anterior quando a nova "já aparece na tela": o logo do
// app levava pro fim da landing, e o "Abrir o Dashboard" (no fim da landing)
// abria o app rolado. O html tem scroll-behavior: smooth, então a rolagem é
// zerada sem animação (ver também data-scroll-behavior no app/layout.tsx).
//
// Fica de fora: voltar/avançar do navegador (o Next restaura a posição) e
// links com âncora (#demo), que rolam até a seção.
export function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useLayoutEffect(() => {
    // Primeira carga: quem cuida é o navegador.
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;

    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    // De novo no quadro seguinte: o Next ainda mexe na rolagem depois de montar a página.
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      html.style.scrollBehavior = previous;
    });
    return () => {
      cancelAnimationFrame(frame);
      html.style.scrollBehavior = previous;
    };
  }, [pathname]);

  return null;
}
