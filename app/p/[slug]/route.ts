// Link público de um site gerado: pagefy.app/p/<slug>. Serve o HTML do site
// como a página inteira (sem nada do app em volta), buscado no backend.
//
// O HTML foi escrito por uma IA e roda no domínio do Pagefy, então vai com
// CSP `sandbox`: a página ganha uma origem isolada e os scripts dela não
// alcançam o localStorage, os cookies nem o login do app. E fica fora do
// Google (noindex) até o site ser vendido.
import { API_URL } from "@/lib/api";
import { sanitizeSiteHtml } from "@/lib/site-safety";

// Sem allow-forms: o site gerado é estático, não tem pra onde mandar um formulário.
const SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox";

// O que o site pode carregar (2026-09-14). Mesmo que o HTML escape da limpeza
// do backend, o navegador bloqueia: script só inline (nada de fora), nenhuma
// chamada de rede (connect-src), nada de formulário, fontes só do Google
// Fonts, imagens do nosso backend ou https, e iframe só do Google Maps.
const apiOrigin = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
})();
const CSP = [
  SANDBOX,
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com data:",
  `img-src https: data: ${apiOrigin}`,
  "media-src https:",
  "frame-src https://www.google.com https://maps.google.com",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

function page(status: number, title: string, text: string) {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f6f6f3;color:#141614;text-align:center;padding:24px}h1{font-size:1.4rem;margin:0 0 8px}p{color:#60625d;margin:0}</style></head><body><div><h1>${title}</h1><p>${text}</p></div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return page(404, "Site não encontrado", "Confira o link que você recebeu.");

  let res: Response;
  try {
    res = await fetch(`${API_URL}/sites/public/${slug}`, { cache: "no-store" });
  } catch {
    return page(503, "Site fora do ar por um instante", "Tente abrir de novo em alguns segundos.");
  }
  if (res.status === 404) return page(404, "Site não encontrado", "Confira o link que você recebeu.");
  if (!res.ok) return page(503, "Site fora do ar por um instante", "Tente abrir de novo em alguns segundos.");

  const site = (await res.json()) as { html: string };
  // Limpa de novo ao servir: sites publicados antes das travas também passam por elas.
  return new Response(sanitizeSiteHtml(site.html).html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": CSP,
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
