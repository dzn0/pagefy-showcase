"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Lock, LoaderCircle, MapPin, Search, Sparkles, Star } from "lucide-react";
import { useAuth } from "./auth-provider";
import { SIGNUP_REQUEST, useLoginDialog } from "./login-dialog";
import { SITE_WIDTH, SiteTemplate } from "./site-template";
import { API_URL } from "@/lib/api";
import { buildDemoResult, EXAMPLE_CITIES, formatCity, resolveCategory, type DemoCategory } from "@/lib/demo-data";
import { kindOf } from "@/lib/lead-search";

// Demo da landing com comércios de verdade (backend /demo/search: 1 busca no
// Google por cidade, guardada por 24 h, 1 cidade nova por IP/dia). Se o
// backend recusar ou cair, a demo volta pra simulação, marcada como tal.

type DemoItem = {
  id: string;
  name: string;
  slug: string;
  category: DemoCategory;
  /** Tipo exato do Google ("Padaria"); a simulação não tem. */
  kind?: string | null;
  neighborhood: string;
  address: string;
  phone: string;
  rating: number | null;
  reviews: number;
  photoUrl: string | null;
  socialOnly: string | null;
};

type DemoView = {
  city: string;
  /** Número grande da contagem. */
  count: number;
  /** true = dados do Google; false = simulação. */
  real: boolean;
  scanned: number;
  businesses: DemoItem[];
};

type ApiDemo = {
  city: string;
  scanned: number;
  /** Total sem site na busca; a lista é só a amostra. */
  total?: number;
  businesses: Array<{
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    kind?: string | null;
    neighborhood: string;
    address: string;
    phone: string | null;
    rating: number | null;
    reviews: number;
    photoUrl?: string | null;
    socialOnly: string | null;
  }>;
};

const VISIBLE_ROWS = 6;

// A demo abre com uma cidade fixa e deixa quem não tem conta fazer UMA
// pesquisa própria a cada 24 h; da segunda em diante, pede login. Anotado
// neste navegador (o backend ainda limita por IP, como segunda barreira).
const FREE_SEARCH_KEY = "pagefy-demo-free-search";
const FREE_SEARCH_WINDOW = 24 * 60 * 60 * 1000;

function freeSearchUsed() {
  try {
    const at = Number(localStorage.getItem(FREE_SEARCH_KEY));
    return Boolean(at) && Date.now() - at < FREE_SEARCH_WINDOW;
  } catch {
    return false;
  }
}

function markFreeSearchUsed() {
  try {
    localStorage.setItem(FREE_SEARCH_KEY, String(Date.now()));
  } catch {
    // Sem storage: vale o limite por IP do backend.
  }
}

function fromSimulation(city: string): DemoView {
  const result = buildDemoResult(city);
  return {
    city: result.city,
    count: result.total,
    real: false,
    scanned: result.total,
    businesses: result.businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category,
      neighborhood: b.neighborhood,
      address: `Rua das Palmeiras, 214 · ${b.neighborhood}`,
      phone: `(00) 9 ••••-${b.phoneEnd}`,
      rating: b.rating,
      reviews: b.reviews,
      photoUrl: null,
      socialOnly: null,
    })),
  };
}

