"use client";

import { useEffect, useRef, useState } from "react";

// Miniatura de verdade de um site gerado: o HTML num iframe isolado, na
// largura de um computador (1280 px) e reduzido com `zoom` pra caber no card
// (nítido, sem borrar como `transform: scale`). Só olhar: sem clique, sem
// rolagem. O iframe só carrega quando o card chega perto da tela.
const WIDTH = 1280;
const HEIGHT = 800;

export function SitePreview({ html, title, className = "" }: { html: string; title: string; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    setZoom(el.getBoundingClientRect().width / WIDTH);
    const observer = new ResizeObserver(([entry]) => setZoom(entry!.contentRect.width / WIDTH));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`overflow-hidden rounded-[14px] border border-line bg-surface shadow-soft ${className}`}>
      <div className="flex items-center gap-1 border-b border-line px-2.5 py-1.5" aria-hidden="true">
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="size-1.5 rounded-full bg-line-strong" />
        <span className="ml-1.5 h-1.5 flex-1 rounded-full bg-surface-2" />
      </div>
      <div ref={boxRef} className="relative overflow-hidden bg-white" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}>
        {zoom > 0 && (
          <div className="pointer-events-none absolute left-0 top-0" style={{ width: WIDTH, height: HEIGHT, zoom }}>
            <iframe
              title={`Prévia do site de ${title}`}
              srcDoc={html}
              sandbox="allow-scripts"
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
              className="block size-full border-0"
              // Sem barra de rolagem na miniatura.
              scrolling="no"
            />
          </div>
        )}
      </div>
    </div>
  );
}
