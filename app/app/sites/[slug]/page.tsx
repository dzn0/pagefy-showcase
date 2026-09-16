"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Globe, LoaderCircle, Monitor, Smartphone, Sparkles } from "lucide-react";
import { findPaymentData, sanitizeSiteHtml } from "@/lib/site-safety";
import { buildSiteZip, exportFileName, exportKey, hasPaidExport, saveBlob } from "@/lib/site-export";
import { createId, timestamp } from "@/lib/id";
import { photoSrc } from "@/lib/lead-search";
import { cleanStepLabel, deriveActivity, type ActivityMarker, type ActivityStep } from "@/lib/site-activity";
import { CONTEXT_STEP, contextTier, promptCost } from "@/lib/site-pricing";
import { publishDraft } from "@/lib/site-publish";
import { MAX_IMAGES_PER_MESSAGE, uploadImage, uploadUrl } from "@/lib/site-uploads";
import { applyEdits, cancelJob, checkWebsite, claimJob, fetchPendingJobs, parseReply, streamGenerate, streamJob, type GenerateBody, type StreamEvent } from "@/lib/site-stream";
import { apiPost } from "@/lib/api";
import { affords, CREDIT_COSTS, refreshCredits, setCredits, useCredits } from "@/lib/store/credits";
import { createRecreation, draftTitle, loadDraft, nextVersion, saveDraft, type SiteDraft } from "@/lib/store/site-drafts";
import { sitesStore } from "@/lib/store/sites";
import { markLeadContacted } from "@/lib/store/leads";
import { ConfirmSpend, type SpendRequest } from "../../_components/confirm-spend";
import { ConfirmRecreate } from "../../_components/editor/confirm-recreate";
import { PublishLink, type PublishState } from "../../_components/editor/publish-link";
import { DeviceStage, type Device, type ScreenState } from "../../_components/editor/device-stage";
import type { PreviewDoc } from "../../_components/editor/preview-frame";
import { WhatsAppIcon } from "../../_components/whatsapp-link";
import { SendToOwner } from "../../_components/editor/send-to-owner";
import { SiteChat, type Attachment, type ChatMessage, type ChatStatus } from "../../_components/editor/site-chat";
import { EmptyState, HueTile } from "../../_components/ui";

// Gerador de site: conversa com a IA à esquerda, o site ao vivo num notebook
// e num celular à direita. O primeiro pedido monta o site inteiro; os
// seguintes ajustam. Cada envio passa pela confirmação de créditos, e o
// preço sobe com o tamanho da conversa (lib/site-pricing.ts).
export default function SiteEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  // O shell só monta no cliente: dá pra ler o rascunho direto no estado inicial.
  const [draft, setDraft] = useState<SiteDraft | null>(() => loadDraft(slug));
  // Trocou de site sem sair da página (ex.: "Recriar site" abre a versão nova).
  const [loadedSlug, setLoadedSlug] = useState(slug);
  if (loadedSlug !== slug) {
    setLoadedSlug(slug);
    setDraft(loadDraft(slug));
  }

  if (!draft) {
    return (
      <EmptyState
        icon={Globe}
        hue="grape"
        title="Site não encontrado"
        text="Este rascunho não está neste navegador. Gere o site de novo a partir de um comércio na busca de leads."
        action={{ label: "Buscar leads", href: "/app/buscar" }}
      />
    );
  }
  // A key recria o editor por site: estado da conversa, prévia e anexos não passam de um pro outro.
  return <Editor key={draft.slug} draft={draft} onChange={setDraft} />;
}

function turnsToMessages(draft: SiteDraft): ChatMessage[] {
  const messages: ChatMessage[] = [];
  if (draft.resets > 0 && draft.html) messages.push({ id: "reset", role: "divider", text: "Nova conversa sobre o site atual" });
  draft.turns.forEach((turn, i) => {
    const parsed = parseReply(turn.reply);
    const changed = parsed.site !== null || parsed.edits.length > 0;
    const failed = turn.failedEdits ? ` · ${turn.failedEdits} ajuste não coube` : "";
    messages.push({ id: `u${i}`, role: "user", text: turn.prompt, images: turn.images?.map(uploadUrl) });
    messages.push({
      id: `a${i}`,
      role: "assistant",
      text: parsed.reply || (changed ? "Pronto, o site foi atualizado." : ""),
      meta: `${changed ? (i === 0 && !draft.baseHtml ? "Site criado" : "Site atualizado") : "Resposta"} · ${turn.cost} créditos${failed}`,
      steps: turn.steps?.map(cleanStepLabel),
      durationMs: turn.durationMs,
    });
  });
  return messages;
}

