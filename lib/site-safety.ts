// Travas do HTML gerado, independentes do que a IA escrever (o prompt pede,
// isto garante). O site é público num domínio do Pagefy, feito por um
// revendedor a partir de dados de um comércio que não pediu nada, então:
//
// 1. Limpeza: nada que carregue código de fora, redirecione, colete dados ou
//    rastreie quem visita. O site é estático (decidido 2026-09-14).
// 2. Dados de pagamento: um site "do comércio" com a chave PIX ou a conta de
//    outra pessoa é golpe contra os clientes dele. Não publica.
//
// Cópia de backend/src/lib/site-safety.ts (lá é a trava que vale, na publicação);
// aqui serve pra prévia, o download e avisar antes de salvar. Mantenha iguais.

/** Iframes que o site pode ter: só o mapa do Google. */
const MAP_FRAME = /^https:\/\/(www\.)?google\.[a-z.]+\/maps|^https:\/\/maps\.google\.[a-z.]+\//i;
/** Rastreadores e redirecionamentos dentro de scripts inline. */
const BAD_SCRIPT = /googletagmanager|google-analytics|gtag\(|fbq\(|connect\.facebook|analytics\.tiktok|hotjar|clarity\.ms|(?:window\.|document\.|top\.)?location\s*(?:\.href\s*)?=|location\.(?:replace|assign)\(|document\.cookie|localStorage|sessionStorage|fetch\(|XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket|eval\(|new\s+Function\(|atob\(/i;

export type SanitizeResult = { html: string; removed: string[] };

export function sanitizeSiteHtml(input: string): SanitizeResult {
  const removed = new Set<string>();
  let html = input;
  const strip = (pattern: RegExp, label: string, replacement = "") => {
    html = html.replace(pattern, () => {
      removed.add(label);
      return replacement;
    });
  };

  // Scripts de fora (qualquer <script src>) e inline com rastreio, redirecionamento ou rede.
  strip(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script\s*>/gi, "script externo");
  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (whole, _attrs: string, body: string) => {
    if (!BAD_SCRIPT.test(body)) return whole;
    removed.add("script com rastreio, rede ou redirecionamento");
    return "";
  });
  // Iframes que não sejam o mapa do Google.
  html = html.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe\s*>|<iframe\b[^>]*\/?>/gi, (whole, attrs: string | undefined) => {
    const src = attrs?.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    if (MAP_FRAME.test(src)) return whole;
    removed.add("iframe");
    return "";
  });
  strip(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh[^>]*>/gi, "redirecionamento automático");
  strip(/<base\b[^>]*>/gi, "base");
  strip(/<(object|embed|applet)\b[\s\S]*?(<\/\1\s*>|\/?>)/gi, "objeto embutido");
  // Formulários e campos: o site não tem pra onde mandar nada.
  strip(/<\/?form\b[^>]*>/gi, "formulário");
  strip(/<(input|textarea|select)\b[^>]*>(?:[\s\S]*?<\/\1\s*>)?/gi, "campo de formulário");
  // Links javascript: e data:text/html viram âncora vazia.
  html = html.replace(/\b(href|src|action|formaction)\s*=\s*(["'])\s*(?:javascript|vbscript|data:text\/html)[^"']*\2/gi, (_m, attr: string) => {
    removed.add("link com script");
    return `${attr}="#"`;
  });
  // Pixels de rastreio em <img> ou <link>.
  strip(/<(img|link)\b[^>]*(facebook\.com\/tr|google-analytics|googletagmanager|doubleclick|analytics\.tiktok)[^>]*>/gi, "pixel de rastreio");
  // Pré-carregamento e conexão com terceiros além das fontes do Google.
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
    const rel = tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    const googleFonts = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(href);
    if (googleFonts || rel.includes("icon") || href.startsWith("data:")) return tag;
    removed.add("recurso de terceiros");
    return "";
  });

  return { html, removed: [...removed] };
}

/**
 * Dados de pagamento no site: chave PIX (CPF, CNPJ, e-mail, telefone ou chave
 * aleatória perto da palavra "pix"), agência e conta, número de cartão ou
 * link de pagamento. Devolve o que achou (vazio = ok).
 */
export function findPaymentData(html: string): string[] {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|\s+/g, " ");
  const found = new Set<string>();
  // Só a chave escrita logo depois de "PIX" ou "chave" conta: "Aceitamos PIX" e o
  // telefone do comércio na mesma frase não são dado de pagamento.
  const key = [
    String.raw`\d{3}\.?\d{3}\.?\d{3}-?\d{2}`, // CPF
    String.raw`\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}`, // CNPJ
    String.raw`[\w.+-]+@[\w-]+\.[\w.]+`, // e-mail
    String.raw`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`, // chave aleatória
    String.raw`\(?\d{2}\)?\s?9?\d{4}-?\d{4}`, // telefone
  ].join("|");
  const pixKey = new RegExp(String.raw`(?:chave(?:\s+(?:pix|aleat[óo]ria))?|pix)(?:\s*(?:[:\-–=]|é|\(.{0,20}?\)))*\s*(?:${key})`, "i");
  if (pixKey.test(text)) found.add("chave PIX");
  if (/ag[eê]ncia\s*:?\s*\d{3,5}[\s\S]{0,40}?conta\s*(corrente|poupan[cç]a)?\s*:?\s*\d{3,}/i.test(text)) found.add("agência e conta");
  if (/\b(?:\d{4}[ -]){3}\d{4}\b/.test(text)) found.add("número de cartão");
  if (/(?:mpago\.la|mercadopago\.com\.br\/checkout|pag\.ae|pagseguro\.uol\.com\.br\/checkout|picpay\.me|nubank\.com\.br\/cobrar|link\.pagar\.me|buy\.stripe\.com|pay\.hotmart)/i.test(html)) found.add("link de pagamento");
  return [...found];
}
