// Preço de cada pedido no gerador de sites, em créditos (sempre múltiplos de 5).
//
// Um nível só: modelo e esforço não aparecem pra quem usa. Quem decide é o
// backend.
//
// Site novo: SITE_PRICE. Ajuste: EDIT_PRICE vezes a faixa da conversa (cada
// pedido relê a conversa toda; a cada CONTEXT_STEP tokens a mais, soma mais
// uma base). Refazer uma seção inteira ou o site não é ajuste: a IA recusa sem
// cobrar e o "Recriar site" abre uma versão nova, com o preço de site novo.

/** Motor de um pedido antigo, guardado no rascunho (não aparece mais na tela). */
export type SiteEngine = { model: string; thinking: string };

export const SITE_PRICE = 150;
/** Busca de comércios sem site (servidor: backend/src/lib/pricing.ts). */
export const SEARCH_PRICE = 30;
export const EDIT_PRICE = 40;

/** Baixar o site em arquivos (.zip), por versão do HTML. A mesma versão de novo é grátis. */
export const EXPORT_PRICE = 100;

/** Créditos de boas-vindas do plano Grátis: 4 buscas, uma vez por telefone verificado. */
export const WELCOME_CREDITS = 120;
export const CONTEXT_STEP = 40_000;

/** Faixa da conversa: 1 até CONTEXT_STEP tokens, 2 até o dobro, e assim por diante. */
export function contextTier(context: number) {
  return 1 + Math.floor(Math.max(0, context - 1) / CONTEXT_STEP);
}

export function promptCost({ hasSite, context }: { hasSite: boolean; context: number }) {
  return hasSite ? EDIT_PRICE * contextTier(context) : SITE_PRICE;
}

/** Tokens aproximados de um texto (HTML e português ficam perto de 3,5 caracteres por token). */
export function estimateTokens(text: string) {
  return Math.ceil(text.length / 3.5);
}

/** Conversa recomeçada: system + dados + fotos (~20 mil) + o site atual. */
export function freshContext(html: string) {
  return 20_000 + estimateTokens(html);
}
