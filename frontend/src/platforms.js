export const PLATFORM_META = {
  twitter: { label: 'X / Twitter', color: 'var(--series-1)' },
  instagram: { label: 'Instagram', color: 'var(--series-2)' },
  youtube: { label: 'YouTube', color: 'var(--series-3)' },
  facebook: { label: 'Facebook', color: 'var(--series-4)' },
  tiktok: { label: 'TikTok', color: 'var(--series-5)' },
};

export function platformLabel(platform) {
  return PLATFORM_META[platform]?.label ?? platform;
}

export function platformColor(platform) {
  return PLATFORM_META[platform]?.color ?? 'var(--text-muted)';
}

export function formatNumber(n) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('it-IT').format(n);
}
