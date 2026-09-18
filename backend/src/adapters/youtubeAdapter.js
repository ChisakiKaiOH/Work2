// Adapter per YouTube Data API v3 (https://developers.google.com/youtube/v3).
// Richiede YOUTUBE_API_KEY. account.handle e' il channel ID (UC...) oppure @handle.

const API_BASE = 'https://www.googleapis.com/youtube/v3';

export function isConfigured() {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

async function apiGet(pathname, params = {}) {
  const url = new URL(`${API_BASE}${pathname}`);
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`YouTube API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function channelParam(handle) {
  return handle.startsWith('UC') ? { id: handle } : { forHandle: handle.replace(/^@/, '@') };
}

export async function fetchMetrics(account) {
  if (!isConfigured()) return null;
  const data = await apiGet('/channels', {
    part: 'statistics',
    ...channelParam(account.handle),
  });
  const stats = data.items?.[0]?.statistics;
  if (!stats) return null;
  return {
    followers: Number(stats.subscriberCount ?? 0),
    following: null,
    posts_count: Number(stats.videoCount ?? 0),
    engagement_rate: null,
  };
}

export async function fetchRecentPosts(account, limit = 5) {
  if (!isConfigured()) return null;
  const channelData = await apiGet('/channels', {
    part: 'contentDetails',
    ...channelParam(account.handle),
  });
  const uploadsPlaylist = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylist) return [];
  const items = await apiGet('/playlistItems', {
    part: 'snippet',
    playlistId: uploadsPlaylist,
    maxResults: String(limit),
  });
  return (items.items ?? []).map((v) => ({
    external_id: v.snippet.resourceId.videoId,
    content: v.snippet.title,
    url: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
    likes: 0,
    comments: 0,
    shares: 0,
    published_at: v.snippet.publishedAt ?? null,
  }));
}
