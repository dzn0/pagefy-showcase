import type { NextConfig } from "next";

// Cabeçalhos de segurança do app. Os sites publicados (/p/<slug>) ficam de
// fora: a rota deles manda a própria CSP de sandbox e Referrer-Policy, e dois
// valores do mesmo cabeçalho somariam restrições.
//
// Sem script-src aqui de propósito: o Next põe scripts inline e o login do
// Google carrega de fora; uma CSP de script precisa de nonce e teste próprio.
const securityHeaders = [
  // Ninguém embute o app num iframe de outro site (clickjacking na tela do cartão).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Foto de perfil do Google, usada no avatar de quem está logado.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path((?!p/).*)", headers: securityHeaders }];
  },
};

export default nextConfig;
