import type { MetadataRoute } from "next";
import { PRIVACIDADE_ATUALIZADO, SITE, TERMOS_ATUALIZADO } from "@/lib/legal";

// As páginas públicas, e só elas. A área logada e os sites publicados
// (`/p/<slug>`) ficam de fora: uma não é pra ninguém de fora ver, a outra é
// `noindex` até o site ser vendido.
//
// `lastModified` dos documentos legais sai da data que eles mesmos publicam
// (lib/legal.ts): se a data no rodapé mudar, a do sitemap muda junto, sem
// ninguém ter que lembrar de duas coisas.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/ajuda`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE.url}/termos`,
      lastModified: TERMOS_ATUALIZADO.iso,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE.url}/privacidade`,
      lastModified: PRIVACIDADE_ATUALIZADO.iso,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
