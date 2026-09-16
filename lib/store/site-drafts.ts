"use client";

import type { SiteEngine } from "../site-pricing";
import { deleteItem, putItem, registerUserData } from "./user-data";

// Conversa e HTML de cada site no gerador, por slug, guardados na conta
// (backend, /dados/rascunhos). "Gerar site" cria o rascunho com os dados do
// comércio; o gerador lê, conversa e grava de volta. A leitura é síncrona, de
// um cache em memória preenchido depois do login (lib/store/user-data.ts).

/** Onde os rascunhos ficavam antes do backend; sobem pra conta no primeiro login. */
const LEGACY_KEY = "pagefy-site-drafts";
/** O gerador grava várias vezes seguidas: junta tudo numa gravação por site. */
const SAVE_DELAY_MS = 800;

export type DraftBusiness = {
  name: string;
  kind: string | null;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  rating: number | null;
  reviews: number | null;
  mapsUrl: string | null;
  /** Nome do recurso da foto no Google (ver photoSrc). */
  photo: string | null;
  color: string;
};

export type DraftTurn = {
  prompt: string;
  /** Imagens que a pessoa mandou junto (nomes de /uploads). */
  images?: string[];
  /** Resposta crua da IA (<reply>, <site>, <edit>): volta pra ela no próximo pedido. */
  reply: string;
  cost: number;
  at: number;
  /** Alterações que não acharam o trecho no site. */
  failedEdits?: number;
  /** Modelo e pensamento usados neste pedido. */
  engine?: SiteEngine;
  /** Etapas que a IA fez neste pedido (pra consultar depois no chat) e quanto levou. */
  steps?: string[];
  durationMs?: number;
};

export type SiteDraft = {
  slug: string;
  placeId?: string;
  business: DraftBusiness;
  turns: DraftTurn[];
  /** Site de partida quando a conversa foi recomeçada. */
  baseHtml?: string;
  html: string | null;
  /** Tokens da conversa depois da última resposta (é o que o próximo pedido relê). */
  context: number;
  /** Quantas conversas já foram recomeçadas (rascunhos de antes do "Recriar site"; só pra mostrar no chat). */
  resets: number;
  /** Sorteia o mundo visual do site no backend; fixa pra conversa toda. */
  seed?: number;
  /** Modelo e pensamento escolhidos pra este site (vale pros próximos pedidos). */
  engine?: SiteEngine;
  /** Geração em andamento no servidor: com isso o gerador se reconecta ao voltar pra página. */
  pending?: { jobId: string; prompt: string; images: string[]; price: number; startedAt: number };
  /** Versão do site deste comércio: 1 é o original; "Recriar site" cria a 2, a 3… como sites separados. */
  version?: number;
  /** Slug do site original (versão 1), nas versões recriadas. */
  sourceSlug?: string;
  /** Pedido já escrito no campo ao abrir (o que foi recusado no site de origem). */
  promptDraft?: string;
  /**
   * A conferência achou um site próprio e o primeiro pedido espera a resposta
   * ("Criar mesmo assim" / "Não criar"). Guardado aqui pra a pergunta não
   * sumir quando a pessoa sai da tela; Sites mostra o card esperando.
   */
  websiteFound?: { prompt: string; images: string[]; price: number; url: string; evidence: string | null };
  /** A conferência achou um site próprio e a pessoa decidiu criar mesmo assim (não pergunta de novo). */
  websiteConfirmed?: { url: string };
  /** Versões do HTML já pagas pro download (lib/site-export.ts): baixar a mesma de novo não cobra. */
  exports?: string[];
  /** Slug do link público (/p/<slug>), quando já publicado. */
  publicSlug?: string;
  /** Chave que deixa este navegador atualizar o site publicado. */
  editKey?: string;
  publishedAt?: number;
  updatedAt: number;
};

let drafts: Record<string, SiteDraft> = {};
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function isDraft(value: unknown): value is SiteDraft {
  return typeof value === "object" && value !== null && typeof (value as { slug?: unknown }).slug === "string";
}

function flush(slug: string) {
  const timer = saveTimers.get(slug);
  if (timer) clearTimeout(timer);
  saveTimers.delete(slug);
  const draft = drafts[slug];
  if (draft) putItem("rascunhos", slug, draft);
}

