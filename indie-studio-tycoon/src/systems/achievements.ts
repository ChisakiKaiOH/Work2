import type { GameState } from "../types";
import { ACHIEVEMENTS } from "../data/achievements";
import { TECH_TREE } from "../data/technology";
import { PLATFORMS } from "../data/platformsThemes";
import { playerWonCategory } from "./awards";

type AchievementTest = (state: GameState) => boolean;

const GOTY_WINS_COUNT = (state: GameState): number =>
  state.awardCeremonies.filter((c) => playerWonCategory(c, "GameOfTheYear")).length;

const TESTS: Record<string, AchievementTest> = {
  firstGame: (s) => s.stats.totalGamesReleased >= 1,
  firstProfit: (s) => s.stats.hadPositiveMonth,
  firstHire: (s) => s.employees.length > 2,
  firstTech: (s) => s.research.unlocked.length >= 1,
  firstOfficeUpgrade: (s) => s.officeUpgrades.some((u) => u.level >= 1),
  firstIp: (s) => s.ips.length >= 1,
  firstSequel: (s) => s.ips.some((ip) => ip.entries.some((e) => e.kind === "Sequel")),
  firstSpinOff: (s) => s.ips.some((ip) => ip.entries.some((e) => e.kind === "SpinOff")),
  firstRemaster: (s) => s.ips.some((ip) => ip.entries.some((e) => e.kind === "Remaster")),
  firstRemake: (s) => s.ips.some((ip) => ip.entries.some((e) => e.kind === "Remake")),
  firstMobilePort: (s) => s.releasedGames.some((g) => g.platforms.includes("Mobile")),
  firstVRGame: (s) => s.releasedGames.some((g) => g.platforms.includes("VR")),
  firstFilm: (s) => s.ips.some((ip) => ip.hasFilmOrSeries),
  firstAcquisitionMade: (s) => s.stats.acquisitionsCompleted >= 1,
  firstHostileTakeover: (s) => s.stats.hostileTakeovers >= 1,
  firstPartnership: (s) => s.stats.partnerships >= 1,
  firstIPO: (s) => s.stockMarket.playerIsPublic,
  firstStockBuy: (s) => s.stockMarket.holdings.length > 0,
  firstAward: (s) => s.awardCeremonies.some((c) => c.categories.some((cat) => cat.nominees[0]?.isPlayer)),
  firstGOTY: (s) => GOTY_WINS_COUNT(s) >= 1,
  tripleGOTY: (s) => GOTY_WINS_COUNT(s) >= 3,
  survivedBankruptcyWarning: (s) => s.stats.hadBankruptcyWarning && s.negativeMonthsStreak === 0 && !s.gameOver,
  hundredEmployees: (s) => s.employees.length >= 100,
  thousandEmployees: (s) => s.employees.length >= 1000,
  tenGames: (s) => s.stats.totalGamesReleased >= 10,
  fiftyGames: (s) => s.stats.totalGamesReleased >= 50,
  tenMillionUnits: (s) => s.stats.totalUnitsSold >= 10_000_000,
  hundredMillionUnits: (s) => s.stats.totalUnitsSold >= 100_000_000,
  billionUnits: (s) => s.stats.totalUnitsSold >= 1_000_000_000,
  tenIPs: (s) => s.ips.length >= 10,
  stageIndependent: (s) => s.stage !== "Piccolo Studio",
  stageMedium: (s) => ["Azienda Media", "Grande Software House", "Colosso dell'Industria", "Impero Multimediale"].includes(s.stage),
  stageMajor: (s) => ["Grande Software House", "Colosso dell'Industria", "Impero Multimediale"].includes(s.stage),
  stageGiant: (s) => ["Colosso dell'Industria", "Impero Multimediale"].includes(s.stage),
  stageEmpire: (s) => s.stage === "Impero Multimediale",
  reputation100: (s) => s.reputation >= 100,
  perfectReview: (s) => s.releasedGames.some((g) => g.criticScore >= 10),
  worstGame: (s) => s.releasedGames.some((g) => g.criticScore < 3),
  bestsellerSingleGame: (s) => s.releasedGames.some((g) => g.totalUnitsSold >= 5_000_000),
  allGenresTried: (s) => new Set(s.releasedGames.map((g) => g.genre)).size >= 10,
  allPlatforms: (s) => PLATFORMS.every((p) => s.releasedGames.some((g) => g.platforms.includes(p))),
  firstDLC: (s) => s.releasedGames.some((g) => g.dlcCount >= 1),
  tenDLC: (s) => s.releasedGames.reduce((sum, g) => sum + g.dlcCount, 0) >= 10,
  marketingMogul: (s) => s.stats.totalMarketingSpend >= 500_000,
  researchMaster: (s) => s.research.unlocked.length >= 15,
  fullTechTree: (s) => s.research.unlocked.length >= TECH_TREE.length,
  survivedInsane: (s) => s.difficulty === "Insane" && s.stats.totalGamesReleased >= 1,
  hundredMillionValue: (s) => s.companyValue >= 100_000_000,
  billionaireValue: (s) => s.companyValue >= 1_000_000_000,
  loyalTeam: (s) => s.employees.some((e) => s.month - e.hiredMonth >= 120),
};

export function checkAchievements(state: GameState): string[] {
  const unlocked = new Set(state.achievementsUnlocked);
  const newlyUnlocked: string[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.has(achievement.id)) continue;
    const test = TESTS[achievement.id];
    if (test && test(state)) newlyUnlocked.push(achievement.id);
  }
  return newlyUnlocked;
}
