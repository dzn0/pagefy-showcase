// Imagens que a pessoa manda no chat do gerador. Antes de subir, a imagem é
// reduzida (lado maior MAX_SIDE) e vira WebP: sobe rápido, pesa pouco no
// site e custa menos tokens pra IA ler. PNG pequeno (logo com fundo
// transparente) sobe como está.
import { API_URL, apiFetch } from "./api";

export const MAX_IMAGES_PER_MESSAGE = 4;
const MAX_SIDE = 1600;
const KEEP_PNG_UNDER = 600 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function isAcceptedImage(file: File) {
  return ACCEPTED.includes(file.type) || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
}

export function uploadUrl(name: string) {
  return `${API_URL}/uploads/${name}`;
}

async function prepare(file: File): Promise<Blob> {
  if (file.type === "image/png" && file.size <= KEEP_PNG_UNDER) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("Não deu pra ler essa imagem.");
  return blob;
}

/** Reduz e sobe a imagem; devolve o nome dela no backend. */
export async function uploadImage(file: File): Promise<string> {
  const blob = await prepare(file);
  const res = await apiFetch("/uploads", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
  const data = (await res.json().catch(() => null)) as { name?: string; error?: string } | null;
  if (!res.ok || !data?.name) throw new Error(data?.error ?? "Não deu pra enviar a imagem.");
  return data.name;
}
