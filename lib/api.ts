// Endereço do backend (pagefy-app/backend). É ele que conversa com o Google
// Places; o frontend só chama estas rotas.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

/**
 * Chamada ao backend levando o cookie de sessão. Sem `credentials: "include"`
 * o navegador não manda o cookie pra outra origem (o site e a API rodam em
 * portas/subdomínios diferentes), e o backend não sabe quem está pedindo.
 */
export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
}

/** Mesma coisa, com corpo JSON. */
export function apiPost(path: string, body: unknown, init: RequestInit = {}) {
  return apiFetch(path, {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(body),
  });
}
