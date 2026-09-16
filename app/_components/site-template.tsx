import { ArrowRight, Clock, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import type { DemoCategory } from "@/lib/demo-data";
import { LogoMark } from "./logo";

// Modelo base do site que o Pagefy gera pra qualquer comércio: uma landing
// completa e compacta (≈1:1, pra caber inteira na prévia sem rolar), montada
// só com o que existe de verdade — nome, foto, nota, bairro, endereço,
// telefone — e os serviços padrão do ramo. Sem depoimentos nem horários
// inventados. Desenhada numa largura fixa de desktop (SITE_WIDTH).

export const SITE_WIDTH = 1024;

export type SiteBusiness = {
  id: string;
  name: string;
  category: DemoCategory;
  neighborhood: string;
  address: string;
  phone: string;
  rating: number | null;
  reviews: number;
  photoUrl: string | null;
};

const INK = "#141614";
const INK_2 = "#3d3f3b";
const MUTED = "#60625d";
const LINE = "#e6e6e1";
const PAPER = "#fafaf8";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i < Math.round(value) ? "fill-[#f5b301] text-[#f5b301]" : "fill-[#e6e6e1] text-[#e6e6e1]"}
        />
      ))}
    </span>
  );
}

type Contact = "whatsapp" | "phone" | "none";

/**
 * Como o comércio atende: celular brasileiro (DDD + 9 + 8 dígitos) pode ter
 * WhatsApp; fixo é só ligação; sem telefone, vai até o local. O número da
 * simulação vem mascarado ("(00) 9 ••••-1234") e conta como celular.
 */
function contactOf(phone: string): Contact {
  if (phone.includes("•")) return "whatsapp";
  const digits = phone.replace(/\D/g, "");
  if (/^(?:55)?\d{2}9\d{8}$/.test(digits)) return "whatsapp";
  return digits.length >= 10 ? "phone" : "none";
}

const CONTACT = {
  whatsapp: { icon: MessageCircle, channel: "pelo WhatsApp", nav: "WhatsApp", cta: "Chamar agora", title: "Atendimento pelo WhatsApp", text: "Ou por telefone, se preferir" },
  phone: { icon: Phone, channel: "por telefone", nav: "Ligar", cta: "Ligar agora", title: "Atendimento por telefone", text: "" },
  none: { icon: MapPin, channel: "no local", nav: "Como chegar", cta: "Como chegar", title: "Atendimento no local", text: "Endereço e rota no mapa" },
} as const;

