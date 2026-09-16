// Funil, lado do navegador. Duas coisas: guardar de onde a pessoa veio na
// PRIMEIRA visita (pra mandar junto no cadastro) e avisar o backend dos
// passos que não deixam rastro em nenhuma tabela — ver backend/src/lib/
// analytics.ts, que tem a lista fechada de eventos e a explicação.
//
// Nada aqui bloqueia a tela: todo envio é disparado e esquecido, e qualquer
// falha é silenciosa. Medir o funil nunca pode atrapalhar quem está usando.
import { apiPost } from "./api";

/** Mesmos nomes do backend. Um nome fora desta lista é recusado lá. */
export type Evento =
  | "landing_vista"
  | "cadastro_iniciado"
  | "login_aberto"
  | "checkout_aberto"
  | "checkout_pix_gerado"
  | "checkout_cartao_recusado"
  | "checkout_abandonado";

export type Props = Record<string, string | number>;

const AQUISICAO_KEY = "pagefy:aquisicao";

export type Aquisicao = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
};

/**
 * De onde a pessoa veio, gravado uma vez e nunca reescrito. Entre ver o
 * anúncio e assinar podem passar semanas e várias visitas; se cada visita
 * sobrescrevesse, o crédito acabaria sempre no acesso direto de quem já
 * conhece o produto, e a campanha que realmente trouxe a pessoa sumiria.
 */
export function capturarAquisicao() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(AQUISICAO_KEY)) return;
  } catch {
    return; // Sem localStorage não dá pra guardar; segue sem atribuição.
  }

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || "";
  let externo = false;
  if (referrer) {
    try {
      externo = new URL(referrer).hostname !== window.location.hostname;
    } catch {
      externo = false;
    }
  }

  const aquisicao: Aquisicao = {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    // Só quem veio de fora conta como indicação: navegar entre páginas do
    // próprio site apontaria o Pagefy como origem do Pagefy.
    referrer: externo ? referrer : undefined,
    landingPath: window.location.pathname,
  };

  // Chegada direta, sem utm e sem indicação: não vale guardar nada além do
  // caminho, e guardar só isso encheria a coluna de ruído.
  const temOrigem = Boolean(aquisicao.utmSource || aquisicao.referrer);
  if (!temOrigem) return;

  try {
    localStorage.setItem(AQUISICAO_KEY, JSON.stringify(aquisicao));
  } catch {
    // idem.
  }
}

/** O que mandar junto com o login. Vazio quando a pessoa chegou direto. */
export function lerAquisicao(): Aquisicao | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(AQUISICAO_KEY);
    return raw ? (JSON.parse(raw) as Aquisicao) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Avisa o backend de um passo do funil. Não devolve promessa de propósito:
 * nenhuma tela deve esperar por telemetria.
 */
export function registrar(evento: Evento, props?: Props) {
  if (typeof window === "undefined") return;
  void apiPost("/eventos", { evento, ...(props ? { props } : {}) }).catch(() => {
    // Offline, bloqueador de anúncio, backend fora: a tela segue igual.
  });
}
