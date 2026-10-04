import { describe, expect, it } from "vitest";
import type { ReleasedGame } from "../types";
import { launchUnits, monthlySalesStep, retentionFor } from "./sales";

function makeGame(overrides: Partial<ReleasedGame> = {}): ReleasedGame {
  return {
    id: "g1",
    name: "Test Game",
    genre: "Action",
    platforms: ["PC"],
    size: "Small",
    theme: "Fantasy",
    quality: { gameplay: 60, technology: 60, graphics: 60, sound: 60, story: 60 },
    qualityScore: 60,
    bugs: 2,
    hype: 50,
    price: 15,
    releaseMonth: 1,
    criticScore: 7,
    reviews: [],
    pros: [],
    cons: [],
    salesHistory: [],
    totalUnitsSold: 0,
    totalRevenue: 0,
    status: "launch",
    marketingBudgetThisMonth: 0,
    dlcCount: 0,
    portedPlatforms: [],
    hasSequel: false,
    onSaleDiscount: 0,
    ...overrides,
  };
}

describe("sales", () => {
  it("launch demand grows with hype and critic score", () => {
    const low = launchUnits({
      platforms: ["PC"],
      hype: 10,
      criticScore: 4,
      reputation: 50,
      price: 15,
      marketingBoost: 1,
      onlineMultiplayerUnlocked: false,
    });
    const high = launchUnits({
      platforms: ["PC"],
      hype: 90,
      criticScore: 9,
      reputation: 50,
      price: 15,
      marketingBoost: 1,
      onlineMultiplayerUnlocked: false,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("retention increases with critic score and stays within bounds", () => {
    expect(retentionFor(1)).toBeGreaterThanOrEqual(0.35);
    expect(retentionFor(10)).toBeLessThanOrEqual(0.85);
    expect(retentionFor(9)).toBeGreaterThan(retentionFor(2));
  });

  it("produces a launch wave at release month, then decays the following month", () => {
    const game = makeGame();
    const launch = monthlySalesStep(game, 1);
    expect(launch.unitsSold).toBeGreaterThan(0);
    expect(launch.status).toBe("launch");

    const gameAfterLaunch: ReleasedGame = {
      ...game,
      salesHistory: [{ month: 1, unitsSold: launch.unitsSold, revenue: launch.revenue }],
    };
    const nextMonth = monthlySalesStep(gameAfterLaunch, 2);
    expect(nextMonth.unitsSold).toBeLessThan(launch.unitsSold);
  });

  it("a discount increases units sold for that month", () => {
    const game = makeGame({
      salesHistory: [{ month: 1, unitsSold: 200, revenue: 2000 }],
      onSaleDiscount: 0,
    });
    const withoutDiscount = monthlySalesStep(game, 2);
    const withDiscount = monthlySalesStep({ ...game, onSaleDiscount: 0.5 }, 2);
    expect(withDiscount.unitsSold).toBeGreaterThan(withoutDiscount.unitsSold);
  });
});
