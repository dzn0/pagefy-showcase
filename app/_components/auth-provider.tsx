"use client";

import Script from "next/script";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { apiFetch, apiPost } from "@/lib/api";
import { lerAquisicao, registrar } from "@/lib/analytics";
import { forgetCredits, setCredits } from "@/lib/store/credits";
import { forgetUserData } from "@/lib/store/user-data";

export type GoogleProfile = {
  name: string;
  email: string;
  picture?: string;
  /** Vê "Custos da API". Quem decide é o servidor; a tela só obedece. */
  admin?: boolean;
};

type Phase = "idle" | "connecting" | "error";
type AuthStatus = Phase | "signed-in";

type AuthContextValue = {
  status: AuthStatus;
  profile: GoogleProfile | null;
  error: string | null;
  /** false quando NEXT_PUBLIC_GOOGLE_CLIENT_ID não foi definido neste ambiente. */
  configured: boolean;
  signIn: () => void;
  signOut: () => void;
  dismissError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const STORAGE_KEY = "pagefy-google-profile";

// Quem diz se a pessoa está logada é o backend, por um cookie de sessão que o
// JavaScript não consegue ler (HttpOnly). O perfil guardado no sessionStorage
// é só um cache pra a tela não piscar "deslogado" a cada carregamento: no
// primeiro instante ele aparece, e logo em seguida /auth/me confirma ou corrige.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const profile = useSyncExternalStore(subscribe, getStoredProfileSnapshot, getServerProfileSnapshot);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ReturnType<NonNullable<Window["google"]>["accounts"]["oauth2"]["initTokenClient"]> | null>(null);

  // Confere a sessão no servidor assim que a página monta.
  useEffect(() => {
    const controller = new AbortController();
    void apiFetch("/auth/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: SessionUser | null } | null) => {
        if (controller.signal.aborted || !data) return;
        if (data.user) {
          storeProfile(toProfile(data.user));
          // O saldo vem junto: uma resposta só serve pra sessão e pros créditos.
          setCredits(data.user.credits);
        } else {
          clearStoredProfile();
          forgetCredits();
          forgetUserData();
        }
      })
      .catch(() => {
        // Backend fora do ar: mantém o que estava em cache em vez de deslogar.
      });
    return () => controller.abort();
  }, []);

  const ensureClient = useCallback(() => {
    if (clientRef.current) return clientRef.current;
    if (!CLIENT_ID || !window.google?.accounts?.oauth2) return null;

    clientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "openid email profile",
      callback: (response) => {
        if (response.error || !response.access_token) {
          setPhase("error");
          setError("Não deu para conectar com o Google. Tente de novo.");
          return;
        }
        // O token do pop-up não é a sessão: ele vai pro backend, que confere
        // com o Google, cria a conta e devolve o cookie.
        void openSession(response.access_token)
          .then((user) => {
            storeProfile(toProfile(user));
            setCredits(user.credits);
            setError(null);
            setPhase("idle");
          })
          .catch((cause: Error) => {
            setPhase("error");
            setError(cause.message);
          });
      },
      error_callback: (err) => {
        if (err.type === "popup_closed") {
          // O usuário fechou o pop-up de propósito: não é um erro a avisar.
          setPhase((current) => (current === "connecting" ? "idle" : current));
          return;
        }
        setPhase("error");
        setError("Não deu para abrir o login do Google. Verifique o bloqueador de pop-up do navegador.");
      },
    });
    return clientRef.current;
  }, []);

  const signIn = useCallback(() => {
    if (!CLIENT_ID) {
      setPhase("error");
      setError("Login com Google ainda não foi configurado neste ambiente.");
      return;
    }
    const client = ensureClient();
    if (!client) {
      setPhase("error");
      setError("O login do Google ainda está carregando. Tente de novo em um instante.");
      return;
    }
    setPhase("connecting");
    setError(null);
    registrar("login_aberto");
    client.requestAccessToken({ prompt: "select_account" });
  }, [ensureClient]);

  const signOut = useCallback(() => {
    // A tela responde na hora; o cookie cai logo atrás.
    clearStoredProfile();
    forgetCredits();
    forgetUserData();
    setPhase("idle");
    setError(null);
    void apiPost("/auth/logout", {}).catch(() => {});
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
    setPhase((current) => (current === "error" ? "idle" : current));
  }, []);

  const status: AuthStatus = profile ? "signed-in" : phase;

  const value = useMemo<AuthContextValue>(
    () => ({ status, profile, error, configured: Boolean(CLIENT_ID), signIn, signOut, dismissError }),
    [status, profile, error, signIn, signOut, dismissError],
  );

  return (
    <AuthContext.Provider value={value}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

/** A conta como o backend a devolve (/auth/me, /auth/google). */
type SessionUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  plan: string;
  credits: number;
  phoneVerified: boolean;
  admin?: boolean;
};

