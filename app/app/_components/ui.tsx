import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Hue } from "@/lib/dashboard-nav";

// Classes literais por cor (o Tailwind só gera o que aparece escrito inteiro).
export const HUE: Record<Hue, { soft: string; ink: string; solid: string; fill: string; ring: string }> = {
  green: { soft: "bg-lime-soft", ink: "text-green-ink", solid: "bg-green text-on-green", fill: "bg-green", ring: "ring-green/25" },
  azure: { soft: "bg-azure-soft", ink: "text-azure-ink", solid: "bg-azure text-on-hue", fill: "bg-azure", ring: "ring-azure/25" },
  grape: { soft: "bg-grape-soft", ink: "text-grape-ink", solid: "bg-grape text-on-hue", fill: "bg-grape", ring: "ring-grape/25" },
  coral: { soft: "bg-coral-soft", ink: "text-coral-ink", solid: "bg-coral text-on-hue", fill: "bg-coral", ring: "ring-coral/25" },
  honey: { soft: "bg-honey-soft", ink: "text-honey-ink", solid: "bg-honey text-[#2a1d02]", fill: "bg-honey", ring: "ring-honey/30" },
  berry: { soft: "bg-berry-soft", ink: "text-berry-ink", solid: "bg-berry text-on-hue", fill: "bg-berry", ring: "ring-berry/25" },
  neutral: { soft: "bg-surface-2", ink: "text-ink-2", solid: "bg-ink text-bg", fill: "bg-muted", ring: "ring-line-strong" },
};

export function HueTile({
  icon: Icon,
  hue,
  size = "md",
  solid = false,
  className = "",
}: {
  icon: LucideIcon;
  hue: Hue;
  size?: "sm" | "md" | "lg";
  solid?: boolean;
  className?: string;
}) {
  const box = { sm: "size-7 rounded-[9px]", md: "size-10 rounded-[12px]", lg: "size-12 rounded-[14px]" }[size];
  const glyph = { sm: "size-[15px]", md: "size-[18px]", lg: "size-5" }[size];
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${solid ? HUE[hue].solid : `${HUE[hue].soft} ${HUE[hue].ink}`} ${className}`}>
      <Icon className={glyph} aria-hidden="true" />
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
  icon,
  hue = "green",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  hue?: Hue;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {icon && <HueTile icon={icon} hue={hue} size="lg" solid className="mt-0.5 shadow-soft" />}
        <div>
          <h1 className="font-display text-[1.6rem] font-semibold tracking-[-0.03em] text-ink sm:text-[1.9rem]">{title}</h1>
          {description && <p className="mt-1 max-w-[60ch] text-[0.96rem] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-[22px] border border-line bg-surface shadow-card ${className}`}>{children}</div>;
}

export function Badge({ hue, children, dot = false }: { hue: Hue; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.74rem] font-semibold ${HUE[hue].soft} ${HUE[hue].ink}`}>
      {dot && <span className={`size-1.5 rounded-full ${HUE[hue].fill}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Saldo como uma barra contínua (proporção do total do plano): serve igual
 * pra 6 ou 600 créditos. A cor avisa o estado — verde tranquilo, mel com
 * ¼ ou menos, rosa zerado. O número exato fica no texto ao lado.
 */
export function CreditMeter({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const total = Math.max(max, value, 1);
  const ratio = Math.min(1, Math.max(0, value / total));
  const tone = value <= 0 ? "bg-berry" : ratio <= 0.25 ? "bg-honey" : "bg-green";
  return (
    <span
      className={`block h-2 overflow-hidden rounded-full bg-line-strong ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      aria-label={`${value} de ${total} créditos`}
    >
      <span
        className={`block h-full rounded-full transition-[width,background-color] duration-700 ease-(--ease-out-expo) ${tone}`}
        style={{ width: `${value <= 0 ? 0 : Math.max(ratio * 100, 4)}%` }}
      />
    </span>
  );
}

export function EmptyState({
  icon,
  hue = "green",
  title,
  text,
  action,
  art,
}: {
  icon: LucideIcon;
  hue?: Hue;
  title: string;
  text: string;
  action?: { label: string; href: string };
  /** Ilustração que mostra como a tela fica cheia. */
  art?: React.ReactNode;
}) {
  return (
    <Panel className="overflow-hidden">
      {art && <div className="border-b border-line bg-paper px-6 pb-0 pt-8">{art}</div>}
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <HueTile icon={icon} hue={hue} size="lg" />
        <p className="font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-ink">{title}</p>
        <p className="max-w-[44ch] text-[0.92rem] leading-relaxed text-muted">{text}</p>
        {action && (
          <Link
            href={action.href}
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-green px-5 text-[0.92rem] font-semibold text-on-green transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
          >
            {action.label} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </Panel>
  );
}

/** Número principal de uma área, num fundo da cor dela. */
export function StatCard({
  icon,
  label,
  value,
  hint,
  hue = "green",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  hue?: Hue;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[22px] p-5 ${HUE[hue].soft}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[0.86rem] font-semibold ${HUE[hue].ink}`}>{label}</p>
        <HueTile icon={icon} hue={hue} size="sm" solid />
      </div>
      <p className="mt-4 font-display text-[2rem] font-semibold leading-none tracking-[-0.035em] text-ink tabular">{value}</p>
      {hint && <p className={`mt-2 text-[0.8rem] font-medium ${HUE[hue].ink}`}>{hint}</p>}
    </div>
  );
}

/**
 * Um valor em créditos com o ícone de crédito do app (o mesmo disco verde
 * com brilho do saldo na topbar), em vez de escrever "créditos" ou "cr".
 */
export function CreditAmount({ value, className = "", size = "sm" }: { value: number; className?: string; size?: "sm" | "md" }) {
  const md = size === "md";
  return (
    <span className={`inline-flex items-center whitespace-nowrap tabular ${md ? "gap-1.5" : "gap-1"} ${className}`}>
      <span className={`grid shrink-0 place-items-center rounded-full bg-green text-on-green ${md ? "size-[18px]" : "size-3.5"}`} aria-hidden="true">
        <Sparkles className={md ? "size-2.5" : "size-2"} strokeWidth={2.6} />
      </span>
      {value.toLocaleString("pt-BR")}
      <span className="sr-only"> créditos</span>
    </span>
  );
}
