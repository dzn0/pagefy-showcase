// Conversa com o backend do gerador (/sites/generate, streaming) e leitura
// da resposta da IA: <reply> pro chat, <site> com o HTML inteiro ou <edit>
// com trocas pontuais (formato em backend/prompts/pagefy-frontend-design.md).
import { apiFetch, apiPost } from "./api";

export type GenerateBody = {
  placeId?: string;
  business: {
    name: string;
    kind?: string | null;
    neighborhood?: string | null;
    address?: string | null;
    phone?: string | null;
    rating?: number | null;
    reviews?: number | null;
    mapsUrl?: string | null;
    photo?: string | null;
  };
  turns: Array<{ prompt: string; reply: string; images?: string[] }>;
  prompt: string;
  /** Imagens enviadas com este pedido (nomes de /uploads). */
  images?: string[];
  baseHtml?: string;
  seed?: number;
  /** Site e início: o servidor lembra, pra retomar de qualquer aba. O preço ele calcula sozinho. */
  slug: string;
  price?: number;
  startedAt: number;
};

export type WebsiteCheck = { hasSite: boolean; url: string | null; evidence: string | null };

/**
 * Antes do primeiro site (e antes de reservar créditos): o comércio já tem
 * site próprio? Em qualquer falha responde "não achou", pra nunca travar a geração.
 */
export async function checkWebsite(body: Pick<GenerateBody, "placeId" | "business">, signal?: AbortSignal): Promise<WebsiteCheck> {
  const none: WebsiteCheck = { hasSite: false, url: null, evidence: null };
  try {
    const res = await apiPost("/sites/website-check", { placeId: body.placeId, business: body.business }, { signal });
    if (!res.ok) return none;
    return (await res.json()) as WebsiteCheck;
  } catch {
    return none;
  }
}

/** Geração que o servidor lembra pra um site (em andamento ou pronta esperando). */
export type PendingJob = {
  jobId: string;
  slug: string;
  prompt: string;
  images: string[];
  price: number;
  startedAt: number;
  finished: boolean;
};

/** Gerações ainda não aplicadas destes sites. */
export async function fetchPendingJobs(slugs: string[]): Promise<PendingJob[]> {
  if (slugs.length === 0) return [];
  try {
    const res = await apiFetch(`/sites/jobs?slugs=${encodeURIComponent(slugs.join(","))}`, { cache: "no-store" });
    if (!res.ok) return [];
    return ((await res.json()) as { jobs: PendingJob[] }).jobs;
  } catch {
    return [];
  }
}

/** O resultado foi aplicado (ou descartado) neste navegador: o servidor esquece. */
export async function claimJob(id: string, slug: string) {
  await apiPost(`/sites/jobs/${id}/claim`, { slug }).catch(() => {});
}

export type StreamEvent =
  /** Primeiro evento: id pra reconectar e o preço que o servidor já descontou. */
  | { t: "job"; id: string; price?: number }
  | { t: "thinking" }
  | { t: "text"; s: string }
  | { t: "tool"; name: string; phase: "start" | "done"; detail?: string }
  /** O que a IA está fazendo agora, narrado pelo backend a partir do raciocínio dela. */
  | { t: "step"; label: string }
  | { t: "done"; stop: string | null; context: number }
  | { t: "error"; message: string };

/** Começa uma geração. O primeiro evento é {t:"job", id}: guarde pra reconectar. */
export async function streamGenerate(body: GenerateBody, onEvent: (event: StreamEvent) => void, signal: AbortSignal) {
  const res = await apiPost("/sites/generate", body, { signal });
  await readEvents(res, onEvent);
}

/** Reconecta numa geração que segue no servidor (a pessoa saiu e voltou). */
export async function streamJob(id: string, onEvent: (event: StreamEvent) => void, signal: AbortSignal) {
  const res = await apiFetch(`/sites/jobs/${id}/stream`, { signal });
  await readEvents(res, onEvent);
}

