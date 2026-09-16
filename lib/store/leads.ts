"use client";

import type { Hue } from "@/lib/dashboard-nav";
import { createListStore } from "./create-list-store";

export type LeadStage = "novo" | "contatado" | "proposta" | "fechado" | "perdido";

export type Lead = {
  id: string;
  businessName: string;
  category: string;
  neighborhood: string;
  phoneEnd: string;
  /** Telefone completo, quando o lead veio da busca real. */
  phone?: string | null;
  address?: string;
  placeId?: string;
  mapsUrl?: string | null;
  /** Nome do recurso da foto no Google (ver photoSrc). */
  photo?: string | null;
  color: string;
  stage: LeadStage;
  createdAt: number;
};

export const LEAD_STAGES: { id: LeadStage; label: string; hue: Hue }[] = [
  { id: "novo", label: "Novo", hue: "azure" },
  { id: "contatado", label: "Contatado", hue: "coral" },
  { id: "proposta", label: "Proposta enviada", hue: "grape" },
  { id: "fechado", label: "Fechado", hue: "green" },
  { id: "perdido", label: "Perdido", hue: "berry" },
];

export const leadsStore = createListStore<Lead>("leads", "pagefy-leads");

/**
 * Abordou o dono: o lead sai de "Novo" e vira "Contatado". É o que a etapa
 * "Oferecer" da Início conta, então tem que acontecer no clique que abre a
 * conversa (WhatsApp da lista, "Enviar pro dono" no gerador) e não só quando
 * a pessoa lembra de mexer no seletor de etapa.
 *
 * Só avança a partir de "novo": quem já está em proposta, fechado ou perdido
 * não volta pra trás por causa de uma mensagem nova.
 */
export function markLeadContacted(match: { id?: string; placeId?: string | null }) {
  const lead = leadsStore
    .getAll()
    .find((item) => (match.id ? item.id === match.id : Boolean(match.placeId) && item.placeId === match.placeId));
  if (lead?.stage === "novo") leadsStore.update(lead.id, { stage: "contatado" });
}
