"use client";

import { useSyncExternalStore } from "react";
import { apiFetch } from "../api";
import { PLAN_BY_ID, type Plan } from "../plans";
import { EDIT_PRICE, EXPORT_PRICE, SEARCH_PRICE, SITE_PRICE, WELCOME_CREDITS } from "../site-pricing";
import { setPlan } from "./plan";

// O saldo mora no servidor (backend: lib/credits.ts). Aqui só fica a cópia do
// último valor que ele informou, pra tela mostrar. Nada nesta página desconta
// crédito: quem cobra é a rota que faz a ação, e toda resposta de ação traz o
// saldo novo — é ele que entra aqui.
//
// Enquanto o servidor não responde (carregando, sem rede, deslogado), o valor
// é null e a interface mostra um traço em vez de um número inventado.

// Créditos de boas-vindas (plano Grátis): 4 buscas (30 cada). Não cobrem um
// site (150): o Grátis é pra achar clientes; gerar pede plano ou recarga.
// A primeira busca não sai daqui: a Início já abre com a cidade da pessoa
// pesquisada (showcase-map). Preços e planos em lib/plans.ts.
// Definido em lib/site-pricing.ts, que é módulo puro: a Central de ajuda é
// página de servidor e não pode importar deste arquivo ("use client").
export { WELCOME_CREDITS };

// Custo de cada ação, sempre em múltiplos de 5. Nada é ilimitado. Estes
// números são só pra mostrar na tela: o servidor tem os mesmos em
// backend/src/lib/pricing.ts e é por lá que a cobrança acontece.
export const CREDIT_COSTS = {
  search: SEARCH_PRICE,
  // Site novo e ajuste (o ajuste sobe com a conversa): lib/site-pricing.ts.
  site: SITE_PRICE,
  edit: EDIT_PRICE,
  // Baixar o site (HTML e imagens num .zip), por versão: a mesma versão baixa de novo sem cobrar.
  export: EXPORT_PRICE,
} as const;

/** Como comprar e o estado da assinatura (GET /credits → billing). */
export type Billing = {
  /** "asaas" = pagamento de verdade; "teste" = compra sem pagar (desenvolvimento); null = nada configurado. */
  mode: "asaas" | "teste" | null;
  /** Já tem cadastro de cobrança (não precisa pedir CPF/CNPJ de novo). */
  hasProfile: boolean;
  /** A assinatura segue cobrando (false = cancelada ou sem plano pago). */
  renewing: boolean;
  /** Até quando o plano atual está pago. */
  paidUntil: string | null;
};

const listeners = new Set<() => void>();
let balance: number | null = null;
let billing: Billing | null = null;
// Nome do modelo que escreve os sites, como o servidor informa ("Claude Opus 5").
// É só informação: a escolha é do servidor, e o esforço não aparece.
let siteModel: string | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): number | null {
  return balance;
}

function getServerSnapshot(): number | null {
  return null;
}

/** Guarda o saldo que o servidor acabou de informar. */
export function setCredits(value: number | null | undefined) {
  if (typeof value !== "number" || value === balance) return;
  balance = value;
  emit();
}

/** Esquece o saldo (logout): a tela volta a não afirmar nada. */
export function forgetCredits() {
  if (balance === null) return;
  balance = null;
  emit();
}

/** Pergunta o saldo ao servidor. Silencioso: sem conta ou sem rede, não muda nada. */
export async function refreshCredits(signal?: AbortSignal) {
  try {
    const res = await apiFetch("/credits", { signal, cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) forgetCredits();
      return;
    }
    const data = (await res.json()) as {
      credits?: number;
      plan?: string;
      planPaidUntil?: string | null;
      billing?: Omit<Billing, "paidUntil">;
      siteModel?: string;
    };
    if (typeof data.siteModel === "string" && data.siteModel !== siteModel) {
      siteModel = data.siteModel;
      emit();
    }
    if (data.billing) {
      billing = { ...data.billing, paidUntil: data.planPaidUntil ?? null };
      emit();
    }
    setCredits(data.credits);
    if (data.plan && data.plan in PLAN_BY_ID) setPlan(data.plan as Plan["id"]);
  } catch {
    // Backend fora do ar: mantém o último valor conhecido.
  }
}

function getBilling() {
  return billing;
}

function getServerBilling(): Billing | null {
  return null;
}

/** Como comprar e a assinatura, ou null enquanto o servidor não disse. */
export function useBilling(): Billing | null {
  return useSyncExternalStore(subscribe, getBilling, getServerBilling);
}

/** Nome do modelo que escreve os sites ("Claude Opus 5"), ou null antes da resposta. */
export function useSiteModel(): string | null {
  return useSyncExternalStore(subscribe, () => siteModel, () => null);
}

/** Saldo atual, ou null enquanto o servidor não disse. */
export function useCredits(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Dá pra pagar isto agora? Só uma dica pra interface (desabilitar o botão,
 * explicar o que falta). Quem decide de verdade é o servidor, que responde
 * 402 quando o saldo não cobre.
 */
export function affords(cost: number) {
  return balance === null || balance >= cost;
}