function toProfile(user: SessionUser): GoogleProfile {
  return { name: user.name, email: user.email, picture: user.avatarUrl ?? undefined, ...(user.admin ? { admin: true } : {}) };
}

/**
 * Conta criada numa rede que já tinha recebido o bônus nas últimas 24 h: ela
 * nasce sem crédito, e o app precisa dizer por quê. Fica no sessionStorage
 * porque é recado de uma vez só — morre quando a aba fecha.
 */
const BONUS_NEGADO_KEY = "pagefy-bonus-negado";

/** Só lê (a tela chama na montagem). Limpar é outra função, de propósito. */
export function temBonusNegado() {
  try {
    return sessionStorage.getItem(BONUS_NEGADO_KEY) === "1";
  } catch {
    return false;
  }
}

/** Recado dado: não aparece de novo nesta aba. */
export function limparBonusNegado() {
  try {
    sessionStorage.removeItem(BONUS_NEGADO_KEY);
  } catch {
    // Sem sessionStorage não havia recado guardado pra limpar.
  }
}

async function openSession(accessToken: string): Promise<SessionUser> {
  let res: Response;
  try {
    // `aquisicao`: de onde a pessoa veio na primeira visita. O backend só a
    // grava quando a conta é criada, e nunca depois (lib/analytics.ts).
    res = await apiPost("/auth/google", { accessToken, aquisicao: lerAquisicao() });
  } catch {
    throw new Error("Conectou com o Google, mas não deu para falar com o Pagefy. Confira a internet e tente de novo.");
  }
  const data = (await res.json().catch(() => null)) as { user?: SessionUser; bonusNegado?: boolean; error?: string } | null;
  if (!res.ok || !data?.user) throw new Error(data?.error ?? "Não deu para entrar agora. Tente de novo.");
  if (data.bonusNegado) {
    try {
      sessionStorage.setItem(BONUS_NEGADO_KEY, "1");
    } catch {
      // Sem sessionStorage a pessoa só não vê o aviso; o saldo na tela já diz zero.
    }
  }
  return data.user;
}

// --- Leitura do sessionStorage como "external store" (useSyncExternalStore) ---

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  listeners.forEach((listener) => listener());
}

let cachedRaw: string | null = null;
let cachedProfile: GoogleProfile | null = null;

function getStoredProfileSnapshot(): GoogleProfile | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  // getSnapshot precisa devolver a mesma referência se nada mudou, senão
  // useSyncExternalStore entende que está sempre "mudando" e loopa.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedProfile = raw ? (JSON.parse(raw) as GoogleProfile) : null;
    } catch {
      cachedProfile = null;
    }
  }
  return cachedProfile;
}

function getServerProfileSnapshot(): GoogleProfile | null {
  return null;
}

function storeProfile(profile: GoogleProfile) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Sem acesso ao sessionStorage (aba anônima, storage bloqueado): o cache
    // não persiste, mas o cookie de sessão continua valendo.
  }
  notify();
}

function clearStoredProfile() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Idem.
  }
  notify();
}
