"use client";

import { useEffect } from "react";
import { capturarAquisicao, registrar } from "@/lib/analytics";

// Topo do funil: guarda de onde a pessoa veio (uma vez, na primeira visita) e
// marca que a landing foi vista. É o denominador de tudo o que vem depois —
// sem ele, "converte pouco" não distingue pouca gente chegando de muita gente
// desistindo. Ver lib/analytics.ts e backend/src/lib/analytics.ts.
//
// Uma vez por aba: recarregar a página ou voltar pelo histórico não deve
// inventar visitante novo.
const MARCA = "pagefy:landing-vista";

export function FunnelTracker() {
  useEffect(() => {
    capturarAquisicao();
    try {
      if (sessionStorage.getItem(MARCA)) return;
      sessionStorage.setItem(MARCA, "1");
    } catch {
      // Sem sessionStorage a visita pode contar duas vezes numa mesma aba;
      // é melhor do que não contar.
    }
    registrar("landing_vista");
  }, []);

  return null;
}
