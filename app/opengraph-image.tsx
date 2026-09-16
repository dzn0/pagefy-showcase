import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// A prévia que aparece quando alguém cola pagefy.app no WhatsApp, no Telegram,
// no LinkedIn ou manda pro Google. Vale mais aqui do que na maioria dos
// produtos: o Pagefy se espalha por link mandado de pessoa pra pessoa.
//
// Desenhada com os mesmos tokens do site (DESIGN.md), na Sora de verdade — os
// dois pesos vivem em assets/, pra o build não depender da rede.

export const alt = "Pagefy — encontre quem não tem site e apareça com o site pronto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#f6f6f3";
const INK = "#141614";
const MUTED = "#60625d";
const GREEN = "#357a27";
const GREEN_INK = "#2f6e22";
const LIME = "#6fcf3c";
const BRAND_GREEN = "#3f8f2f";
const LINE = "#e3e3de";

export default async function Image() {
  const [sora600, sora700] = await Promise.all([
    readFile(join(process.cwd(), "assets/sora-600.ttf")),
    readFile(join(process.cwd(), "assets/sora-700.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 76,
          fontFamily: "Sora",
        }}
      >
        {/* A marca, com a geometria exata do logo (app/_components/logo.tsx):
            dois quadrados de 62 num quadro de 100, deslocados 14, raio 18. No
            claro, o lime fica atrás e o verde escuro na frente. */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width={62} height={62} viewBox="0 0 100 100">
            <rect x="14" y="10" width="62" height="62" rx="18" fill={LIME} />
            <rect x="28" y="28" width="62" height="62" rx="18" fill={BRAND_GREEN} />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 600, color: INK, letterSpacing: "-0.03em" }}>Pagefy</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 74,
              fontWeight: 700,
              color: INK,
              letterSpacing: "-0.04em",
              lineHeight: 1.06,
            }}
          >
            <div style={{ display: "flex" }}>Encontre quem não tem site</div>
            <div style={{ display: "flex", color: GREEN_INK }}>e apareça com ele pronto.</div>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, fontWeight: 600, color: MUTED, letterSpacing: "-0.01em" }}>
            Comércios reais da sua cidade, com a página de cada um pronta.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${LINE}`, paddingTop: 30 }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: MUTED }}>pagefy.app</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: GREEN,
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 600,
              padding: "16px 34px",
              borderRadius: 999,
            }}
          >
            Comece grátis
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Sora", data: sora600, weight: 600, style: "normal" },
        { name: "Sora", data: sora700, weight: 700, style: "normal" },
      ],
    },
  );
}
