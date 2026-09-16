"use client";

import Image from "next/image";

// Extraído do Navbar pra ser reaproveitado no topo do dashboard também.
export function Avatar({ name, picture, size }: { name: string; picture?: string; size: number }) {
  if (picture) {
    return (
      <Image
        src={picture}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        unoptimized
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-surface-2 font-display font-semibold text-ink-2"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function firstName(name: string) {
  return name.split(" ")[0];
}
