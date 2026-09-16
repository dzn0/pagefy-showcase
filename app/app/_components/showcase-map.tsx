"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { hydrateBusiness, type ApiBusiness, type LeadBusiness, type LeadSearchResult, type Showcase } from "@/lib/lead-search";
import { loadLastSearch, saveLastSearch } from "@/lib/store/last-search";
import { CityMap } from "./city-map";
import { MapPreview } from "./map-preview";

// Mapa da Início: todos os comércios sem site da cidade de quem abriu
// (localizada pelo IP no backend, /leads/cidade-local). É a primeira busca
// da pessoa, já feita e sem cobrar créditos (os de boas-vindas já descontam
// ela): vira a "última busca", e o Buscar leads abre direto nela.
// Sem localização, um ponto movimentado sorteado (/showcase), só pra ver.
const SHOWCASE_IDS = ["sp", "rio", "bh", "cwb"] as const;

type MapData =
  | { kind: "city"; city: string; businesses: LeadBusiness[] }
  | { kind: "showcase"; showcase: Showcase };

type ApiResult = Omit<LeadSearchResult, "businesses"> & { businesses: ApiBusiness[] };
type ApiShowcase = Omit<Showcase, "businesses"> & { businesses: ApiBusiness[] };

function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  return apiFetch(path, { signal }).then((res) =>
    res.ok ? (res.json() as Promise<T>) : Promise.reject(new Error(String(res.status))),
  );
}

async function loadCity(signal: AbortSignal): Promise<MapData> {
  const raw = await getJson<ApiResult>("/leads/cidade-local", signal);
  const result: LeadSearchResult = { ...raw, businesses: raw.businesses.map(hydrateBusiness) };
  // Primeira busca de presente: só entra se a pessoa ainda não buscou nada,
  // pra não passar por cima de uma busca que ela fez (e pagou).
  if (!loadLastSearch()) saveLastSearch({ query: result.city, result });
  return { kind: "city", city: result.city, businesses: result.businesses };
}

async function loadShowcase(signal: AbortSignal): Promise<MapData> {
  const id = SHOWCASE_IDS[Math.floor(Math.random() * SHOWCASE_IDS.length)];
  const raw = await getJson<ApiShowcase>(`/showcase?id=${id}`, signal);
  return { kind: "showcase", showcase: { ...raw, businesses: raw.businesses.map(hydrateBusiness) } };
}

function centerOf(businesses: LeadBusiness[]): [number, number] {
  const lat = businesses.reduce((sum, b) => sum + b.lat, 0) / businesses.length;
  const lng = businesses.reduce((sum, b) => sum + b.lng, 0) / businesses.length;
  return [lat, lng];
}

export function ShowcaseMap() {
  const [data, setData] = useState<MapData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    loadCity(controller.signal)
      .catch((error: unknown) => {
        if ((error as Error).name === "AbortError") throw error;
        return loadShowcase(controller.signal);
      })
      .then((next) => {
        const businesses = next.kind === "city" ? next.businesses : next.showcase.businesses;
        if (businesses.length === 0) setFailed(true);
        else setData(next);
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, []);

  // Sem Google configurado (ou fora do ar): fica a ilustração de antes.
  if (failed || !data) {
    return (
      <>
        <CityMap className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${failed ? "" : "opacity-60"}`} />
        <MapChip>{failed ? "Cada pino é um comércio sem site" : "Procurando comércios sem site na sua cidade…"}</MapChip>
      </>
    );
  }

  if (data.kind === "city") {
    const count = data.businesses.length;
    return (
      <>
        <MapPreview
          businesses={data.businesses}
          selectedId={selectedId}
          onSelect={setSelectedId}
          center={centerOf(data.businesses)}
          zoom={13}
          pinSize={30}
          emptyText={null}
          className="absolute inset-0"
        />
        <MapChip
          action={
            <Link
              href="/app/buscar"
              className="pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-green px-3 py-1.5 text-[0.8rem] font-semibold text-on-green shadow-soft transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
            >
              Ver lista <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          {count} {count === 1 ? "comércio sem site" : "comércios sem site"} em {data.city}
        </MapChip>
      </>
    );
  }

  const { showcase } = data;
  return (
    <>
      <MapPreview
        businesses={showcase.businesses}
        selectedId={selectedId}
        onSelect={setSelectedId}
        center={[showcase.center.lat, showcase.center.lng]}
        zoom={14}
        pinSize={30}
        emptyText={null}
        className="absolute inset-0"
      />
      <MapChip>
        {showcase.businesses.length} comércios sem site a até {Math.round(showcase.radius / 1000)} km{" "}
        {showcase.label === "Centro" ? "do" : "da"} {showcase.label}, {showcase.city}
      </MapChip>
    </>
  );
}

function MapChip({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute left-3 right-14 top-3 z-[1100] flex items-center gap-2 sm:left-4 sm:top-4">
      <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-surface/95 px-3 py-1.5 text-[0.8rem] font-semibold text-ink shadow-soft backdrop-blur">
        <span className="size-2 shrink-0 rounded-full bg-lime" aria-hidden="true" />
        <span className="truncate">{children}</span>
      </span>
      {action}
    </div>
  );
}
