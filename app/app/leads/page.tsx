"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Kanban, MapPin, Phone } from "lucide-react";
import { siteSlug, slugify } from "@/lib/lead-search";
import { timestamp } from "@/lib/id";
import { leadsStore, LEAD_STAGES, markLeadContacted, type Lead, type LeadStage } from "@/lib/store/leads";
import { ensureDraft } from "@/lib/store/site-drafts";
import { sitesStore } from "@/lib/store/sites";
import { BusinessPhoto } from "../_components/business-photo";
import { ConfirmDelete, DeleteButton } from "../_components/confirm-delete";
import { GenerateButton } from "../_components/generate-button";
import { matches, SearchField } from "../_components/search-field";
import { WhatsAppLink } from "../_components/whatsapp-link";
import { EmptyState, HUE, PageHeader } from "../_components/ui";

type Filter = LeadStage | "todos";

const STAGE_ORDER = Object.fromEntries(LEAD_STAGES.map((stage, i) => [stage.id, i])) as Record<LeadStage, number>;

// Mesmo slug da busca quando o lead veio do Google: o site gerado lá
// aparece como criado aqui também.
function leadSlug(lead: Lead) {
  return lead.placeId ? siteSlug(lead.businessName, lead.placeId) : `${slugify(lead.businessName)}-${lead.id.slice(-5)}`;
}

