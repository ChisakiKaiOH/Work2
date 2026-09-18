// In esecuzione normale (browser, PWA, Electron) frontend e backend condividono
// la stessa origine, quindi basta '/api'. In un guscio nativo (es. Capacitor su
// Android) la pagina viene caricata da un'origine locale del dispositivo mentre
// il backend gira altrove sulla rete: in quel caso si imposta VITE_API_BASE in
// fase di build (es. "http://192.168.1.50:4317/api") per puntare al PC che lo ospita.
const BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Errore ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getPlatforms: () => request('/accounts/platforms'),
  getAccounts: () => request('/accounts'),
  addAccount: (payload) => request('/accounts', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  refreshAccount: (id) => request(`/accounts/${id}/refresh`, { method: 'POST' }),
  getSnapshots: (id) => request(`/accounts/${id}/snapshots`),
  getPosts: (id) => request(`/accounts/${id}/posts`),
  getOverview: () => request('/overview'),
};
