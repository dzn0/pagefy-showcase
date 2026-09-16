"use client";

import { useState } from "react";
import { photoSrc } from "@/lib/lead-search";

// Foto real do comércio (Google Places, via /places/photo no backend). Sem foto, ou
// se o Google não entregar (nome de foto vencido), cai na inicial na cor do
// ramo. `loading="lazy"`: só busca a foto quando a linha aparece na tela,
// porque cada foto é uma chamada cobrada.
export function BusinessPhoto({
  photo,
  name,
  color,
  size,
  className = "",
  initialClassName = "text-[0.95rem]",
}: {
  photo: string | null | undefined;
  name: string;
  color: string;
  /** Lado em px na tela (a foto é a mesma de todo o app, só reduzida). */
  size: number;
  className?: string;
  initialClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!photo || failed) {
    return (
      <span
        className={`grid shrink-0 place-items-center font-display font-semibold text-white ${initialClassName} ${className}`}
        style={{ backgroundColor: color, width: size, height: size }}
        aria-hidden="true"
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a URL final é um redirect pro Google; next/image não ajuda aqui
    <img
      src={photoSrc(photo)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`shrink-0 object-cover ${className}`}
      style={{ width: size, height: size, backgroundColor: "var(--surface-2)" }}
    />
  );
}