export default function LeadsPage() {
  const leads = leadsStore.useAll();
  const sites = sitesStore.useAll();
  const [filter, setFilter] = useState<Filter>("todos");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  // "Gerar site" abre o gerador; os créditos são confirmados a cada prompt lá.
  function requestGenerate(lead: Lead) {
    const slug = leadSlug(lead);
    ensureDraft(
      slug,
      lead.placeId,
      {
        name: lead.businessName,
        kind: lead.category,
        neighborhood: lead.neighborhood || null,
        address: lead.address ?? null,
        phone: lead.phone ?? null,
        rating: null,
        reviews: null,
        mapsUrl: lead.mapsUrl ?? null,
        photo: lead.photo ?? null,
        color: lead.color,
      },
      timestamp(),
    );
    router.push(`/app/sites/${slug}`);
  }

  // "Todos": na ordem do funil; dentro de cada etapa, os mais novos primeiro.
  const found = leads.filter((lead) =>
    // Telefone também só com números: "34228808" acha "(67) 3422-8808".
    matches(search, [lead.businessName, lead.category, lead.neighborhood, lead.address, lead.phone, lead.phone?.replace(/\D/g, "")]),
  );
  const visible = found
    .filter((lead) => filter === "todos" || lead.stage === filter)
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Kanban}
        hue="coral"
        title="Leads"
        description="Acompanhe cada abordagem, do primeiro contato até a venda."
        action={
          leads.length > 0 ? (
            <SearchField
              id="busca-leads"
              label="Buscar nos leads"
              placeholder="Buscar por nome, bairro, telefone…"
              value={search}
              onChange={setSearch}
              className="w-full sm:w-80"
            />
          ) : undefined
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          icon={Kanban}
          hue="coral"
          title="Nenhum lead ainda"
          text="Salve um comércio na busca de leads e ele entra aqui como Novo. Depois é só ir movendo até Fechado."
          action={{ label: "Buscar leads", href: "/app/buscar" }}
          art={<ListSketch />}
        />
      ) : (
        <>
          {/* Filtro por etapa: cada aba na cor da etapa, com a contagem. */}
          <div role="tablist" aria-label="Etapas do funil" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <FilterTab active={filter === "todos"} onClick={() => setFilter("todos")} count={found.length} dotClass="bg-ink-2">
              Todos
            </FilterTab>
            {LEAD_STAGES.map((stage) => (
              <FilterTab
                key={stage.id}
                active={filter === stage.id}
                onClick={() => setFilter(stage.id)}
                count={found.filter((lead) => lead.stage === stage.id).length}
                dotClass={HUE[stage.hue].fill}
                activeClass={`${HUE[stage.hue].soft} ${HUE[stage.hue].ink} border-transparent`}
              >
                {stage.label}
              </FilterTab>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-line-strong px-5 py-10 text-center">
              <p className="text-[0.9rem] text-muted">
                {search.trim() ? `Nenhum lead encontrado para “${search.trim()}”${filter === "todos" ? "" : " nessa etapa"}.` : "Nenhum lead nessa etapa ainda."}
              </p>
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-[0.84rem] font-semibold text-ink transition-colors hover:border-ink/30"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  generated={sites.some((site) => site.slug === leadSlug(lead))}
                  onGenerate={() => requestGenerate(lead)}
                  onDelete={() => setPending({ id: lead.id, name: lead.businessName })}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDelete
        target={pending?.name ?? null}
        kind="lead"
        detail="O comércio sai da sua lista de leads, com a etapa em que estava."
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) leadsStore.remove(pending.id);
          setPending(null);
        }}
      />
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  count,
  dotClass,
  activeClass = "bg-ink text-bg border-transparent",
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  dotClass: string;
  activeClass?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[0.88rem] font-semibold transition-colors duration-200 ${
        active ? activeClass : "border-line-strong bg-surface text-ink-2 hover:border-ink/30 hover:text-ink"
      }`}
    >
      <span className={`size-2 rounded-full ${active && activeClass.includes("bg-ink") ? "bg-bg" : dotClass}`} aria-hidden="true" />
      {children}
      <span className="tabular opacity-75">{count}</span>
    </button>
  );
}

function LeadCard({
  lead,
  generated,
  onGenerate,
  onDelete,
}: {
  lead: Lead;
  generated: boolean;
  onGenerate: () => void;
  onDelete: () => void;
}) {
  const stage = LEAD_STAGES.find((s) => s.id === lead.stage) ?? LEAD_STAGES[0];

  return (
    <li className="rise-in group relative flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:gap-5 sm:py-3.5 sm:pl-4 sm:pr-12">
      {/* Quem é */}
      <div className="flex min-w-0 flex-1 items-center gap-4 pr-8 sm:pr-0">
        <BusinessPhoto
          photo={lead.photo}
          name={lead.businessName}
          color={lead.color}
          size={56}
          className="rounded-[14px]"
          initialClassName="text-[1.1rem]"
        />
        <div className="min-w-0">
          <p className="truncate text-[1rem] font-semibold text-ink">{lead.businessName}</p>
          <p className="truncate text-[0.84rem] text-muted">
            {lead.category}
            {lead.neighborhood && ` · ${lead.neighborhood}`}
          </p>
          {lead.address && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[0.8rem] text-muted">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{lead.address}</span>
            </p>
          )}
        </div>
      </div>

      {/* Contato */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {lead.phone ? (
          <WhatsAppLink phone={lead.phone} onOpen={() => markLeadContacted({ id: lead.id })} />
        ) : (
          <span className="inline-flex h-9 items-center gap-1.5 px-1 text-[0.84rem] text-muted tabular">
            <Phone className="size-3.5" aria-hidden="true" />
            {lead.phoneEnd ? `(00) 9 ••••-${lead.phoneEnd}` : "Sem telefone"}
          </span>
        )}
        {lead.mapsUrl && (
          <a
            href={lead.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[0.84rem] font-semibold text-ink transition-colors hover:border-ink/30"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Maps
          </a>
        )}
        <GenerateButton generated={generated} onClick={onGenerate} />
      </div>

      {/* Etapa */}
      <div className="relative shrink-0 sm:w-48">
        <label className="sr-only" htmlFor={`stage-${lead.id}`}>
          Etapa do funil
        </label>
        <span className={`pointer-events-none absolute left-3.5 top-1/2 size-2 -translate-y-1/2 rounded-full ${HUE[stage.hue].fill}`} aria-hidden="true" />
        <select
          id={`stage-${lead.id}`}
          value={lead.stage}
          onChange={(event) => leadsStore.update(lead.id, { stage: event.target.value as LeadStage })}
          className={`h-10 w-full appearance-none rounded-full border border-transparent pl-8 pr-9 text-[0.86rem] font-semibold outline-none transition-colors duration-200 hover:border-ink/20 focus-visible:border-green focus-visible:shadow-[0_0_0_4px_var(--lime-soft)] ${HUE[stage.hue].soft} ${HUE[stage.hue].ink}`}
        >
          {LEAD_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 ${HUE[stage.hue].ink}`} aria-hidden="true" />
      </div>

      <DeleteButton label={`Apagar o lead ${lead.businessName}`} onClick={onDelete} className="absolute right-3 top-3 sm:top-1/2 sm:-translate-y-1/2" />
    </li>
  );
}

// Esboço da lista vazia: três cartões com a cor de cada etapa.
function ListSketch() {
  return (
    <div className="mx-auto max-w-xl space-y-2 [mask-image:linear-gradient(180deg,#000_55%,transparent_100%)]" aria-hidden="true">
      {LEAD_STAGES.slice(0, 3).map((stage, i) => (
        <div key={stage.id} className="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-3 py-2.5">
          <span className="size-9 shrink-0 rounded-[10px] bg-surface-2" />
          <span className="flex-1 space-y-1.5">
            <span className="block h-2 rounded-full bg-line-strong" style={{ width: `${70 - i * 12}%` }} />
            <span className="block h-1.5 w-2/5 rounded-full bg-surface-2" />
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-semibold ${HUE[stage.hue].soft} ${HUE[stage.hue].ink}`}>
            <span className={`size-1.5 rounded-full ${HUE[stage.hue].fill}`} />
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  );
}
