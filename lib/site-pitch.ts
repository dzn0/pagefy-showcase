// Mensagem de WhatsApp pro dono do comércio ("Enviar pro dono" no gerador).
// O backend escreve com o nome do comércio e o link; sem resposta dele, vale
// o texto simples daqui. Não custa créditos.
import { apiPost } from "./api";

export function fallbackPitch(name: string, url: string) {
  return `Oi! Fiz um site para ${name} e queria te mostrar como ficou:\n\n${url}\n\nDá uma olhada e me diz o que você acha?`;
}

export async function writePitch(
  business: { name: string; kind?: string | null; neighborhood?: string | null },
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const res = await apiPost(
      "/sites/pitch",
      { business: { name: business.name, kind: business.kind, neighborhood: business.neighborhood }, url },
      { signal },
    );
    if (!res.ok) return fallbackPitch(business.name, url);
    const data = (await res.json()) as { message: string | null };
    return data.message?.trim() || fallbackPitch(business.name, url);
  } catch {
    return fallbackPitch(business.name, url);
  }
}
