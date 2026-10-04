import { useMemo } from "react";
import { hashStringToSeed, seededRandom } from "../utils/random";

const SHAPES = ["circle", "hex", "diamond", "shield"] as const;

function initialsFor(name: string): string {
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Logo aziendale procedurale: stesso seme (es. l'id dell'azienda) → sempre lo stesso logo. */
export default function CompanyLogo({ seed, name, size = 48 }: { seed: string | number; name: string; size?: number }) {
  const numericSeed = typeof seed === "number" ? seed : hashStringToSeed(seed);
  const { shape, hue, hue2, initials } = useMemo(() => {
    const rng = seededRandom(numericSeed);
    const hueBase = Math.floor(rng() * 360);
    return {
      shape: SHAPES[Math.floor(rng() * SHAPES.length)],
      hue: hueBase,
      hue2: (hueBase + 40 + Math.floor(rng() * 60)) % 360,
      initials: initialsFor(name),
    };
  }, [numericSeed, name]);

  const fillId = `logo-grad-${numericSeed}`;
  const c1 = `hsl(${hue}, 70%, 55%)`;
  const c2 = `hsl(${hue2}, 75%, 45%)`;

  const shapePath: Record<(typeof SHAPES)[number], string> = {
    circle: "",
    hex: "M50 2 L93 26 L93 74 L50 98 L7 74 L7 26 Z",
    diamond: "M50 2 L98 50 L50 98 L2 50 Z",
    shield: "M50 2 L92 16 L92 52 C92 78 74 94 50 98 C26 94 8 78 8 52 L8 16 Z",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Logo di ${name}`}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      {shape === "circle" ? (
        <circle cx="50" cy="50" r="48" fill={`url(#${fillId})`} />
      ) : (
        <path d={shapePath[shape]} fill={`url(#${fillId})`} />
      )}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="34"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        fill="rgba(255,255,255,0.92)"
      >
        {initials}
      </text>
    </svg>
  );
}
