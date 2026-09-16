import { PencilLine } from "lucide-react";

// Botão da ação principal do produto: gerar o site de um comércio. É o roxo
// da etapa "montar", chapado, sem efeito de brilho: o que ele promete é uma
// página pronta, e o ícone mostra exatamente isso — uma página cujas linhas
// se desenham no hover. CSS em globals.css (.pf-magic). Com movimento
// reduzido, só a cor muda.
export function GenerateButton({
  generated,
  onClick,
  className = "",
}: {
  generated: boolean;
  onClick: () => void;
  className?: string;
}) {
  // Site já criado: o mesmo clique abre o gerador pra continuar editando.
  if (generated) {
    return (
      <button type="button" onClick={onClick} className={`pf-edit h-9 px-3.5 text-[0.82rem] ${className}`}>
        <PencilLine className="pf-edit-icon size-3.5" aria-hidden="true" />
        Editar site
      </button>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`pf-magic h-9 px-3.5 text-[0.82rem] ${className}`}>
      <PageGlyph />
      Gerar site
    </button>
  );
}

// Uma página: moldura, barra de topo e duas linhas de conteúdo que se
// desenham da esquerda pra direita no hover, como se o site estivesse sendo
// montado ali. Traço, não preenchimento — o ícone cheio virava mancha no roxo.
function PageGlyph() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="pf-magic-icon size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="2.75" y="3.25" width="14.5" height="13.5" rx="2.5" opacity="0.9" />
      <path d="M2.75 7.4h14.5" opacity="0.9" />
      <path className="pf-magic-line" pathLength={1} d="M5.9 10.9h8.2" />
      <path className="pf-magic-line pf-magic-line-2" pathLength={1} d="M5.9 13.7h5.2" />
    </svg>
  );
}
