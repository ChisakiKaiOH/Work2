import type { Difficulty } from "../types";

export interface DifficultySettings {
  label: string;
  description: string;
  startingMoneyMultiplier: number;
  expenseMultiplier: number;
  eventChanceMultiplier: number;
  competitorAggressivenessMultiplier: number;
  salesMultiplier: number;
  bankruptcyGraceMonths: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultySettings> = {
  Easy: {
    label: "Facile",
    description: "Più denaro iniziale, spese ridotte, concorrenza meno aggressiva. Ideale per imparare.",
    startingMoneyMultiplier: 1.5,
    expenseMultiplier: 0.8,
    eventChanceMultiplier: 0.8,
    competitorAggressivenessMultiplier: 0.7,
    salesMultiplier: 1.15,
    bankruptcyGraceMonths: 5,
  },
  Normal: {
    label: "Normale",
    description: "L'esperienza di gioco pensata come riferimento, bilanciata ma impegnativa.",
    startingMoneyMultiplier: 1,
    expenseMultiplier: 1,
    eventChanceMultiplier: 1,
    competitorAggressivenessMultiplier: 1,
    salesMultiplier: 1,
    bankruptcyGraceMonths: 3,
  },
  Hard: {
    label: "Difficile",
    description: "Meno margine economico, concorrenza più aggressiva, grazia più breve.",
    startingMoneyMultiplier: 0.75,
    expenseMultiplier: 1.2,
    eventChanceMultiplier: 1.2,
    competitorAggressivenessMultiplier: 1.3,
    salesMultiplier: 0.9,
    bankruptcyGraceMonths: 2,
  },
  Insane: {
    label: "Insane",
    description: "Per veterani: budget ridotto all'osso, spese alte, rivali spietati, nessuna rete di sicurezza.",
    startingMoneyMultiplier: 0.5,
    expenseMultiplier: 1.4,
    eventChanceMultiplier: 1.4,
    competitorAggressivenessMultiplier: 1.6,
    salesMultiplier: 0.8,
    bankruptcyGraceMonths: 1,
  },
};

export interface ChallengeScenario {
  id: string;
  name: string;
  description: string;
  objective: string;
  startingMoney: number;
  targetCompanyValue: number;
  targetMonths: number;
}

export const CHALLENGE_SCENARIOS: ChallengeScenario[] = [
  {
    id: "fastGrowth",
    name: "Scalata Rapida",
    description: "Uno scenario speciale: meno liquidità di partenza, ma un obiettivo chiaro da raggiungere in tempo.",
    objective: "Raggiungi 2.000.000€ di valore aziendale (stadio Azienda Media) entro 5 anni.",
    startingMoney: 30_000,
    targetCompanyValue: 2_000_000,
    targetMonths: 60,
  },
];
