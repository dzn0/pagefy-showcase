// Miniatura do site gerado: janela de navegador com o topo na cor do ramo,
// o nome do comércio e blocos de conteúdo. Não é um print, é um esboço fiel
// ao que o gerador monta (capa, serviços, botão de WhatsApp).
export function SiteThumb({ name, color, className = "" }: { name: string; color: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[14px] border border-line bg-surface shadow-soft ${className}`} aria-hidden="true">
      <div className="flex items-center gap-1 border-b border-line px-2.5 py-1.5">
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="ml-1.5 h-1.5 flex-1 rounded-full bg-surface-2" />
      </div>
      <div className="relative px-3 pb-4 pt-3.5 text-white" style={{ backgroundColor: color }}>
        <span className="absolute right-3 top-3 h-1 w-7 rounded-full bg-white/40" />
        <p className="max-w-[80%] truncate font-display text-[0.92rem] font-bold leading-tight tracking-[-0.02em]">{name}</p>
        <span className="mt-2 block h-1 w-3/5 rounded-full bg-white/45" />
        <span className="mt-1 block h-1 w-2/5 rounded-full bg-white/30" />
        <span className="mt-3 inline-block h-3.5 w-14 rounded-full bg-white" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 p-2.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-7 rounded-md" style={{ backgroundColor: `${color}${i === 1 ? "26" : "17"}` }} />
        ))}
      </div>
    </div>
  );
}
