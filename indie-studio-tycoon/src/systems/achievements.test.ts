import { describe, expect, it } from "vitest";
import { createNewGameState } from "../game/initialState";
import { checkAchievements } from "./achievements";

describe("achievements", () => {
  it("unlocks 'firstGame' once a game has been released, and only once", () => {
    const state = createNewGameState("Test Studio");
    state.stats.totalGamesReleased = 1;
    const unlocked = checkAchievements(state);
    expect(unlocked).toContain("firstGame");

    state.achievementsUnlocked = unlocked;
    const secondPass = checkAchievements(state);
    expect(secondPass).not.toContain("firstGame");
  });

  it("unlocks stage achievements once the corresponding stage is reached", () => {
    const state = createNewGameState("Test Studio");
    state.stage = "Grande Software House";
    const unlocked = checkAchievements(state);
    expect(unlocked).toContain("stageIndependent");
    expect(unlocked).toContain("stageMedium");
    expect(unlocked).toContain("stageMajor");
    expect(unlocked).not.toContain("stageGiant");
  });

  it("unlocks bestsellerSingleGame only when a game sells enough copies", () => {
    const state = createNewGameState("Test Studio");
    state.releasedGames = [
      {
        id: "g1",
        name: "Hit",
        genre: "Action",
        platforms: ["PC"],
        size: "AAA",
        theme: "Modern",
        quality: { gameplay: 80, technology: 80, graphics: 80, sound: 80, story: 80 },
        qualityScore: 80,
        bugs: 0,
        hype: 50,
        price: 40,
        releaseMonth: 1,
        criticScore: 8,
        reviews: [],
        pros: [],
        cons: [],
        salesHistory: [],
        totalUnitsSold: 6_000_000,
        totalRevenue: 100_000_000,
        status: "active",
        marketingBudgetThisMonth: 0,
        dlcCount: 0,
        portedPlatforms: [],
        hasSequel: false,
        onSaleDiscount: 0,
      },
    ];
    expect(checkAchievements(state)).toContain("bestsellerSingleGame");
  });

  it("does not unlock achievements whose condition is not met", () => {
    const state = createNewGameState("Test Studio");
    const unlocked = checkAchievements(state);
    expect(unlocked).not.toContain("firstGame");
    expect(unlocked).not.toContain("billionaireValue");
  });
});
