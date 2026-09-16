import type { Metadata } from "next";
import { DashboardShell } from "./_components/shell";

// Cinto e suspensório com o robots.txt, que já bloqueia /app/. Se algum dia um
// endereço daqui for rastreado por outro caminho (um link que alguém colou em
// algum lugar), o `noindex` tira do índice — e "Redirecionando…" nunca vira
// resultado de busca do Pagefy.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