export function SiteTemplate({ business, city }: { business: SiteBusiness; city: string }) {
  const color = business.category.color;
  const rating = business.rating?.toFixed(1).replace(".", ",");
  const place = [business.neighborhood, city].filter(Boolean).join(", ");
  const reviews = business.reviews.toLocaleString("pt-BR");
  const contactKind = contactOf(business.phone);
  const contact = CONTACT[contactKind];
  const { channel } = contact;
  const ContactIcon = contact.icon;

  return (
    <div className="bg-white font-sans" style={{ color: INK }}>
      {/* Menu */}
      <header className="flex items-center justify-between px-10 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
        <span className="font-display text-[1.2rem] font-bold tracking-[-0.02em]" style={{ color }}>
          {business.name}
        </span>
        <nav className="flex items-center gap-7 text-[0.92rem] font-medium" style={{ color: INK_2 }}>
          <span>Serviços</span>
          <span>Avaliações</span>
          <span>Como chegar</span>
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-bold text-white" style={{ backgroundColor: color }}>
            <ContactIcon className="size-4" /> {contact.nav}
          </span>
        </nav>
      </header>

      {/* Capa */}
      <section className="relative flex h-[380px] items-end overflow-hidden" style={{ backgroundColor: color }}>
        {business.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto do Google (googleusercontent)
          <img src={business.photoUrl} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute right-10 top-6 font-display text-[12rem] font-bold leading-none text-white/15" aria-hidden="true">
            {business.name.charAt(0)}
          </span>
        )}
        <span className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${color} 4%, ${color}cc 36%, ${color}26 76%, transparent)` }} />
        <div className="relative w-full px-10 pb-10 text-white">
          {rating && (
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.9rem] font-medium backdrop-blur-sm">
              <Star className="size-4 fill-current" /> {rating} no Google · {reviews} avaliações
            </p>
          )}
          <h1 className="mt-4 max-w-[18ch] font-display text-[3.4rem] font-bold leading-[1] tracking-[-0.04em]">{business.name}</h1>
          <p className="mt-3 max-w-[50ch] text-[1.12rem] leading-snug text-white/90">
            {business.category.tagline}
            {place && ` em ${place}`}.
          </p>
          <div className="mt-6 flex gap-3">
            {contactKind === "whatsapp" && (
              <span className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1fa855] px-6 text-[0.98rem] font-bold text-white">
                <MessageCircle className="size-5" /> Chamar no WhatsApp
              </span>
            )}
            {contactKind === "none" ? (
              <span className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[0.98rem] font-bold" style={{ color: INK }}>
                <MapPin className="size-5" /> Como chegar
              </span>
            ) : (
              <span className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[0.98rem] font-bold" style={{ color: INK }}>
                <Phone className="size-5" /> Ligar agora
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="grid grid-cols-3" style={{ borderBottom: `1px solid ${LINE}` }}>
        {[
          { icon: Star, title: rating ? `Nota ${rating} no Google` : "Avaliado no Google", text: `${reviews} clientes já avaliaram` },
          { icon: MapPin, title: business.neighborhood || city, text: "Endereço e rota no mapa" },
          { icon: contact.icon, title: contact.title, text: contact.text || business.phone },
        ].map((item, i) => (
          <div key={item.title} className="flex items-center gap-3.5 px-10 py-6" style={i > 0 ? { borderLeft: `1px solid ${LINE}` } : undefined}>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${color}14`, color }}>
              <item.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[1rem] font-bold">{item.title}</span>
              <span className="block text-[0.88rem]" style={{ color: MUTED }}>
                {item.text}
              </span>
            </span>
          </div>
        ))}
      </section>

      {/* Serviços */}
      <section className="px-10 py-10">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-[2rem] font-bold tracking-[-0.03em]">O que você encontra aqui</h2>
          <p className="text-[0.95rem]" style={{ color: MUTED }}>
            Valores e disponibilidade {channel}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {business.category.services.map((service, i) => {
            const featured = i === 1;
            return (
              <div
                key={service}
                className="flex items-center justify-between gap-3 rounded-2xl px-6 py-5"
                style={{ backgroundColor: featured ? color : PAPER, color: featured ? "#fff" : INK, border: featured ? "none" : `1px solid ${LINE}` }}
              >
                <span className="text-[1.12rem] font-bold tracking-[-0.01em]">{service}</span>
                <ArrowRight className="size-5 shrink-0" style={{ color: featured ? "#fff" : color }} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Avaliações + Como chegar */}
      <section className="grid grid-cols-2 gap-4 px-10 pb-10">
        <div className="flex items-center gap-6 rounded-3xl px-8 py-7" style={{ backgroundColor: PAPER, border: `1px solid ${LINE}` }}>
          <span className="font-display text-[3.6rem] font-bold leading-none tracking-[-0.04em]">{rating ?? "–"}</span>
          <span>
            <span className="block text-[1.15rem] font-bold">Quem vem, recomenda</span>
            {business.rating !== null && (
              <span className="mt-1.5 block">
                <Stars value={business.rating} size={18} />
              </span>
            )}
            <span className="mt-1.5 block text-[0.92rem]" style={{ color: MUTED }}>
              {reviews} avaliações no Google
            </span>
          </span>
        </div>
        <div className="rounded-3xl px-8 py-6" style={{ border: `1px solid ${LINE}` }}>
          <p className="text-[1.15rem] font-bold">Como chegar</p>
          <ul className="mt-3 space-y-2 text-[0.95rem]" style={{ color: INK_2 }}>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" style={{ color }} />
              <span className="truncate">{business.address}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 size-4 shrink-0" style={{ color }} />
              <span className="tabular-nums">{business.phone}</span>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0" style={{ color }} />
              <span>Horário: consulte {channel}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Chamada final + rodapé */}
      <section className="mx-10 flex items-center justify-between gap-6 rounded-3xl px-10 py-7 text-white" style={{ backgroundColor: color }}>
        <div>
          <p className="font-display text-[1.7rem] font-bold leading-tight tracking-[-0.03em]">Fale com {business.name}</p>
          <p className="mt-1 text-[1rem] text-white/85">Tire suas dúvidas e peça orçamento {channel}.</p>
        </div>
        <span className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-[0.98rem] font-bold" style={{ color }}>
          <ContactIcon className="size-5" /> {contact.cta}
        </span>
      </section>
      <footer className="flex items-center justify-between gap-6 px-10 py-5 text-[0.86rem]" style={{ color: MUTED }}>
        <span className="truncate">
          <strong className="font-bold" style={{ color: INK }}>
            {business.name}
          </strong>{" "}
          · {business.address}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          Feito com
          <span className="inline-flex items-center gap-1 font-display font-semibold" style={{ color: INK }}>
            <LogoMark className="size-4" /> Pagefy
          </span>
        </span>
      </footer>
    </div>
  );
}
