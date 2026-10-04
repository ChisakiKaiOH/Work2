import { useMemo } from "react";
import { hashStringToSeed, seededRandom } from "../utils/random";

const BODY_SHAPES = ["blob", "egg", "star"] as const;
const ACCESSORIES = ["none", "antenna", "ears", "horn"] as const;

/** Mascotte procedurale e originale per uno studio: stesso seme → stessa mascotte. */
export default function Mascot({ seed, size = 72 }: { seed: string | number; size?: number }) {
  const numericSeed = typeof seed === "number" ? seed : hashStringToSeed(seed);
  const traits = useMemo(() => {
    const rng = seededRandom(numericSeed);
    const hue = Math.floor(rng() * 360);
    return {
      bodyShape: BODY_SHAPES[Math.floor(rng() * BODY_SHAPES.length)],
      accessory: ACCESSORIES[Math.floor(rng() * ACCESSORIES.length)],
      hue,
      eyeGap: 10 + Math.floor(rng() * 8),
      smile: rng() > 0.3,
      spots: rng() > 0.5,
    };
  }, [numericSeed]);

  const bodyColor = `hsl(${traits.hue}, 65%, 60%)`;
  const darkColor = `hsl(${traits.hue}, 55%, 40%)`;

  const bodyPath: Record<(typeof BODY_SHAPES)[number], string> = {
    blob: "M50 8 C78 8 92 30 90 55 C88 80 68 94 50 94 C32 94 12 80 10 55 C8 30 22 8 50 8 Z",
    egg: "M50 6 C72 6 86 34 86 58 C86 82 70 96 50 96 C30 96 14 82 14 58 C14 34 28 6 50 6 Z",
    star: "M50 4 L62 36 L96 36 L68 56 L78 92 L50 70 L22 92 L32 56 L4 36 L38 36 Z",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Mascotte dello studio">
      <path d={bodyPath[traits.bodyShape]} fill={bodyColor} stroke={darkColor} strokeWidth={2} />
      {traits.spots && (
        <>
          <circle cx="28" cy="70" r="5" fill={darkColor} opacity={0.5} />
          <circle cx="70" cy="68" r="4" fill={darkColor} opacity={0.5} />
        </>
      )}
      {traits.accessory === "antenna" && <line x1="50" y1="8" x2="50" y2="-4" stroke={darkColor} strokeWidth={3} />}
      {traits.accessory === "antenna" && <circle cx="50" cy="-6" r="4" fill={darkColor} />}
      {traits.accessory === "ears" && (
        <>
          <circle cx="24" cy="18" r="9" fill={bodyColor} stroke={darkColor} strokeWidth={2} />
          <circle cx="76" cy="18" r="9" fill={bodyColor} stroke={darkColor} strokeWidth={2} />
        </>
      )}
      {traits.accessory === "horn" && <path d="M50 10 L44 -6 L56 -6 Z" fill={darkColor} />}
      <circle cx={50 - traits.eyeGap} cy="48" r="7" fill="#1b1b22" />
      <circle cx={50 + traits.eyeGap} cy="48" r="7" fill="#1b1b22" />
      <circle cx={50 - traits.eyeGap + 2} cy="46" r="2" fill="#fff" />
      <circle cx={50 + traits.eyeGap + 2} cy="46" r="2" fill="#fff" />
      {traits.smile ? (
        <path d="M40 62 Q50 72 60 62" stroke="#1b1b22" strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : (
        <ellipse cx="50" cy="64" rx="6" ry="4" fill="#1b1b22" />
      )}
    </svg>
  );
}
