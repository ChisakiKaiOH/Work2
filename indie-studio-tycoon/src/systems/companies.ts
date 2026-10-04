import type { BudgetTier, CompanyStage, CompanyStrategy, FictionalPlatform, Genre, Platform, QualityAxis, RivalCompany, RivalGame, Theme } from "../types";
import { COMPANY_STAGES } from "../types";
import { GENRES, idealAllocationFor } from "../data/genres";
import { THEMES } from "../data/platformsThemes";
import { generateCompanyName, generatePersonName, generatePlatformName } from "../utils/nameGenerator";
import { createId } from "../utils/id";
import { clamp } from "../utils/format";
import { chance, pick, randomFloat, randomInt, type RandomFn, defaultRandom } from "../utils/random";

export const COMPANY_STRATEGIES: CompanyStrategy[] = [
  "Aggressive",
  "Innovative",
  "Conservative",
  "IndieFriendly",
  "AAAFocused",
  "MobileFocused",
  "HardwareFocused",
];

// Soglie di valore azienda (euro) che definiscono lo stadio di crescita,
// condivise da giocatore e rivali.
const STAGE_THRESHOLDS: [number, CompanyStage][] = [
  [0, "Piccolo Studio"],
  [250_000, "Studio Indipendente"],
  [2_000_000, "Azienda Media"],
  [20_000_000, "Grande Software House"],
  [150_000_000, "Colosso dell'Industria"],
  [1_000_000_000, "Impero Multimediale"],
];

export const COMPANY_STAGES_INDEX: Record<CompanyStage, number> = Object.fromEntries(
  COMPANY_STAGES.map((stage, index) => [stage, index])
) as Record<CompanyStage, number>;

export function companyStageFor(companyValue: number): CompanyStage {
  let stage: CompanyStage = "Piccolo Studio";
  for (const [threshold, label] of STAGE_THRESHOLDS) {
    if (companyValue >= threshold) stage = label;
  }
  return stage;
}

export function computePlayerCompanyValue(params: {
  money: number;
  totalRevenueAllTime: number;
  ipValueSum: number;
  releasedGamesRevenueSum: number;
  reputation: number;
}): number {
  const base = Math.max(0, params.money);
  const reputationMultiplier = 0.7 + params.reputation / 100;
  return Math.round(
    (base + params.ipValueSum + params.releasedGamesRevenueSum * 0.2 + params.totalRevenueAllTime * 0.08) *
      reputationMultiplier
  );
}

// Tier di partenza per generare un roster di rivali vario fin dall'inizio:
// alcuni piccoli indie, alcuni colossi storici già affermati.
const STARTING_TIERS = [
  { weight: 4, valueRange: [80_000, 400_000] as const, employeeRange: [2, 8] as const },
  { weight: 4, valueRange: [400_000, 3_000_000] as const, employeeRange: [8, 40] as const },
  { weight: 2, valueRange: [3_000_000, 40_000_000] as const, employeeRange: [40, 300] as const },
  { weight: 1, valueRange: [40_000_000, 500_000_000] as const, employeeRange: [300, 3000] as const },
];

function pickStartingTier(rng: RandomFn) {
  const total = STARTING_TIERS.reduce((s, t) => s + t.weight, 0);
  let roll = rng() * total;
  for (const tier of STARTING_TIERS) {
    roll -= tier.weight;
    if (roll <= 0) return tier;
  }
  return STARTING_TIERS[0];
}

export function createRivalCompany(month: number, rng: RandomFn = defaultRandom): RivalCompany {
  const tier = pickStartingTier(rng);
  const companyValue = Math.round(randomFloat(tier.valueRange[0], tier.valueRange[1], rng));
  const employeeCount = randomInt(tier.employeeRange[0], tier.employeeRange[1], rng);
  const foundedMonth = Math.max(1, month - randomInt(12, 360, rng));
  return {
    id: createId("rival"),
    name: generateCompanyName(rng),
    logoSeed: randomInt(1, 1_000_000, rng),
    founder: generatePersonName(rng),
    foundedMonth,
    strategy: pick(COMPANY_STRATEGIES, rng),
    aggressiveness: randomInt(20, 90, rng),
    risk: randomInt(10, 90, rng),
    capital: Math.round(companyValue * randomFloat(0.1, 0.4, rng)),
    companyValue,
    reputation: randomInt(30, 85, rng),
    employeeCount,
    marketShare: 0,
    games: [],
    ipIds: [],
    ownedPlatformIds: [],
    isPublic: companyValue > 20_000_000 && chance(0.6, rng),
    sharePrice: 0,
    sharesOutstanding: 0,
    relationshipWithPlayer: randomInt(-10, 20, rng),
    bankrupt: false,
    acquiredByPlayer: false,
  };
}

