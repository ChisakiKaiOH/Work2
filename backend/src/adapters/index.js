import * as demo from './demoAdapter.js';
import * as twitter from './twitterAdapter.js';
import * as instagram from './instagramAdapter.js';
import * as youtube from './youtubeAdapter.js';
import * as facebook from './facebookAdapter.js';
import * as tiktok from './tiktokAdapter.js';

export const PLATFORMS = ['twitter', 'instagram', 'youtube', 'facebook', 'tiktok'];

const REAL_ADAPTERS = {
  twitter,
  instagram,
  youtube,
  facebook,
  tiktok,
};

export function isPlatformLive(platform) {
  return Boolean(REAL_ADAPTERS[platform]?.isConfigured?.());
}

async function withFallback(account, method) {
  const real = REAL_ADAPTERS[account.platform];
  if (real?.isConfigured?.()) {
    try {
      const result = await real[method](account);
      if (result !== null && result !== undefined) return { data: result, source: 'live' };
    } catch (err) {
      console.error(`[adapter:${account.platform}] ${method} failed, falling back to demo:`, err.message);
    }
  }
  const data = await demo[method](account);
  return { data, source: 'demo' };
}

export async function fetchMetrics(account) {
  return withFallback(account, 'fetchMetrics');
}

export async function fetchRecentPosts(account, limit = 5) {
  const real = REAL_ADAPTERS[account.platform];
  if (real?.isConfigured?.()) {
    try {
      const result = await real.fetchRecentPosts(account, limit);
      if (result !== null && result !== undefined) return { data: result, source: 'live' };
    } catch (err) {
      console.error(`[adapter:${account.platform}] fetchRecentPosts failed, falling back to demo:`, err.message);
    }
  }
  const data = await demo.fetchRecentPosts(account, limit);
  return { data, source: 'demo' };
}
