// A chave que abre os números de custo no backend, guardada só neste navegador.
//
// Quem PODE ver a área não se decide mais aqui: vem em `profile.admin`, que o
// servidor calcula (ADMIN_EMAILS). Antes era um NEXT_PUBLIC_ADMIN_EMAILS, e
// isso embutia o e-mail do dono no JavaScript que todo visitante baixa.

const KEY_STORAGE = "pagefy-admin-key";

export function loadAdminKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function saveAdminKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // Sem storage: pede a chave de novo na próxima vez.
  }
}
