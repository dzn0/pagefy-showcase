"use client";

import { X } from "lucide-react";
import { useAuth } from "./auth-provider";

// Faixa fina abaixo do header, só aparece quando o login com Google falha
// (pop-up bloqueado, ambiente sem client ID, etc). Qualquer botão de
// Entrar/Começar pode disparar o erro; este é o único lugar que o mostra.
export function AuthErrorBanner() {
  const { status, error, dismissError, signIn } = useAuth();

  if (status !== "error" || !error) return null;

  return (
    <div role="alert" className="border-b border-danger/25 bg-danger/10 px-5 py-2.5 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="text-[0.88rem] font-medium text-danger">{error}</p>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={signIn} className="text-[0.86rem] font-semibold text-danger underline underline-offset-4">
            Tentar de novo
          </button>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Fechar aviso"
            className="grid size-7 place-items-center rounded-full text-danger transition-colors hover:bg-danger/15"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
