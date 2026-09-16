"use client";

import { useSyncExternalStore } from "react";
import { deleteItem, putItem, registerUserData, type UserDataKind } from "./user-data";

// Lista com id guardada na conta (backend, /dados/<kind>). As telas leem e
// escrevem de forma síncrona num cache em memória; cada mudança vai pro
// servidor em segundo plano (lib/store/user-data.ts). O cache é preenchido
// depois do login, antes do app aparecer (DashboardShell).
//
// `legacyKey` é onde a lista ficava no localStorage antes do backend: no
// primeiro login, o que existir lá sobe pra conta.
export function createListStore<T extends { id: string }>(kind: UserDataKind, legacyKey: string) {
  const listeners = new Set<() => void>();
  const EMPTY: T[] = [];
  let list: T[] = EMPTY;

  function set(next: T[]) {
    list = next;
    listeners.forEach((listener) => listener());
  }

  function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  registerUserData(kind, {
    hydrate: (items) => set(items.filter((item): item is T => isItem(item))),
    reset: () => set(EMPTY),
    legacy() {
      try {
        const raw = localStorage.getItem(legacyKey);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(isItem).map((item) => ({ id: item.id, item })) : [];
      } catch {
        return [];
      }
    },
    dropLegacy() {
      try {
        localStorage.removeItem(legacyKey);
      } catch {
        // Sem storage: nada a apagar.
      }
    },
    ids: () => new Set(list.map((item) => item.id)),
    adopt: (item) => set([...list, item as T]),
  });

  return {
    useAll(): T[] {
      return useSyncExternalStore(subscribe, () => list, () => EMPTY);
    },
    /** Leitura fora de componente (dentro de um handler). */
    getAll(): T[] {
      return list;
    },
    add(item: T) {
      set([item, ...list]);
      putItem(kind, item.id, item);
    },
    update(id: string, patch: Partial<T>) {
      const current = list.find((item) => item.id === id);
      if (!current) return;
      const next = { ...current, ...patch };
      set(list.map((item) => (item.id === id ? next : item)));
      putItem(kind, id, next);
    },
    remove(id: string) {
      if (!list.some((item) => item.id === id)) return;
      set(list.filter((item) => item.id !== id));
      deleteItem(kind, id);
    },
    clear() {
      const ids = list.map((item) => item.id);
      set([]);
      ids.forEach((id) => deleteItem(kind, id));
    },
  };
}

function isItem(value: unknown): value is { id: string } {
  return typeof value === "object" && value !== null && typeof (value as { id?: unknown }).id === "string";
}
