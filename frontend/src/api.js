// In esecuzione normale (browser, PWA, Electron) frontend e backend condividono
// la stessa origine, quindi basta '/api'. In un guscio nativo (es. Capacitor su
// Android) la pagina viene caricata da un'origine locale del dispositivo mentre
// il backend gira altrove sulla rete: in quel caso si imposta VITE_API_BASE in
// fase di build (es. "http://192.168.1.50:4317/api") per puntare al PC che lo ospita.
const BASE = import.meta.env.VITE_API_BASE || '/api';

// Se il backend e' esposto pubblicamente (vedi backend/src/index.js,
// requireApiKey) con SHIE_API_KEY impostata, questa build deve conoscere lo
// stesso valore per poter chiamare l'API: si passa in fase di build come
// VITE_API_KEY, esattamente come VITE_API_BASE.
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (API_KEY) headers['X-Api-Key'] = API_KEY;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
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
