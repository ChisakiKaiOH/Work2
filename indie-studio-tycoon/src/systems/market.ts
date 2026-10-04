import type { Genre, MarketTrendState } from "../types";
import { GENRES } from "../data/genres";
import { pickMany, randomFloat, type RandomFn, defaultRandom } from "../utils/random";
import { clamp } from "../utils/format";

export interface YearlyTrendResult {
  trend: MarketTrendState;
  genrePopularity: Record<Genre, number>;
}

// Generato una volta all'anno (ogni 12 mesi): sposta la popolarità di alcuni
// generi, con conseguenze reali su potenziale commerciale e vendite dei
// giochi di quei generi (vedi projectFactory.ts e companies.ts, che leggono
// entrambi genrePopularity).
export function rollYearlyTrend(
  genrePopularity: Record<Genre, number>,
  year: number,
  rng: RandomFn = defaultRandom
): YearlyTrendResult {
  const risingGenres = pickMany(GENRES, 2, rng);
  const remaining = GENRES.filter((g) => !risingGenres.includes(g));
  const decliningGenres = pickMany(remaining, 2, rng);

  const next = { ...genrePopularity };
  for (const g of risingGenres) next[g] = clamp(next[g] + randomFloat(12, 28, rng), 0, 100);
  for (const g of decliningGenres) next[g] = clamp(next[g] - randomFloat(10, 22, rng), 0, 100);

  const label = `${risingGenres.join("/")} in crescita · ${decliningGenres.join("/")} in calo`;

  return {
    trend: { year, label, risingGenres, decliningGenres },
    genrePopularity: next,
  };
}
