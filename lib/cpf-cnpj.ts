// Mesma conferência do backend (backend/src/lib/cpf-cnpj.ts), pra avisar na
// hora que o número está errado. Quem decide continua sendo o servidor.

export function cleanDocument(value: string) {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function isCpf(doc: string) {
  if (!/^\d{11}$/.test(doc) || /^(\d)\1{10}$/.test(doc)) return false;
  const digits = [...doc].map(Number);
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += digits[i]! * (size + 1 - i);
    if (((sum * 10) % 11) % 10 !== digits[size]) return false;
  }
  return true;
}

function isCnpj(doc: string) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(doc) || /^(\d)\1{13}$/.test(doc)) return false;
  const values = [...doc].map((c) => c.charCodeAt(0) - 48);
  for (const size of [12, 13]) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += values[i]! * (((size - 1 - i) % 8) + 2);
    const rest = sum % 11;
    if ((rest < 2 ? 0 : 11 - rest) !== values[size]) return false;
  }
  return true;
}

export function isValidDocument(value: string) {
  const doc = cleanDocument(value);
  return isCpf(doc) || isCnpj(doc);
}

/** Máscara enquanto digita: 000.000.000-00 até 11 caracteres, 00.000.000/0000-00 depois. */
export function formatDocument(value: string) {
  const doc = cleanDocument(value).slice(0, 14);
  if (doc.length <= 11) {
    return doc.replace(/^(\w{3})(\w)/, "$1.$2").replace(/^(\w{3})\.(\w{3})(\w)/, "$1.$2.$3").replace(/\.(\w{3})(\w{1,2})$/, ".$1-$2");
  }
  return doc
    .replace(/^(\w{2})(\w)/, "$1.$2")
    .replace(/^(\w{2})\.(\w{3})(\w)/, "$1.$2.$3")
    .replace(/\.(\w{3})(\w)/, ".$1/$2")
    .replace(/(\w{4})(\w{1,2})$/, "$1-$2");
}
