import type { FranchiseEntryKind, IntellectualProperty, ReleasedGame } from "../types";
import { createId } from "../utils/id";
import { clamp } from "../utils/format";

export function ipValueFromGame(game: ReleasedGame): number {
  return Math.round(game.totalRevenue * 0.35 + game.qualityScore * 1500 + game.criticScore * 4000);
}

export function createIpFromGame(game: ReleasedGame, month: number): IntellectualProperty {
  return {
    id: createId("ip"),
    name: game.name,
    genre: game.genre,
    theme: game.theme,
    value: ipValueFromGame(game),
    fanbase: clamp(game.criticScore * 6 + game.hype / 3, 0, 100),
    reputation: clamp(game.criticScore * 10, 0, 100),
    recognizability: clamp(game.criticScore * 4, 0, 60),
    foundedMonth: month,
    entries: [{ kind: "Original", releasedGameId: game.id, month }],
    hasFilmOrSeries: false,
    ownerCompanyId: null,
  };
}

const ENTRY_BONUS: Record<FranchiseEntryKind, { value: number; fanbase: number; recognizability: number }> = {
  Original: { value: 0, fanbase: 0, recognizability: 0 },
  Sequel: { value: 1.25, fanbase: 15, recognizability: 12 },
  SpinOff: { value: 1.1, fanbase: 8, recognizability: 8 },
  DLC: { value: 1.05, fanbase: 4, recognizability: 2 },
  Remake: { value: 1.2, fanbase: 10, recognizability: 10 },
  Remaster: { value: 1.1, fanbase: 6, recognizability: 6 },
  Mobile: { value: 1.08, fanbase: 12, recognizability: 10 },
  Film: { value: 1.6, fanbase: 25, recognizability: 30 },
};

export function addFranchiseEntry(
  ip: IntellectualProperty,
  kind: FranchiseEntryKind,
  releasedGameId: string,
  month: number,
  extraValue = 0
): IntellectualProperty {
  const bonus = ENTRY_BONUS[kind];
  return {
    ...ip,
    value: Math.round(ip.value * bonus.value + extraValue),
    fanbase: clamp(ip.fanbase + bonus.fanbase, 0, 150),
    recognizability: clamp(ip.recognizability + bonus.recognizability, 0, 100),
    hasFilmOrSeries: ip.hasFilmOrSeries || kind === "Film",
    entries: [...ip.entries, { kind, releasedGameId, month }],
  };
}

export type FranchisePotential = "Nessuno" | "Spin-off" | "Remake/Remaster" | "Film o Serie TV";

export function franchisePotential(ip: IntellectualProperty): FranchisePotential {
  if (ip.recognizability >= 70 && ip.fanbase >= 60 && !ip.hasFilmOrSeries) return "Film o Serie TV";
  if (ip.entries.length >= 2 && ip.recognizability >= 30) return "Remake/Remaster";
  if (ip.fanbase >= 25) return "Spin-off";
  return "Nessuno";
}

// Soglia minima di stadio dello studio per poter produrre film/serie TV
// basate su una IP (section 6 delle specifiche).
export const FILM_MIN_STAGE_INDEX = 3; // "Grande Software House"

export const REMASTER_COST = 25_000;
export const REMAKE_COST = 70_000;
export const FILM_COST = 150_000;
