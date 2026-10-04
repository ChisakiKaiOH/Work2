import { useMemo } from "react";
import type { Genre, Theme } from "../types";
import { hashStringToSeed, seededRandom } from "../utils/random";

const GENRE_EMOJI: Record<Genre, string> = {
  Action: "⚔️",
  RPG: "🛡️",
  JRPG: "🔮",
  Adventure: "🗺️",
  Horror: "💀",
  Survival: "🏕️",
  Strategy: "♟️",
  Simulation: "⚙️",
  Racing: "🏎️",
  Sports: "🏆",
  Fighting: "🥊",
  Puzzle: "🧩",
  Platform: "🦘",
  Roguelike: "🎲",
  MMO: "🌐",
  MOBA: "🏹",
  FPS: "🎯",
  RTS: "🏰",
  Tactical: "🧭",
  Sandbox: "🧱",
  VisualNovel: "📖",
  Casual: "🎈",
  Educational: "📚",
};

const THEME_GRADIENT: Record<Theme, [string, string]> = {
  Fantasy: ["#1f4d3c", "#c9a227"],
  "Sci-Fi": ["#0b3d5c", "#2fd6e0"],
  Horror: ["#1a0a0a", "#7a1020"],
  Cyberpunk: ["#1a0b2e", "#ff2fd1"],
  Medieval: ["#3b2a1a", "#c9a227"],
  Modern: ["#2a2d35", "#4d8dff"],
  Futuristic: ["#1a0b3d", "#8457ff"],
  "Post-apocalyptic": ["#2b1a0a", "#d97b3f"],
  Mystery: ["#131326", "#5b4bce"],
  Superhero: ["#2a0a0a", "#4d8dff"],
  Historical: ["#2b2210", "#c9a227"],
  Space: ["#05070f", "#2fd6e0"],
  Military: ["#1f2417", "#6b7a3a"],
  Comedy: ["#3d2b00", "#ffd34d"],
  Noir: ["#0c0c0c", "#8a8a8a"],
  Sports: ["#0c3d1a", "#e3b341"],
};

/** Copertina di gioco generata proceduralmente in stile cartoon/box-art. */
export default function GameCover({
  gameId,
  title,
  genre,
  theme,
  width = 120,
  height = 160,
}: {
  gameId: string;
  title: string;
  genre: Genre;
  theme: Theme;
  width?: number;
  height?: number;
}) {
  const seed = hashStringToSeed(gameId);
  const pattern = useMemo(() => {
    const rng = seededRandom(seed);
    return {
      shapes: Array.from({ length: 5 }, () => ({
        cx: 10 + rng() * 80,
        cy: 10 + rng() * 80,
        r: 4 + rng() * 10,
      })),
    };
  }, [seed]);

  const [c1, c2] = THEME_GRADIENT[theme];
  const gradId = `cover-grad-${seed}`;

  return (
    <div className="game-cover" style={{ width, height }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill={`url(#${gradId})`} />
        {pattern.shapes.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="rgba(255,255,255,0.08)" />
        ))}
      </svg>
      <div className="game-cover-emoji" aria-hidden="true">
        {GENRE_EMOJI[genre]}
      </div>
      <div className="game-cover-title">{title}</div>
    </div>
  );
}
