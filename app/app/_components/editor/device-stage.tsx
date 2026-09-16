"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Compass, Flower2, Lock, Mail, MessageCircle, Music, Plus, RotateCw, Settings, Share, Wifi, type LucideIcon } from "lucide-react";
import { PreviewFrame, type PreviewDoc } from "./preview-frame";

// A mesa do gerador: um aparelho por vez (o seletor fica na página), no
// maior tamanho que cabe na mesa. Cada tela é montada no tamanho real do
// aparelho (notebook 1440 x 900 com barra de menus, navegador e dock;
// celular 393 x 852 com barra de status, barra de endereço e indicador de
// início) e reduzida inteira pra caber na moldura, então o site vê a
// largura de verdade. A interface do sistema segue o tema do app (--os-*).
//
// As molduras usam unidades do container (cqw), então a proporção de cada
// aparelho é exata (ratio = largura / altura); a mesa é um container de
// tamanho e o aparelho cresce até a largura ou a altura acabar.
const LAPTOP = { w: 1440, h: 900, ratio: 1.675 };
const PHONE = { w: 393, h: 852, ratio: 0.4798 };

export type ScreenState = "empty" | "thinking" | "live";
export type Device = "desktop" | "mobile";

type StageProps = {
  doc: PreviewDoc | null;
  state: ScreenState;
  businessName: string;
  photoUrl: string | null;
  url: string;
};

export function DeviceStage({ device, ...props }: StageProps & { device: Device }) {
  const ratio = device === "desktop" ? LAPTOP.ratio : PHONE.ratio;
  return (
    <div className="grid size-full place-items-center [container-type:size]">
      <div style={{ width: `min(100cqw, ${100 * ratio}cqh)` }}>
        {device === "desktop" ? <Laptop {...props} /> : <Phone {...props} />}
      </div>
    </div>
  );
}

