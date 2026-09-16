"use client";

import { createElement, type FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dices,
  ExternalLink,
  LayoutGrid,
  List,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, CATEGORY_LIST, EXAMPLE_CITIES, inRamo, randomCity, normalizeRamo, ramoLabel, SEGMENT_PREFIX, SEGMENTS, segmentOf } from "@/lib/demo-data";
import { apiFetch } from "@/lib/api";
import { businessIcon } from "@/lib/business-icons";
import { hydrateBusiness, kindOf, photoSrc, type ApiBusiness, type LeadBusiness, type LeadSearchError, type LeadSearchResult } from "@/lib/lead-search";
import { createId, timestamp } from "@/lib/id";
import { SITE_PRICE } from "@/lib/site-pricing";
import { affords, CREDIT_COSTS, refreshCredits, setCredits, useCredits } from "@/lib/store/credits";
import { loadLastSearch, saveLastSearch } from "@/lib/store/last-search";
import { leadsStore } from "@/lib/store/leads";
import { ensureDraft } from "@/lib/store/site-drafts";
import { sitesStore } from "@/lib/store/sites";
import { BusinessPhoto } from "../_components/business-photo";
import { CityMap } from "../_components/city-map";
import { ConfirmSpend, type SpendRequest } from "../_components/confirm-spend";
import { GenerateButton } from "../_components/generate-button";
import { MapPreview } from "../_components/map-preview";
import { PhotoLightbox, type LightboxPhoto } from "../_components/photo-lightbox";
import { WhatsAppLink } from "../_components/whatsapp-link";
import { Badge, HueTile, PageHeader, Panel } from "../_components/ui";

// A home manda a cidade pela URL (?cidade=). A `key` recomeça a busca se a
// cidade da URL mudar sem sair da página.
export default function BuscarLeadsPage() {
  return (
    <Suspense fallback={null}>
      <BuscarFromUrl />
    </Suspense>
  );
}

// ?cidade= (busca), ?ramo= (ramo já escolhido) e ?destaque= (id do comércio
// que deve abrir selecionado — vem do "Gerar este site" da landing).
function BuscarFromUrl() {
  const params = useSearchParams();
  const city = (params.get("cidade") ?? "").trim();
  const ramo = params.get("ramo") ?? "";
  const highlight = params.get("destaque");
  return (
    <BuscarLeads
      key={`${city}|${ramo}|${highlight ?? ""}`}
      initialCity={city}
      initialRamo={normalizeRamo(ramo) || null}
      highlightId={highlight}
    />
  );
}

