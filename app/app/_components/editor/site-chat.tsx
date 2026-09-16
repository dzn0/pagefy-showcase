"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, ExternalLink, ImagePlus, LoaderCircle, Sparkles, Square, X } from "lucide-react";
import type { ActivityStep } from "@/lib/site-activity";
import { isAcceptedImage, MAX_IMAGES_PER_MESSAGE } from "@/lib/site-uploads";
import { contextTier } from "@/lib/site-pricing";
import { DoneActivity, LiveActivity } from "./activity-log";
import { useSiteModel } from "@/lib/store/credits";
import { CreditAmount } from "../ui";

// Chat do gerador: a IA abre a conversa pedindo o site do jeito da pessoa,
// com ideias prontas que entram e saem do texto (cores, estilo, destaque).
// Depois do primeiro site, as ideias viram ajustes rápidos.

export type ChatMessage =
  | { id: string; role: "user"; text: string; images?: string[] }
  | {
      id: string;
      role: "assistant";
      text: string;
      meta?: string;
      tone?: "error";
      steps?: string[];
      durationMs?: number;
      /** Link destacado na mensagem (ex.: o site que o comércio já tem). */
      link?: string;
      /** Botões na mensagem: o primeiro é a ação principal. */
      actions?: Array<{ label: string; onClick: () => void }>;
    }
  | { id: string; role: "divider"; text: string };

export type ChatStatus = "idle" | "thinking" | "writing" | "reviewing";

/** Imagem anexada no composer, antes de enviar. */
export type Attachment = { id: string; preview: string; name: string | null; error?: string };

type IdeaGroup = { label: string; ideas: Array<{ label: string; phrase: string; hint?: string }> };

const FIRST_IDEAS: IdeaGroup[] = [
  {
    label: "Cores",
    ideas: [
      { label: "Cores da marca", phrase: "cores da marca (tire das fotos: fachada, placa, embalagens)", hint: "a IA olha as fotos" },
      { label: "Claras e limpas", phrase: "cores claras e limpas" },
      { label: "Escuras e elegantes", phrase: "cores escuras e elegantes" },
      { label: "Vivas e alegres", phrase: "cores vivas e alegres" },
    ],
  },
  {
    label: "Estilo",
    ideas: [
      { label: "Moderno", phrase: "estilo moderno" },
      { label: "Aconchegante", phrase: "estilo aconchegante, de bairro" },
      { label: "Minimalista", phrase: "estilo minimalista" },
      { label: "Sofisticado", phrase: "estilo sofisticado" },
    ],
  },
  {
    label: "Destaque",
    ideas: [
      { label: "WhatsApp", phrase: "botão de WhatsApp bem visível" },
      { label: "Avaliações", phrase: "destaque para as avaliações do Google" },
      { label: "Galeria de fotos", phrase: "galeria com as fotos" },
      { label: "Horário", phrase: "horário de funcionamento em destaque" },
    ],
  },
];

const EDIT_IDEAS = [
  "Deixe as cores mais escuras",
  "Destaque mais as avaliações",
  "Troque a fonte dos títulos",
  "Aumente o título do topo",
  "Aumente as fotos",
];

