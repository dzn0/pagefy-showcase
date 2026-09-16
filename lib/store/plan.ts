"use client";

import { useSyncExternalStore } from "react";
import { PLAN_BY_ID, type Plan } from "@/lib/plans";

// Plano atual da conta. Quem manda é o servidor (GET /credits, em
// refreshCredits); aqui fica só a última cópia, pra tela abrir sem piscar.
const STORAGE_KEY = "pagefy-plan";
const DEFAULT_PLAN: Plan["id"] = "gratis";

const listeners = new Set<() => void>();

function getSnapshot(): Plan["id"] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && raw in PLAN_BY_ID ? (raw as Plan["id"]) : DEFAULT_PLAN;
  } catch {
    return DEFAULT_PLAN;
  }
}

function getServerSnapshot(): Plan["id"] {
  return DEFAULT_PLAN;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function setPlan(id: Plan["id"]) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Sem storage: o plano volta ao Grátis ao recarregar.
  }
  listeners.forEach((listener) => listener());
}

/** Plano atual (objeto completo, com nome e franquia de créditos). */
export function usePlan(): Plan {
  return PLAN_BY_ID[useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)];
}
