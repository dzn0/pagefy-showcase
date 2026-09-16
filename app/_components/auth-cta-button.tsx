"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "./auth-provider";
import { SIGNUP_REQUEST, useLoginDialog, type LoginRequest } from "./login-dialog";

// Botão de "Começar"/"Criar conta": abre o pop-up de login do Pagefy (que é
// quem chama o Google). Existe como componente próprio (em vez de espalhar
// hooks pelas seções) pra as seções estáticas continuarem no servidor. Com a
// sessão aberta vira um atalho pro Dashboard, com a mesma aparência.
export function AuthCtaButton({
  className,
  connectingLabel,
  signedInLabel = "Abrir o Dashboard",
  login = SIGNUP_REQUEST,
  children,
}: {
  className: string;
  connectingLabel: string;
  signedInLabel?: string;
  /** Texto do pop-up e destino depois do login. */
  login?: Partial<LoginRequest>;
  children: ReactNode;
}) {
  const { status, profile } = useAuth();
  const openLogin = useLoginDialog();
  const connecting = status === "connecting";

  if (profile) {
    return (
      <Link href="/app" className={className}>
        <LayoutDashboard className="size-[18px]" aria-hidden="true" />
        {signedInLabel}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => openLogin(login)} disabled={connecting} className={className}>
      {connecting ? connectingLabel : children}
    </button>
  );
}
