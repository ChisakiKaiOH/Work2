import { describe, expect, it } from "vitest";
import type { ReleasedGame, RivalCompany } from "../types";
import { runAwardCeremony, playerWonCategory, playerWins } from "./awards";
import { createRivalCompany } from "./companies";

function makeGame(overrides: Partial<ReleasedGame> = {}): ReleasedGame {
  return {
    id: "g1",
    name: "Masterpiece",
    genre: "RPG",
    platforms: ["PC"],
    size: "AAA",
    theme: "Fantasy",
    quality: { gameplay: 95, technology: 90, graphics: 92, sound: 88, story: 98 },
    qualityScore: 95,
    bugs: 0,
    hype: 90,
    price: 60,
    releaseMonth: 1,
    criticScore: 9.8,
    reviews: [],
    pros: [],
    cons: [],
    salesHistory: [],
    totalUnitsSold: 5_000_000,
    totalRevenue: 200_000_000,
    status: "active",
    marketingBudgetThisMonth: 0,
    dlcCount: 0,
    portedPlatforms: [],
    hasSequel: false,
    onSaleDiscount: 0,
    ...overrides,
  };
}

describe("awards (Global Game Awards)", () => {
  it("a clearly superior game wins Game of the Year against weak rivals", () => {
    const masterpiece = makeGame();
    const weakRival: RivalCompany = {
      ...createRivalCompany(1),
      games: [
        {
          id: "r1",
          name: "Mediocre Quest",
          genre: "RPG",
          theme: "Fantasy",
          platform: "PC",
          topAxis: "gameplay",
          budgetTier: "Indie",
          qualityScore: 20,
          criticScore: 3,
          releaseMonth: 1,
          unitsSold: 1000,
        },
      ],
    };
    const ceremony = runAwardCeremony(13, 1, "My Studio", [masterpiece], [weakRival]);
    expect(playerWonCategory(ceremony, "GameOfTheYear")).toBe(true);
    expect(playerWonCategory(ceremony, "BestRPG")).toBe(true);
    expect(playerWins(ceremony).length).toBeGreaterThan(0);
  });

  it("only considers games released in the last 12 months", () => {
    const oldGame = makeGame({ releaseMonth: 1 });
    const ceremony = runAwardCeremony(30, 2, "My Studio", [oldGame], []);
    const goty = ceremony.categories.find((c) => c.categoryId === "GameOfTheYear");
    expect(goty?.nominees.some((n) => n.releasedGameId === oldGame.id)).toBe(false);
  });

  it("ineligible genres are excluded from genre-specific categories", () => {
    const puzzleGame = makeGame({ genre: "Puzzle", id: "p1" });
    const ceremony = runAwardCeremony(13, 1, "My Studio", [puzzleGame], []);
    const bestRPG = ceremony.categories.find((c) => c.categoryId === "BestRPG");
    expect(bestRPG?.nominees.some((n) => n.releasedGameId === "p1")).toBe(false);
  });

  it("BestMobile only nominates games released on Mobile", () => {
    const mobileGame = makeGame({ platforms: ["Mobile"], id: "m1" });
    const pcGame = makeGame({ platforms: ["PC"], id: "pc1" });
    const ceremony = runAwardCeremony(13, 1, "My Studio", [mobileGame, pcGame], []);
    const bestMobile = ceremony.categories.find((c) => c.categoryId === "BestMobile");
    expect(bestMobile?.nominees.some((n) => n.releasedGameId === "m1")).toBe(true);
    expect(bestMobile?.nominees.some((n) => n.releasedGameId === "pc1")).toBe(false);
  });
});
