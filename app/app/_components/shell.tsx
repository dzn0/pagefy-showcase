"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { isFocusRoute } from "@/lib/dashboard-nav";
import { refreshCredits } from "@/lib/store/credits";
import { loadUserData, useUserDataStatus } from "@/lib/store/user-data";
// Registram as listas na carga dos dados da conta (precisam existir antes dela).
import "@/lib/store/leads";
import "@/lib/store/sites";
import "@/lib/store/sales";
import "@/lib/store/site-drafts";
import { useAuth } from "@/app/_components/auth-provider";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// Porta de entrada da UI de criação: só existe pra quem já logou com o
// Google. Sem conta, manda de volta pra landing em vez de mostrar o app vazio.
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const focus = isFocusRoute(usePathname());
  const dataStatus = useUserDataStatus();
  const account = profile?.email ?? null;

  // Leads, sites, rascunhos e vendas vêm da conta antes das telas abrirem: elas
  // leem as listas na hora (e "Gerar site" criaria um rascunho novo por cima
  // de um que só ainda não chegou).
  useEffect(() => {
    if (!account) return;
    void loadUserData(account);
    // Saldo, plano, preços e nome do modelo de uma vez: sem isto, quem entrava
    // direto no gerador via a tela sem essas informações até fazer algo que as buscasse.
    void refreshCredits();
  }, [account]);

  useEffect(() => {
    // Um recarregamento de página faz o React hidratar com `profile` ainda
    // nulo (o valor combinado com o servidor) antes de corrigir pro valor
    // real do sessionStorage. Adiar pro próximo tick evita mandar de volta
    // pra landing alguém que, na real, já está logado.
    const id = setTimeout(() => {
      if (!profile) router.replace("/");
    }, 0);
    return () => clearTimeout(id);
  }, [profile, router]);

  if (!profile) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <p className="text-[0.94rem] text-muted">Redirecionando…</p>
      </div>
    );
  }

  if (dataStatus !== "ready") {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-5">
        {dataStatus === "error" ? (
          <div className="max-w-sm text-center">
            <p className="text-[0.94rem] text-ink">Não deu pra carregar seus dados agora.</p>
            <p className="mt-1 text-[0.86rem] text-muted">Confira a conexão e tente de novo.</p>
            <button
              type="button"
              onClick={() => account && void loadUserData(account)}
              className="mt-4 rounded-full bg-ink px-4 py-2 text-[0.88rem] font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-[0.94rem] text-muted">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Carregando seus dados…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="pf-canvas min-h-dvh bg-bg">
      <Sidebar />
      <Topbar />
      <main className={`px-5 pb-28 pt-6 sm:px-8 sm:pb-10 md:pr-8 ${focus ? "md:pl-[calc(5rem+2rem)]" : "md:pl-[calc(16rem+2rem)]"}`}>
        <div className={`mx-auto ${focus ? "max-w-[112rem]" : "max-w-6xl"}`}>{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
