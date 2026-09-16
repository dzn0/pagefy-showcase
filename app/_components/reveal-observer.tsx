"use client";

import { useEffect } from "react";

// Revela os elementos marcados com `data-reveal` quando entram na tela.
// O atraso de cada um vem da variável CSS `--reveal-delay` (ver lib/reveal.ts).
export function RevealObserver() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
