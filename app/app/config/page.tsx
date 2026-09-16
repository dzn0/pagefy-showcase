"use client";

import Link from "next/link";
import { ArrowRight, Filter, BadgeCheck, Languages, ReceiptText, Settings } from "lucide-react";
import { Avatar } from "@/app/_components/avatar";
import { useAuth } from "@/app/_components/auth-provider";
import { Badge, HueTile, PageHeader, Panel } from "../_components/ui";

export default function ConfigPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <PageHeader icon={Settings} hue="neutral" title="Configurações" description="Sua conta e as preferências do Pagefy." />

      <Panel className="flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={profile.name} picture={profile.picture} size={60} />
        <div className="min-w-0 flex-1">
          <p className="text-[1.08rem] font-semibold text-ink">{profile.name}</p>
          <p className="truncate text-[0.88rem] text-muted">{profile.email}</p>
        </div>
        <Badge hue="azure">
          <BadgeCheck className="size-3.5" aria-hidden="true" /> Login com Google
        </Badge>
      </Panel>

      {/* Aqui havia "Marca própria" (seu nome e logo no rodapé dos sites), como
          "Em breve". Saiu em 2026-09-16, pelo mesmo motivo do domínio
          personalizado em 15/09: promessa sem código por trás. Saída junto do
          plano Pro, que a vendia — cobrar por "em breve" é pior do que não
          oferecer. */}
      <Panel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <HueTile icon={Languages} hue="honey" />
          <div>
            <p className="text-[1.02rem] font-semibold text-ink">Idioma e moeda</p>
            <p className="mt-0.5 text-[0.88rem] text-muted">Outros idiomas e moedas chegam depois do lançamento.</p>
          </div>
        </div>
        <span className="inline-flex h-10 items-center rounded-full border border-line-strong bg-surface-2 px-4 text-[0.86rem] font-medium text-ink-2">
          Português (Brasil) · R$ BRL
        </span>
      </Panel>

      {profile.admin && (
        <Link
          href="/app/config/custos"
          className="group flex flex-col gap-4 rounded-[22px] border border-dashed border-line-strong bg-surface p-5 shadow-card transition-colors duration-200 hover:border-honey sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex items-start gap-3.5">
            <HueTile icon={ReceiptText} hue="honey" />
            <div>
              <p className="flex items-center gap-2 text-[1.02rem] font-semibold text-ink">
                Custos da API
                <Badge hue="neutral">Admin</Badge>
              </p>
              <p className="mt-0.5 text-[0.88rem] text-muted">Quanto o Google (e depois a Claude) está custando, por busca e por dia.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-honey-ink transition-[gap] duration-200 group-hover:gap-2.5">
            Abrir <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      {profile.admin && (
        <Link
          href="/app/config/funil"
          className="group flex flex-col gap-4 rounded-[22px] border border-dashed border-line-strong bg-surface p-5 shadow-card transition-colors duration-200 hover:border-azure sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex items-start gap-3.5">
            <HueTile icon={Filter} hue="azure" />
            <div>
              <p className="flex items-center gap-2 text-[1.02rem] font-semibold text-ink">
                Funil
                <Badge hue="neutral">Admin</Badge>
              </p>
              <p className="mt-0.5 text-[0.88rem] text-muted">De quem chega, quantos passam por cada etapa até pagar — e por qual canal vieram.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-azure-ink transition-[gap] duration-200 group-hover:gap-2.5">
            Abrir <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      <p className="text-[0.84rem] text-muted">Sem senha própria no Pagefy: a sua conta é a do Google.</p>
    </div>
  );
}