/** Conteúdo em tamanho real (w x h), reduzido pra largura da caixa. */
function ScaledScreen({ w, h, children, className = "" }: { w: number; h: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setScale(el.getBoundingClientRect().width / w);
    const observer = new ResizeObserver(([entry]) => setScale(entry!.contentRect.width / w));
    observer.observe(el);
    return () => observer.disconnect();
  }, [w]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      {/* zoom, não transform: o conteúdo (e o site no iframe) é desenhado de
          novo na resolução final. Com scale() o navegador rasteriza e reduz,
          e o texto sai borrado. */}
      <div className="absolute left-0 top-0" style={{ width: w, height: h, zoom: scale || 1, visibility: scale ? "visible" : "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ notebook

// Apps do dock no estilo dos ícones do macOS (desenhados aqui, sem copiar
// os da Apple): navegador aberto (com o pontinho), mensagens, e-mail, fotos,
// calendário com a data, música e ajustes.
const DOCK: Array<{ name: string; bg: string; icon?: LucideIcon; fg?: string }> = [
  { name: "Navegador", bg: "linear-gradient(180deg,#5ac8fa,#1e6fe8)", icon: Compass },
  { name: "Mensagens", bg: "linear-gradient(180deg,#6ee07a,#1fb141)", icon: MessageCircle },
  { name: "E-mail", bg: "linear-gradient(180deg,#63b3ff,#1a7cf5)", icon: Mail },
  { name: "Fotos", bg: "#ffffff", icon: Flower2, fg: "#ff9f0a" },
  { name: "Calendário", bg: "#ffffff" },
  { name: "Música", bg: "linear-gradient(180deg,#ff6b81,#fa233b)", icon: Music },
  { name: "Ajustes", bg: "linear-gradient(180deg,#b8bcc4,#7d828b)", icon: Settings },
];

function Laptop({ doc, state, businessName, photoUrl, url }: StageProps) {
  return (
    <div className="flex flex-col items-center [container-type:inline-size]" style={{ aspectRatio: LAPTOP.ratio }}>
      {/* Tampa: 88% da largura, borda fina, câmera no alto. */}
      <div className="relative w-[88cqw] rounded-t-[2.2cqw] bg-(--device-bezel) px-[1.2cqw] pb-[1.8cqw] pt-[1.8cqw] shadow-soft ring-1 ring-black/10">
        <span className="absolute left-1/2 top-[0.6cqw] size-[0.55cqw] -translate-x-1/2 rounded-full bg-white/15" aria-hidden="true" />
        <ScaledScreen w={LAPTOP.w} h={LAPTOP.h} className="rounded-[0.35cqw]">
          <div className="flex h-full flex-col bg-(image:--os-wall) font-sans">
            {/* Barra de menus */}
            <div className="flex h-[26px] shrink-0 items-center justify-end gap-4 bg-(--os-menubar) px-4 text-[12.5px] font-medium text-(--os-ink) backdrop-blur-xl">
              <Wifi className="size-[15px]" strokeWidth={2.4} aria-hidden="true" />
              <Battery />
              <span className="tabular-nums">Seg 14 set 9:41</span>
            </div>
            {/* Janela do navegador */}
            <div className="mx-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-(--os-screen) shadow-[0_8px_30px_rgb(0_0_0/0.18)]">
              <div className="flex h-[46px] shrink-0 items-center gap-3 border-b border-(--os-line) bg-(--os-toolbar) px-4 text-(--os-dim)">
                <span className="flex gap-2" aria-hidden="true">
                  <span className="size-3 rounded-full bg-[#ff5f57]" />
                  <span className="size-3 rounded-full bg-[#febc2e]" />
                  <span className="size-3 rounded-full bg-[#28c840]" />
                </span>
                <ChevronLeft className="ml-4 size-[18px]" aria-hidden="true" />
                <ChevronRight className="size-[18px] opacity-50" aria-hidden="true" />
                <span className="mx-auto flex h-[30px] w-[460px] items-center justify-center gap-2 rounded-[8px] bg-(--os-field) text-[13px] text-(--os-ink)">
                  <Lock className="size-3 text-(--os-dim)" strokeWidth={2.4} aria-hidden="true" />
                  {url}
                </span>
                <RotateCw className="size-4" aria-hidden="true" />
                <Share className="ml-2 size-4" aria-hidden="true" />
                <Plus className="size-[18px]" aria-hidden="true" />
              </div>
              <div className="relative min-h-0 flex-1">
                <PreviewFrame doc={doc} title={`Site de ${businessName} no computador`} />
                <ScreenOverlay state={state} businessName={businessName} photoUrl={photoUrl} size="lg" />
              </div>
            </div>
            {/* Dock */}
            <div className="flex h-[76px] shrink-0 items-center justify-center" aria-hidden="true">
              <div className="flex items-center gap-[10px] rounded-[20px] border border-(--os-dock-line) bg-(--os-dock) px-[10px] py-[8px] backdrop-blur-xl">
                {DOCK.map(({ name, bg, icon: Icon, fg }, i) => (
                  <span
                    key={name}
                    title={name}
                    className="relative grid size-[46px] place-items-center rounded-[11px] shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_0_0_0.5px_rgb(0_0_0/0.08)]"
                    style={{ background: bg }}
                  >
                    {Icon ? (
                      <Icon className="size-[26px]" style={{ color: fg ?? "#ffffff" }} strokeWidth={2.1} />
                    ) : (
                      <span className="flex flex-col items-center leading-none">
                        <span className="text-[8px] font-bold tracking-wide text-[#ff3b30]">SEG</span>
                        <span className="text-[22px] font-light text-[#1d1d1f]">14</span>
                      </span>
                    )}
                    {i === 0 && <span className="absolute -bottom-[7px] left-1/2 size-[4px] -translate-x-1/2 rounded-full bg-(--os-ink) opacity-70" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScaledScreen>
      </div>
      {/* Base, mais larga, com o entalhe de abrir */}
      <div className="relative h-[2.6cqw] w-full rounded-b-[1.4cqw] rounded-t-[0.3cqw] bg-linear-to-b from-(--device-deck-top) to-(--device-deck-bottom) shadow-soft">
        <span className="absolute left-1/2 top-0 h-[0.9cqw] w-[13cqw] -translate-x-1/2 rounded-b-[0.8cqw] bg-black/10" aria-hidden="true" />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- celular

function Phone({ doc, state, businessName, photoUrl, url }: StageProps) {
  const host = url.split("/")[0];
  return (
    <div className="[container-type:inline-size]" style={{ aspectRatio: PHONE.ratio }}>
      <div className="h-full rounded-[15cqw] bg-(--device-bezel) p-[3.6cqw] shadow-soft ring-1 ring-black/10">
        <ScaledScreen w={PHONE.w} h={PHONE.h} className="rounded-[11.6cqw]">
          <div className="flex h-full flex-col bg-(--os-screen) font-sans text-(--os-ink)">
            {/* Barra de status com a ilha */}
            <div className="relative flex h-[54px] shrink-0 items-center justify-between px-[34px] pt-[6px]">
              <span className="text-[16px] font-semibold tabular-nums">9:41</span>
              <span className="absolute left-1/2 top-[11px] h-[36px] w-[124px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
              <span className="flex items-center gap-[6px]" aria-hidden="true">
                <Signal />
                <Wifi className="size-[17px]" strokeWidth={2.6} />
                <Battery />
              </span>
            </div>
            <div className="relative min-h-0 flex-1">
              <PreviewFrame doc={doc} title={`Site de ${businessName} no celular`} />
              <ScreenOverlay state={state} businessName={businessName} photoUrl={photoUrl} size="sm" />
            </div>
            {/* Barra de endereço embaixo e o indicador de início */}
            <div className="flex h-[82px] shrink-0 flex-col items-center border-t border-(--os-line) bg-(--os-bar) px-[14px] pt-[9px]">
              <span className="flex h-[40px] w-full items-center justify-center gap-[6px] rounded-full bg-(--os-pill) text-[15px] shadow-[0_1px_3px_rgb(0_0_0/0.12)]">
                <Lock className="size-[12px] text-(--os-dim)" strokeWidth={2.6} aria-hidden="true" />
                {host}
              </span>
              <span className="mt-auto mb-[8px] h-[5px] w-[134px] rounded-full bg-(--os-home)" aria-hidden="true" />
            </div>
          </div>
        </ScaledScreen>
      </div>
    </div>
  );
}

// Ícones da barra de status, desenhados (os da biblioteca não têm o formato do iOS).
function Signal() {
  return (
    <svg viewBox="0 0 18 12" className="h-[11px] w-[17px] fill-current" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
  );
}

function Battery() {
  return (
    <svg viewBox="0 0 27 13" className="h-[12px] w-[25px]" aria-hidden="true">
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" />
      <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
      <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

// Antes do HTML chegar: o comércio esperando o site (vazio) ou o esboço do
// site em varredura (a IA está planejando). Em pixels reais da tela.
function ScreenOverlay({
  state,
  businessName,
  photoUrl,
  size,
}: {
  state: ScreenState;
  businessName: string;
  photoUrl: string | null;
  size: "lg" | "sm";
}) {
  if (state === "live") return null;
  const lg = size === "lg";
  return (
    <div
      className="absolute inset-0 flex flex-col bg-(--os-paper)"
      // O esboço usa os tons da tela do aparelho (que seguem o tema).
      style={{ "--surface": "var(--os-sk-hi)", "--surface-2": "var(--os-sk)" } as React.CSSProperties}
      aria-hidden="true"
    >
      {state === "empty" ? (
        <div className="relative flex flex-1 flex-col justify-end overflow-hidden">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="absolute inset-0 size-full object-cover opacity-25 grayscale" />
          )}
          <div className={`relative bg-linear-to-t from-(--os-paper) via-(--os-paper)/85 to-transparent ${lg ? "p-16 pt-40" : "p-7 pt-24"}`}>
            <p className={`font-display font-semibold leading-[1.02] tracking-[-0.035em] text-(--os-paper-ink) ${lg ? "text-[64px]" : "text-[34px]"}`}>{businessName}</p>
            <p className={`mt-3 text-(--os-paper-muted) ${lg ? "text-[20px]" : "text-[15px]"}`}>O site aparece aqui</p>
          </div>
        </div>
      ) : (
        <div className={`flex flex-1 flex-col ${lg ? "gap-7 p-14" : "gap-5 p-6"}`}>
          <div className="pf-skeleton h-[5%] w-[35%] rounded-full" />
          <div className="pf-skeleton h-[36%] w-full rounded-[14px]" />
          <div className="pf-skeleton h-[4%] w-[70%] rounded-full" />
          <div className="pf-skeleton h-[4%] w-[52%] rounded-full" />
          <div className={`grid flex-1 ${lg ? "grid-cols-3 gap-6" : "grid-cols-2 gap-4"}`}>
            <div className="pf-skeleton rounded-[14px]" />
            <div className="pf-skeleton rounded-[14px]" />
            {lg && <div className="pf-skeleton rounded-[14px]" />}
          </div>
        </div>
      )}
    </div>
  );
}
