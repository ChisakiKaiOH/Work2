import { prTier, type PrTier } from '../services/performanceRating';

const TIER_COLOR: Record<PrTier, string> = {
  Rookie: '#9aa0ac',
  Street: '#4fd17a',
  Sport: '#4d8dff',
  Super: '#b06bff',
  Hyper: '#ffb02e',
  Legend: '#ff4d6d',
};

export default function PRBadge({ pr }: { pr: number }) {
  const tier = prTier(pr);
  const color = TIER_COLOR[tier];
  return (
    <span className="badge pr-badge" style={{ background: `${color}26`, color, borderColor: `${color}55` }}>
      PR {pr} · {tier}
    </span>
  );
}
