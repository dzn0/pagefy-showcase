"use client";

import { useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api";

// Dados do app da conta (leads, sites, rascunhos, vendas) moram no backend
// (/dados). As stores continuam síncronas pras telas: leem de um cache em
// memória, preenchido aqui depois do login, e cada mudança sai pro servidor
// em segundo plano, em ordem, por item.

export type UserDataKind = "leads" | "sites" | "vendas" | "rascunhos";
export type UserDataStatus = "idle" | "loading" | "ready" | "error";

type Loader = {
  hydrate(items: unknown[]): void;
  reset(): void;
  /** Itens que ficaram só neste navegador antes do backend (localStorage). */
  legacy(): { id: string; item: unknown }[];
  /** Apaga a cópia antiga do navegador depois de subir pra conta. */
  dropLegacy(): void;
  ids(): Set<string>;
  adopt(item: unknown): void;
};

const loaders = new Map<UserDataKind, Loader>();

export function registerUserData(kind: UserDataKind, loader: Loader) {
  loaders.set(kind, loader);
}

// ------------------------------------------------------------ estado da carga

let status: UserDataStatus = "idle";
let loadedFor: string | null = null;
let failedWrites = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function useUserDataStatus(): UserDataStatus {
  return useSyncExternalStore(subscribe, () => status, () => "idle" as const);
}

/** Quantas gravações não chegaram ao servidor depois das tentativas. */
export function useFailedWrites(): number {
  return useSyncExternalStore(subscribe, () => failedWrites, () => 0);
}

/**
 * Carrega os dados da conta (uma vez por login). `account` é o e-mail: se
 * outra conta entrar no mesmo navegador, o cache da anterior é descartado.
 */
export async function loadUserData(account: string) {
  if (loadedFor === account && (status === "ready" || status === "loading")) return;
  if (loadedFor !== account) forgetUserData();
  loadedFor = account;
  status = "loading";
  emit();
  try {
    const res = await apiFetch("/dados");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<UserDataKind, unknown[]>;
    if (loadedFor !== account) return;
    for (const [kind, loader] of loaders) loader.hydrate(Array.isArray(data[kind]) ? data[kind] : []);
    importLegacy();
    status = "ready";
  } catch {
    if (loadedFor === account) status = "error";
  }
  emit();
}

/** Saiu da conta: nada da conta anterior fica na memória. */
export function forgetUserData() {
  loadedFor = null;
  status = "idle";
  failedWrites = 0;
  for (const loader of loaders.values()) loader.reset();
  emit();
}

// Antes do backend, tudo ficava no localStorage. No primeiro login depois da
// mudança, o que só existe aqui sobe pra conta e a cópia local é apagada.
function importLegacy() {
  for (const [kind, loader] of loaders) {
    const onServer = loader.ids();
    for (const { id, item } of loader.legacy()) {
      if (onServer.has(id)) continue;
      loader.adopt(item);
      putItem(kind, id, item);
    }
    loader.dropLegacy();
  }
}

// ------------------------------------------------------------ gravação

const queues = new Map<string, Promise<void>>();
const RETRIES = [1_000, 4_000, 15_000];

async function send(path: string, init: RequestInit) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await apiFetch(path, init);
      // 4xx não melhora tentando de novo (sessão, limite, item inválido).
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)) {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("HTTP 4")) throw error;
    }
    const wait = RETRIES[attempt];
    if (wait === undefined) throw new Error("sem conexão");
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

/** Enfileira por item: um "salvar" nunca chega depois do "apagar" que veio depois dele. */
function enqueue(kind: UserDataKind, id: string, task: () => Promise<void>) {
  const key = `${kind}/${id}`;
  const run = (queues.get(key) ?? Promise.resolve()).then(task).catch(() => {
    failedWrites += 1;
    emit();
  });
  queues.set(key, run);
  void run.finally(() => {
    if (queues.get(key) === run) queues.delete(key);
  });
}

export function putItem(kind: UserDataKind, id: string, item: unknown) {
  enqueue(kind, id, () =>
    send(`/dados/${kind}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: item }),
    }),
  );
}

export function deleteItem(kind: UserDataKind, id: string) {
  enqueue(kind, id, () => send(`/dados/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" }));
}

/** Há gravação a caminho? (pra avisar antes de fechar a aba.) */
export function hasPendingWrites() {
  return queues.size > 0;
}