function Editor({ draft, onChange }: { draft: SiteDraft; onChange: (draft: SiteDraft) => void }) {
  const credits = useCredits();
  const router = useRouter();
  const [text, setText] = useState(draft.promptDraft ?? "");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [live, setLive] = useState<{ prompt: string; images: string[]; reply: string } | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // Etapas ao vivo da geração (o que a IA está fazendo agora).
  const [activity, setActivity] = useState<{ steps: ActivityStep[]; startedAt: number } | null>(null);
  // "Recriar site" aguardando a confirmação (com o pedido que já vai escrito na versão nova).
  const [recreate, setRecreate] = useState<{ prompt: string } | null>(null);
  // Último pedido recusado por ser grande demais pra um ajuste.
  // size: grande demais pra um ajuste (oferece Recriar site); rule: contra as regras ou fora do site.
  const [declined, setDeclined] = useState<{ prompt: string; reason: string; kind: "size" | "rule" } | null>(null);
  // Primeiro pedido parado porque o comércio já tem site próprio (nada cobrado).
  // Fica no rascunho: quem saiu da tela encontra a pergunta de volta (e o card em Sites).
  const [siteFound, setSiteFound] = useState<SiteDraft["websiteFound"] | null>(draft.websiteFound ?? null);
  function updateSiteFound(next: SiteDraft["websiteFound"] | null) {
    setSiteFound(next);
    const latest = loadDraft(draft.slug) ?? draft;
    const rest = { ...latest };
    delete rest.websiteFound;
    saveDraft(next ? { ...rest, websiteFound: next } : rest);
  }
  const checkAbortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spend, setSpend] = useState<SpendRequest | null>(null);
  const [doc, setDoc] = useState<PreviewDoc | null>(() => (draft.html ? { key: 0, html: sanitizeSiteHtml(draft.html).html, streaming: false } : null));
  const [device, setDevice] = useState<Device>(loadDevice);
  const abortRef = useRef<AbortController | null>(null);
  const jobRef = useRef<string | null>(null);
  const userStopRef = useRef(false);
  // A página está sendo fechada ou recarregada: a conexão cai, mas a geração segue no servidor.
  const leavingRef = useRef(false);
  const keyRef = useRef(0);

  const hasSite = Boolean(draft.html);
  // Preço fixo: site novo ou ajuste (o backend escolhe como a IA roda).
  const cost = promptCost({ hasSite, context: draft.context });
  const photoUrl = draft.business.photo ? photoSrc(draft.business.photo) : null;

  // Saiu da página no meio: só para de ouvir. A geração segue no servidor e
  // o gerador se reconecta quando a pessoa voltar (draft.pending).
  useEffect(() => {
    // Montou (de novo, no modo estrito do dev): a tela está aberta.
    leavingRef.current = false;
    const onLeave = () => {
      leavingRef.current = true;
    };
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
      // Saiu do gerador (outra tela do app): conta como sair, não como Parar.
      leavingRef.current = true;
      abortRef.current?.abort();
    };
  }, []);

  function stopGeneration() {
    userStopRef.current = true;
    if (jobRef.current) void cancelJob(jobRef.current);
    checkAbortRef.current?.abort();
    abortRef.current?.abort();
  }

  function clearPending() {
    const latest = loadDraft(draft.slug);
    if (latest?.pending) {
      const rest = { ...latest };
      delete rest.pending;
      saveDraft(rest);
    }
  }

  // Estado do link público: publicando, falhou (tentar de novo) ou publicado.
  const [publishing, setPublishing] = useState(false);
  const [publishFailed, setPublishFailed] = useState(false);
  const publishState: PublishState = !draft.html ? "none" : publishing ? "publishing" : publishFailed ? "failed" : draft.publicSlug ? "published" : "publishing";

  // Manda a versão atual pro link público e atualiza o estado do botão.
  function publish(target: SiteDraft) {
    setPublishing(true);
    setPublishFailed(false);
    void publishDraft(target).then((slug) => {
      setPublishing(false);
      if (!slug) {
        setPublishFailed(true);
        return;
      }
      const latest = loadDraft(target.slug);
      if (latest) onChange(latest);
    });
  }

  // Site de antes do link público existir: publica ao abrir.
  useEffect(() => {
    if (!draft.html || draft.publicSlug) return;
    const id = setTimeout(() => publish(draft), 0);
    return () => clearTimeout(id);
    // Só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeDevice(next: Device) {
    setDevice(next);
    try {
      localStorage.setItem(DEVICE_KEY, next);
    } catch {
      // Sem storage: volta pro computador na próxima visita.
    }
  }

  // Anexar: mostra a miniatura na hora e sobe em paralelo (reduzida, em WebP).
  function attach(files: File[]) {
    const room = MAX_IMAGES_PER_MESSAGE - attachments.length;
    for (const file of files.slice(0, Math.max(0, room))) {
      const id = createId("img");
      setAttachments((list) => [...list, { id, preview: URL.createObjectURL(file), name: null }]);
      uploadImage(file)
        .then((name) => setAttachments((list) => list.map((a) => (a.id === id ? { ...a, name } : a))))
        .catch((err: Error) => setAttachments((list) => list.map((a) => (a.id === id ? { ...a, error: err.message } : a))));
    }
  }

  function removeAttachment(id: string) {
    setAttachments((list) => {
      const gone = list.find((a) => a.id === id);
      if (gone?.preview.startsWith("blob:")) URL.revokeObjectURL(gone.preview);
      return list.filter((a) => a.id !== id);
    });
  }

  function nextKey() {
    keyRef.current += 1;
    return keyRef.current;
  }

  function persist(next: SiteDraft) {
    saveDraft(next);
    onChange(next);
  }

  // Cada versão nova vai pro link público (o dono vê sempre a última).
  function persistAndPublish(next: SiteDraft) {
    persist(next);
    publish(next);
  }

  function requestSend() {
    const images = attachments.flatMap((a) => (a.name ? [a.name] : []));
    // Só imagens, sem texto: a IA decide onde usar (logo, cardápio, fotos).
    const prompt = text.trim() || (images.length ? "Use estas imagens no site." : "");
    if (!prompt || status !== "idle" || attachments.some((a) => !a.name && !a.error)) return;
    const long = hasSite && contextTier(draft.context) > 1;
    setSpend({
      title: hasSite ? "Enviar este ajuste?" : `Gerar o site de ${draft.business.name}?`,
      description: !hasSite
        ? "A IA monta o site inteiro com os dados e as fotos do Google e o seu pedido. Leva alguns minutos, e você acompanha ao vivo."
        : long
          ? "A conversa já está longa: a cada pedido a IA relê o site e tudo o que vocês conversaram, por isso custa mais. Se o pedido refizer uma seção inteira ou o site todo, a IA não cobra e oferece recriar o site."
          : "A IA ajusta o site com o seu pedido. Pra refazer uma seção inteira ou o site todo, ela não cobra e oferece recriar o site.",
      cost,
      confirmLabel: hasSite ? "Enviar" : "Gerar site",
      icon: Sparkles,
      hue: "grape",
      onConfirm: () => void run(prompt, images, cost),
    });
  }

  async function run(prompt: string, images: string[], price: number, resume?: NonNullable<SiteDraft["pending"]>, skipWebsiteCheck = false) {
    // Primeiro site: antes de reservar créditos, confere se o comércio já tem
    // site próprio. Não achou: segue direto. Achou: pergunta no chat.
    if (!resume && !hasSite && !skipWebsiteCheck && !(loadDraft(draft.slug) ?? draft).websiteConfirmed) {
      setError(null);
      updateSiteFound(null);
      setStatus("thinking");
      setLive({ prompt, images, reply: "" });
      setActivity({ steps: [{ id: "website-check", label: "Conferindo se o comércio já tem site" }], startedAt: Date.now() });
      // Só o Parar desiste aqui. Sair da tela no meio não cancela: o resultado
      // segue (gera no servidor, ou a pergunta fica guardada no rascunho).
      const checkController = new AbortController();
      checkAbortRef.current = checkController;
      const found = await checkWebsite({ placeId: draft.placeId, business: { ...draft.business } }, checkController.signal);
      checkAbortRef.current = null;
      if (checkController.signal.aborted) {
        setStatus("idle");
        setLive(null);
        setActivity(null);
        return;
      }
      if (found.hasSite && found.url) {
        setStatus("idle");
        setLive(null);
        setActivity(null);
        updateSiteFound({ prompt, images, price, url: found.url, evidence: found.evidence });
        return;
      }
    }
    // Quem reserva e devolve os créditos é o servidor (/sites/generate cobra ao
    // começar e devolve sozinho se o trabalho não chegou a sair; ver
    // backend/src/lib/site-reply.ts). Aqui é só uma dica pra não mandar o que
    // o saldo conhecido já não cobre.
    if (!resume && !affords(price)) {
      setError("Seu saldo não cobre este pedido agora. Consiga mais créditos em Créditos e plano.");
      return;
    }
    const editing = hasSite;
    userStopRef.current = false;
    jobRef.current = resume?.jobId ?? null;
    const sentAttachments = attachments;
    setError(null);
    setDeclined(null);
    setText("");
    setAttachments([]);
    setStatus("thinking");
    setLive({ prompt, images, reply: "" });

    const body: GenerateBody = {
      placeId: draft.placeId,
      business: { ...draft.business },
      turns: draft.turns.map(({ prompt: p, reply, images: imgs }) => ({ prompt: p, reply, ...(imgs?.length ? { images: imgs } : {}) })),
      prompt,
      ...(images.length ? { images } : {}),
      baseHtml: draft.baseHtml,
      seed: draft.seed,
      slug: draft.slug,
      price,
      startedAt: Date.now(),
    };
    const controller = new AbortController();
    abortRef.current = controller;

    let raw = "";
    let context = draft.context;
    let finished = false;
    let failure: string | null = null;
    // Erro do servidor (não o Parar): aí os créditos sempre voltam se o trabalho não saiu inteiro.
    let serverFailed = false;
    let streamKey: number | null = null;
    let lastPaint = 0;
    let shownEdits = 0;
    const startedAt = resume?.startedAt ?? body.startedAt;
    const markers: ActivityMarker[] = [];
    const refreshActivity = () => setActivity({ steps: deriveActivity(raw, markers, editing), startedAt });
    refreshActivity();

    // O texto chega em pedaços pequenos; a tela redesenha no máximo a cada 120 ms.
    const paint = (force = false) => {
      const now = performance.now();
      if (!force && now - lastPaint < 120) return;
      lastPaint = now;
      const parsed = parseReply(raw);
      setLive({ prompt, images, reply: parsed.reply });
      refreshActivity();
      if (parsed.site !== null && parsed.site.length > 0 && !parsed.siteDone) {
        // O site chegando: escrito ao vivo.
        streamKey ??= nextKey();
        setStatus("writing");
        setDoc({ key: streamKey, html: parsed.site, streaming: true });
      } else if (parsed.edits.length > shownEdits || (parsed.siteDone && streamKey === null)) {
        // Site pronto ou correções da revisão: aplica na tela assim que chegam.
        shownEdits = parsed.edits.length;
        const base = parsed.site ?? draft.html;
        if (base) {
          streamKey ??= nextKey();
          setDoc({ key: nextKey(), html: applyEdits(base, parsed.edits).html, streaming: false, keepScroll: true });
        }
      }
    };

    const onEvent = (event: StreamEvent) => {
          if (event.t === "job") {
            // A geração ganhou um id no servidor: guarda pra reconectar se a pessoa sair.
            jobRef.current = event.id;
            // O servidor acabou de descontar: mostra o saldo novo.
            void refreshCredits();
            const latest = loadDraft(draft.slug) ?? draft;
            saveDraft({ ...latest, pending: { jobId: event.id, prompt, images, price, startedAt } });
            // Começou depois que a pessoa já saiu (durante a conferência): a
            // geração fica no servidor e esta aba para de ouvir.
            if (leavingRef.current) controller.abort();
          } else if (event.t === "text") {
            raw += event.s;
            paint();
          } else if (event.t === "thinking") {
            markers.push({ kind: "thinking", at: raw.length });
            refreshActivity();
          } else if (event.t === "step") {
            // Etapa real: o que a IA está fazendo agora (narrado no backend).
            markers.push({ kind: "step", at: raw.length, label: event.label });
            refreshActivity();
          } else if (event.t === "tool") {
            // O agente conferindo o próprio trabalho (prints, detector) ou lendo um guia.
            if (event.phase === "start") {
              setStatus(event.name === "read_reference" ? "thinking" : "reviewing");
              markers.push({ kind: "tool", at: raw.length, name: event.name, detail: event.detail });
              refreshActivity();
            } else setStatus("writing");
          } else if (event.t === "done") {
            context = event.context;
            finished = event.stop !== "max_tokens";
            if (!finished) failure = "O site ficou grande demais e parou no meio. Tente pedir algo mais simples; nenhum crédito foi cobrado.";
          } else if (event.t === "error") {
            failure = event.message;
            if (!userStopRef.current) serverFailed = true;
          }
    };

    // A conexão pode cair no meio (rede, backend reiniciando): com o id da
    // geração, reconecta e recebe tudo de novo desde o começo (até 3 vezes).
    let attempt = 0;
    for (;;) {
      try {
        if (resume || (attempt > 0 && jobRef.current)) await streamJob(resume?.jobId ?? jobRef.current!, onEvent, controller.signal);
        else await streamGenerate(body, onEvent, controller.signal);
        break;
      } catch {
        if (controller.signal.aborted || leavingRef.current) break;
        if (jobRef.current && attempt < 3) {
          attempt++;
          raw = "";
          markers.length = 0;
          shownEdits = 0;
          streamKey = null;
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }
        failure = "Não deu pra falar com o gerador. Confira a internet (ou se o backend está rodando) e tente de novo.";
        break;
      }
    }
    abortRef.current = null;
    // Se o trabalho não saiu, o servidor devolve os créditos ao encerrar a
    // geração; confere o saldo agora e de novo logo depois (a devolução é assíncrona).
    void refreshCredits();
    setTimeout(() => void refreshCredits(), 2500);

    // Saiu da página (não foi o Parar): a geração segue no servidor; nada a fazer aqui.
    if ((controller.signal.aborted && !userStopRef.current) || leavingRef.current) return;
    // Resolvida aqui (aplicada ou descartada): o servidor pode esquecer esta geração.
    if (jobRef.current) void claimJob(jobRef.current, draft.slug);
    jobRef.current = null;
    clearPending();

    const parsed = parseReply(raw);
    // Site inteiro ou trocas completas: o servidor cobra mesmo com Parar, erro
    // ou recusa depois (o trabalho já tinha chegado), então aqui ele fica guardado.
    const delivered = parsed.siteDone || parsed.edits.length > 0;

    // Recusou: o pedido refaz uma seção inteira ou o site todo. Nada muda nem
    // é cobrado; o chat mostra o motivo com o "Recriar site" pra esse pedido.
    // Recusou por regra (dados de pagamento, conteúdo proibido, fora do site):
    // nada muda nem é cobrado; o chat mostra o motivo e o pedido volta pro campo.
    if (parsed.refuse && !delivered) {
      setDoc(draft.html ? { key: nextKey(), html: sanitizeSiteHtml(draft.html).html, streaming: false, keepScroll: true } : null);
      setStatus("idle");
      setLive(null);
      setActivity(null);
      setText(prompt);
      setAttachments(sentAttachments.filter((a) => a.name));
      setDeclined({ prompt, reason: parsed.refuse, kind: "rule" });
      return;
    }

    if (parsed.decline && editing && !delivered) {
      setDoc(draft.html ? { key: nextKey(), html: draft.html, streaming: false, keepScroll: true } : null);
      setStatus("idle");
      setLive(null);
      setActivity(null);
      setText("");
      setAttachments(sentAttachments.filter((a) => a.name));
      setDeclined({ prompt, reason: parsed.decline, kind: "size" });
      return;
    }

    const stopped = controller.signal.aborted || (userStopRef.current && !finished);
    const siteBroken = parsed.site !== null && !parsed.siteDone;
    // A IA terminou sem site, sem troca e sem resposta: nada foi feito, não cobra.
    const empty = parsed.site === null && parsed.edits.length === 0 && !parsed.reply;
    if (empty && !failure) failure = "A IA terminou sem fazer a mudança. Tente de novo; nenhum crédito foi cobrado.";

    if (!delivered && (stopped || failure || !finished || siteBroken || empty)) {
      // Nada guardado e a tela volta pro site de antes. Os créditos voltam, a
      // não ser que o site pela metade já tivesse passado do <body> (a regra do servidor).
      const charged = siteBroken && !serverFailed && /<body[\s>]/i.test(parsed.site ?? "");
      setDoc(draft.html ? { key: nextKey(), html: draft.html, streaming: false, keepScroll: true } : null);
      setStatus("idle");
      setLive(null);
      setActivity(null);
      setText(prompt);
      setAttachments(sentAttachments.filter((a) => a.name));
      setError(
        charged
          ? "A geração parou com o site pela metade. Como ele já estava sendo escrito, os créditos deste pedido não voltam."
          : stopped
            ? null
            : (failure ?? "A resposta veio incompleta. Tente de novo; nenhum crédito foi cobrado."),
      );
      if (resume) setText("");
      return;
    }

    // Site final: o último <site> (ou o de antes) com as trocas que vieram depois.
    let html = draft.html;
    let failedEdits = 0;
    const base = parsed.site !== null ? parsed.site.trim() : draft.html;
    if (base) {
      const applied = applyEdits(base, parsed.edits);
      html = applied.html;
      failedEdits = applied.failed;
    }

    // Dados de pagamento no site (chave PIX, conta, link de pagamento): não
    // guarda. O backend recusa publicar (lib/site-safety.ts) e cobra o pedido,
    // porque o HTML já saiu pelo stream (lib/site-reply.ts).
    const payment = html ? findPaymentData(html) : [];
    if (payment.length) {
      setDoc(draft.html ? { key: nextKey(), html: draft.html, streaming: false, keepScroll: true } : null);
      setStatus("idle");
      setLive(null);
      setActivity(null);
      setText(prompt);
      setError(`O site não pode ter dados de pagamento (${payment.join(", ")}): um site com a chave PIX ou a conta de outra pessoa pode virar golpe contra os clientes do comércio. Peça de novo sem essa parte.`);
      return;
    }

    // Os créditos já saíram no servidor, ao começar.
    const now = timestamp();
    const next: SiteDraft = {
      ...draft,
      pending: undefined,
      html,
      context,
      promptDraft: undefined,
      turns: [
        ...draft.turns,
        {
          prompt,
          reply: raw,
          cost: price,
          at: now,
          steps: deriveActivity(raw, markers, editing).map((step) => step.label),
          durationMs: Date.now() - startedAt,
          ...(images.length ? { images } : {}),
          ...(failedEdits ? { failedEdits } : {}),
        },
      ],
      updatedAt: now,
    };
    persistAndPublish(next);

    // Primeiro site pronto: entra na lista de Sites como rascunho.
    if (!draft.html && html && !sitesStore.getAll().some((site) => site.slug === draft.slug)) {
      sitesStore.add({
        id: createId("site"),
        businessName: draftTitle(draft),
        slug: draft.slug,
        category: draft.business.kind ?? "Comércio",
        color: draft.business.color,
        status: "rascunho",
        createdAt: now,
      });
    }

    // Pronto: escreve o documento inteiro de novo (mantendo a rolagem). O que
    // foi escrito aos pedaços pode ter deixado scripts e fontes pela metade.
    // Na prévia vai a versão limpa (sem script de fora, rastreio ou redirecionamento), igual ao link público.
    if (html) setDoc({ key: nextKey(), html: sanitizeSiteHtml(html).html, streaming: false, keepScroll: true });
    setLive(null);
    setActivity(null);
    setStatus("idle");
  }

  // Voltou pra página com uma geração em andamento: reconecta e mostra tudo desde o começo.
  useEffect(() => {
    const pending = draft.pending;
    if (pending) {
      void run(pending.prompt, pending.images, pending.price, pending);
      return;
    }
    // O navegador não guardou nada, mas o servidor pode ter uma geração deste site.
    let cancelled = false;
    void fetchPendingJobs([draft.slug]).then(([job]) => {
      if (job && !cancelled) void run(job.prompt, job.images, job.price, job);
    });
    return () => {
      cancelled = true;
    };
    // Só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Baixar o site: cobra uma vez por versão do HTML (a mesma versão baixa de novo sem cobrar).
  const [downloading, setDownloading] = useState(false);
  // "Enviar pro dono": a mensagem de WhatsApp com o link (não custa créditos).
  const [sending, setSending] = useState(false);
  function requestDownload() {
    const latest = loadDraft(draft.slug) ?? draft;
    if (!latest.html) return;
    if (hasPaidExport(latest)) {
      void download(latest, false);
      return;
    }
    setSpend({
      title: `Baixar o site de ${draftTitle(latest)}?`,
      description:
        "Um .zip com o HTML e as imagens que você mandou no chat, pra hospedar onde quiser. Baixar esta mesma versão de novo não cobra.",
      // A ressalva das fotos estava no meio do parágrafo e passava batido: quem
      // baixa espera o site igualzinho ao da tela. Sobe pro bloco de aviso.
      note: "As fotos do Google não vêm no .zip: no lugar delas vão imagens neutras numeradas, pra você trocar pelas do dono. Os termos do Google não deixam copiá-las.",
      cost: CREDIT_COSTS.export,
      confirmLabel: "Baixar",
      icon: Download,
      hue: "grape",
      onConfirm: () => void download(latest, true),
    });
  }

  async function download(target: SiteDraft, charge: boolean) {
    setDownloading(true);
    setError(null);
    try {
      const blob = await buildSiteZip(target);
      // Só cobra o que ficou pronto pra baixar. A cobrança é no servidor, que
      // lembra as versões já pagas (baixar a mesma de novo não cobra).
      if (charge) {
        const res = await apiPost("/sites/baixar", { slug: target.slug, version: exportKey(target.html!) });
        const data = (await res.json().catch(() => null)) as { credits?: number; error?: string } | null;
        if (!res.ok) {
          setError(data?.error ?? "Não deu pra liberar o download agora. Tente de novo; nenhum crédito foi cobrado.");
          void refreshCredits();
          return;
        }
        setCredits(data?.credits);
        const latest = loadDraft(target.slug) ?? target;
        persist({ ...latest, exports: [...(latest.exports ?? []), exportKey(target.html!)] });
      }
      saveBlob(blob, exportFileName(target));
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Não deu pra preparar o download. Tente de novo; nenhum crédito foi cobrado.");
    } finally {
      setDownloading(false);
    }
  }

  function openRecreate(prompt = text.trim()) {
    if (status !== "idle") return;
    setRecreate({ prompt });
  }

  // Cria a próxima versão (site separado, vazio) e abre nela, com o pedido já escrito.
  function confirmRecreate() {
    const prompt = recreate?.prompt;
    setRecreate(null);
    const now = timestamp();
    const slug = createRecreation(draft, prompt || undefined, now);
    // Entra em Sites na hora, como rascunho (antes só entrava depois de gerar).
    sitesStore.add({
      id: createId("site"),
      businessName: draftTitle({ business: draft.business, version: loadDraft(slug)?.version }),
      slug,
      category: draft.business.kind ?? "Comércio",
      color: draft.business.color,
      status: "rascunho",
      createdAt: now,
    });
    router.push(`/app/sites/${slug}`);
  }

  const messages = turnsToMessages(draft);
  if (declined) {
    messages.push({ id: "declined-u", role: "user", text: declined.prompt });
    messages.push({
      id: "declined-a",
      role: "assistant",
      text: declined.reason,
      meta: "Nenhum crédito cobrado",
      ...(declined.kind === "size" ? { actions: [{ label: "Recriar site", onClick: () => openRecreate(declined.prompt) }] } : {}),
    });
  }
  if (siteFound) {
    const found = siteFound;
    messages.push({ id: "found-u", role: "user", text: found.prompt, images: found.images.map(uploadUrl) });
    messages.push({
      id: "found-a",
      role: "assistant",
      text: `Antes de começar, conferi: ${draft.business.name} parece já ter um site próprio.${found.evidence ? ` ${found.evidence}` : ""} Quer criar um site mesmo assim?`,
      link: found.url,
      meta: "Nenhum crédito cobrado",
      actions: [
        {
          label: "Criar mesmo assim",
          onClick: () => {
            const latest = loadDraft(draft.slug) ?? draft;
            const rest = { ...latest };
            delete rest.websiteFound;
            persist({ ...rest, websiteConfirmed: { url: found.url } });
            setSiteFound(null);
            void run(found.prompt, found.images, found.price, undefined, true);
          },
        },
        { label: "Não criar", onClick: () => updateSiteFound(null) },
      ],
    });
  }
  if (live) {
    messages.push({ id: "live-u", role: "user", text: live.prompt, images: live.images.map(uploadUrl) });
    if (live.reply) messages.push({ id: "live-a", role: "assistant", text: live.reply });
  }
  if (error) messages.push({ id: "error", role: "assistant", text: error, tone: "error" });

  const screen: ScreenState = doc ? "live" : status !== "idle" ? "thinking" : "empty";

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link
          href="/app/sites"
          aria-label="Voltar para Sites"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <HueTile icon={Sparkles} hue="grape" size="lg" solid className="hidden shadow-soft sm:grid" />
        <div className="min-w-0 flex-1 basis-[13rem]">
          <h1 className="truncate font-display text-[1.45rem] font-semibold tracking-[-0.03em] text-ink sm:text-[1.7rem]">
            {draftTitle(draft)}
          </h1>
          <p className="mt-0.5 text-[0.86rem] text-muted">{draft.business.kind ?? "Comércio"}</p>
        </div>
        {hasSite && (
          <button
            type="button"
            onClick={() => openRecreate()}
            disabled={status !== "idle"}
            title={`Abre ${draftTitle({ business: draft.business, version: nextVersion(draft) })}, um site novo do zero. Este fica como está.`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[0.86rem] font-semibold text-ink transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-4 text-grape-ink" aria-hidden="true" />
            Recriar site
          </button>
        )}
      </div>

      {/* Chat + mesa. No desktop os dois ocupam a altura da tela; o aparelho
          escolhido cresce até a largura ou a altura da mesa acabar. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)] 2xl:grid-cols-[27rem_minmax(0,1fr)]">
        <div className="order-2 h-[36rem] lg:order-1 lg:h-[calc(100dvh-15rem)] lg:min-h-[34rem]">
          <SiteChat
            businessName={draft.business.name}
            messages={messages}
            status={status}
            hasSite={hasSite}
            cost={cost}
            draft={text}
            onDraft={setText}
            onSend={requestSend}
            onStop={stopGeneration}
            onRecreate={() => openRecreate()}
            resetHint={hasSite && draft.context > CONTEXT_STEP}
            attachments={attachments}
            onAttach={attach}
            onRemoveAttachment={removeAttachment}
            activity={activity}
            context={draft.context}
          />
        </div>
        <div className="order-1 flex flex-col rounded-[28px] border border-line bg-surface-2 p-3 lg:order-2 xl:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <DeviceToggle value={device} onChange={changeDevice} />
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
              <PublishLink state={publishState} slug={draft.publicSlug} onRetry={() => publish(loadDraft(draft.slug) ?? draft)} />
              {draft.publicSlug && (
                <button
                  type="button"
                  onClick={() => setSending(true)}
                  title="Mandar o link do site pro dono do comércio no WhatsApp"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-4 text-[0.84rem] font-semibold text-[#05361a] transition-[background-color,transform] duration-200 hover:bg-[#1fc05b] active:scale-[0.97]"
                >
                  <WhatsAppIcon className="size-[18px]" />
                  Enviar pro dono
                </button>
              )}
              {hasSite && (
                <button
                  type="button"
                  onClick={requestDownload}
                  disabled={status !== "idle" || downloading}
                  title="Baixar um .zip com o HTML pra hospedar onde quiser. As fotos do Google não vão junto: vão imagens neutras pra trocar pelas do dono."
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[0.84rem] font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
                  {downloading ? "Preparando…" : "Baixar site"}
                </button>
              )}
            </div>
          </div>
          <div className="h-[26rem] sm:h-[34rem] lg:h-auto lg:min-h-0 lg:flex-1">
            <DeviceStage
              device={device}
              doc={doc}
              state={screen}
              businessName={draft.business.name}
              photoUrl={photoUrl}
              url={`pagefy.app/p/${draft.slug}`}
            />
          </div>
        </div>
      </div>

      {draft.publicSlug && (
        <SendToOwner
          open={sending}
          business={{ name: draft.business.name, kind: draft.business.kind, neighborhood: draft.business.neighborhood, phone: draft.business.phone }}
          slug={draft.publicSlug}
          onSent={() => markLeadContacted({ placeId: draft.placeId })}
          onClose={() => setSending(false)}
        />
      )}
      <ConfirmRecreate
        open={recreate !== null}
        nextTitle={draftTitle({ business: draft.business, version: nextVersion(draft) })}
        currentTitle={draftTitle(draft)}
        onCancel={() => setRecreate(null)}
        onConfirm={confirmRecreate}
      />
      <ConfirmSpend request={spend} balance={credits} onClose={() => setSpend(null)} />
    </div>
  );
}

const DEVICE_KEY = "pagefy-editor-device";

function loadDevice(): Device {
  try {
    return localStorage.getItem(DEVICE_KEY) === "mobile" ? "mobile" : "desktop";
  } catch {
    return "desktop";
  }
}

// Computador ou celular: um aparelho por vez, pra cada um aparecer grande.
function DeviceToggle({ value, onChange }: { value: Device; onChange: (device: Device) => void }) {
  const options = [
    { id: "desktop" as const, label: "Computador", icon: Monitor },
    { id: "mobile" as const, label: "Celular", icon: Smartphone },
  ];
  return (
    <div role="radiogroup" aria-label="Ver o site no" className="inline-flex rounded-full border border-line-strong bg-surface p-1">
      {options.map(({ id, label, icon: Icon }) => {
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[0.86rem] font-semibold transition-colors duration-200 ${
              on ? "bg-ink text-bg" : "text-ink-2 hover:text-ink"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
