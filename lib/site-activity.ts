// Etapas reais da geração, pro chat mostrar o que a IA está fazendo agora,
// em vez de só "Gerando site…". Os nomes não citam ferramentas, modelos nem
// fornecedores: quem usa vê o trabalho, não a infraestrutura. Tudo sai do texto que
// chega (as tags e o HTML) e dos eventos do agente (pensando, ferramentas),
// cada um na posição do texto em que aconteceu. Recalcular do zero a cada
// pedaço é barato e deixa a lista sempre consistente.

export type ActivityMarker =
  | { kind: "thinking"; at: number }
  | { kind: "tool"; at: number; name: string; detail?: string }
  /** Etapa real narrada pelo backend (o que a IA está pensando em fazer agora). */
  | { kind: "step"; at: number; label: string };

export type ActivityStep = { id: string; label: string };

const REFERENCE_NAMES: Record<string, string> = {
  typeset: "a tipografia",
  layout: "o layout",
  colorize: "as cores",
  animate: "as animações",
  polish: "o acabamento",
  bolder: "como dar mais ousadia",
  quieter: "como tirar exageros",
  distill: "como simplificar",
  delight: "os detalhes que encantam",
  overdrive: "efeitos avançados",
  clarify: "os textos",
  adapt: "o celular e outras telas",
  harden: "os casos difíceis",
  optimize: "o desempenho",
  audit: "uma revisão técnica",
  critique: "uma crítica do design",
};

function pretty(id: string) {
  const text = id.replace(/[-_]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type Event = { at: number; order: number; label: string; key?: string };

/** Etapas na ordem em que aconteceram. `hasSite`: pedido de ajuste (não é o primeiro site). */
export function deriveActivity(raw: string, markers: ActivityMarker[], hasSite: boolean): ActivityStep[] {
  const events: Event[] = [];
  let order = 0;
  const add = (at: number, label: string, key?: string) => events.push({ at, order: order++, label, key });

  let sawTool = false;
  markers.forEach((marker, i) => {
    if (marker.kind === "step") {
      add(marker.at, marker.label);
    } else if (marker.kind === "thinking") {
      // A frase genérica só segura o lugar até chegar a primeira etapa real deste trecho de raciocínio.
      const next = markers.slice(i + 1).find((m) => m.kind !== "thinking");
      if (next?.kind === "step") return;
      add(marker.at, sawTool ? "Analisando o que viu" : hasSite ? "Entendendo o pedido" : "Estudando as fotos e o comércio");
    } else {
      sawTool = true;
      if (marker.name === "screenshot") add(marker.at, marker.detail === "full" ? "Conferindo a página inteira no computador e no celular" : "Conferindo no computador e no celular");
      else if (marker.name === "detect") add(marker.at, "Revisando os detalhes do design");
      else if (marker.name === "read_reference") add(marker.at, `Estudando ${REFERENCE_NAMES[marker.detail ?? ""] ?? "o design"}`);
    }
  });

  const direction = raw.indexOf("<direction>");
  if (direction >= 0) add(direction, "Definindo a direção visual");

  // Dentro do site: o estilo, a primeira tela, cada seção, o rodapé, os scripts.
  let from = 0;
  for (;;) {
    const start = raw.indexOf("<site>", from);
    if (start < 0) break;
    const end = raw.indexOf("</site>", start);
    const body = raw.slice(start, end >= 0 ? end : undefined);
    add(start, hasSite ? "Reescrevendo o site" : "Começando o HTML");
    const style = body.indexOf("<style");
    if (style >= 0) add(start + style, "Escolhendo cores, fontes e espaçamentos");
    const bodyTag = body.search(/<body[\s>]/);
    if (bodyTag >= 0) add(start + bodyTag, "Montando a primeira tela");
    let count = 0;
    const sections = [...body.matchAll(/<section\b([^>]*)>/g)];
    sections.forEach((match, i) => {
      count++;
      // Nome da seção: o título dela (h1–h3), senão o aria-label ou o id.
      const inside = body.slice(match.index!, sections[i + 1]?.index ?? undefined);
      const heading = inside.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/)?.[1];
      const title = heading ? heading.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
      const attr = match[1]?.match(/\b(?:aria-label|id)="([^"]+)"/)?.[1];
      const name = title || (attr ? pretty(attr) : "");
      const short = name.length > 42 ? `${name.slice(0, 40).trimEnd()}…` : name;
      add(start + match.index!, short ? `Montando “${short}”` : `Montando a seção ${count}`);
    });
    const footer = body.lastIndexOf("<footer");
    if (footer >= 0) add(start + footer, "Montando o rodapé");
    const script = body.lastIndexOf("<script");
    if (script >= 0 && script > (bodyTag >= 0 ? bodyTag : 0)) add(start + script, "Adicionando as interações");
    if (end >= 0) {
      const lines = body.split("\n").length;
      add(end, `Site escrito · ${lines.toLocaleString("pt-BR")} linhas`);
      from = end + 7;
    } else break;
  }

  // Trocas pontuais (ajuste ou correções depois dos prints), agrupadas quando seguidas.
  for (const match of raw.matchAll(/<edit>/g)) add(match.index!, "edit", "edit");
  const reply = raw.lastIndexOf("<reply>");
  if (reply >= 0) add(reply, "Escrevendo o resumo pra você");

  events.sort((a, b) => a.at - b.at || a.order - b.order);
  const steps: ActivityStep[] = [];
  let editRun = 0;
  for (const event of events) {
    if (event.key === "edit") {
      editRun++;
      const label = sawTool ? `Aplicando correções (${editRun})` : `Ajustando o site (${editRun} ${editRun === 1 ? "troca" : "trocas"})`;
      const last = steps[steps.length - 1];
      if (last && last.id.startsWith("edit-")) last.label = label;
      else steps.push({ id: `edit-${event.at}`, label });
      continue;
    }
    editRun = 0;
    steps.push({ id: `${event.at}-${event.order}`, label: event.label });
  }
  return steps;
}

/** Etapas guardadas em pedidos antigos, com os nomes de antes (citavam a ferramenta): mostra com os de agora. */
export function cleanStepLabel(label: string) {
  if (label === "Rodando o detector de vícios de IA") return "Revisando os detalhes do design";
  const guide = label.match(/^Lendo o guia de (.+) da Impeccable$/);
  if (guide) {
    const entry = Object.entries(REFERENCE_NAMES).find(([id, name]) => name.replace(/^(a|o|as|os|uma|como) /, "") === guide[1] || id === guide[1]);
    return `Estudando ${entry?.[1] ?? "o design"}`;
  }
  return label;
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return min ? `${min} min ${String(sec).padStart(2, "0")} s` : `${sec} s`;
}
