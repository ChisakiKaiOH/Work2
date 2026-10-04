import type { Employee, GameState, Genre } from "../types";
import { GENRES } from "../data/genres";
import { createInitialOfficeUpgrades } from "../data/officeUpgrades";
import { STARTING_MONEY } from "../systems/economy";
import { generateCandidatePool } from "../systems/employees";
import { salaryForLevel } from "../data/employees";
import { createId } from "../utils/id";
import { generatePersonName } from "../utils/nameGenerator";

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

export function createNewGameState(studioName: string): GameState {
  const month = 1;
  return {
    studioName: studioName.trim() || "Nuovo Studio",
    money: STARTING_MONEY,
    month,
    reputation: 50,
    negativeMonthsStreak: 0,

    employees: [starterEmployee("Programmer", month), starterEmployee("Designer", month)],
    candidatePool: generateCandidatePool(month),

    projects: [],
    releasedGames: [],

    research: { unlocked: [], active: null },
    officeUpgrades: createInitialOfficeUpgrades(),

    genrePopularity: initialGenrePopularity(),

    activeEvent: null,
    eventLog: [],
    notifications: [
      {
        id: createId("notif"),
        month,
        text: `Hai fondato ${studioName.trim() || "il tuo studio"}! Crea il tuo primo progetto per iniziare.`,
        tone: "info",
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
    },

    activeSlot: null,
    tutorialStep: null,
    gameOver: false,
    isNew: true,
  };
}
