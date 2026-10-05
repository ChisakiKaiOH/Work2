import type { CarSilhouette } from '../types';

interface CarArtProps {
  silhouette: CarSilhouette;
  colorPrimary: string;
  colorSecondary: string;
  size?: number;
  className?: string;
}

/**
 * Fully procedural SVG car silhouette — no downloaded or copyrighted art.
 * Each CarSilhouette maps to a distinct invented body-shape path so cars read
 * as visually different at a glance even before stats/rarity are shown.
 */
function bodyPath(shape: CarSilhouette): string {
  switch (shape) {
    case 'hypercar':
      return 'M2 62 L14 50 Q30 34 56 32 L104 32 Q128 34 142 50 L154 62 L150 70 L132 72 Q128 80 116 80 Q104 80 100 72 L56 72 Q52 80 40 80 Q28 80 24 72 L6 70 Z';
    case 'prototype':
      return 'M0 60 L10 44 Q40 30 78 30 Q116 30 142 44 L156 58 L156 68 L140 70 Q136 80 122 80 Q110 80 106 70 L50 70 Q46 80 34 80 Q20 80 16 70 L0 68 Z';
    case 'roadster':
      return 'M4 64 L18 52 Q34 40 60 40 L88 36 Q112 36 128 48 L148 60 L148 70 L130 72 Q126 80 114 80 Q102 80 98 72 L58 72 Q54 80 42 80 Q30 80 26 72 L4 70 Z';
    case 'suv-coupe':
      return 'M2 66 L10 44 Q16 30 34 30 L122 30 Q140 30 146 44 L154 66 L154 74 L134 76 Q130 84 118 84 Q106 84 102 76 L52 76 Q48 84 36 84 Q24 84 20 76 L2 74 Z';
    case 'classic':
      return 'M4 62 L16 48 Q26 38 46 38 L108 38 Q124 38 134 48 L150 62 L150 70 L132 72 Q128 80 116 80 Q104 80 100 72 L56 72 Q52 80 40 80 Q28 80 24 72 L4 70 Z';
    case 'coupe':
    default:
      return 'M4 64 L16 48 Q28 36 52 34 L104 34 Q124 36 138 48 L152 64 L152 72 L134 74 Q130 82 118 82 Q106 82 102 74 L54 74 Q50 82 38 82 Q26 82 22 74 L4 72 Z';
  }
}

export default function CarArt({ silhouette, colorPrimary, colorSecondary, size = 96, className }: CarArtProps) {
  const path = bodyPath(silhouette);
  const wheelY = silhouette === 'suv-coupe' ? 82 : silhouette === 'hypercar' || silhouette === 'prototype' ? 78 : 80;
  return (
    <svg
      viewBox="0 0 156 100"
      width={size}
      height={Math.round(size * (100 / 156))}
      className={className}
      role="img"
      aria-label={`Silhouette ${silhouette}`}
    >
      <ellipse cx="78" cy="88" rx="64" ry="7" fill="#000" opacity="0.28" />
      <path d={path} fill={colorPrimary} stroke="#000" strokeOpacity="0.25" strokeWidth="1.5" />
      <path
        d="M30 46 Q50 36 78 36 Q106 36 126 46 L120 56 Q100 48 78 48 Q56 48 36 56 Z"
        fill={colorSecondary}
        opacity="0.9"
      />
      <circle cx="40" cy={wheelY} r="11" fill="#111" />
      <circle cx="40" cy={wheelY} r="5" fill="#555" />
      <circle cx="116" cy={wheelY} r="11" fill="#111" />
      <circle cx="116" cy={wheelY} r="5" fill="#555" />
      <rect x="18" y="58" width="8" height="4" rx="2" fill="#ffd166" opacity="0.9" />
      <rect x="130" y="58" width="8" height="4" rx="2" fill="#ff4d4d" opacity="0.9" />
    </svg>
  );
}