/** O botão Parar: cancela a geração no servidor. */
export async function cancelJob(id: string) {
  await apiFetch(`/sites/jobs/${id}/cancel`, { method: "POST" }).catch(() => {});
}

async function readEvents(res: Response, onEvent: (event: StreamEvent) => void) {
  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    onEvent({ t: "error", message: data?.error ?? "Não deu pra falar com o gerador agora. Tente de novo." });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const line = buffer.slice(0, cut).trim();
      buffer = buffer.slice(cut + 2);
      if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)) as StreamEvent);
    }
  }
}

export type ParsedReply = {
  reply: string;
  /** Pedido grande demais pra um ajuste: o motivo, pra oferecer "Recriar site" (vazio = não recusou). */
  decline: string;
  /** Pedido contra as regras ou fora do site (guardrails do prompt): o motivo (vazio = não recusou). */
  refuse: string;
  /** HTML do <site> (parcial enquanto chega). */
  site: string | null;
  siteDone: boolean;
  edits: SiteEdit[];
};

/**
 * Uma troca. Sem `until`, troca o trecho `find`. Com `until`, troca tudo do
 * começo de `find` até o fim do primeiro `until` depois dele (uma seção
 * inteira refeita). Mesmo formato em backend/src/lib/site-html.ts.
 */
export type SiteEdit = { find: string; until?: string; replace: string };

const EDIT_BLOCK = /<edit>\s*<find>([\s\S]*?)<\/find>\s*(?:<until>([\s\S]*?)<\/until>\s*)?<replace>([\s\S]*?)<\/replace>\s*<\/edit>/g;

/** Tira do fim um pedaço de tag de fechamento que ainda está chegando ("</si"). */
function trimPartialTag(text: string, tag: string) {
  for (let size = Math.min(tag.length - 1, text.length); size > 0; size--) {
    if (text.endsWith(tag.slice(0, size))) return text.slice(0, -size);
  }
  return text;
}

// O agente escreve o site, vê os prints e corrige com <edit> depois, e fecha
// com <reply>: vale a última resposta, o último <site> e as trocas depois dele.
export function parseReply(raw: string): ParsedReply {
  const replyAt = raw.lastIndexOf("<reply>");
  const reply = replyAt >= 0 ? trimPartialTag(raw.slice(replyAt + 7).split("</reply>")[0]!, "</reply>").trim() : "";
  const declineAt = raw.indexOf("<decline>");
  const decline = declineAt >= 0 ? trimPartialTag(raw.slice(declineAt + 9).split("</decline>")[0]!, "</decline>").trim() : "";
  const refuseAt = raw.indexOf("<refuse>");
  const refuse = refuseAt >= 0 ? trimPartialTag(raw.slice(refuseAt + 8).split("</refuse>")[0]!, "</refuse>").trim() : "";

  let site: string | null = null;
  let siteDone = false;
  let rest = raw;
  const start = raw.lastIndexOf("<site>");
  if (start >= 0) {
    const end = raw.indexOf("</site>", start);
    siteDone = end >= 0;
    site = (siteDone ? raw.slice(start + 6, end) : trimPartialTag(raw.slice(start + 6), "</site>")).replace(/^\s+/, "");
    rest = siteDone ? raw.slice(end + 7) : "";
  }

  const edits = [...rest.matchAll(EDIT_BLOCK)].map((m) => ({ find: m[1]!, until: m[2], replace: m[3]! }));
  return { reply, decline, refuse, site, siteDone, edits };
}

/** Aplica as trocas em ordem; a que não acha o trecho exato é pulada e contada. */
export function applyEdits(html: string, edits: SiteEdit[]) {
  let failed = 0;
  let next = html;
  for (const { find, until, replace } of edits) {
    const at = find.length ? next.indexOf(find) : -1;
    const end = at < 0 ? -1 : until ? next.indexOf(until, at + find.length) : at;
    if (at < 0 || end < 0) {
      failed++;
      continue;
    }
    const stop = until ? end + until.length : at + find.length;
    next = next.slice(0, at) + replace + next.slice(stop);
  }
  return { html: next, failed };
}