export function generateInitialCompanies(month: number, count: number, rng: RandomFn = defaultRandom): RivalCompany[] {
  return Array.from({ length: count }, () => createRivalCompany(month, rng));
}

const STRATEGY_GENRE_BIAS: Partial<Record<CompanyStrategy, Genre[]>> = {
  AAAFocused: ["Action", "RPG", "FPS", "RTS", "MMO"],
  IndieFriendly: ["Puzzle", "Platform", "Roguelike", "VisualNovel", "Adventure"],
  MobileFocused: ["Casual", "Puzzle", "Simulation", "Educational"],
  Innovative: ["Roguelike", "Sandbox", "Tactical", "VisualNovel"],
  HardwareFocused: ["FPS", "Racing", "Sports", "MMO"],
};

function pickRivalGenre(company: RivalCompany, genrePopularity: Record<Genre, number>, rng: RandomFn): Genre {
  const bias = STRATEGY_GENRE_BIAS[company.strategy];
  if (bias && chance(0.55, rng)) return pick(bias, rng);
  // Altrimenti segue il mercato: genere scelto con probabilità proporzionale alla popolarità.
  const weighted = GENRES.map((g) => ({ genre: g, weight: Math.max(1, genrePopularity[g]) }));
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = rng() * total;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.genre;
  }
  return GENRES[0];
}

function budgetFor(company: RivalCompany, rng: RandomFn): number {
  const baseline = clamp(company.capital * randomFloat(0.05, 0.2, rng), 5_000, 300_000);
  const strategyMult = company.strategy === "AAAFocused" ? 2.2 : company.strategy === "IndieFriendly" ? 0.5 : 1;
  return Math.round(baseline * strategyMult);
}

function qualityFor(company: RivalCompany, budget: number, rng: RandomFn): number {
  const skill = clamp(company.reputation * 0.6 + Math.log10(Math.max(1, budget)) * 8, 10, 95);
  const innovationBonus = company.strategy === "Innovative" ? randomFloat(0, 10, rng) : 0;
  const variance = randomFloat(-12, 12, rng);
  return clamp(skill + innovationBonus + variance, 5, 100);
}

function budgetTierFor(budget: number): BudgetTier {
  if (budget < 30_000) return "Indie";
  if (budget < 150_000) return "Mid";
  return "AAA";
}

const AXES: QualityAxis[] = ["gameplay", "technology", "graphics", "sound", "story"];

function topAxisFor(genre: Genre, company: RivalCompany, rng: RandomFn): QualityAxis {
  if (company.strategy === "Innovative" && chance(0.4, rng)) return pick(AXES, rng);
  const ideal = idealAllocationFor(genre);
  return AXES.reduce((best, axis) => (ideal[axis] > ideal[best] ? axis : best), AXES[0]);
}

function platformFor(company: RivalCompany, rng: RandomFn): Platform {
  if (company.strategy === "MobileFocused") return chance(0.75, rng) ? "Mobile" : "PC";
  if (company.strategy === "HardwareFocused" || company.strategy === "AAAFocused") {
    return chance(0.7, rng) ? "Console" : "PC";
  }
  return pick(["PC", "Console", "Mobile"], rng);
}

export interface CompanyTickResult {
  company: RivalCompany;
  releasedGame: RivalGame | null;
  acquiredCompanyId: string | null;
  wentBankrupt: boolean;
}