function hasPhrase(text: string, phrase: string) {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

/** Liga ou desliga uma ideia no texto: acrescenta no fim ou tira de onde estiver. */
function togglePhrase(text: string, phrase: string) {
  if (hasPhrase(text, phrase)) {
    const at = text.toLowerCase().indexOf(phrase.toLowerCase());
    return (text.slice(0, at) + text.slice(at + phrase.length))
      .replace(/\s*,\s*,\s*/g, ", ")
      .replace(/^\s*,\s*|\s*,\s*$/g, "")
      .trim();
  }
  const base = text.trim().replace(/[.,;]\s*$/, "");
  return base ? `${base}, ${phrase}` : phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

export function SiteChat({
  businessName,
  messages,
  status,
  hasSite,
  cost,
  draft,
  onDraft,
  onSend,
  onStop,
  onRecreate,
  resetHint,
  attachments,
  onAttach,
  onRemoveAttachment,
  activity,
  context,
}: {
  businessName: string;
  messages: ChatMessage[];
  status: ChatStatus;
  hasSite: boolean;
  cost: number;
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  onRecreate: () => void;
  /** Conversa longa: avisa que o próximo pedido custa mais e oferece recriar o site. */
  resetHint: boolean;
  attachments: Attachment[];
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  /** Etapas ao vivo enquanto gera. */
  activity: { steps: ActivityStep[]; startedAt: number } | null;
  /** Tamanho da conversa (o aviso de conversa longa volta quando ela sobe de faixa). */
  context: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // Aviso de conversa longa fechado nesta faixa de preço; volta se a conversa subir de faixa.
  const [hintClosedTier, setHintClosedTier] = useState<number | null>(null);
  const hintClosed = hintClosedTier !== null && contextTier(context) <= hintClosedTier;
  const siteModel = useSiteModel();
  const busy = status !== "idle";
  const uploading = attachments.some((a) => !a.name && !a.error);
  const readyImages = attachments.filter((a) => a.name).length;
  const full = attachments.length >= MAX_IMAGES_PER_MESSAGE;

  function takeFiles(list: FileList | File[] | null | undefined) {
    const files = [...(list ?? [])].filter(isAcceptedImage);
    if (files.length) onAttach(files);
  }

  // Mensagem nova ou texto chegando: acompanha o fim da conversa.
  const last = messages[messages.length - 1];
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages.length, last?.text, status, activity?.steps.length]);

  // Caixa de texto cresce com o conteúdo, até ~7 linhas.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 176)}px`;
  }, [draft]);

  const canSend = !busy && !uploading && (draft.trim().length > 0 || readyImages > 0);

  return (
    <section
      aria-label="Conversa com a IA"
      className={`relative flex h-full min-h-0 flex-col rounded-[22px] border bg-surface shadow-card transition-colors ${dragging ? "border-green" : "border-line"}`}
      onDragOver={(event) => {
        if (busy || ![...event.dataTransfer.types].includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        if (busy) return;
        event.preventDefault();
        setDragging(false);
        takeFiles(event.dataTransfer.files);
      }}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-10 grid place-items-center rounded-[18px] border-2 border-dashed border-green bg-surface/90 text-center">
          <p className="flex flex-col items-center gap-2 text-[0.92rem] font-semibold text-ink">
            <ImagePlus className="size-6 text-green-ink" aria-hidden="true" />
            Solte a imagem para mandar à IA
          </p>
        </div>
      )}
      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5" aria-live="polite">
        {/* Abertura da IA, sempre no topo */}
        <AssistantBubble>
          <p>
            Vamos montar o site de <strong className="font-semibold text-ink">{businessName}</strong>. Já tenho do Google o endereço, o
            telefone, as fotos e as avaliações.
          </p>
          <p className="mt-2">
            Me conta como você imagina: cores, estilo, o que aparece primeiro. Escreva do seu jeito ou toque nas ideias abaixo. Se não souber a
            cor, escolha <strong className="font-semibold text-ink">Cores da marca</strong> que eu tiro das fotos.
          </p>
          {!hasSite && (
            <div className="mt-4 space-y-3">
              {FIRST_IDEAS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[0.76rem] font-semibold text-muted">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.ideas.map((idea) => {
                      const on = hasPhrase(draft, idea.phrase);
                      return (
                        <button
                          key={idea.label}
                          type="button"
                          aria-pressed={on}
                          disabled={busy}
                          onClick={() => {
                            onDraft(togglePhrase(draft, idea.phrase));
                            inputRef.current?.focus();
                          }}
                          title={idea.hint}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.8rem] font-semibold transition-colors duration-200 disabled:opacity-50 ${
                            on ? "border-transparent bg-grape-soft text-grape-ink" : "border-line-strong text-ink-2 hover:border-ink/30 hover:text-ink"
                          }`}
                        >
                          {idea.label === "Cores da marca" && <Sparkles className="size-3.5" aria-hidden="true" />}
                          {idea.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AssistantBubble>

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex flex-col items-end gap-1.5">
              {message.images && message.images.length > 0 && (
                <div className="flex max-w-[88%] flex-wrap justify-end gap-1.5">
                  {message.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="Imagem enviada" className="size-20 rounded-[12px] border border-line object-cover" />
                  ))}
                </div>
              )}
              {message.text && (
                <p className="max-w-[88%] whitespace-pre-wrap rounded-[16px] rounded-br-[6px] bg-ink px-4 py-2.5 text-[0.9rem] leading-relaxed text-bg">
                  {message.text}
                </p>
              )}
            </div>
          ) : message.role === "divider" ? (
            <p key={message.id} className="flex items-center gap-3 text-[0.76rem] font-semibold text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
              {message.text}
            </p>
          ) : (
            <AssistantBubble key={message.id} tone={message.tone}>
              {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
              {message.meta && <p className="mt-2 font-mono text-[0.7rem] text-muted">{message.meta}</p>}
              {message.steps && <DoneActivity steps={message.steps} durationMs={message.durationMs} />}
              {message.link && (
                <a
                  href={message.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate font-mono text-[0.8rem] font-medium text-grape-ink underline-offset-2 hover:underline"
                >
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{message.link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
                </a>
              )}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action, i) =>
                    i === 0 ? (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        disabled={busy}
                        className="pf-magic h-9 px-3.5 text-[0.82rem] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    ) : (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        disabled={busy}
                        className="inline-flex h-9 items-center rounded-full border border-line-strong px-3.5 text-[0.82rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {action.label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </AssistantBubble>
          ),
        )}

        {busy && activity && (
          <AssistantBubble>
            <LiveActivity steps={activity.steps} startedAt={activity.startedAt} />
          </AssistantBubble>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-line p-3 sm:p-4">
        {hasSite && !busy && (
          <div className="-mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {EDIT_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => {
                  onDraft(idea);
                  inputRef.current?.focus();
                }}
                className="inline-flex h-8 shrink-0 items-center rounded-full border border-line-strong px-3 text-[0.78rem] font-semibold text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
              >
                {idea}
              </button>
            ))}
          </div>
        )}

        {resetHint && !busy && !hintClosed && (
          <div className="mb-2.5 flex items-center gap-3 rounded-[14px] bg-honey-soft py-2.5 pl-3.5 pr-2 text-[0.8rem] leading-snug text-honey-ink">
            <p className="flex-1">A conversa ficou longa e cada ajuste custa mais. Pra mudar muita coisa, recriar o site sai melhor.</p>
            <button
              type="button"
              onClick={onRecreate}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3 font-semibold text-ink shadow-soft transition-transform active:scale-[0.97]"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              Recriar site
            </button>
            <button
              type="button"
              onClick={() => setHintClosedTier(contextTier(context))}
              aria-label="Fechar aviso"
              title="Fechar"
              className="grid size-7 shrink-0 place-items-center rounded-full text-honey-ink/70 transition-colors hover:bg-honey-ink/10 hover:text-honey-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) onSend();
          }}
          className="rounded-[20px] border border-line-strong bg-bg transition-[border-color,box-shadow] duration-200 focus-within:border-green focus-within:shadow-[0_0_0_4px_var(--lime-soft)]"
        >
          {attachments.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-3 pt-3" aria-label="Imagens anexadas">
              {attachments.map((a) => (
                <li key={a.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.preview}
                    alt=""
                    className={`size-14 rounded-[10px] border object-cover ${a.error ? "border-danger opacity-50" : "border-line"} ${!a.name && !a.error ? "opacity-60" : ""}`}
                  />
                  {!a.name && !a.error && (
                    <LoaderCircle className="absolute inset-0 m-auto size-5 animate-spin text-ink" aria-label="Enviando imagem" />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(a.id)}
                    aria-label="Tirar imagem"
                    title={a.error}
                    className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-ink text-bg shadow-soft"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label htmlFor="prompt-site" className="sr-only">
            {hasSite ? "O que você quer mudar no site" : "Como você quer o site"}
          </label>
          <textarea
            id="prompt-site"
            ref={inputRef}
            rows={2}
            value={draft}
            disabled={busy}
            onChange={(event) => onDraft(event.target.value)}
            onPaste={(event) => {
              const files = [...event.clipboardData.files];
              if (files.some(isAcceptedImage)) {
                event.preventDefault();
                takeFiles(files);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (canSend) onSend();
              }
            }}
            placeholder={
              hasSite
                ? "Ex.: troque a foto do topo pela da fachada e deixe o botão do WhatsApp verde"
                : "Ex.: um site aconchegante, com as cores da fachada, destacando o café da manhã e o botão do WhatsApp"
            }
            className="block max-h-44 w-full resize-none bg-transparent px-4 pt-3 text-[0.92rem] leading-relaxed text-ink caret-green outline-none placeholder:text-muted disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-3 px-2.5 pb-2.5 pt-1">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(event) => {
                  takeFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy || full}
                aria-label="Anexar imagem"
                title={full ? `Até ${MAX_IMAGES_PER_MESSAGE} imagens por mensagem` : "Anexar imagem: logo, cardápio, fachada… (ou cole / arraste aqui)"}
                className="grid size-9 place-items-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ImagePlus className="size-[18px]" aria-hidden="true" />
              </button>
              <CreditAmount value={cost} size="md" className="h-8 rounded-full bg-surface-2 pl-2 pr-3 font-mono text-[0.84rem] font-medium text-ink" />
              {/* Só informa qual modelo escreve o site; não dá pra trocar, e o
                  esforço (alto ao criar, baixo ao ajustar) não aparece. */}
              {siteModel && (
                <span className="hidden h-8 items-center rounded-full px-2 text-[0.78rem] font-medium text-muted sm:inline-flex" title={`Os sites são escritos pelo ${siteModel}`}>
                  {siteModel}
                </span>
              )}
            </div>
            {/* Keys diferentes: sem elas o React reaproveita o mesmo <button> e, ao
                parar, ele vira type="submit" no meio do clique, que então envia o
                formulário (e abria a confirmação de gerar o site). */}
            {busy ? (
              <button
                key="stop"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onStop();
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[0.82rem] font-semibold text-ink transition-colors hover:border-ink/30"
              >
                <Square className="size-3 fill-current" aria-hidden="true" />
                Parar
              </button>
            ) : (
              <button
                key="send"
                type="submit"
                disabled={!canSend}
                aria-label={hasSite ? "Enviar ajuste" : "Gerar o site"}
                className="grid size-9 place-items-center rounded-full bg-green text-on-green transition-[background-color,transform,opacity] duration-200 hover:bg-green-hover active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="size-4.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function AssistantBubble({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-[9px] bg-grape-soft text-grape-ink" aria-hidden="true">
        <Sparkles className="size-[15px]" />
      </span>
      <div
        className={`max-w-[92%] rounded-[16px] rounded-tl-[6px] border px-4 py-3 text-[0.9rem] leading-relaxed shadow-soft ${
          tone === "error" ? "border-danger/30 bg-surface text-danger" : "border-line bg-surface text-ink-2"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
