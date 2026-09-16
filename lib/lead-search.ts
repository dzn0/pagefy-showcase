// Tipos da busca de leads real (Google Places), que o backend faz em
// /leads/search e /showcase. O backend manda só o id do ramo; cor e nome
// do ramo são coisa de interface e vêm de CATEGORIES (hydrateBusiness).
import { API_URL } from "./api";
import { resolveCategory, type DemoCategory } from "./demo-data";

export type LeadBusiness = {
  /** id do lugar no Google (estável). */
  id: string;
  name: string;
  slug: string;
  category: DemoCategory;
  /** Tipo exato segundo o Google ("Padaria", "Pizzaria"); null quando não veio. */
  kind?: string | null;
  /** Código do tipo no Google ("hamburger_restaurant"), pro ícone. */
  type?: string | null;
  neighborhood: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviews: number;
  lat: number;
  lng: number;
  mapsUrl: string | null;
  /** Quando o "site" no Google é só uma rede social ou link de cardápio: o nome dela. */
  socialOnly: string | null;
  /** Primeira foto do lugar no Google (nome do recurso + autor, que precisa aparecer junto). */
  photo: LeadPhoto | null;
  /** URL pública da foto já resolvida (vitrine da Início, que não chama o Google a cada visita). */
  photoUrl?: string | null;
};

export type LeadPhoto = { name: string; author: string | null; authorUrl: string | null };

/**
 * URL da foto pelo backend (a chave do Google fica lá). Um tamanho só pro app
 * inteiro: o Google cobra cada tamanho à parte, e a mesma URL deixa o
 * navegador reaproveitar a foto entre card, pino, lista e zoom.
 */
export function photoSrc(name: string) {
  return `${API_URL}/places/photo?name=${encodeURIComponent(name)}`;
}

export type LeadSearchResult = {
  city: string;
  /** Ramo buscado ("" = todos). */
  ramo: string;
  businesses: LeadBusiness[];
  /** Quantos comércios o Google devolveu antes de tirar os que já têm site. */
  scanned: number;
};

/** Como o comércio chega do backend: o ramo vem só pelo id. */
export type ApiBusiness = Omit<LeadBusiness, "category"> & { categoryId: string };

export function hydrateBusiness({ categoryId, ...rest }: ApiBusiness): LeadBusiness {
  const { category, legacyKind } = resolveCategory(categoryId);
  return { ...rest, category, kind: rest.kind ?? legacyKind };
}

/** Como o comércio aparece em selos e linhas: o tipo do Google, senão o ramo. */
export function kindOf(business: Pick<LeadBusiness, "kind" | "category">) {
  return business.kind || business.category.short;
}

/** Vitrine do mapa da Início (backend /showcase). */
export type Showcase = {
  id: string;
  label: string;
  city: string;
  center: { lat: number; lng: number };
  radius: number;
  businesses: LeadBusiness[];
};

export type LeadSearchError = { error: string };

/**
 * Slug do site de um comércio: o mesmo que o backend dá em `slug`
 * (nome + fim do id do Google), pra busca e leads reconhecerem o mesmo site.
 */
export function siteSlug(name: string, placeId: string) {
  return `${slugify(name)}-${placeId.slice(-5).toLowerCase()}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
