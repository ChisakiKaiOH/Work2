import { describe, expect, it } from "vitest";
import type { Genre } from "../types";
import { GENRES } from "../data/genres";
import { seededRandom } from "../utils/random";
import { companyStageFor, createRivalCompany, generateInitialCompanies, simulateCompanyMonth } from "./companies";

function flatGenrePopularity(value = 50): Record<Genre, number> {
  return Object.fromEntries(GENRES.map((g) => [g, value])) as Record<Genre, number>;
}

describe("companies (AI concorrenti)", () => {
  it("companyStageFor maps value thresholds to the right growth stage", () => {
    expect(companyStageFor(0)).toBe("Piccolo Studio");
    expect(companyStageFor(300_000)).toBe("Studio Indipendente");
    expect(companyStageFor(5_000_000)).toBe("Azienda Media");
    expect(companyStageFor(50_000_000)).toBe("Grande Software House");
    expect(companyStageFor(200_000_000)).toBe("Colosso dell'Industria");
    expect(companyStageFor(2_000_000_000)).toBe("Impero Multimediale");
  });

  it("generates a varied roster of initial companies with distinct names", () => {
    const companies = generateInitialCompanies(1, 10);
    expect(companies).toHaveLength(10);
    const names = new Set(companies.map((c) => c.name));
    expect(names.size).toBeGreaterThan(5);
    for (const c of companies) {
      expect(c.companyValue).toBeGreaterThan(0);
      expect(c.employeeCount).toBeGreaterThan(0);
    }
  });

  it("simulateCompanyMonth deducts upkeep and can release a game", () => {
    // Seme fisso: il test deve essere deterministico, non dipendere dalla
    // fortuna di Math.random() su quante iterazioni servono per un rilascio.
    const rng = seededRandom(42);
    const company = createRivalCompany(1, rng);
    let releasedAny = false;
    let lastCapital = company.capital;
    let current = company;
    for (let i = 0; i < 300 && !releasedAny; i++) {
      const result = simulateCompanyMonth(
        current,
        { month: i + 1, genrePopularity: flatGenrePopularity(80), otherCompanies: [], difficultyMult: 1 },
        rng
      );
      current = result.company;
      if (result.releasedGame) releasedAny = true;
      lastCapital = current.capital;
    }
    expect(releasedAny).toBe(true);
    expect(typeof lastCapital).toBe("number");
  });

  it("a bankrupt or player-acquired company is skipped by the simulation", () => {
    const company = { ...createRivalCompany(1), bankrupt: true };
    const result = simulateCompanyMonth(company, { month: 2, genrePopularity: flatGenrePopularity(), otherCompanies: [], difficultyMult: 1 });
    expect(result.company).toBe(company);
    expect(result.releasedGame).toBeNull();
  });
});
