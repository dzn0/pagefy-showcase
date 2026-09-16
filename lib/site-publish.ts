// Publica o site no link público (/p/<slug>). Roda sozinho a cada versão
// nova no gerador e, pra sites antigos, na hora de copiar o link. O backend
// devolve o slug público (pode ganhar -2 se outra pessoa já publicou o mesmo
// comércio) e, na primeira vez, a chave que deixa só este navegador atualizar.
import { apiFetch, apiPost } from "./api";
import { loadDraft, saveDraft, type SiteDraft } from "./store/site-drafts";

export function publicUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "https://pagefy.app");
  return `${base.replace(/\/$/, "")}/p/${slug}`;
}

/** Texto do link sem o protocolo, pros cards ("pagefy.app/p/..."). */
export function publicUrlLabel(slug: string) {
  return publicUrl(slug).replace(/^https?:\/\//, "");
}

/**
 * Tira o site do link público (apagar o site). true = o link não abre mais
 * (ou nunca foi publicado); false = não deu, e o site deve ficar como está
 * pra tentar de novo (sem o rascunho, a chave de edição se perderia).
 */
export async function unpublishDraft(draft: SiteDraft | null): Promise<boolean> {
  if (!draft?.publicSlug) return true;
  try {
    const res = await apiFetch(`/sites/public/${draft.publicSlug}`, { method: "DELETE", headers: draft.editKey ? { "x-edit-key": draft.editKey } : {} });
    return res.ok;
  } catch {
    return false;
  }
}

/** Publica o HTML atual do rascunho; devolve o slug público (ou null se não deu). */
export async function publishDraft(draft: SiteDraft): Promise<string | null> {
  if (!draft.html) return null;
  try {
    const res = await apiPost("/sites/publish", {
      slug: draft.slug,
      publicSlug: draft.publicSlug,
      editKey: draft.editKey,
      name: draft.business.name,
      html: draft.html,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug: string; editKey?: string };
    // Grava por cima do rascunho mais recente (pode ter mudado enquanto publicava).
    const latest = loadDraft(draft.slug) ?? draft;
    saveDraft({ ...latest, publicSlug: data.slug, editKey: data.editKey ?? latest.editKey, publishedAt: Date.now() });
    return data.slug;
  } catch {
    return null;
  }
}
