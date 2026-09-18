// TikTok non espone una API pubblica di sola lettura per metriche di un account arbitrario
// (la Display API richiede che l'utente autorizzi l'app sul proprio account).
// Questo adapter resta come placeholder: ritorna sempre null cosi' il sistema
// ricade sull'adapter demo, finche' non si integra un provider ufficiale o terzo.

export function isConfigured() {
  return false;
}

export async function fetchMetrics() {
  return null;
}

export async function fetchRecentPosts() {
  return null;
}
