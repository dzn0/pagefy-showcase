export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <rect x="14" y="10" width="62" height="62" rx="18" style={{ fill: "var(--mark-back)" }} />
      <rect x="28" y="28" width="62" height="62" rx="18" style={{ fill: "var(--mark-front)" }} />
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "size-7",
  textClassName = "text-[1.3rem]",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className={`font-display font-semibold tracking-[-0.03em] text-ink ${textClassName}`}>Pagefy</span>
    </span>
  );
}
