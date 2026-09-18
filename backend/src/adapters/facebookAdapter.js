// Adapter per Facebook Graph API (https://developers.facebook.com/docs/graph-api).
// Richiede FACEBOOK_ACCESS_TOKEN con permessi sulla Pagina. account.handle e' il Page ID.

const API_BASE = 'https://graph.facebook.com/v19.0';

export function isConfigured() {
  return Boolean(process.env.FACEBOOK_ACCESS_TOKEN);
}

async function apiGet(pathname, params = {}) {
  const url = new URL(`${API_BASE}${pathname}`);
  url.searchParams.set('access_token', process.env.FACEBOOK_ACCESS_TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Facebook API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchMetrics(account) {
  if (!isConfigured()) return null;
  const data = await apiGet(`/${account.handle}`, {
    fields: 'fan_count,followers_count',
  });
  return {
    followers: data.followers_count ?? data.fan_count ?? null,
    following: null,
    posts_count: null,
    engagement_rate: null,
  };
}

export async function fetchRecentPosts(account, limit = 5) {
  if (!isConfigured()) return null;
  const data = await apiGet(`/${account.handle}/posts`, {
    fields: 'id,message,permalink_url,created_time,likes.summary(true),comments.summary(true),shares',
    limit: String(limit),
  });
  return (data.data ?? []).map((p) => ({
    external_id: p.id,
    content: p.message ?? '',
    url: p.permalink_url ?? null,
    likes: p.likes?.summary?.total_count ?? 0,
    comments: p.comments?.summary?.total_count ?? 0,
    shares: p.shares?.count ?? 0,
    published_at: p.created_time ?? null,
  }));
}