function fromApi(data: ApiDemo): DemoView {
  return {
    city: data.city,
    count: data.total ?? data.businesses.length,
    real: true,
    scanned: data.scanned,
    businesses: data.businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: resolveCategory(b.categoryId).category,
      kind: b.kind ?? resolveCategory(b.categoryId).legacyKind,
      neighborhood: b.neighborhood,
      address: b.address,
      phone: b.phone ?? "Sem telefone no Google",
      rating: b.rating,
      reviews: b.reviews,
      photoUrl: b.photoUrl ?? null,
      socialOnly: b.socialOnly,
    })),
  };
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    if (from === target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const length = reduce ? 0 : duration;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = length === 0 ? 1 : Math.min(1, (now - start) / length);
      const eased = 1 - Math.pow(2, -10 * t);
      const next = Math.round(from + (target - from) * (t === 1 ? 1 : eased));
      shownRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function CityDemo() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<DemoView | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const count = useCountUp(view?.count ?? 0);
  const { profile } = useAuth();
  const router = useRouter();
  const openLogin = useLoginDialog();

  async function load(city: string, { initial = false } = {}) {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/demo/search?cidade=${encodeURIComponent(city)}`);
      const data = (await res.json().catch(() => null)) as (ApiDemo & { error?: string }) | null;
      if (res.status === 429 && data?.error) {
        if (initial) {
          // Teto do dia já na amostra inicial: mostra a simulação e explica.
          show(fromSimulation(city));
          setNotice(data.error);
        } else {
          markFreeSearchUsed();
          askLogin(city);
        }
        return;
      }
      if (!res.ok || !data || data.error) throw new Error(data?.error ?? String(res.status));
      if (data.businesses.length === 0) {
        setNotice(`O Google não trouxe comércios sem site em ${data.city} nessa amostra. Tente outra cidade.`);
        if (initial) show(fromSimulation(city));
        return;
      }
      show(fromApi(data));
      if (!initial) {
        markFreeSearchUsed();
        setQuery(data.city);
      }
    } catch {
      // Backend fora do ar: a demo continua funcionando, como simulação.
      show(fromSimulation(city));
    } finally {
      setLoading(false);
    }
  }

  function show(next: DemoView) {
    setView(next);
    setSelectedId(next.businesses[0]?.id ?? null);
  }

  useEffect(() => {
    // Aracaju é cidade de exemplo: vem do cache e não gasta a busca do visitante.
    const id = setTimeout(() => void load(EXAMPLE_CITIES[0], { initial: true }), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function askLogin(city: string) {
    openLogin({
      title: "Para pesquisar mais, entre com o Google",
      message: "Você já usou a pesquisa grátis de hoje. Com a conta grátis você pesquisa a sua cidade e ainda faz mais 4 buscas sem pagar nada.",
      icon: "search",
      redirectTo: `/app/buscar?cidade=${encodeURIComponent(formatCity(city))}`,
    });
  }

  // Qualquer tentativa de pesquisar (Buscar ou sugestão de cidade): com conta,
  // vai pra busca de verdade no app; sem conta, a primeira pesquisa roda na
  // demo e as seguintes abrem o pop-up de login (sem gastar Google).
  function requestSearch(city: string) {
    const name = formatCity(city);
    if (profile) {
      router.push(`/app/buscar?cidade=${encodeURIComponent(name)}`);
      return;
    }
    if (freeSearchUsed()) {
      askLogin(name);
      return;
    }
    void load(name);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError("Digite o nome de uma cidade para buscar.");
      return;
    }
    requestSearch(trimmed);
  }

  const items = view?.businesses.slice(0, VISIBLE_ROWS) ?? [];
  const selected = items.find((b) => b.id === selectedId) ?? items[0] ?? null;

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface text-left shadow-frame">
      {/* Barra do app */}
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5 sm:px-5">
        <span className="font-mono text-[0.78rem] text-muted">pagefy.app/app/buscar</span>
        <span className="hidden items-center gap-1.5 text-[0.8rem] font-medium text-muted sm:inline-flex">
          <span className="size-1.5 rounded-full bg-lime" aria-hidden="true" />
          Demo grátis · sem cadastro
        </span>
      </div>

      {/* Busca */}
      <form onSubmit={onSubmit} noValidate className="border-b border-line p-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <label
            htmlFor="cidade"
            className="block font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-ink lg:w-[300px] lg:shrink-0"
          >
            Quais comércios da sua cidade não têm site?
          </label>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-azure" aria-hidden="true" />
              <input
                id="cidade"
                name="cidade"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite sua cidade"
                autoComplete="address-level2"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "cidade-erro" : "cidade-dica"}
                className="h-12 w-full rounded-full border border-line-strong bg-bg pl-11 pr-4 text-[1rem] text-ink placeholder:text-muted transition-[border-color,box-shadow] outline-none focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)] aria-invalid:border-danger"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green px-6 font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] disabled:cursor-progress disabled:opacity-80"
            >
              {loading ? <LoaderCircle className="size-[18px] animate-spin" aria-hidden="true" /> : <Search className="size-[18px]" aria-hidden="true" />}
              {loading ? "Buscando" : "Buscar"}
            </button>
          </div>
        </div>
        {error ? (
          <p id="cidade-erro" role="alert" className="mt-2.5 pl-1 text-[0.86rem] font-medium text-danger lg:pl-[324px]">
            {error}
          </p>
        ) : (
          <p id="cidade-dica" className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1 pl-1 text-[0.86rem] text-muted lg:pl-[324px]">
            <span>Ou tente:</span>
            {EXAMPLE_CITIES.map((city, i) => (
              <span key={city} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => requestSearch(city)}
                  className="font-semibold text-green-ink underline decoration-green/30 underline-offset-4 transition-colors hover:decoration-green"
                >
                  {city}
                </button>
                {i < EXAMPLE_CITIES.length - 1 && <span aria-hidden="true">·</span>}
              </span>
            ))}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] bg-honey-soft px-4 py-2.5 text-[0.88rem] text-honey-ink lg:ml-[324px]">
            {notice}
            <button
              type="button"
              onClick={() => openLogin({ ...SIGNUP_REQUEST, redirectTo: "/app/buscar" })}
              className="font-semibold underline underline-offset-4"
            >
              Criar conta grátis
            </button>
          </p>
        )}
      </form>

      {/* No desktop o miolo tem altura fixa (igual em qualquer monitor, sem
          encolher em telas baixas); lista e site rolam por dentro. */}
      <div className="grid grid-cols-[minmax(0,1fr)] lg:h-[40rem] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* Resultados */}
        <div className="p-4 sm:p-6 lg:flex lg:min-h-0 lg:flex-col lg:border-r lg:border-line lg:py-5">
          <div className="flex items-end justify-between gap-4" aria-live="polite">
            {view ? (
              <p className="text-[0.95rem] leading-snug text-ink-2">
                <span className="block font-display text-[1.9rem] font-semibold leading-none tracking-[-0.035em] text-ink tabular">{count}</span>
                <span className="mt-1.5 block">
                  comércios sem site em <strong className="font-semibold text-ink">{view.city}</strong>
                </span>
              </p>
            ) : (
              <span className="block h-[3.4rem] w-44 animate-pulse rounded-xl bg-surface-2" aria-label="Carregando" />
            )}
            {view && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.74rem] font-medium ${
                  view.real ? "bg-azure-soft text-azure-ink" : "bg-surface-2 text-muted"
                }`}
              >
                {view.real ? "dados reais do Google" : "simulação"}
              </span>
            )}
          </div>

          <ul
            className={`mt-4 divide-y divide-line transition-opacity duration-300 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-width:thin] ${
              loading && view ? "opacity-40" : "opacity-100"
            }`}
          >
            {view
              ? items.map((b, i) => (
                  <li key={b.id} className={i >= 4 ? "hidden sm:block" : undefined}>
                    <BusinessRow business={b} selected={b.id === selected?.id} onSelect={() => setSelectedId(b.id)} />
                  </li>
                ))
              : Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="flex items-center gap-3.5 px-2.5 py-3">
                    <span className="size-10 shrink-0 animate-pulse rounded-[10px] bg-surface-2" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3 w-3/5 animate-pulse rounded-full bg-surface-2" />
                      <span className="block h-2.5 w-2/5 animate-pulse rounded-full bg-surface-2" />
                    </span>
                  </li>
                ))}
          </ul>

          <div className="mt-3 shrink-0 rounded-2xl bg-azure-soft px-4 py-3">
            <p className="text-[0.9rem] text-azure-ink">
              {view?.real
                ? view.count > view.businesses.length
                  ? // A lista mostra menos que a amostra (6 no desktop, 4 no celular): sem número aqui, nunca desmente a tela.
                    `Esta é só uma amostra dos ${view.count}. Na sua conta você vê todos, com mapa e contato.`
                  : "Na sua conta você vê todos, com mapa e contato."
                : "Na sua conta, a busca usa dados reais do Google e vai bem além desta amostra."}
            </p>
            {/* Mesmo caminho do "Gerar este site": pop-up do Pagefy e, depois
                do login, a busca de leads na cidade da demo. */}
            <button
              type="button"
              onClick={() => {
                const city = view?.city ?? "";
                openLogin({
                  title: city ? `Veja todos os comércios sem site em ${city}` : "Veja a lista completa",
                  message: "Entre com o Google para ver a lista inteira, com mapa, telefone e nota de cada comércio.",
                  icon: "search",
                  redirectTo: city ? `/app/buscar?cidade=${encodeURIComponent(city)}` : "/app/buscar",
                });
              }}
              className="mt-1 inline-flex items-center gap-1.5 text-[0.92rem] font-semibold text-azure-ink transition-[gap] hover:gap-2.5"
            >
              Ver a lista completa <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Preview do site gerado: uma tela de desktop quase quadrada, que rola */}
        <div className="flex flex-col border-t border-line bg-surface-2 p-3 sm:p-4 lg:min-h-0 lg:border-t-0">
          <DesktopScreen business={selected} resetKey={selected?.id ?? ""}>
            {selected && view ? <SiteTemplate business={selected} city={view.city} /> : <div className="h-[1024px] animate-pulse bg-surface" />}
          </DesktopScreen>
          <div className="mt-3 flex shrink-0 items-center justify-between gap-3 px-1">
            <p className="text-[0.8rem] leading-snug text-muted">
              <strong className="font-semibold text-ink-2">Prévia simplificada.</strong> Na sua conta, a IA monta cada site sob
              medida, bem mais completo que este modelo.
            </p>
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (!selected || !view) return;
                // Não cria site: abre a loja na busca de leads (cidade + ramo
                // dela, já selecionada). Sem conta, passa antes pelo login.
                const params = new URLSearchParams({ cidade: view.city, ramo: selected.category.id, destaque: selected.id });
                openLogin({
                  title: `Encontre ${selected.name} na busca de leads`,
                  message: `Entre com o Google para abrir ${selected.name} na busca de leads, com telefone, endereço e nota do Google.`,
                  icon: "search",
                  redirectTo: `/app/buscar?${params}`,
                });
              }}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-green px-4.5 text-[0.9rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] disabled:opacity-60"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Gerar este site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Navegador de desktop em miniatura: o site é montado na largura de um
 * desktop (SITE_WIDTH) e reduzido com `zoom` (que, ao contrário de transform,
 * reduz também a altura rolável), e rola dentro da moldura. No desktop a
 * moldura preenche a altura do card; no celular, é quadrada.
 */
