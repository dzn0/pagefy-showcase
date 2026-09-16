"use client";

import { createListStore } from "./create-list-store";

export type SaleType = "avulso" | "mensal";

export type Sale = {
  id: string;
  client: string;
  value: number;
  type: SaleType;
  date: string; // ISO yyyy-mm-dd
};

export const salesStore = createListStore<Sale>("vendas", "pagefy-sales");