function BuscarLeads({
  initialCity,
  initialRamo,
  highlightId,
}: {
  initialCity: string;
  initialRamo: string | null;
  highlightId: string | null;
}) {
  const credits = useCredits();
  const router = useRouter();
  // O shell só monta esta página no cliente, então dá pra ler o
  // localStorage direto no estado inicial: a última busca volta pra tela.
  const [lastSearch] = useState(loadLastSearch);
  const [query, setQuery] = useState(initialCity || lastSearch?.query || "");
  const [ramo, setRamo] = useState(initialRamo ?? normalizeRamo(lastSearch?.result.ramo));
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<LeadSearchResult | null>(lastSearch?.result ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(lastSearch?.result.businesses[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ResultsView>(loadView);
  const [sort, setSort] = useState<Sort>(loadSort);
  // Foto aberta em tela cheia (clique na foto do card ou do detalhe).
  const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);
  const pageSize = PAGE_SIZE[view];

  const leads = leadsStore.useAll();
  const sites = sitesStore.useAll();

  // Ação paga aguardando confirmação (custo + saldo no pop-up).
  const [spend, setSpend] = useState<SpendRequest | null>(null);
  const businesses = sortBusinesses(
    result
      ? result.businesses.filter(
          (b) => (minRating === 0 || (b.rating ?? 0) >= minRating) && inRamo(b.category, ramo),
        )
      : [],
    sort,
  );
  // O filtro pede algo que a última busca não trouxe (ex.: buscou Barbearias
  // e escolheu Academias): precisa de uma busca nova.
  const ramoChanged = Boolean(result && !coversRamo(normalizeRamo(result.ramo), ramo));

  // Resultados em páginas: a busca pode trazer dezenas de comércios.
  const pageCount = Math.max(1, Math.ceil(businesses.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = businesses.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  function goToPage(next: number) {
    const target = Math.min(Math.max(next, 0), pageCount - 1);
    setPage(target);
    setSelectedId(businesses[target * pageSize]?.id ?? null);
    document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Troca grade/lista sem perder o lugar: abre a página onde estava o
  // primeiro comércio que a pessoa via.
  // Trocar a ordem volta pra primeira página: o que estava na página 3 não
  // tem mais nada a ver com o que está lá depois de reordenar.
  function changeSort(next: Sort) {
    setSort(next);
    saveSort(next);
    setPage(0);
    setSelectedId(null);
  }

  function changeView(next: ResultsView) {
    if (next === view) return;
    setPage(Math.floor((currentPage * pageSize) / PAGE_SIZE[next]));
    setView(next);
    saveView(next);
  }

  // Clicou num pino: seleciona e traz o comércio pra vista.
  function selectFromMap(id: string) {
    setSelectedId(id);
    document.getElementById(`lead-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Pedir uma busca: valida a cidade e abre a confirmação de custo. A busca
  // só roda (e só cobra) depois de confirmar.
  function requestSearch(event?: FormEvent, cityOverride?: string) {
    event?.preventDefault();
    const city = (cityOverride ?? query).trim();
    if (city.length < 2) {
      setError("Digite uma cidade ou bairro para buscar.");
      return;
    }
    setError(null);
    setSpend({
      title: `Buscar comércios em ${city}?`,
      description: ramo ? `Busca de ${ramoLabel(ramo)} sem site, com dados reais do Google.` : "Busca em todos os ramos, com dados reais do Google.",
      cost: CREDIT_COSTS.search,
      confirmLabel: "Buscar",
      icon: Search,
      hue: "azure",
      onConfirm: () => void runSearch(city),
    });
  }

  // Dado: sorteia uma cidade (nunca a que já está no campo) e já pede a busca.
  const [rolls, setRolls] = useState(0);
  function rollCity() {
    const city = randomCity(query);
    setQuery(city);
    setRolls((n) => n + 1);
    requestSearch(undefined, city);
  }

  async function runSearch(city = query.trim()) {
    if (!spendCheck(CREDIT_COSTS.search)) return;
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ cidade: city, ...(ramo ? { ramo } : {}) });
      const res = await apiFetch(`/leads/search?${params}`);
      const raw = (await res.json()) as (Omit<LeadSearchResult, "businesses"> & { businesses: ApiBusiness[]; credits?: number }) | LeadSearchError;
      if (!res.ok || "error" in raw) {
        setError("error" in raw ? raw.error : "Não deu para buscar agora. Tente de novo.");
        // 402 (saldo) ou falha: o servidor já devolveu o que cobrou; pega o saldo certo.
        void refreshCredits();
        return;
      }
      // Quem cobra é o servidor (só a busca que deu certo); aqui só entra o saldo novo.
      setCredits(raw.credits);
      const data: LeadSearchResult = { ...raw, businesses: raw.businesses.map(hydrateBusiness) };
      saveLastSearch({ query: city, result: data });
      setResult(data);
      // Veio com um comércio em destaque: abre na página dele, já selecionado.
      const highlighted = highlightId ? data.businesses.findIndex((b) => b.id === highlightId) : -1;
      setPage(highlighted >= 0 ? Math.floor(highlighted / pageSize) : 0);
      setSelectedId(highlighted >= 0 ? highlightId : (data.businesses[0]?.id ?? null));
    } catch {
      setError("Não deu para falar com o servidor do Pagefy. Confira a internet (ou se o backend está rodando) e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  // Chegou da Início (ou da landing) com a cidade: já abre a confirmação.
  useEffect(() => {
    if (initialCity.length < 2) return;
    const id = setTimeout(() => requestSearch(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveLead(business: LeadBusiness) {
    leadsStore.add({
      id: createId("lead"),
      businessName: business.name,
      category: kindOf(business),
      neighborhood: business.neighborhood,
      phoneEnd: (business.phone ?? "").replace(/\D/g, "").slice(-4),
      phone: business.phone,
      address: business.address,
      placeId: business.id,
      mapsUrl: business.mapsUrl,
      photo: business.photo?.name ?? null,
      color: business.category.color,
      stage: "novo",
      createdAt: timestamp(),
    });
    setSavedIds((prev) => new Set(prev).add(business.id));
  }

  // Só uma dica pra não pedir o que obviamente não cabe; quem decide é o servidor.
  function spendCheck(cost: number) {
    return affords(cost);
  }

  // "Gerar site" abre o gerador (a confirmação de créditos fica pra cada
  // prompt lá dentro). O rascunho leva os dados que a busca já tem.
  function requestGenerate(business: LeadBusiness) {
    // Quem vai gerar o site já está trabalhando esse comércio: vira lead (Novo) na hora.
    if (!leadsStore.getAll().some((lead) => lead.placeId === business.id)) saveLead(business);
    ensureDraft(
      business.slug,
      business.id,
      {
        name: business.name,
        kind: kindOf(business),
        neighborhood: business.neighborhood || null,
        address: business.address || null,
        phone: business.phone,
        rating: business.rating,
        reviews: business.reviews,
        mapsUrl: business.mapsUrl,
        photo: business.photo?.name ?? null,
        color: business.category.color,
      },
      timestamp(),
    );
    router.push(`/app/sites/${business.slug}`);
  }

  const selected = pageItems.find((b) => b.id === selectedId) ?? null;
  const isSaved = (business: LeadBusiness) => savedIds.has(business.id) || leads.some((lead) => lead.placeId === business.id);
  const isGenerated = (business: LeadBusiness) => sites.some((site) => site.slug === business.slug);

  // Busca de um ramo com o filtro trocado, ou nada pra mostrar: o mesmo aviso
  // nas duas vistas.
  const notice = !result ? null : ramoChanged ? (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <p className="text-[0.92rem] text-ink-2">
        Essa busca foi só de <strong className="font-semibold text-ink">{ramoLabel(normalizeRamo(result.ramo))}</strong>. Para ver{" "}
        {ramoLabel(ramo)}, busque de novo.
      </p>
      <button
        type="button"
        onClick={() => requestSearch()}
        disabled={loading}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-green px-4 text-[0.88rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] disabled:opacity-55"
      >
        <Search className="size-4" aria-hidden="true" /> Buscar de novo
      </button>
    </div>
  ) : businesses.length === 0 ? (
    <p className="px-5 py-10 text-center text-[0.9rem] text-muted">
      {result.businesses.length === 0
        ? "Todos os comércios que o Google achou já têm site próprio. Tente outro bairro, cidade ou ramo."
        : "Nenhum comércio com esses filtros. Tente outro ramo ou uma nota menor."}
    </p>
  ) : null;

  return (
    // Na grade a página inteira sai do limite de largura do app (pf-wide),
    // pra os cards usarem as margens das telas grandes; tudo mantém a mesma borda.
    <div className={`space-y-6 ${view === "grid" ? "pf-wide" : ""}`}>
      <PageHeader
        icon={Search}
        hue="azure"
        title="Buscar leads"
        description="Escolha uma região e veja os comércios que ainda não têm site."
      />

      <Panel className="p-5 sm:p-6">
        <form onSubmit={requestSearch} noValidate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_17rem_9.5rem_auto] lg:items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Recuado o dado + o espaço (48 + 8 px): o rótulo começa junto com o campo. */}
            <label htmlFor="cidade" className="mb-1.5 block pl-14 text-[0.86rem] font-semibold text-ink-2">
              Cidade ou bairro
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={rollCity}
                disabled={loading}
                aria-label="Buscar numa cidade aleatória"
                title="Cidade aleatória"
                className="group grid size-12 shrink-0 place-items-center rounded-full border border-line-strong bg-bg text-azure transition-[border-color,background-color,transform] duration-200 hover:border-azure hover:bg-azure-soft active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {/* A key recria o ícone a cada sorteio: o giro roda de novo. */}
                <Dices
                  key={rolls}
                  className={`size-5 transition-transform duration-300 ease-(--ease-out-expo) group-hover:-rotate-12 ${rolls ? "animate-[pf-dice-roll_0.6s_var(--ease-out-expo)]" : ""}`}
                  aria-hidden="true"
                />
              </button>
            <div className="relative min-w-0 flex-1">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-azure" aria-hidden="true" />
              <input
                id="cidade"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ex.: Botucatu"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "cidade-erro" : undefined}
                className={`h-12 w-full rounded-full border bg-bg pl-11 pr-4 text-[0.96rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)] ${
                  error ? "border-danger" : "border-line-strong"
                }`}
              />
            </div>
            </div>
          </div>
          <SelectField
            id="ramo"
            label="Ramo"
            value={ramo}
            onChange={(v) => {
              setRamo(v);
              setPage(0);
            }}
          >
            <option value="">Todos os ramos</option>
            {/* Um grupo por segmento; a primeira opção pega o segmento inteiro. */}
            {SEGMENTS.map((segment) => (
              <optgroup key={segment.id} label={segment.label}>
                <option value={`${SEGMENT_PREFIX}${segment.id}`}>Tudo em {segment.label}</option>
                {CATEGORY_LIST.filter((category) => category.segment === segment.id).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </SelectField>
          <SelectField id="nota" label="Nota mínima" value={String(minRating)} onChange={(v) => {
              setMinRating(Number(v));
              setPage(0);
            }}>
            <option value="0">Qualquer</option>
            <option value="4">4,0 ou mais</option>
            <option value="4.5">4,5 ou mais</option>
          </SelectField>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green px-6 text-[0.94rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 sm:col-span-2 lg:col-span-1"
          >
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
            {loading ? "Buscando" : "Buscar"}
          </button>
        </form>

        {error && (
          <p id="cidade-erro" role="alert" className="mt-2.5 pl-4 text-[0.86rem] font-medium text-danger">
            {error}
          </p>
        )}
        {!result && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[0.84rem] text-muted">Tente:</span>
            {EXAMPLE_CITIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuery(example);
                  setError(null);
                }}
                className="rounded-full border border-line-strong px-3 py-1 text-[0.84rem] font-medium text-ink-2 transition-colors duration-200 hover:border-azure hover:bg-azure-soft hover:text-azure-ink"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </Panel>

      {!result && (
        <Panel className={`grid overflow-hidden transition-opacity duration-300 lg:grid-cols-[1fr_1.1fr] ${loading ? "opacity-50" : ""}`}>
          <div className="p-6 sm:p-8">
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">O que aparece depois da busca</h2>
            <ul className="mt-5 space-y-4">
              {[
                { icon: MapPin, hue: "azure" as const, title: "Comércios sem site", text: "Dados reais do Google: nome, bairro, telefone e endereço, no mapa e na lista." },
                { icon: Star, hue: "honey" as const, title: "Nota no Google", text: "Filtre pelos mais bem avaliados, que costumam receber melhor a visita." },
                { icon: Sparkles, hue: "grape" as const, title: "Site em um clique", text: `Gere a página do comércio por ${SITE_PRICE} créditos e mande o link.` },
              ].map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <HueTile icon={item.icon} hue={item.hue} />
                  <div>
                    <p className="text-[0.95rem] font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[0.88rem] leading-snug text-muted">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-60 border-t border-line lg:border-l lg:border-t-0">
            <CityMap className="absolute inset-0 h-full w-full" highlight={7} />
          </div>
        </Panel>
      )}

      {result && (
        <div
          id="resultados"
          className={`grid scroll-mt-24 items-start gap-5 transition-opacity duration-300 lg:grid-cols-[minmax(0,1fr)_360px] ${
            view === "list" ? "lg:items-stretch" : ""
          } ${loading ? "opacity-40" : ""}`}
        >
          {view === "list" ? (
            <Panel className="overflow-hidden">
              {/* O resumo abre a linha (é o dado); ordenar e trocar a vista ficam juntos, à direita. */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 pl-5 pr-3">
                <div className="min-w-0">
                  <ResultsSummary result={result} count={businesses.length} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SortControl sort={sort} onChange={changeSort} />
                  <ViewToggle view={view} onChange={changeView} />
                </div>
              </div>
              {notice ?? (
                <ul className="divide-y divide-line">
                  {pageItems.map((business) => (
                    <li
                      key={business.id}
                      id={`lead-${business.id}`}
                      onMouseEnter={() => setSelectedId(business.id)}
                      className={`flex scroll-mt-28 flex-col gap-3 px-5 py-3.5 transition-colors duration-200 sm:flex-row sm:items-center ${
                        selectedId === business.id ? "bg-lime-soft" : ""
                      }`}
                    >
                      <BusinessPhoto
                        photo={business.photo?.name}
                        name={business.name}
                        color={business.category.color}
                        size={48}
                        className="rounded-[12px]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{business.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.84rem] text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: business.category.color }}>
                              <TypeIcon business={business} className="size-3" strokeWidth={2.4} />
                            </span>
                            {kindOf(business)}
                            {business.neighborhood && ` · ${business.neighborhood}`}
                          </span>
                          <Rating business={business} />
                          {business.socialOnly && <Badge hue="coral">só {business.socialOnly}</Badge>}
                        </p>
                      </div>
                      <LeadActions
                        saved={isSaved(business)}
                        generated={isGenerated(business)}
                        onSave={() => saveLead(business)}
                        onGenerate={() => requestGenerate(business)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {!notice && pageCount > 1 && (
                <Pager page={currentPage} pageCount={pageCount} pageSize={pageSize} total={businesses.length} onChange={goToPage} />
              )}
            </Panel>
          ) : (
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pl-1">
                <div className="min-w-0">
                  <ResultsSummary result={result} count={businesses.length} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SortControl sort={sort} onChange={changeSort} />
                  <ViewToggle view={view} onChange={changeView} />
                </div>
              </div>
              {notice ? (
                <Panel>{notice}</Panel>
              ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] gap-4">
                  {pageItems.map((business) => (
                    <LeadCard
                      key={business.id}
                      business={business}
                      active={selectedId === business.id}
                      onHover={() => setSelectedId(business.id)}
                      onOpenPhoto={setLightbox}
                      actions={
                        <LeadActions
                          stretch
                          saved={isSaved(business)}
                          generated={isGenerated(business)}
                          onSave={() => saveLead(business)}
                          onGenerate={() => requestGenerate(business)}
                        />
                      }
                    />
                  ))}
                </ul>
              )}
              {!notice && pageCount > 1 && (
                <Panel className="mt-4 overflow-hidden">
                  <Pager bare page={currentPage} pageCount={pageCount} pageSize={pageSize} total={businesses.length} onChange={goToPage} />
                </Panel>
              )}
            </div>
          )}

          {/* Na grade o card já mostra o comércio inteiro: a coluna fica só com
              o mapa, preso no topo enquanto a grade rola. */}
          <div className={`flex flex-col gap-4 ${view === "grid" ? "lg:sticky lg:top-[6.25rem] lg:mt-[3.25rem]" : ""}`}>
            <MapPreview businesses={pageItems} selectedId={selectedId} onSelect={selectFromMap} />
            {view === "list" && selected && <SelectedDetail business={selected} onOpenPhoto={setLightbox} />}
          </div>
        </div>
      )}
      <PhotoLightbox photo={lightbox} onClose={() => setLightbox(null)} />
      <ConfirmSpend request={spend} balance={credits} onClose={() => setSpend(null)} />
    </div>
  );
}

/** A busca feita (resultRamo) já traz o que o filtro pede? */
function coversRamo(resultRamo: string, ramo: string) {
  if (resultRamo === "" || resultRamo === ramo) return true;
  const segment = segmentOf(resultRamo);
  return Boolean(segment && CATEGORIES[ramo]?.segment === segment.id);
}

type ResultsView = "grid" | "list";

// 12 na grade fecha as linhas de 2, 3 e 4 colunas; a lista segue com 10.
const PAGE_SIZE: Record<ResultsView, number> = { grid: 12, list: 10 };
const VIEW_KEY = "pagefy-buscar-view";

function loadView(): ResultsView {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function saveView(view: ResultsView) {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    // Sem storage: volta pra grade no próximo acesso.
  }
}

// Ordem da lista. "relevancia" é a que o Google devolveu (a busca já mistura
// distância, nota e quantidade de avaliações), e é o padrão.
type SortKey = "relevancia" | "nota" | "avaliacoes" | "nome";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const SORT_OPTIONS: Array<{ id: SortKey; label: string; asc: string; desc: string }> = [
  { id: "relevancia", label: "Relevância", asc: "", desc: "" },
  { id: "nota", label: "Nota", asc: "Da menor nota pra maior", desc: "Da maior nota pra menor" },
  { id: "avaliacoes", label: "Avaliações", asc: "Das menos avaliadas pras mais", desc: "Das mais avaliadas pras menos" },
  { id: "nome", label: "Nome", asc: "De A a Z", desc: "De Z a A" },
];

/** Direção que faz sentido abrir em cada ordem: melhores primeiro, nome de A a Z. */
const SORT_DEFAULT_DIR: Record<SortKey, Sort["dir"]> = { relevancia: "desc", nota: "desc", avaliacoes: "desc", nome: "asc" };

const SORT_KEY = "pagefy-buscar-ordem";
const DEFAULT_SORT: Sort = { key: "relevancia", dir: "desc" };

function loadSort(): Sort {
  try {
    const [key, dir] = (localStorage.getItem(SORT_KEY) ?? "").split(":");
    if (!SORT_OPTIONS.some((option) => option.id === key)) return DEFAULT_SORT;
    return { key: key as SortKey, dir: dir === "asc" ? "asc" : "desc" };
  } catch {
    return DEFAULT_SORT;
  }
}

function saveSort(sort: Sort) {
  try {
    localStorage.setItem(SORT_KEY, `${sort.key}:${sort.dir}`);
  } catch {
    // Sem storage: volta pra relevância no próximo acesso.
  }
}

/** Comércio sem nota fica por último nas duas direções: nota 0 não é "pior". */
function sortBusinesses(list: LeadBusiness[], sort: Sort) {
  if (sort.key === "relevancia") return list;
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    if (sort.key === "nome") return sign * a.name.localeCompare(b.name, "pt-BR");
    const left = sort.key === "nota" ? a.rating : a.reviews;
    const right = sort.key === "nota" ? b.rating : b.reviews;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    return sign * (left - right);
  });
}

// Ordem dos resultados: o que ordenar (menu) e pra que lado (botão da seta).
function SortControl({ sort, onChange }: { sort: Sort; onChange: (sort: Sort) => void }) {
  const option = SORT_OPTIONS.find((item) => item.id === sort.key) ?? SORT_OPTIONS[0]!;
  const ascending = sort.dir === "asc";
  const DirIcon = ascending ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc (igual ao menu de conta).
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    // Mesmo casco do Grade/Lista ao lado (pílula com borda, p-1, botões de h-8).
    // A lista é um menu nosso: a do <select> é desenhada pelo sistema (fundo
    // branco mesmo no tema escuro, com o texto sumindo) e não dá pra estilizar.
    <div ref={rootRef} className="relative">
      <div className="inline-flex rounded-full border border-line-strong bg-surface p-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Ordenar por: ${option.label}`}
          className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.84rem] font-semibold transition-colors duration-200 ${
            open ? "bg-surface-2 text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          <ArrowDownWideNarrow className="size-4" aria-hidden="true" />
          {option.label}
          <ChevronDown
            className={`size-3.5 text-muted transition-transform duration-200 ease-(--ease-out-expo) ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {sort.key !== "relevancia" && (
          <button
            type="button"
            onClick={() => onChange({ key: sort.key, dir: ascending ? "desc" : "asc" })}
            title={ascending ? option.asc : option.desc}
            aria-label={ascending ? option.asc : option.desc}
            className="grid size-8 place-items-center rounded-full text-ink-2 transition-colors duration-200 hover:bg-surface-2 hover:text-ink"
          >
            <DirIcon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div role="menu" className="absolute left-0 top-[calc(100%+8px)] z-30 w-48 rounded-2xl border border-line bg-surface p-1.5 shadow-frame">
          {SORT_OPTIONS.map((item) => {
            const current = item.id === sort.key;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                onClick={() => {
                  onChange({ key: item.id, dir: SORT_DEFAULT_DIR[item.id] });
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[0.9rem] font-medium transition-colors duration-200 ${
                  current ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {item.label}
                {current && <Check className="size-4 shrink-0 text-green-ink" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultsSummary({ result, count }: { result: LeadSearchResult; count: number }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-[0.94rem] text-ink-2">
      <span>
        <span className="font-display text-[1.35rem] font-semibold tracking-[-0.02em] text-ink tabular">{count}</span>{" "}
        {count === 1 ? "comércio sem site" : "comércios sem site"} em <strong className="font-semibold text-ink">{result.city}</strong>
        {result.ramo && <span className="text-muted"> · {ramoLabel(normalizeRamo(result.ramo))}</span>}
      </span>
      <span className="text-[0.8rem] text-muted tabular">
        de {result.scanned} {result.scanned === 1 ? "analisado" : "analisados"} no Google
      </span>
    </p>
  );
}

const VIEW_OPTIONS: Array<{ id: ResultsView; label: string; icon: LucideIcon }> = [
  { id: "grid", label: "Grade", icon: LayoutGrid },
  { id: "list", label: "Lista", icon: List },
];

// Controle segmentado (radiogroup), como o de mensal/semestral do plano.
function ViewToggle({ view, onChange }: { view: ResultsView; onChange: (view: ResultsView) => void }) {
  return (
    <div role="radiogroup" aria-label="Ver resultados em" className="inline-flex rounded-full border border-line-strong bg-surface p-1">
      {VIEW_OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.84rem] font-semibold transition-colors duration-200 ${
              active ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// Ícone do tipo do comércio (garfo e faca, tesoura, pata…), ver lib/business-icons.
function TypeIcon({
  business,
  ...props
}: { business: LeadBusiness } & Omit<React.ComponentProps<LucideIcon>, "ref">) {
  return createElement(businessIcon(business), { "aria-hidden": true, ...props });
}

function Rating({ business }: { business: LeadBusiness }) {
  if (business.rating === null) return null;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-ink-2 tabular">
      <Star className="size-3.5 fill-honey text-honey" aria-hidden="true" />
      {business.rating.toFixed(1).replace(".", ",")}
      <span className="font-normal text-muted">({business.reviews})</span>
    </span>
  );
}

function LeadActions({
  saved,
  generated,
  onSave,
  onGenerate,
  stretch = false,
}: {
  saved: boolean;
  generated: boolean;
  onSave: () => void;
  onGenerate: () => void;
  /** Card da grade: os botões dividem a largura (um em cima do outro se o card for estreito). */
  stretch?: boolean;
}) {
  return (
    <div className={stretch ? "grid gap-2 @[17.5rem]:grid-cols-2" : "flex shrink-0 gap-2"}>
      <button
        type="button"
        onClick={onSave}
        disabled={saved}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[0.82rem] font-semibold text-ink transition-colors duration-200 hover:border-coral hover:text-coral-ink disabled:cursor-default disabled:border-transparent disabled:bg-coral-soft disabled:text-coral-ink"
      >
        {saved ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
        {saved ? "Lead salvo" : "Salvar lead"}
      </button>
      <GenerateButton generated={generated} onClick={onGenerate} />
    </div>
  );
}

// Card da grade: um comércio inteiro, com a foto no topo. Passar o mouse
// seleciona (e acende o pino no mapa), igual à linha da lista.
function LeadCard({
  business,
  active,
  onHover,
  onOpenPhoto,
  actions,
}: {
  business: LeadBusiness;
  active: boolean;
  onHover: () => void;
  onOpenPhoto: (photo: LightboxPhoto) => void;
  actions: React.ReactNode;
}) {
  return (
    <li
      id={`lead-${business.id}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`@container flex scroll-mt-28 flex-col overflow-hidden rounded-[22px] border bg-surface shadow-card transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] ${
        active ? "-translate-y-0.5 border-green shadow-[0_0_0_4px_var(--lime-soft),var(--shadow-card)]" : "border-line"
      }`}
    >
      <CardPhoto business={business} onOpen={onOpenPhoto} />
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 min-h-[2.7em] font-semibold leading-snug text-ink" title={business.name}>
          {business.name}
        </p>
        {/* Duas linhas fixas, cada uma sem quebrar (corta com "…"): se
            quebrassem, o card ficaria mais alto que os vizinhos e abriria um
            vão acima dos botões. */}
        <p className="mt-1 truncate text-[0.84rem] text-muted" title={business.address || undefined}>
          {business.neighborhood || kindOf(business)}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[0.84rem] text-muted tabular">
          {business.rating === null ? (
            "Sem avaliações no Google"
          ) : (
            <>
              <Star className="size-3.5 shrink-0 fill-current text-ink-2" aria-hidden="true" />
              <span className="font-semibold text-ink-2">{business.rating.toFixed(1).replace(".", ",")}</span>
              <span className="truncate">
                · {business.reviews.toLocaleString("pt-BR")} {business.reviews === 1 ? "avaliação" : "avaliações"}
              </span>
            </>
          )}
        </p>
        <div className="mt-3 flex items-center gap-2">
          {business.phone ? (
            <WhatsAppLink phone={business.phone} tone="quiet" className="h-8 min-w-0 flex-1 justify-center px-3 text-[0.8rem]" />
          ) : (
            <span className="flex h-8 flex-1 items-center text-[0.82rem] text-muted">Sem telefone no Google</span>
          )}
          {business.mapsUrl && (
            <a
              href={business.mapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Ver ${business.name} no Google Maps`}
              title="Ver no Maps"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 transition-colors duration-200 hover:border-ink/30 hover:text-ink"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
        <div className="mt-auto pt-3">{actions}</div>
      </div>
    </li>
  );
}

function lightboxPhoto(business: LeadBusiness): LightboxPhoto | null {
  const photo = business.photo;
  if (!photo) return null;
  return { src: photoSrc(photo.name), alt: `Foto de ${business.name}`, author: photo.author, authorUrl: photo.authorUrl };
}

const zoomButton =
  "absolute inset-0 cursor-pointer outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white";

// Foto do card, com o ramo e o aviso de "só Instagram" por cima. Sem foto,
// a faixa na cor do ramo com a inicial.
function CardPhoto({ business, onOpen }: { business: LeadBusiness; onOpen: (photo: LightboxPhoto) => void }) {
  const [failed, setFailed] = useState(false);
  const photo = business.photo;

  return (
    <div className="relative aspect-[16/10] shrink-0 overflow-hidden" style={{ backgroundColor: business.category.color }}>
      {photo && !failed ? (
        <button
          type="button"
          onClick={() => {
            const big = lightboxPhoto(business);
            if (big) onOpen(big);
          }}
          aria-label={`Ampliar a foto de ${business.name}`}
          className={`group/photo ${zoomButton}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- redirect pro Google; next/image não ajuda aqui */}
          <img
            src={photoSrc(photo.name)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full bg-surface-2 object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover/photo:scale-[1.03]"
          />
        </button>
      ) : (
        <TypeIcon business={business} className="absolute bottom-4 left-4 size-9 text-white/85" strokeWidth={1.75} />
      )}
      <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pl-1 pr-2.5 text-[0.74rem] font-semibold text-ink shadow-soft">
        <span className="grid size-5 place-items-center rounded-full text-white" style={{ backgroundColor: business.category.color }} aria-hidden="true">
          <TypeIcon business={business} className="size-3" strokeWidth={2.4} />
        </span>
        {kindOf(business)}
      </span>
      {business.socialOnly && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-coral-soft px-2.5 py-1 text-[0.74rem] font-semibold text-coral-ink shadow-soft">
          só {business.socialOnly}
        </span>
      )}
      {photo?.author && !failed && (
        <span className="pointer-events-none absolute bottom-2 right-2 max-w-[70%] truncate rounded-full bg-black/55 px-2 py-0.5 text-[0.66rem] text-white">
          Foto: {photo.author}
        </span>
      )}
    </div>
  );
}

// Coluna de detalhes da lista: foto grande, números e contato do selecionado.
function SelectedDetail({ business, onOpenPhoto }: { business: LeadBusiness; onOpenPhoto: (photo: LightboxPhoto) => void }) {
  return (
    <Panel key={business.id} className="rise-in flex flex-col overflow-hidden lg:flex-1">
      <DetailPhoto business={business} onOpen={onOpenPhoto} />
      <div className="p-4">
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-ink">{business.name}</p>
          <p className="mt-0.5 text-[0.82rem] leading-snug text-muted">{business.address}</p>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[12px] bg-honey-soft px-2 py-2.5">
            <dt className="text-[0.72rem] font-medium text-honey-ink">Nota</dt>
            <dd className="font-display text-[1.05rem] font-semibold text-ink tabular">
              {business.rating === null ? "–" : business.rating.toFixed(1).replace(".", ",")}
            </dd>
          </div>
          <div className="rounded-[12px] bg-azure-soft px-2 py-2.5">
            <dt className="text-[0.72rem] font-medium text-azure-ink">Avaliações</dt>
            <dd className="font-display text-[1.05rem] font-semibold text-ink tabular">{business.reviews}</dd>
          </div>
          <div className="rounded-[12px] bg-surface-2 px-2 py-2.5">
            <dt className="text-[0.72rem] font-medium text-ink-2">Bairro</dt>
            <dd className="truncate text-[0.86rem] font-semibold leading-[1.6rem] text-ink">{business.neighborhood || "–"}</dd>
          </div>
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {business.phone ? <WhatsAppLink phone={business.phone} tone="quiet" /> : <span className="text-[0.84rem] text-muted">Sem telefone no Google</span>}
          {business.mapsUrl && (
            <a
              href={business.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[0.84rem] font-semibold text-ink transition-colors hover:border-ink/30"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              Ver no Maps
            </a>
          )}
        </div>
        {business.socialOnly && (
          <p className="mt-3 rounded-[12px] bg-coral-soft px-3 py-2 text-[0.8rem] leading-snug text-coral-ink">
            No Google, o “site” deste comércio é só {business.socialOnly}. Continua sem site próprio.
          </p>
        )}
      </div>
    </Panel>
  );
}

function Pager({
  page,
  pageCount,
  pageSize,
  total,
  onChange,
  bare = false,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  /** Sozinho num card (grade): sem a linha de cima. */
  bare?: boolean;
}) {
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const numbers = pageCount <= 7;
  const arrow =
    "grid size-9 place-items-center rounded-full border border-line-strong text-ink transition-colors duration-200 hover:border-ink/30 hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-35";

  return (
    <nav
      aria-label="Páginas de resultados"
      className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${bare ? "" : "border-t border-line"}`}
    >
      <p className="text-[0.84rem] text-muted tabular">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page === 0} aria-label="Página anterior" className={arrow}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        {numbers ? (
          Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              aria-current={i === page ? "page" : undefined}
              className={`grid size-9 place-items-center rounded-full text-[0.86rem] font-semibold tabular transition-colors duration-200 ${
                i === page ? "bg-ink text-bg" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {i + 1}
            </button>
          ))
        ) : (
          <span className="px-2 text-[0.86rem] font-medium text-ink-2 tabular">
            Página {page + 1} de {pageCount}
          </span>
        )}
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount - 1}
          aria-label="Próxima página"
          className={arrow}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

// Foto grande do comércio selecionado, com o crédito do autor que o Google
// exige mostrar junto. Sem foto (ou se ela falhar), uma faixa na cor do ramo.
function DetailPhoto({ business, onOpen }: { business: LeadBusiness; onOpen: (photo: LightboxPhoto) => void }) {
  const [failed, setFailed] = useState(false);
  const photo = business.photo;

  if (!photo || failed) {
    return (
      <div className="flex h-24 items-end px-4 pb-3 lg:h-auto lg:min-h-24 lg:flex-1" style={{ backgroundColor: business.category.color }} aria-hidden="true">
        <span className="font-display text-[1.6rem] font-semibold leading-none text-white/90">{business.name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <figure className="relative aspect-[16/10] bg-surface-2 lg:aspect-auto lg:min-h-44 lg:flex-1">
      <button
        type="button"
        onClick={() => {
          const big = lightboxPhoto(business);
          if (big) onOpen(big);
        }}
        aria-label={`Ampliar a foto de ${business.name}`}
        className={zoomButton}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- redirect pro Google; next/image não ajuda aqui */}
        <img src={photoSrc(photo.name)} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      </button>
      {photo.author && (
        <figcaption className="absolute bottom-2 right-2 max-w-[80%] truncate rounded-full bg-black/55 px-2.5 py-1 text-[0.7rem] text-white backdrop-blur-sm">
          Foto:{" "}
          {photo.authorUrl ? (
            <a href={photo.authorUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {photo.author}
            </a>
          ) : (
            photo.author
          )}
        </figcaption>
      )}
    </figure>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.86rem] font-semibold text-ink-2">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none truncate rounded-full border border-line-strong bg-bg pl-4 pr-10 text-[0.94rem] text-ink outline-none transition-colors duration-200 hover:border-ink/30 focus-visible:border-green focus-visible:shadow-[0_0_0_4px_var(--lime-soft)]"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      </div>
    </div>
  );
}

