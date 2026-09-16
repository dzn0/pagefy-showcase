import type { Metadata } from "next";
import { Sora, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/legal";
import { AuthProvider } from "./_components/auth-provider";
import { LoginDialogProvider } from "./_components/login-dialog";
import { HashLanding } from "./_components/hash-landing";
import { ScrollToTop } from "./_components/scroll-to-top";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = "Pagefy | Encontre quem não tem site e apareça com o site pronto";
const DESCRICAO =
  "O Pagefy encontra os comércios da sua cidade que ainda não têm site e monta a página de cada um com dados reais. Você manda o link e fecha a venda. Comece grátis.";

export const metadata: Metadata = {
  // Base de toda URL relativa daqui pra baixo: sem ela, o canonical de cada
  // página sai relativo e a imagem do Open Graph não resolve (o WhatsApp e o
  // Google querem endereço absoluto).
  metadataBase: new URL(SITE.url),
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "/" },
  // O produto inteiro é mandar link por WhatsApp — inclusive o da própria
  // Pagefy, de um usuário pro outro. Sem isto o link chega como texto pelado.
  openGraph: {
    type: "website",
    siteName: SITE.nome,
    locale: "pt_BR",
    url: SITE.url,
    title: TITULO,
    description: DESCRICAO,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
  },
  // Deixa o Google mostrar trecho e prévia de imagem sem limite de tamanho.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

// Aplica o tema salvo antes da primeira pintura, para não piscar o tema errado.
const themeScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("pagefy-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior: o html tem scroll-behavior: smooth (âncoras da
    // landing), e no Next 16 isso só é desligado durante a troca de página com
    // este atributo. Sem ele, as rolagens da navegação viravam animação e a
    // página nova abria perto do rodapé.
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sora.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <LoginDialogProvider>{children}</LoginDialogProvider>
          <ScrollToTop />
          <HashLanding />
        </AuthProvider>
      </body>
    </html>
  );
}
