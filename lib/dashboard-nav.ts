import {
  CreditCard,
  Globe,
  Home,
  Kanban,
  LifeBuoy,
  MessageSquareHeart,
  PlayCircle,
  Search,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Cor de cada área do app: a mesma da etapa do caminho até a venda que ela cuida. */
export type Hue = "green" | "azure" | "grape" | "coral" | "honey" | "berry" | "neutral";

export type NavItem = { href: string; label: string; icon: LucideIcon; hue: Hue };

export const PRIMARY_NAV: NavItem[] = [
  { href: "/app", label: "Início", icon: Home, hue: "green" },
  { href: "/app/buscar", label: "Buscar leads", icon: Search, hue: "azure" },
  { href: "/app/leads", label: "Leads", icon: Kanban, hue: "coral" },
  { href: "/app/sites", label: "Sites", icon: Globe, hue: "grape" },
  { href: "/app/financeiro", label: "Financeiro", icon: Wallet, hue: "honey" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/app/plano", label: "Créditos e plano", icon: CreditCard, hue: "neutral" },
  { href: "/app/config", label: "Configurações", icon: Settings, hue: "neutral" },
];

/**
 * Aprender e falar com a gente. Grupo separado da conta porque não é ajuste de
 * cadastro: é pra quem travou numa etapa ou tem algo a dizer.
 */
export const HELP_NAV: NavItem[] = [
  { href: "/app/tutoriais", label: "Tutoriais", icon: PlayCircle, hue: "neutral" },
  { href: "/app/suporte", label: "Suporte", icon: LifeBuoy, hue: "neutral" },
  { href: "/app/feedback", label: "Feedback", icon: MessageSquareHeart, hue: "neutral" },
];

// Mobile: sidebar vira barra inferior com Início, Buscar, Leads, Sites e Mais.
export const MOBILE_TABS = PRIMARY_NAV.slice(0, 4);

/**
 * Telas que precisam da largura toda (o gerador de site): a barra lateral
 * vira um trilho só de ícones e o conteúdo perde o limite de largura.
 */
export function isFocusRoute(pathname: string) {
  return /^\/app\/sites\/[^/]+/.test(pathname);
}
