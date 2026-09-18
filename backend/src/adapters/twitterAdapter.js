// Adapter per X/Twitter tramite API v2 (https://developer.twitter.com/en/docs/twitter-api).
// Richiede TWITTER_BEARER_TOKEN nel .env. Ritorna null se non configurato,
// cosi' il chiamante puo' ricadere sull'adapter demo.

const API_BASE = 'https://api.twitter.com/2';

export function isConfigured() {
  return Boolean(process.env.TWITTER_BEARER_TOKEN);
}

async function apiGet(pathname) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Twitter API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function fetchMetrics(account) {
  if (!isConfigured()) return null;
  const data = await apiGet(
    `/users/by/username/${encodeURIComponent(account.handle)}?user.fields=public_metrics`
  );
  const metrics = data?.data?.public_metrics;
  if (!metrics) return null;
  return {
    followers: metrics.followers_count ?? null,
    following: metrics.following_count ?? null,
    posts_count: metrics.tweet_count ?? null,
    engagement_rate: null,
  };
}

export async function fetchRecentPosts(account, limit = 5) {
  if (!isConfigured()) return null;
  const user = await apiGet(`/users/by/username/${encodeURIComponent(account.handle)}`);
  const userId = user?.data?.id;
  if (!userId) return [];
  const tweets = await apiGet(
    `/users/${userId}/tweets?max_results=${Math.min(Math.max(limit, 5), 100)}&tweet.fields=public_metrics,created_at`
  );
  return (tweets?.data ?? []).map((t) => ({
    external_id: t.id,
    content: t.text,
    url: `https://x.com/${account.handle}/status/${t.id}`,
    likes: t.public_metrics?.like_count ?? 0,
    comments: t.public_metrics?.reply_count ?? 0,
    shares: t.public_metrics?.retweet_count ?? 0,
    published_at: t.created_at ?? null,
  }));
}
