"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, ExternalLink, Globe, LoaderCircle, PenLine } from "lucide-react";
import type { Hue } from "@/lib/dashboard-nav";
import { CATEGORIES } from "@/lib/demo-data";
import { createId } from "@/lib/id";
import { publicUrl, publicUrlLabel, publishDraft, unpublishDraft } from "@/lib/site-publish";
import { fetchPendingJobs } from "@/lib/site-stream";
import { deleteDraft, draftTitle, loadAllDrafts, loadDraft, loadDraftHtml, loadGeneratingDrafts, type SiteDraft } from "@/lib/store/site-drafts";
import { sitesStore, type SiteStatus } from "@/lib/store/sites";
import { ConfirmDelete, DeleteButton } from "../_components/confirm-delete";
import { matches, SearchField } from "../_components/search-field";
import { SitePreview } from "../_components/site-preview";
import { SiteThumb } from "../_components/site-thumb";
import { Badge, EmptyState, PageHeader } from "../_components/ui";

const STATUS: Record<SiteStatus, { label: string; hue: Hue }> = {
  rascunho: { label: "Rascunho", hue: "neutral" },
  publicado: { label: "Publicado", hue: "green" },
  vendido: { label: "Vendido", hue: "honey" },
};

export default function SitesPage() {
  const sites = sitesStore.useAll();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // O shell só monta no cliente: dá pra ler os rascunhos direto no estado inicial.
  const [htmlBySlug] = useState(loadDraftHtml);
  // Primeiro site ainda sendo gerado (a IA segue no servidor mesmo fora do gerador).
  const [generating, setGenerating] = useState<SiteDraft[]>(() => loadGeneratingDrafts().filter((draft) => !sites.some((site) => site.slug === draft.slug)));
  // O servidor também lembra as gerações por site: pega as que este navegador não guardou.
  useEffect(() => {
    // Versões recriadas antes de entrarem em Sites na hora: põe na lista.
    const listed = new Set(sitesStore.getAll().map((site) => site.slug));
    for (const draft of loadAllDrafts()) {
      if (!draft.sourceSlug || listed.has(draft.slug)) continue;
      sitesStore.add({
        id: createId("site"),
        businessName: draftTitle(draft),
        slug: draft.slug,
        category: draft.business.kind ?? "Comércio",
        color: draft.business.color,
        status: "rascunho",
        createdAt: draft.updatedAt,
      });
    }
    const drafts = loadAllDrafts().filter((draft) => !draft.html);
    void fetchPendingJobs(drafts.map((draft) => draft.slug)).then((jobs) => {
      const found = drafts.filter((draft) => jobs.some((job) => job.slug === draft.slug));
      if (found.length) setGenerating((list) => [...list, ...found.filter((draft) => !list.some((d) => d.slug === draft.slug))]);
    });
  }, []);
  const found = sites.filter((site) => matches(search, [site.businessName, site.category, site.slug]));
  // Primeiro pedido parado porque o comércio já tem site: espera "Criar mesmo assim" no gerador.
  const [waiting] = useState<SiteDraft[]>(() => loadAllDrafts().filter((draft) => draft.websiteFound && !draft.html && !draft.pending));
  const pendingCards = [
    ...generating.map((draft) => ({ draft, state: "generating" as const })),
    ...waiting.filter((draft) => !generating.some((d) => d.slug === draft.slug)).map((draft) => ({ draft, state: "waiting" as const })),
  ].filter(({ draft }) => !sites.some((site) => site.slug === draft.slug));
  const shownPending = pendingCards.filter(({ draft }) => matches(search, [draftTitle(draft), draft.business.kind, draft.slug]));

  // Slug público de cada site (pode ter ganhado sufixo ao publicar).
  const [publicSlugs, setPublicSlugs] = useState<Record<string, string>>(() =>
    Object.fromEntries(sites.flatMap((site) => {
      const slug = loadDraft(site.slug)?.publicSlug;
      return slug ? [[site.slug, slug]] : [];
    })),
  );
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  // Copia o link público; site antigo, ainda não publicado, publica antes.
  async function copyLink(id: string, slug: string) {
    let target = publicSlugs[slug];
    if (!target) {
      const draft = loadDraft(slug);
      setPublishingId(id);
      target = (draft && (await publishDraft(draft))) || "";
      setPublishingId(null);
      if (!target) {
        setFailedId(id);
        setTimeout(() => setFailedId((current) => (current === id ? null : current)), 2600);
        return;
      }
      setPublicSlugs((map) => ({ ...map, [slug]: target }));
    }
    await navigator.clipboard?.writeText(publicUrl(target));
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Globe}
        hue="grape"
        title="Sites"
        description="Todos os sites que você já gerou, com o status de cada um."
        action={
          sites.length > 0 ? (
            <div className="flex w-full items-center gap-4 sm:w-auto">
              <p className="shrink-0 text-[0.88rem] text-muted">
                <span className="font-display text-[1.2rem] font-semibold text-ink tabular">{sites.length}</span>{" "}
                {sites.length === 1 ? "site" : "sites"}
              </p>
              <SearchField
                id="busca-sites"
                label="Buscar nos sites"
                placeholder="Buscar por nome ou ramo…"
                value={search}
                onChange={setSearch}
                className="w-full sm:w-72"
              />
            </div>
          ) : undefined
        }
      />

      {deleteError && (
        <p role="alert" className="rounded-[14px] bg-coral-soft px-4 py-3 text-[0.88rem] leading-snug text-coral-ink">
          {deleteError}
        </p>
      )}

      {sites.length === 0 && pendingCards.length === 0 ? (
        <EmptyState
          icon={Globe}
          hue="grape"
          title="Nenhum site gerado ainda"
          text="Busque uma região e gere o primeiro site a partir de um comércio sem site. Ele aparece aqui com o link pra mandar ao dono."
          action={{ label: "Buscar leads", href: "/app/buscar" }}
          art={
            <div className="mx-auto grid max-w-xl grid-cols-3 gap-4 [mask-image:linear-gradient(180deg,#000_55%,transparent_100%)]" aria-hidden="true">
              {[CATEGORIES.restaurantes, CATEGORIES.saloes, CATEGORIES.pet].map((category, i) => (
                <SiteThumb key={category.id} name={category.short} color={category.color} className={i === 1 ? "-translate-y-3" : ""} />
              ))}
            </div>
          }
        />
      ) : (
        found.length === 0 && shownPending.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-line-strong px-5 py-10 text-center">
          <p className="text-[0.9rem] text-muted">Nenhum site encontrado para “{search.trim()}”.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-[0.84rem] font-semibold text-ink transition-colors hover:border-ink/30"
          >
            Limpar busca
          </button>
        </div>
        ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Em andamento ou esperando resposta: na mesma grade, antes dos prontos. */}
          {shownPending.map(({ draft, state }) => (
            <PendingSiteCard key={draft.slug} draft={draft} state={state} />
          ))}
          {found
            .slice()
            .reverse()
            .map((site) => {
              const copied = copiedId === site.id;
              return (
                <li key={site.id} className="rise-in group relative flex flex-col rounded-[22px] border border-line bg-surface p-3 shadow-card">
                  <DeleteButton
                    label={`Apagar o site de ${site.businessName}`}
                    onClick={() => setPending({ id: site.id, name: site.businessName })}
                    className="absolute right-5 top-5 z-10"
                  />
                  <Link href={`/app/sites/${site.slug}`} aria-label={`Abrir o site de ${site.businessName}`} className="block rounded-[16px] bg-surface-2 p-4">
                    {htmlBySlug[site.slug] ? (
                      <SitePreview html={htmlBySlug[site.slug]!} title={site.businessName} />
                    ) : (
                      <SiteThumb name={site.businessName} color={site.color} />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate font-semibold text-ink" title={site.businessName}>
                        {site.businessName}
                      </p>
                      <Badge hue={STATUS[site.status].hue} dot>
                        {STATUS[site.status].label}
                      </Badge>
                    </div>
                    <p className="mb-3 mt-0.5 text-[0.82rem] text-muted">{site.category}</p>
                    <p className="mt-auto truncate whitespace-nowrap rounded-full bg-surface-2 px-3 py-1.5 font-mono text-[0.72rem] text-ink-2">
                      {publicUrlLabel(publicSlugs[site.slug] ?? site.slug)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copyLink(site.id, site.slug)}
                        disabled={!htmlBySlug[site.slug] || publishingId === site.id}
                        title={htmlBySlug[site.slug] ? undefined : "Gere o site no gerador primeiro"}
                        className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full text-[0.82rem] font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97] ${
                          copied ? "bg-lime-soft text-green-ink" : "bg-grape text-on-hue hover:brightness-110"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {publishingId === site.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : copied ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3.5" aria-hidden="true" />
                        )}
                        {publishingId === site.id ? "Publicando" : copied ? "Link copiado" : failedId === site.id ? "Tente de novo" : "Copiar link"}
                      </button>
                      {publicSlugs[site.slug] && (
                        <a
                          href={publicUrl(publicSlugs[site.slug]!)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir o site de ${site.businessName}`}
                          title="Abrir o link público"
                          className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
                        >
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                      )}
                      <Link
                        href={`/app/sites/${site.slug}`}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[0.82rem] font-semibold text-ink transition-colors hover:border-ink/30"
                      >
                        <PenLine className="size-3.5" aria-hidden="true" />
                        Editar
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
        )
      )}

      <ConfirmDelete
        target={pending?.name ?? null}
        kind="site"
        detail="O site sai da sua lista, a conversa com a IA é apagada e o link de preview sai do ar."
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          const target = pending;
          setPending(null);
          const slug = sites.find((site) => site.id === target.id)?.slug;
          const draft = slug ? loadDraft(slug) : null;
          // Primeiro tira o link do ar; só então apaga o rascunho (que guarda a
          // chave pra isso) e o site da lista. Sem isso, a versão recriada voltaria.
          void unpublishDraft(draft).then((ok) => {
            if (!ok) {
              setDeleteError(`Não deu pra tirar o link de ${target.name} do ar agora. O site continua na lista; tente apagar de novo.`);
              return;
            }
            setDeleteError(null);
            if (slug) deleteDraft(slug);
            sitesStore.remove(target.id);
          });
        }}
      />
    </div>
  );
}

// Card de um site que ainda não ficou pronto, na mesma grade dos prontos:
// gerando (a IA segue no servidor) ou esperando a resposta sobre o site próprio
// que a conferência achou.
function PendingSiteCard({ draft, state }: { draft: SiteDraft; state: "generating" | "waiting" }) {
  const title = draftTitle(draft);
  const generating = state === "generating";
  return (
    <li className="rise-in flex flex-col rounded-[22px] border border-line bg-surface p-3 shadow-card">
      <Link
        href={`/app/sites/${draft.slug}`}
        className="block rounded-[16px] bg-surface-2 p-4"
        aria-label={generating ? `Acompanhar a geração de ${title}` : `Responder sobre o site de ${title}`}
      >
        {generating ? (
          <div className="overflow-hidden rounded-[14px] border border-line bg-surface shadow-soft">
            <div className="flex items-center gap-1 border-b border-line px-2.5 py-1.5" aria-hidden="true">
              <span className="size-1.5 rounded-full bg-line-strong" />
              <span className="size-1.5 rounded-full bg-line-strong" />
              <span className="size-1.5 rounded-full bg-line-strong" />
              <span className="ml-1.5 h-1.5 flex-1 rounded-full bg-surface-2" />
            </div>
            <div className="flex aspect-[16/10] flex-col gap-2.5 p-4" aria-hidden="true">
              <div className="pf-skeleton h-3 w-2/5 rounded-full" />
              <div className="pf-skeleton h-[42%] w-full rounded-[8px]" />
              <div className="pf-skeleton h-2.5 w-3/4 rounded-full" />
              <div className="grid flex-1 grid-cols-3 gap-2">
                <div className="pf-skeleton rounded-[6px]" />
                <div className="pf-skeleton rounded-[6px]" />
                <div className="pf-skeleton rounded-[6px]" />
              </div>
            </div>
          </div>
        ) : (
          <SiteThumb name={title} color={draft.business.color} />
        )}
      </Link>
      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-semibold text-ink" title={title}>
            {title}
          </p>
          {generating ? (
            <Badge hue="grape">
              <LoaderCircle className="size-3 animate-spin" aria-hidden="true" />
              Gerando
            </Badge>
          ) : (
            <Badge hue="honey" dot>
              Sua resposta
            </Badge>
          )}
        </div>
        <p className="mb-3 mt-0.5 text-[0.82rem] leading-snug text-muted">
          {generating
            ? "A IA está montando o site. Pode sair desta tela: ela continua trabalhando."
            : "Achamos um site próprio deste comércio. Decida se quer criar mesmo assim; nada foi cobrado."}
        </p>
        <Link
          href={`/app/sites/${draft.slug}`}
          className={`mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[0.82rem] font-semibold transition-[filter,transform,background-color] duration-200 active:scale-[0.97] ${
            generating ? "bg-grape text-on-hue hover:brightness-110" : "border border-line-strong text-ink hover:border-ink/30 hover:bg-surface-2"
          }`}
        >
          {generating ? "Acompanhar" : "Ver e decidir"}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}
