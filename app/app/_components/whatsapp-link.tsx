import { siWhatsapp } from "simple-icons";

// Telefone do comércio como atalho pro WhatsApp: chip no verde da marca que
// abre a conversa no wa.me (aba nova). O texto é verde bem escuro, não
// branco: branco sobre #25D366 não passa no contraste mínimo.

/** wa.me exige o número com código do país e só dígitos: (67) 3422-8808 → 556734228808. */
export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits.replace(/^0+/, "")}`;
  return `https://wa.me/${withCountry}`;
}

export function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={siWhatsapp.path} />
    </svg>
  );
}

/**
 * Telefone do comércio.
 *
 * `solid` (padrão) é o verde do WhatsApp preenchido: usado na página de Leads,
 * onde falar com o dono É a ação da tela. `quiet` é o mesmo atalho em contorno,
 * com só o ícone no verde da marca do WhatsApp: usado no card da busca, onde a
 * ação que a tela quer é "Gerar site" e dois pills preenchidos no mesmo card
 * disputariam o olho. O hover preenche, então a afordância continua visível.
 */
export function WhatsAppLink({
  phone,
  className = "",
  onOpen,
  tone = "solid",
}: {
  phone: string;
  className?: string;
  onOpen?: () => void;
  tone?: "solid" | "quiet";
}) {
  const quiet = tone === "quiet";
  return (
    <a
      href={whatsappUrl(phone)}
      target="_blank"
      rel="noreferrer"
      onClick={onOpen}
      aria-label={`Abrir conversa no WhatsApp com ${phone}`}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.84rem] font-semibold tabular transition-[background-color,border-color,transform] duration-200 active:scale-[0.97] ${
        quiet
          ? "border border-line-strong bg-surface text-ink hover:border-whatsapp/70 hover:bg-whatsapp/12"
          : "bg-whatsapp text-[#05361a] hover:bg-[#1fc05b]"
      } ${className}`}
    >
      <WhatsAppIcon className={`size-4 shrink-0 ${quiet ? "text-whatsapp-ink" : ""}`} />
      {phone}
    </a>
  );
}