function DesktopScreen({ business, resetKey, children }: { business: DemoItem | null; resetKey: string; children: React.ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.5);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setZoom(viewport.clientWidth / SITE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // Trocou de comércio: o site novo começa do topo.
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft lg:min-h-0 lg:flex-1">
      {/* Bolinhas | endereço | espaço igual às bolinhas: o endereço fica no centro exato. */}
      <div className="grid shrink-0 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-3 border-b border-[#e6e6e1] bg-[#f3f3f0] px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#d6d6d0]" />
          <span className="size-2.5 rounded-full bg-[#d6d6d0]" />
          <span className="size-2.5 rounded-full bg-[#d6d6d0]" />
        </span>
        <span className="flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-1.5 font-mono text-[0.72rem] text-[#60625d]">
          <Lock className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{business ? `pagefy.app/p/${business.slug}` : "pagefy.app/p/…"}</span>
        </span>
        <span aria-hidden="true" />
      </div>
      <div
        ref={viewportRef}
        className="aspect-square overflow-y-auto overscroll-contain [scrollbar-width:thin] lg:aspect-auto lg:min-h-0 lg:flex-1"
        tabIndex={0}
        aria-label={business ? `Prévia do site de ${business.name}` : "Prévia do site"}
      >
        <div key={resetKey} className="rise-in" style={{ width: SITE_WIDTH, zoom }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function BusinessRow({ business, selected, onSelect }: { business: DemoItem; selected: boolean; onSelect: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group flex w-full items-center gap-3.5 rounded-xl px-2.5 py-3 text-left transition-colors ${selected ? "bg-lime-soft" : "hover:bg-surface-2"}`}
    >
      {business.photoUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto do Google (googleusercontent), sem otimização do Next
        <img
          src={business.photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="size-10 shrink-0 rounded-[10px] bg-surface-2 object-cover"
        />
      ) : (
        <span
          className="grid size-10 shrink-0 place-items-center rounded-[10px] font-display text-[0.95rem] font-semibold text-white"
          style={{ backgroundColor: business.category.color }}
          aria-hidden="true"
        >
          {initials(business.name)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-1 font-semibold leading-snug text-ink">{business.name}</span>
        <span className="flex items-center gap-1.5 truncate text-[0.86rem] text-muted">
          <span className="truncate">
            {kindOf(business)}
            {business.neighborhood && ` · ${business.neighborhood}`}
          </span>
          {business.rating !== null && (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-ink-2 tabular">
              <Star className="size-3 fill-honey text-honey" aria-hidden="true" />
              {business.rating.toFixed(1).replace(".", ",")}
            </span>
          )}
        </span>
      </span>
      {business.socialOnly && (
        <span className="hidden shrink-0 rounded-full bg-coral-soft px-2 py-0.5 text-[0.7rem] font-semibold text-coral-ink xl:inline">
          só {business.socialOnly}
        </span>
      )}
    </button>
  );
}

function initials(name: string) {
  const words = name.split(" ").filter((w) => w.length > 2 && !["Shop", "Auto"].includes(w));
  return (words[0]?.[0] ?? name[0] ?? "") + (words[1]?.[0] ?? "");
}
