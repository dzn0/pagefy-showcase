// Download do site (HTML e imagens num .zip), cobrado em créditos por versão.
//
// Os termos do Google Maps Platform não deixam redistribuir as fotos do
// Google, e o link delas passa pelo nosso backend (cada visita num site
// hospedado fora viraria custo pra sempre). Então as fotos do Google saem
// trocadas por imagens neutras numeradas, e o LEIA-ME explica como trocar.
// As imagens que a pessoa mandou no chat são dela: vão no pacote.
import { hash } from "./demo-data";
import { findPaymentData, sanitizeSiteHtml } from "./site-safety";
import { draftTitle, type SiteDraft } from "./store/site-drafts";
import { createZip, type ZipEntry } from "./zip";

/** Foto do Google no HTML: a URL curta do gerador ou a de /places/photo. */
const GOOGLE_PHOTO = /https?:\/\/[^\s"'()<>]+?\/(?:sites\/photo\/[\w-]+\/\d+|places\/photo\?[^\s"'()<>]*)/g;
/** Imagem enviada no chat (nome gerado pelo backend). */
const UPLOAD = /https?:\/\/[^\s"'()<>]+?\/uploads\/([a-f0-9]{32}\.(?:jpg|png|webp))/g;

/** Identifica a versão do HTML: pagar de novo só quando o site mudou. */
export function exportKey(html: string) {
  return `${html.length}-${hash(html).toString(36)}`;
}

export function hasPaidExport(draft: SiteDraft) {
  return Boolean(draft.html && draft.exports?.includes(exportKey(draft.html)));
}

function placeholderSvg(n: number, color: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${color}"/><rect x="40" y="40" width="1520" height="920" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="4" stroke-dasharray="18 14"/><text x="800" y="480" fill="#ffffff" font-family="system-ui,sans-serif" font-size="56" font-weight="600" text-anchor="middle">Foto ${n}</text><text x="800" y="560" fill="#ffffff" fill-opacity=".8" font-family="system-ui,sans-serif" font-size="36" text-anchor="middle">Troque pela foto do comércio (imagens/foto-${n}.svg)</text></svg>`;
}

function readme(title: string, photos: number, uploads: number, missing: number) {
  return [
    `Site: ${title}`,
    "Feito com Pagefy.",
    "",
    "O QUE TEM AQUI",
    "- index.html: o site inteiro (textos, cores, estilo e o pouco de script que ele usa).",
    uploads ? `- imagens/: ${uploads} imagem(ns) que você mandou no chat.` : "",
    photos ? `- imagens/foto-1.svg a foto-${photos}.svg: lugares das fotos do comércio.` : "",
    "",
    "COMO PUBLICAR",
    "Suba a pasta inteira (index.html e a pasta imagens) em qualquer hospedagem de site estático:",
    "Netlify, Vercel, GitHub Pages, Cloudflare Pages ou a hospedagem do cliente. Não precisa de servidor nem banco.",
    "",
    photos
      ? [
          "TROQUE AS FOTOS ANTES DE PUBLICAR",
          "As fotos que aparecem no Pagefy vêm do Google Maps, e os termos do Google não permitem copiá-las para outro site.",
          "Por isso elas vieram como imagens neutras numeradas. Peça ao dono fotos próprias (fachada, ambiente, produtos)",
          "e salve cada uma com o mesmo nome na pasta imagens (ex.: foto-1.jpg), trocando também o nome no index.html",
          "(procure por foto-1.svg). Se o site mostra créditos de foto (\"Foto: Nome\"), apague junto.",
          "",
        ].join("\n")
      : "",
    "AVALIAÇÕES DO GOOGLE",
    "Se o site mostra trechos de avaliações ou a nota do Google, confira com o dono se quer manter. Nota e",
    "avaliações mudam com o tempo; o ideal é trocar por um link para o perfil no Google Maps.",
    missing ? `\nAVISO: ${missing} imagem(ns) enviada(s) no chat não puderam ser baixadas e ficaram com o link original.` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Nome do arquivo .zip: "ernesto-cafe-bar-2-site.zip". */
export function exportFileName(draft: SiteDraft) {
  const base = draftTitle(draft)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "site"}-site.zip`;
}

/** Monta o .zip do site atual do rascunho. */
export async function buildSiteZip(draft: SiteDraft): Promise<Blob> {
  if (!draft.html) throw new Error("Este site ainda não foi gerado.");
  // Mesmas travas do link público: sem dados de pagamento, e o HTML limpo.
  const payment = findPaymentData(draft.html);
  if (payment.length) throw new Error(`O site tem dados de pagamento (${payment.join(", ")}). Peça pra IA tirar antes de baixar; nenhum crédito foi cobrado.`);
  let html = sanitizeSiteHtml(draft.html).html;
  const entries: ZipEntry[] = [];

  // Fotos do Google: cada URL diferente vira um lugar numerado.
  const photoIndex = new Map<string, number>();
  html = html.replace(GOOGLE_PHOTO, (url) => {
    const key = url.replace(/&amp;/g, "&");
    if (!photoIndex.has(key)) photoIndex.set(key, photoIndex.size + 1);
    return `imagens/foto-${photoIndex.get(key)}.svg`;
  });
  for (const n of photoIndex.values()) entries.push({ name: `imagens/foto-${n}.svg`, data: placeholderSvg(n, draft.business.color || "#6b6b6b") });

  // Imagens do chat: baixa e põe na pasta; se falhar, fica o link original.
  const uploads = new Map<string, string>();
  for (const match of html.matchAll(UPLOAD)) uploads.set(match[0], match[1]!);
  let missing = 0;
  let included = 0;
  for (const [url, name] of uploads) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      entries.push({ name: `imagens/${name}`, data: new Uint8Array(await res.arrayBuffer()) });
      html = html.split(url).join(`imagens/${name}`);
      included++;
    } catch {
      missing++;
    }
  }

  entries.unshift({ name: "index.html", data: html });
  entries.push({ name: "LEIA-ME.txt", data: readme(draftTitle(draft), photoIndex.size, included, missing) });
  return createZip(entries);
}

/** Entrega o arquivo pro navegador salvar. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
