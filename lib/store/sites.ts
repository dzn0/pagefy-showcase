"use client";

import { createListStore } from "./create-list-store";

export type SiteStatus = "rascunho" | "publicado" | "vendido";

export type GeneratedSite = {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  color: string;
  status: SiteStatus;
  createdAt: number;
};

export const sitesStore = createListStore<GeneratedSite>("sites", "pagefy-sites");
