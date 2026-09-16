"use client";

import { useEffect } from "react";

// Faz o link com âncora funcionar quando a página é ABERTA nele, e não só
// quando alguém clica dentro do site.
//
// O problema: abrir pagefy.app/#precos direto (link colado no WhatsApp, vindo
// do Google, um favorito) caía no topo. O navegador tenta rolar assim que lê o
// hash, quando a landing ainda não montou as seções; não acha o elemento e não
// tenta de novo. Confirmado em produção antes desta correção.
//
// A tentativa se repete por um instante, e cada repetição RECORRIGE a posição,
// porque a altura acima da âncora ainda muda enquanto mapa e imagens entram.
// Parar antes disso não serve: numa medição, o layout empurrou a seção 8.500px
// depois que a rolagem já tinha acertado. Quem interrompe de verdade é a
// pessoa: qualquer toque na rolagem cancela o resto, porque aí a intenção dela
// vale mais que a nossa.
//
// Os intervalos usam setTimeout, e não requestAnimationFrame: quem abre o link
// numa aba de segundo plano não teria quadro nenhum, e a rolagem só aconteceria
// quando (e se) a aba virasse a da frente.
const TENTATIVAS_MS = [0, 60, 160, 320, 640, 1200];

/** Qualquer sinal de que a pessoa assumiu a rolagem. */
const EVENTOS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

export function HashLanding() {
  useEffect(() => {
    const bruto = window.location.hash.slice(1);
    if (!bruto) return;

    let id: string;
    try {
      id = decodeURIComponent(bruto);
    } catch {
      id = bruto;
    }

    const timers: number[] = [];

    const parar = () => {
      for (const t of timers) window.clearTimeout(t);
      timers.length = 0;
      for (const evento of EVENTOS) window.removeEventListener(evento, parar);
    };

    const tentar = () => {
      const alvo = document.getElementById(id);
      if (!alvo) return;

      // scrollIntoView respeita o scroll-padding-top do html (6rem), que é o
      // que deixa a seção abaixo da barra fixa. O smooth do html fica desligado
      // durante o salto: ao ABRIR a página, a animação é desorientadora.
      const html = document.documentElement;
      const comportamento = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      alvo.scrollIntoView({ block: "start" });
      html.style.scrollBehavior = comportamento;
    };

    for (const evento of EVENTOS) window.addEventListener(evento, parar, { passive: true });
    for (const espera of TENTATIVAS_MS) timers.push(window.setTimeout(tentar, espera));
    return parar;
    // Só na primeira montagem: navegação dentro do site já rola sozinha.
  }, []);

  return null;
}
