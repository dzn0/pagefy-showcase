// Cartão digitado no checkout: máscara, bandeira e conferências de formato.
// Só ajuda quem digita; quem aprova ou recusa é o Asaas, pelo backend.

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | "hipercard" | null;

const ELO = /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7][0-9]|9000)|627780|63(6297|6368)|650(03[1-9]|[1-4][0-9]{2}|5[0-2][0-9])|6516(5[2-9]|[6-7][0-9])|6550([0-5][0-9]))/;

export function cardBrand(number: string): CardBrand {
  const n = onlyDigits(number);
  if (ELO.test(n)) return "elo";
  if (/^(606282|3841)/.test(n)) return "hipercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(n)) return "mastercard";
  if (/^4/.test(n)) return "visa";
  return null;
}

export const BRAND_NAME: Record<Exclude<CardBrand, null>, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
};

/** 0000 0000 0000 0000 (Amex: 0000 000000 00000). */
export function formatCardNumber(value: string) {
  const n = onlyDigits(value).slice(0, 19);
  if (cardBrand(n) === "amex") return n.replace(/^(\d{4})(\d{1,6})?(\d{1,5})?/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Algoritmo de Luhn: pega número digitado errado antes de ir pro Asaas. */
export function validCardNumber(value: string) {
  const n = onlyDigits(value);
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** MM/AA enquanto digita. */
export function formatExpiry(value: string) {
  const n = onlyDigits(value).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

/** Validade no futuro (vale até o fim do mês impresso). Devolve mês e ano com 4 dígitos. */
export function parseExpiry(value: string, now = new Date()) {
  const n = onlyDigits(value);
  if (n.length !== 4) return null;
  const month = Number(n.slice(0, 2));
  const year = 2000 + Number(n.slice(2));
  if (month < 1 || month > 12) return null;
  const endOfMonth = new Date(year, month, 1);
  if (endOfMonth <= now || year > now.getFullYear() + 20) return null;
  return { month: n.slice(0, 2), year: String(year) };
}

export function formatPostalCode(value: string) {
  const n = onlyDigits(value).slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
}

export function formatPhone(value: string) {
  const n = onlyDigits(value).slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : "";
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}
