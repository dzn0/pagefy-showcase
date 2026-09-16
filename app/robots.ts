import type { MetadataRoute } from "next";
import { SITE } from "@/lib/legal";

// O que o Google pode rastrear. Duas decisões deliberadas aqui:
//
// 1. `/app/` sai. É a área logada: sem sessão ela só mostra "Redirecionando…",
//    e uma dezena de páginas idênticas com essa frase é exatamente o tipo de
//    conteúdo raso que derruba a avaliação do site inteiro.
//
// 2. `/p/` NÃO sai, mesmo sendo página que não deve aparecer na busca. Parece
//    contraditório, mas é o contrário: quem bloqueia no robots.txt impede o
//    Google de LER a página — e é dentro dela que está o `noindex`
//    (X-Robots-Tag, em app/p/[slug]/route.ts). Bloqueado aqui, o endereço
//    ainda poderia entrar no índice pelo link, e aí sem jeito de tirar. Deixar
//    rastrear é o que garante que o `noindex` seja visto e obedecido.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/app/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
