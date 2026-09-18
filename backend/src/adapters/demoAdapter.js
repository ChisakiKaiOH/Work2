// Adapter demo: genera metriche e post plausibili senza bisogno di chiavi API.
// Usato come fallback per qualunque piattaforma quando le credenziali reali non sono configurate.

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

export async function fetchMetrics(account) {
  const rand = seededRandom(hashString(`${account.platform}:${account.handle}:${new Date().toDateString()}`));
  const base = 500 + Math.floor(rand() * 50000);
  const drift = Math.floor((rand() - 0.4) * base * 0.02);
  return {
    followers: Math.max(0, base + drift),
    following: Math.floor(base * 0.05),
    posts_count: Math.floor(100 + rand() * 900),
    engagement_rate: Number((1 + rand() * 6).toFixed(2)),
  };
}

const SAMPLE_TEXTS = [
  'Ecco l\'ultimo aggiornamento sul progetto!',
  'Grazie a tutti per il supporto questa settimana.',
  'Nuovo contenuto disponibile ora, fatemi sapere cosa ne pensate.',
  'Dietro le quinte di oggi.',
  'Sondaggio: qual e\' il vostro argomento preferito?',
];

export async function fetchRecentPosts(account, limit = 5) {
  const rand = seededRandom(hashString(`${account.platform}:${account.handle}:posts`));
  const posts = [];
  for (let i = 0; i < limit; i++) {
    const daysAgo = i * (1 + Math.floor(rand() * 2));
    const publishedAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    posts.push({
      external_id: `demo-${hashString(account.handle)}-${i}`,
      content: SAMPLE_TEXTS[Math.floor(rand() * SAMPLE_TEXTS.length)],
      url: null,
      likes: Math.floor(rand() * 2000),
      comments: Math.floor(rand() * 200),
      shares: Math.floor(rand() * 100),
      published_at: publishedAt,
    });
  }
  return posts;
}
