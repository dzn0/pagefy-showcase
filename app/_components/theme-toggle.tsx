"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "pagefy-theme";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function resolvedTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    listeners.delete(callback);
    media.removeEventListener("change", callback);
  };
}

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sem acesso ao storage: o tema vale só para esta visita.
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore<Theme | null>(subscribe, resolvedTheme, () => null);
  const isDark = theme === "dark";
  const label = isDark ? "Mudar para o tema claro" : "Mudar para o tema escuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={`relative grid size-10 place-items-center overflow-hidden rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <Sun
        aria-hidden="true"
        className={`absolute size-[18px] transition-[transform,opacity] duration-500 ease-(--ease-out-expo) ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute size-[18px] transition-[transform,opacity] duration-500 ease-(--ease-out-expo) ${
          isDark || theme === null ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
    </button>
  );
}
