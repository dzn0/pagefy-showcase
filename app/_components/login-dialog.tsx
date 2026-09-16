"use client";

import { useRouter } from "next/navigation";
import { registrar } from "@/lib/analytics";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, Search, Sparkles, X } from "lucide-react";
import { useAuth } from "./auth-provider";
import { GoogleIcon } from "./google-icon";
import { Logo } from "./logo";

// Pop-up do Pagefy que antecede qualquer login: todo botão de "Entrar",
// "Começar grátis", "Gerar site"… abre este diálogo, e só o botão de dentro
// dele chama o pop-up do Google. Cada chamada ajusta o texto ao contexto e
// diz pra onde ir depois do login.

export type LoginRequest = {
  title: string;
  message: ReactNode;
  icon?: "brand" | "search" | "site";
  /** Pra onde ir quando o login der certo. null/ausente = fica na página. */
  redirectTo?: string | null;
};

const DEFAULT_REQUEST: LoginRequest = {
  title: "Entre no Pagefy",
  message: "Use a sua conta do Google: sem senha nova e sem cartão de crédito.",
  icon: "brand",
};

/** Botões de criar conta ("Começar grátis", "Achar clientes grátis"…). */
export const SIGNUP_REQUEST: Partial<LoginRequest> = {
  title: "Crie sua conta grátis",
  message: "Entre com o Google: sua cidade já vem pesquisada e você ganha 120 créditos de boas-vindas pra mais 4 buscas. Sem cartão de crédito.",
  icon: "brand",
  redirectTo: "/app",
};

const LoginDialogContext = createContext<((request?: Partial<LoginRequest>) => void) | null>(null);

/** Abre o pop-up de login do Pagefy (ou, se já houver sessão, só segue pro destino). */
export function useLoginDialog() {
  const open = useContext(LoginDialogContext);
  if (!open) throw new Error("useLoginDialog precisa estar dentro de <LoginDialogProvider>.");
  return open;
}

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<LoginRequest | null>(null);
  const { profile } = useAuth();
  const router = useRouter();

  const open = useCallback(
    (partial?: Partial<LoginRequest>) => {
      const next = { ...DEFAULT_REQUEST, ...partial };
      if (profile) {
        if (next.redirectTo) router.push(next.redirectTo);
        return;
      }
      setRequest(next);
      // Clicou num CTA e o pop-up abriu. A distância entre isto e
      // "login_aberto" é quanta gente desiste na hora de entrar com o Google.
      registrar("cadastro_iniciado", next.redirectTo ? { origem: next.redirectTo } : undefined);
    },
    [profile, router],
  );

  // Login concluído com o diálogo aberto: fecha e segue pro destino pedido.
  useEffect(() => {
    if (!request || !profile) return;
    const destination = request.redirectTo;
    const id = setTimeout(() => {
      setRequest(null);
      if (destination) router.push(destination);
    }, 0);
    return () => clearTimeout(id);
  }, [request, profile, router]);

  const value = useMemo(() => open, [open]);

  return (
    <LoginDialogContext.Provider value={value}>
      {children}
      <LoginDialog request={request} onClose={() => setRequest(null)} />
    </LoginDialogContext.Provider>
  );
}

function LoginDialog({ request, onClose }: { request: LoginRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { signIn, status, error, configured } = useAuth();
  const connecting = status === "connecting";
  const openNow = request !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (openNow && !dialog.open) dialog.showModal();
    if (!openNow && dialog.open) dialog.close();
  }, [openNow]);

  const icon = request?.icon ?? "brand";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // Clique no fundo escurecido fecha.
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="login-dialog-titulo"
      className="m-auto w-[min(92vw,440px)] rounded-[24px] border border-line bg-surface p-0 text-ink shadow-frame backdrop:bg-[#0b0c0d]/55 backdrop:backdrop-blur-[2px] open:animate-[rise-in_0.35s_var(--ease-out-expo)_both]"
    >
      {request && (
        <div className="relative p-7 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          {icon === "brand" ? (
            <Logo className="gap-[9px]" markClassName="-ml-[5px] size-10" textClassName="text-[1.45rem] leading-none" />
          ) : (
            <span
              className={`grid size-12 place-items-center rounded-[14px] ${icon === "site" ? "bg-grape-soft text-grape-ink" : "bg-azure-soft text-azure-ink"}`}
            >
              {icon === "site" ? <Sparkles className="size-5" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
            </span>
          )}
          <h2 id="login-dialog-titulo" className="mt-5 text-[1.45rem] font-semibold leading-tight tracking-[-0.03em]">
            {request.title}
          </h2>
          <p className="mt-2.5 text-[0.98rem] leading-relaxed text-ink-2">{request.message}</p>

          <button
            type="button"
            onClick={signIn}
            disabled={connecting}
            autoFocus
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-line-strong bg-surface text-[0.98rem] font-semibold text-ink shadow-soft transition-[border-color,transform] duration-200 hover:border-ink/30 active:scale-[0.98] disabled:cursor-progress disabled:opacity-80"
          >
            {connecting ? <LoaderCircle className="size-[18px] animate-spin" aria-hidden="true" /> : <GoogleIcon className="size-[18px]" />}
            {connecting ? "Conectando…" : "Entrar com o Google"}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-center text-[0.86rem] font-medium text-danger">
              {error}
            </p>
          )}
          <p className="mt-4 text-center text-[0.84rem] text-muted">
            {configured ? "Sem cartão de crédito. Só a sua conta do Google." : "Login com Google ainda não configurado neste ambiente."}
          </p>
        </div>
      )}
    </dialog>
  );
}
