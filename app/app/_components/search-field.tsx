"use client";

import { Search, X } from "lucide-react";

/** Minúsculas e sem acento: "São José" encontra "sao jose". */
export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** true quando todas as palavras da busca aparecem em algum dos campos. */
export function matches(query: string, fields: Array<string | null | undefined>) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(fields.filter(Boolean).join(" "));
  return words.every((word) => haystack.includes(word));
}

// Campo de busca das listas do app (Leads, Sites): filtra enquanto digita.
export function SearchField({
  id,
  value,
  onChange,
  placeholder,
  label,
  className = "",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} role="search">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) onChange("");
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 w-full rounded-full border border-line-strong bg-surface pl-10 pr-10 text-[0.92rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted focus:border-green focus:shadow-[0_0_0_4px_var(--lime-soft)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
