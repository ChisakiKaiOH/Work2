// Adapter per Instagram tramite Graph API (richiede account Business/Creator
// collegato a una Pagina Facebook). Vedi https://developers.facebook.com/docs/instagram-api
// Richiede INSTAGRAM_ACCESS_TOKEN. account.handle deve essere l'IG User ID numerico
// (l'API Graph non permette lookup diretto per username altrui).

const API_BASE = 'https://graph.facebook.com/v19.0';

export function isConfigured() {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN);
}

async function apiGet(pathname, params = {}) {
  const url = new URL(`${API_BASE}${pathname}`);
  url.searchParams.set('access_token', process.env.INSTAGRAM_ACCESS_TOKEN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Instagram API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchMetrics(account) {
  if (!isConfigured()) return null;
  const data = await apiGet(`/${account.handle}`, {
    fields: 'followers_count,follows_count,media_count',
  });
  return {
    followers: data.followers_count ?? null,
    following: data.follows_count ?? null,
    posts_count: data.media_count ?? null,
    engagement_rate: null,
  };
}

export async function fetchRecentPosts(account, limit = 5) {
  if (!isConfigured()) return null;
  const data = await apiGet(`/${account.handle}/media`, {
    fields: 'id,caption,permalink,like_count,comments_count,timestamp',
    limit: String(limit),
  });
  return (data.data ?? []).map((m) => ({
    external_id: m.id,
    content: m.caption ?? '',
    url: m.permalink ?? null,
    likes: m.like_count ?? 0,
    comments: m.comments_count ?? 0,
    shares: 0,
    published_at: m.timestamp ?? null,
  }));
}
