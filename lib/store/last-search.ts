"use client";

import type { LeadSearchResult } from "@/lib/lead-search";

// Última busca de leads, guardada neste navegador: a lista continua na tela
// ao voltar pra /app/buscar (ou recarregar) até a próxima busca dar certo.
const STORAGE_KEY = "pagefy-last-search";

export type LastSearch = { query: string; result: LeadSearchResult };

export function loadLastSearch(): LastSearch | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastSearch;
    return parsed?.result && Array.isArray(parsed.result.businesses) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLastSearch(search: LastSearch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(search));
  } catch {
    // Sem storage: a lista só dura enquanto a página estiver aberta.
  }
}
