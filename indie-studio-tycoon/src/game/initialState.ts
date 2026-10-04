import type { Difficulty, Employee, GameMode, GameState, Genre } from "../types";
import { SAVE_FORMAT_VERSION } from "../types";
import { GENRES } from "../data/genres";
import { createInitialOfficeUpgrades } from "../data/officeUpgrades";
import { STARTING_MONEY } from "../systems/economy";
import { DIFFICULTY_SETTINGS, CHALLENGE_SCENARIOS } from "../data/difficulty";
import { generateCandidatePool } from "../systems/employees";
import { salaryForLevel } from "../data/employees";
import { createId } from "../utils/id";
import { generatePersonName } from "../utils/nameGenerator";
import { companyStageFor, computePlayerCompanyValue, generateInitialCompanies, createInitialPlatforms } from "../systems/companies";

function starterEmployee(role: Employee["role"], month: number): Employee {
  return {
    id: createId("emp"),
    name: generatePersonName(),
    role,
    level: 1,
    salary: salaryForLevel(role, 1),
    productivity: 65,
    morale: 80,
    experience: 0,
    hiredMonth: month,
    assignedProjectId: null,
  };
}

function initialGenrePopularity(): Record<Genre, number> {
  const entries = GENRES.map((g) => [g, 50] as const);
  return Object.fromEntries(entries) as Record<Genre, number>;
}

export interface NewGameOptions {
  mode: GameMode;
  difficulty: Difficulty;
  challengeId?: string;
}

export function createNewGameState(studioName: string, options: NewGameOptions = { mode: "Career", difficulty: "Normal" }): GameState {
  const month = 1;
  const diff = DIFFICULTY_SETTINGS[options.difficulty];
  const challenge = options.mode === "Challenge" ? CHALLENGE_SCENARIOS.find((c) => c.id === options.challengeId) ?? CHALLENGE_SCENARIOS[0] : null;

  const startingMoney = challenge ? challenge.startingMoney : Math.round(STARTING_MONEY * diff.startingMoneyMultiplier);

  const companies = generateInitialCompanies(month, 10);
  const companyValue = computePlayerCompanyValue({
    money: startingMoney,
    totalRevenueAllTime: 0,
    ipValueSum: 0,
    releasedGamesRevenueSum: 0,
    reputation: 50,
  });

  const name = studioName.trim() || "Nuovo Studio";

  return {
    studioName: name,
    money: startingMoney,
    month,
    reputation: 50,
    negativeMonthsStreak: 0,

    mode: options.mode,
    difficulty: options.difficulty,
    stage: companyStageFor(companyValue),
    companyValue,
    fanbase: 0,

    employees: [starterEmployee("Programmer", month), starterEmployee("Designer", month)],
    candidatePool: generateCandidatePool(month),

    projects: [],
    releasedGames: [],
    ips: [],

    research: { unlocked: [], active: null },
    officeUpgrades: createInitialOfficeUpgrades(),

    genrePopularity: initialGenrePopularity(),

    companies,
    platformsCatalog: createInitialPlatforms(month),

    activeEvent: null,
    eventLog: [],
    notifications: [
      {
        id: createId("notif"),
        month,
        text: `Hai fondato ${name}! Crea il tuo primo progetto per iniziare.`,
        tone: "info",
      },
    ],
    news: [
      {
        id: createId("news"),
        month,
        headline: `${name} apre i battenti nel mondo dello sviluppo videoludico`,
        category: "Studio",
      },
    ],
    globalEvents: [],

    marketTrend: { year: 1, label: "Il mercato è ancora stabile", risingGenres: [], decliningGenres: [] },
    awardCeremonies: [],
    pendingAwardCeremonyId: null,

    stockMarket: { playerIsPublic: false, playerSharePrice: 0, playerSharesOutstanding: 0, holdings: [] },
    achievementsUnlocked: [],
    timeline: [
      {
        id: createId("timeline"),
        month,
        title: "Fondazione",
        description: `${name} viene fondato.`,
      },
    ],

    time: { speed: 1 },
    marketingBudget: 0,

    stats: {
      foundedMonth: month,
      totalRevenue: 0,
      totalExpenses: 0,
      totalUnitsSold: 0,
      totalGamesReleased: 0,
      bestSellingGameId: null,
      totalMarketingSpend: 0,
      hadPositiveMonth: false,
      hadBankruptcyWarning: false,
      acquisitionsCompleted: 0,
      hostileTakeovers: 0,
      partnerships: 0,
    },

    activeSlot: null,
    tutorialStep: null,
    gameOver: false,

    saveVersion: SAVE_FORMAT_VERSION,
    isNew: true,
  };
}
