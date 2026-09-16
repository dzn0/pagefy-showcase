"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker, TileLayer } from "leaflet";
import { photoSrc, type LeadBusiness } from "@/lib/lead-search";

// Mapa real (Leaflet + mapas da CARTO sobre OpenStreetMap) com os comércios
// da página atual. Os pinos mostram a foto do Google, a mesma URL do card e da
// lista: o navegador reaproveita a imagem e o Google cobra uma vez só.

// A CARTO exige chave (grátis, pedida em carto.com/basemaps/apikey) e ela vai
// na URL de cada bloco do mapa, por isso é NEXT_PUBLIC_. Sem chave, os blocos
// vêm com marca d'água "API KEY REQUIRED": nesse caso o mapa usa os blocos
// padrão do OpenStreetMap, só no tema claro, até a chave existir.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_BASEMAPS_KEY;
const OSM = '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

const TILES = CARTO_KEY
  ? {
      light: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
      dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
      subdomains: "abcd",
      maxZoom: 20,
      attribution: `${OSM} · © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>`,
    }
  : {
      light: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      dark: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      subdomains: "",
      maxZoom: 19,
      attribution: OSM,
    };

type Leaflet = typeof import("leaflet");

function isDark() {
  const theme = document.documentElement.dataset.theme;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

function pinHtml(business: LeadBusiness) {
  const initial = escapeHtml(business.name.charAt(0));
  // Vitrine da Início traz a URL pronta; a busca usa a rota de fotos.
  const src = business.photoUrl ?? (business.photo ? photoSrc(business.photo.name) : null);
  const photo = src ? `<img src="${escapeHtml(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
  return `<span class="pf-pin" style="--pin:${escapeHtml(business.category.color)}"><span>${initial}</span>${photo}</span>`;
}

export function MapPreview({
  businesses,
  selectedId = null,
  onSelect,
  center = [-15.8, -47.9],
  zoom = 4,
  pinSize = 34,
  className = "relative aspect-square rounded-[22px] border border-line",
  emptyText = "Os comércios encontrados aparecem aqui no mapa.",
}: {
  businesses: LeadBusiness[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Onde o mapa abre antes de enquadrar os pinos. */
  center?: [number, number];
  zoom?: number;
  pinSize?: number;
  /** Posição, tamanho e moldura do mapa. */
  className?: string;
  emptyText?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<Leaflet | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tilesRef = useRef<TileLayer | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Cria o mapa uma vez. O Leaflet mexe em `window` ao carregar, então entra
  // por import dinâmico, só no navegador.
  useEffect(() => {
    let cancelled = false;
    let cleanupTheme = () => {};
    const markers = markersRef.current;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: false,
        // Roda do mouse dá zoom direto (sem precisar clicar antes), em passos
        // menores que o padrão pra não pular níveis demais de uma vez.
        scrollWheelZoom: true,
        wheelPxPerZoomLevel: 100,
        zoomSnap: 0.5,
        attributionControl: false,
      });
      L.control.zoom({ position: "topright", zoomInTitle: "Aproximar", zoomOutTitle: "Afastar" }).addTo(map);
      L.control.attribution({ prefix: false, position: "bottomright" }).addAttribution(TILES.attribution).addTo(map);

      const setTiles = () => {
        tilesRef.current?.remove();
        tilesRef.current = L.tileLayer(isDark() ? TILES.dark : TILES.light, {
          ...(TILES.subdomains ? { subdomains: TILES.subdomains } : {}),
          maxZoom: TILES.maxZoom,
        }).addTo(map);
      };
      setTiles();
      const observer = new MutationObserver(setTiles);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", setTiles);
      cleanupTheme = () => {
        observer.disconnect();
        media.removeEventListener("change", setTiles);
      };

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      cleanupTheme();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      tilesRef.current = null;
      markers.clear();
    };
    // Só na montagem: center/zoom são o ponto de partida, não controlam o mapa depois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pinos da página atual + enquadramento em todos eles.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;

    layer.clearLayers();
    markersRef.current.clear();
    for (const business of businesses) {
      const marker = L.marker([business.lat, business.lng], {
        icon: L.divIcon({ html: pinHtml(business), className: "pf-pin-icon", iconSize: [pinSize, pinSize], iconAnchor: [pinSize / 2, pinSize / 2] }),
        title: business.name,
        alt: business.name,
        keyboard: true,
        riseOnHover: true,
      });
      marker.on("click", () => onSelectRef.current?.(business.id));
      marker.bindTooltip(escapeHtml(business.name), { direction: "top", offset: [0, -pinSize / 2 - 2], className: "pf-map-tip" });
      marker.addTo(layer);
      markersRef.current.set(business.id, marker);
    }

    if (businesses.length === 1) {
      map.setView([businesses[0].lat, businesses[0].lng], 16);
    } else if (businesses.length > 1) {
      map.fitBounds(L.latLngBounds(businesses.map((b) => [b.lat, b.lng] as [number, number])), { padding: [36, 36], maxZoom: 16 });
    }
  }, [ready, businesses, pinSize]);

  // Destaque do selecionado; se ele estiver fora da vista, o mapa vai até ele.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    for (const [id, marker] of markersRef.current) {
      const active = id === selectedId;
      marker.getElement()?.classList.toggle("is-active", active);
      marker.setZIndexOffset(active ? 1000 : 0);
      if (active && !map.getBounds().pad(-0.1).contains(marker.getLatLng())) map.panTo(marker.getLatLng());
    }
  }, [ready, selectedId, businesses]);

  return (
    <div className={`pf-map isolate overflow-hidden bg-surface-2 ${className}`} style={{ "--pin-size": `${pinSize}px` } as React.CSSProperties}>
      <div ref={containerRef} className="absolute inset-0" aria-label="Mapa dos comércios" role="region" />
      {businesses.length === 0 && emptyText && (
        <p className="pointer-events-none absolute inset-x-6 top-1/2 z-[500] -translate-y-1/2 rounded-full bg-surface/95 px-4 py-2 text-center text-[0.84rem] text-ink-2 shadow-soft">
          {emptyText}
        </p>
      )}
    </div>
  );
}
