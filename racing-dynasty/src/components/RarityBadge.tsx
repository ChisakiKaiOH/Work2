import type { Rarity } from '../types';

const RARITY_COLOR: Record<Rarity, string> = {
  Common: '#9aa0ac',
  Uncommon: '#4fd17a',
  Rare: '#4d8dff',
  Epic: '#b06bff',
  Legendary: '#ffb02e',
  Iconic: '#ff4d6d',
};

export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span className="badge" style={{ background: `${RARITY_COLOR[rarity]}26`, color: RARITY_COLOR[rarity], borderColor: `${RARITY_COLOR[rarity]}55` }}>
      {rarity}
    </span>
  );
}

export { RARITY_COLOR };
