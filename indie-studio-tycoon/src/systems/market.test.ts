import { describe, expect, it } from "vitest";
import type { Genre } from "../types";
import { GENRES } from "../data/genres";
import { rollYearlyTrend } from "./market";

function flatPopularity(value = 50): Record<Genre, number> {
  return Object.fromEntries(GENRES.map((g) => [g, value])) as Record<Genre, number>;
}

describe("market trends", () => {
  it("rolls exactly 2 rising and 2 declining genres, moving popularity accordingly", () => {
    const base = flatPopularity(50);
    const { trend, genrePopularity } = rollYearlyTrend(base, 2);
    expect(trend.risingGenres).toHaveLength(2);
    expect(trend.decliningGenres).toHaveLength(2);
    for (const g of trend.risingGenres) expect(genrePopularity[g]).toBeGreaterThan(base[g]);
    for (const g of trend.decliningGenres) expect(genrePopularity[g]).toBeLessThan(base[g]);
  });

  it("rising and declining genre sets never overlap", () => {
    const { trend } = rollYearlyTrend(flatPopularity(), 1);
    const overlap = trend.risingGenres.filter((g) => trend.decliningGenres.includes(g));
    expect(overlap).toHaveLength(0);
  });

  it("clamps popularity within 0-100", () => {
    const extreme = flatPopularity(95);
    const { genrePopularity } = rollYearlyTrend(extreme, 1);
    for (const value of Object.values(genrePopularity)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});
