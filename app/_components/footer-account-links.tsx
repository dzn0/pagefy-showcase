"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";
import { SIGNUP_REQUEST, useLoginDialog } from "./login-dialog";

// Coluna "Conta" do rodapé: sem sessão, abre o login do Google (não existe
// página de entrar ou de cadastro); com a sessão aberta, atalhos pra dentro do app.
export function FooterAccountLinks({ linkClass }: { linkClass: string }) {
  const { profile, status } = useAuth();
  const openLogin = useLoginDialog();

  if (profile) {
    return (
      <>
        {[
          { href: "/app", label: "Dashboard" },
          { href: "/app/plano", label: "Créditos e plano" },
        ].map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </>
    );
  }

  return (
    <>
      <li>
        <button type="button" onClick={() => openLogin()} disabled={status === "connecting"} className={linkClass}>
          Entrar
        </button>
      </li>
      <li>
        <button type="button" onClick={() => openLogin(SIGNUP_REQUEST)} disabled={status === "connecting"} className={linkClass}>
          Criar conta
        </button>
      </li>
    </>
  );
}