export function simulateCompanyMonth(
  company: RivalCompany,
  context: { month: number; genrePopularity: Record<Genre, number>; otherCompanies: RivalCompany[]; difficultyMult: number },
  rng: RandomFn = defaultRandom
): CompanyTickResult {
  if (company.bankrupt || company.acquiredByPlayer) {
    return { company, releasedGame: null, acquiredCompanyId: null, wentBankrupt: false };
  }

  let { capital, companyValue, reputation, employeeCount, marketShare } = company;
  let releasedGame: RivalGame | null = null;
  let acquiredCompanyId: string | null = null;

  // Spese fisse mensili (stipendi stimati).
  const upkeep = employeeCount * randomFloat(1500, 2600, rng) * context.difficultyMult;
  capital -= upkeep;

  // Possibilità di pubblicare un nuovo gioco.
  const releaseChance = clamp(0.08 + company.aggressiveness / 400, 0.05, 0.3);
  if (chance(releaseChance, rng)) {
    const genre: Genre = pickRivalGenre(company, context.genrePopularity, rng);
    const theme: Theme = pick(THEMES, rng);
    const budget = budgetFor(company, rng);
    const qualityScore = qualityFor(company, budget, rng);
    const criticScore = clamp(qualityScore / 10 + randomFloat(-0.6, 0.6, rng), 1, 10);
    const reach = 400 + Math.log10(Math.max(2, employeeCount)) * 900;
    const unitsSold = Math.round(reach * (0.4 + qualityScore / 60) * (0.5 + context.genrePopularity[genre] / 120));
    const revenue = Math.round(unitsSold * randomFloat(8, 35, rng) * 0.7);

    capital -= budget;
    capital += revenue;
    companyValue += revenue * 0.15;
    reputation = clamp(reputation + (qualityScore - 50) / 25, 0, 100);

    releasedGame = {
      id: createId("rgame"),
      name: `${company.name} ${pick(["Chronicles", "Project", "Legacy", "Edition", "Saga"], rng)}`,
      genre,
      theme,
      platform: platformFor(company, rng),
      topAxis: topAxisFor(genre, company, rng),
      budgetTier: budgetTierFor(budget),
      qualityScore,
      criticScore,
      releaseMonth: context.month,
      unitsSold,
    };
  }

  // Crescita/declino organico in base alla salute finanziaria.
  const profit = capital - company.capital;
  companyValue = clamp(companyValue + profit * 0.1, 1000, companyValue + Math.max(0, profit));
  if (profit > 0) {
    employeeCount = Math.round(employeeCount * (1 + randomFloat(0, 0.01, rng)));
  } else if (chance(0.15, rng)) {
    employeeCount = Math.max(1, Math.round(employeeCount * 0.97));
  }

  // Rischio di bancarotta per le aziende più piccole quando il capitale resta negativo.
  let wentBankrupt = false;
  if (capital < 0 && companyValue < 500_000 && chance(0.1 + company.risk / 500, rng)) {
    wentBankrupt = true;
  }

  // Acquisizioni tra rivali: solo aziende grandi/aggressive, verso bersagli molto più piccoli.
  if (!wentBankrupt && (company.strategy === "Aggressive" || company.strategy === "AAAFocused") && chance(0.015, rng)) {
    const target = context.otherCompanies.find(
      (c) => !c.bankrupt && !c.acquiredByPlayer && c.id !== company.id && c.companyValue < companyValue * 0.15
    );
    if (target) {
      acquiredCompanyId = target.id;
      capital -= target.companyValue * 0.3;
      companyValue += target.companyValue * 0.5;
      employeeCount += Math.round(target.employeeCount * 0.6);
    }
  }

  marketShare = clamp(marketShare + randomFloat(-0.3, 0.3, rng), 0, 100);

  return {
    company: { ...company, capital, companyValue, reputation, employeeCount, marketShare, bankrupt: wentBankrupt },
    releasedGame,
    acquiredCompanyId,
    wentBankrupt,
  };
}

export function createFictionalPlatform(
  month: number,
  category: Platform,
  ownerCompanyId: string | null,
  rng: RandomFn = defaultRandom
): FictionalPlatform {
  return {
    id: createId("platform"),
    name: generatePlatformName(rng),
    ownerCompanyId,
    category,
    launchMonth: month,
    installedBase: randomFloat(0.5, 3, rng),
    power: randomInt(40, 90, rng),
    royaltyRate: randomFloat(0.2, 0.35, rng),
    lifecycleStage: "Launch",
  };
}

export function createInitialPlatforms(month: number, rng: RandomFn = defaultRandom): FictionalPlatform[] {
  return [createFictionalPlatform(month, "Console", null, rng), createFictionalPlatform(month, "Console", null, rng)];
}

export function advancePlatformLifecycle(platform: FictionalPlatform, currentMonth: number): FictionalPlatform {
  const ageMonths = currentMonth - platform.launchMonth;
  let lifecycleStage: FictionalPlatform["lifecycleStage"] = "Launch";
  let installedBase = platform.installedBase;
  if (ageMonths < 24) {
    lifecycleStage = "Launch";
    installedBase = clamp(installedBase + 0.15, 0, 200);
  } else if (ageMonths < 60) {
    lifecycleStage = "Growth";
    installedBase = clamp(installedBase + 0.3, 0, 200);
  } else if (ageMonths < 96) {
    lifecycleStage = "Mature";
    installedBase = clamp(installedBase + 0.05, 0, 200);
  } else if (ageMonths < 132) {
    lifecycleStage = "Decline";
    installedBase = clamp(installedBase - 0.1, 0, 200);
  } else {
    lifecycleStage = "Discontinued";
  }
  return { ...platform, lifecycleStage, installedBase };
}

export function strategyLabel(strategy: CompanyStrategy): string {
  switch (strategy) {
    case "Aggressive":
      return "Aggressiva";
    case "Innovative":
      return "Innovativa";
    case "Conservative":
      return "Conservativa";
    case "IndieFriendly":
      return "Indie Friendly";
    case "AAAFocused":
      return "Focalizzata su AAA";
    case "MobileFocused":
      return "Focalizzata su Mobile";
    case "HardwareFocused":
      return "Focalizzata su Hardware";
  }
}