registerUserData("rascunhos", {
  hydrate(items) {
    drafts = {};
    for (const item of items) if (isDraft(item)) drafts[item.slug] = item;
  },
  reset() {
    saveTimers.forEach((timer) => clearTimeout(timer));
    saveTimers.clear();
    drafts = {};
  },
  legacy() {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      return Object.values(parsed as Record<string, unknown>)
        .filter(isDraft)
        .map((draft) => ({ id: draft.slug, item: draft }));
    } catch {
      return [];
    }
  },
  dropLegacy() {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Sem storage: nada a apagar.
    }
  },
  ids: () => new Set(Object.keys(drafts)),
  adopt(item) {
    if (isDraft(item)) drafts[item.slug] = item;
  },
});

// Fechando a aba com gravação agendada: manda na hora em vez de perder.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => [...saveTimers.keys()].forEach(flush));
}

function readAll(): Record<string, SiteDraft> {
  return drafts;
}

/** HTML atual de cada site, por slug (pras miniaturas da lista de Sites). */
export function loadDraftHtml(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [slug, draft] of Object.entries(readAll())) if (draft.html) out[slug] = draft.html;
  return out;
}

export function loadAllDrafts(): SiteDraft[] {
  return Object.values(readAll());
}

/** Sites com geração em andamento no servidor (a pessoa pode ter saído do gerador). */
export function loadGeneratingDrafts(): SiteDraft[] {
  return Object.values(readAll()).filter((draft) => draft.pending);
}

export function loadDraft(slug: string): SiteDraft | null {
  return readAll()[slug] ?? null;
}

export function saveDraft(draft: SiteDraft) {
  drafts = { ...drafts, [draft.slug]: draft };
  const timer = saveTimers.get(draft.slug);
  if (timer) clearTimeout(timer);
  // Com geração em andamento a gravação vai na hora: é o que deixa voltar pra
  // página (ou abrir em outro aparelho) e reencontrar o trabalho.
  if (draft.pending) {
    flush(draft.slug);
    return;
  }
  saveTimers.set(draft.slug, setTimeout(() => flush(draft.slug), SAVE_DELAY_MS));
}

/** Apaga o rascunho (conversa e HTML) de um site. */
export function deleteDraft(slug: string) {
  if (!(slug in drafts)) return;
  const timer = saveTimers.get(slug);
  if (timer) clearTimeout(timer);
  saveTimers.delete(slug);
  const rest = { ...drafts };
  delete rest[slug];
  drafts = rest;
  deleteItem("rascunhos", slug);
}

/** Nome do site na lista e no gerador: "Ernesto Café/Bar", "Ernesto Café/Bar 2"… */
export function draftTitle(draft: Pick<SiteDraft, "business" | "version">) {
  return draft.version && draft.version > 1 ? `${draft.business.name} ${draft.version}` : draft.business.name;
}

/**
 * "Recriar site": um rascunho novo e vazio do mesmo comércio, como a próxima
 * versão (o original e as outras versões ficam como estão). A pessoa faz o
 * fluxo normal de site novo nele. Devolve o slug do rascunho novo.
 */
/** Número da próxima versão do site deste comércio. */
export function nextVersion(from: Pick<SiteDraft, "slug" | "sourceSlug">) {
  const sourceSlug = from.sourceSlug ?? from.slug;
  const family = Object.values(readAll()).filter((draft) => draft.slug === sourceSlug || draft.sourceSlug === sourceSlug);
  return Math.max(1, ...family.map((draft) => draft.version ?? 1)) + 1;
}

export function createRecreation(from: SiteDraft, promptDraft: string | undefined, now: number) {
  const sourceSlug = from.sourceSlug ?? from.slug;
  const version = nextVersion(from);
  const slug = `${sourceSlug.slice(0, 130)}-v${version}`;
  saveDraft({
    slug,
    placeId: from.placeId,
    business: from.business,
    turns: [],
    html: null,
    context: 0,
    resets: 0,
    seed: Math.floor(Math.random() * 2 ** 31),
    version,
    sourceSlug,
    // Já decidiu criar mesmo com site próprio no site de origem: não pergunta de novo.
    ...(from.websiteConfirmed ? { websiteConfirmed: from.websiteConfirmed } : {}),
    ...(promptDraft ? { promptDraft } : {}),
    updatedAt: now,
  });
  return slug;
}

/** Cria o rascunho se ainda não existir (clicar de novo em "Gerar site" não apaga a conversa). */
export function ensureDraft(slug: string, placeId: string | undefined, business: DraftBusiness, now: number) {
  if (loadDraft(slug)) return;
  const seed = Math.floor(Math.random() * 2 ** 31);
  saveDraft({ slug, placeId, business, turns: [], html: null, context: 0, resets: 0, seed, updatedAt: now });
}
