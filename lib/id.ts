export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Isola `Date.now()` num helper porque o eslint (react-compiler) marca uma
 * chamada direta a uma função impura dentro do corpo de um componente, mesmo
 * quando só roda a partir de um manipulador de evento. */
export function timestamp() {
  return Date.now();
}
