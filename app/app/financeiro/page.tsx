"use client";

import { type FormEvent, useState } from "react";
import { ChevronDown, Plus, Repeat, TrendingUp, Wallet } from "lucide-react";
import { formatBRL } from "@/lib/currency";
import { createId } from "@/lib/id";
import { salesStore, type SaleType } from "@/lib/store/sales";
import { Badge, EmptyState, HueTile, PageHeader, Panel, StatCard } from "../_components/ui";
import { ConfirmDelete, DeleteButton } from "../_components/confirm-delete";

export default function FinanceiroPage() {
  const sales = salesStore.useAll();
  const [client, setClient] = useState("");
  const [value, setValue] = useState("");
  const [type, setType] = useState<SaleType>("avulso");
  /** Venda esperando confirmação pra ser apagada; null = nenhuma. */
  const [pending, setPending] = useState<{ id: string; client: string } | null>(null);

  const total = sales.reduce((sum, sale) => sum + sale.value, 0);
  const monthly = sales.filter((sale) => sale.type === "mensal");
  const recurring = monthly.reduce((sum, sale) => sum + sale.value, 0);

  function addSale(event: FormEvent) {
    event.preventDefault();
    const numeric = Number(value.replace(",", "."));
    if (!client.trim() || !Number.isFinite(numeric) || numeric <= 0) return;
    salesStore.add({
      id: createId("sale"),
      client: client.trim(),
      value: numeric,
      type,
      date: new Date().toISOString().slice(0, 10),
    });
    setClient("");
    setValue("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        hue="honey"
        title="Financeiro"
        description="Registre cada site vendido e acompanhe quanto já entrou."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} hue="honey" label="Total faturado" value={formatBRL(total)} hint="soma de todas as vendas" />
        <StatCard
          icon={TrendingUp}
          hue="grape"
          label="Vendas registradas"
          value={String(sales.length)}
          hint={`${sales.length - monthly.length} avulsas · ${monthly.length} mensais`}
        />
        <StatCard icon={Repeat} hue="azure" label="Receita mensal" value={formatBRL(recurring)} hint="dos clientes no plano mensal" />
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <HueTile icon={Plus} hue="green" size="sm" />
          <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">Registrar venda</h2>
        </div>
        <form onSubmit={addSale} className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="cliente" className="mb-1.5 block text-[0.86rem] font-semibold text-ink-2">
              Cliente
            </label>
            <input
              id="cliente"
              value={client}
              onChange={(event) => setClient(event.target.value)}
              placeholder="Nome do comércio"
              className="h-12 w-full rounded-full border border-line-strong bg-bg px-4 text-[0.94rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)]"
            />
          </div>
          <div>
            <label htmlFor="valor" className="mb-1.5 block text-[0.86rem] font-semibold text-ink-2">
              Valor (R$)
            </label>
            <input
              id="valor"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              inputMode="decimal"
              placeholder="400"
              className="h-12 w-full rounded-full border border-line-strong bg-bg px-4 text-[0.94rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)]"
            />
          </div>
          <div>
            <label htmlFor="tipo" className="mb-1.5 block text-[0.86rem] font-semibold text-ink-2">
              Tipo
            </label>
            <div className="relative">
              <select
                id="tipo"
                value={type}
                onChange={(event) => setType(event.target.value as SaleType)}
                className="h-12 w-full appearance-none rounded-full border border-line-strong bg-bg pl-4 pr-10 text-[0.94rem] text-ink outline-none transition-colors duration-200 hover:border-ink/30 focus-visible:border-green focus-visible:shadow-[0_0_0_4px_var(--lime-soft)]"
              >
                <option value="avulso">Avulso</option>
                <option value="mensal">Mensal</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green px-6 text-[0.94rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar
          </button>
        </form>
      </Panel>

      {sales.length === 0 ? (
        <EmptyState
          icon={Wallet}
          hue="honey"
          title="Nenhuma venda registrada"
          text="Assim que fechar a primeira venda, registre aqui pra acompanhar o retorno da assinatura."
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">Vendas</h2>
            <p className="text-[0.84rem] text-muted">mais recentes primeiro</p>
          </div>
          <ul className="divide-y divide-line">
            {sales.map((sale) => (
              <li key={sale.id} className="rise-in group flex items-center gap-3 px-5 py-3.5">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-honey-soft font-display text-[0.9rem] font-semibold text-honey-ink"
                  aria-hidden="true"
                >
                  {sale.client.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{sale.client}</p>
                  <p className="text-[0.8rem] text-muted tabular">{new Date(`${sale.date}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge hue={sale.type === "mensal" ? "azure" : "grape"}>{sale.type === "avulso" ? "Avulso" : "Mensal"}</Badge>
                <p className="w-28 text-right font-display text-[1.02rem] font-semibold text-ink tabular sm:w-32">
                  {formatBRL(sale.value)}
                  {sale.type === "mensal" && <span className="text-[0.76rem] font-medium text-muted">/mês</span>}
                </p>
                <DeleteButton
                  label={`Apagar a venda de ${sale.client}`}
                  onClick={() => setPending({ id: sale.id, client: sale.client })}
                  className="shrink-0"
                />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ConfirmDelete
        target={pending?.client ?? null}
        kind="venda"
        detail="A venda sai do total faturado e da receita mensal."
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) salesStore.remove(pending.id);
          setPending(null);
        }}
      />
    </div>
  );
}
