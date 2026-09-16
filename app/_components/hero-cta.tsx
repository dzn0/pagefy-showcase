"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { AuthCtaButton } from "./auth-cta-button";
import { useAuth } from "./auth-provider";
import { revealDelay } from "@/lib/reveal";

// Área de ação do hero: troca de "Gerar site / Ver como funciona" para um
// único botão Dashboard assim que a conta do Google conecta. É daqui que a
// pessoa logada entra na UI de criação de sites.
export function HeroCta() {
  const { profile } = useAuth();

  return (
    <>
      <div data-reveal style={revealDelay(180)} className="mt-7 flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-3">
        {profile ? (
          <Link
            href="/app"
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-green px-7 text-[1.02rem] font-semibold text-on-green shadow-[0_1px_2px_rgb(20_26_18/0.12),0_8px_20px_-8px_rgb(63_143_47/0.6)] transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97]"
          >
            <LayoutDashboard className="size-[18px]" aria-hidden="true" />
            Dashboard
          </Link>
        ) : (
          <>
            <AuthCtaButton
              connectingLabel="Conectando…"
              className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-green px-7 text-[1.02rem] font-semibold text-on-green shadow-[0_1px_2px_rgb(20_26_18/0.12),0_8px_20px_-8px_rgb(63_143_47/0.6)] transition-[background-color,transform] duration-200 hover:bg-green-hover active:scale-[0.97] sm:w-auto"
            >
              Achar clientes grátis
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </AuthCtaButton>
            <Link
              href="#como-funciona"
              className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-5 text-[1.02rem] font-semibold text-ink transition-colors hover:bg-surface-2 sm:h-13"
            >
              Ver como funciona
              <ArrowRight
                className="size-4 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </>
        )}
      </div>
      <p data-reveal style={revealDelay(240)} className="mt-3 text-[0.88rem] text-muted">
        {profile ? `Bem-vindo de volta, ${profile.name.split(" ")[0]}.` : "Sem cartão de crédito. Entrar é só com sua conta do Google."}
      </p>
    </>
  );
}
