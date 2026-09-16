import type { CSSProperties } from "react";

// Atraso do reveal on-screen, lido pelo CSS de `[data-reveal]` em globals.css.
export function revealDelay(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}
