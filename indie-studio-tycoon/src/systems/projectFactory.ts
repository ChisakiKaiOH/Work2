import type { Allocation, Genre, Platform, Project, ProjectSize, Theme } from "../types";
import { SIZE_PROFILES } from "../data/sizes";
import { PLATFORM_PROFILES } from "../data/platformsThemes";
import { idealAllocationFor } from "../data/genres";
import { generateGameTitle } from "../utils/nameGenerator";
import { createId } from "../utils/id";
import { clamp } from "../utils/format";

export interface NewProjectChoice {
  genre: Genre;
  platforms: Platform[];
  size: ProjectSize;
  theme: Theme;
}

export interface NewProjectEstimate {
  cost: number;
  durationMonths: number;
  recommendedTeamSize: number;
  qualityPotential: number; // 0-100
  risk: "Basso" | "Medio" | "Alto" | "Molto Alto";
  hypePotential: number; // 0-100
  commercialPotential: number; // 0-100
}

export function estimateProject(
  choice: NewProjectChoice,
  context: { teamSize: number; unlockedTechIds: string[]; genrePopularity: number }
): NewProjectEstimate {
  const sizeProfile = SIZE_PROFILES[choice.size];
  const platformCostMultiplier =
    choice.platforms.reduce((sum, p) => sum + PLATFORM_PROFILES[p].costMultiplier, 0) /
    Math.max(1, choice.platforms.length);
  const platformCount = Math.max(1, choice.platforms.length);

  const cost = Math.round(sizeProfile.baseCost * platformCostMultiplier * (1 + (platformCount - 1) * 0.35));

  // Generazione procedurale riduce tempo/costo per progetti grandi.
  const proceduralBonus = context.unlockedTechIds.includes("proceduralGen") && sizeProfile.teamSizeHint >= 5 ? 0.85 : 1;
  const durationMonths = Math.max(1, Math.round(sizeProfile.baseDurationMonths * proceduralBonus));

  const recommendedTeamSize = sizeProfile.teamSizeHint;

  const teamRatio = clamp(context.teamSize / recommendedTeamSize, 0.2, 2);
  const qualityPotential = clamp(sizeProfile.maxQualityCeiling * clamp(teamRatio, 0.5, 1), 10, 100);

  const understaffing = recommendedTeamSize - context.teamSize;
  let risk: NewProjectEstimate["risk"] = "Basso";
  if (understaffing >= recommendedTeamSize * 0.7) risk = "Molto Alto";
  else if (understaffing >= recommendedTeamSize * 0.4) risk = "Alto";
  else if (understaffing >= recommendedTeamSize * 0.15) risk = "Medio";

  const hypePotential = clamp(30 + context.genrePopularity * 0.5, 0, 90);
  const commercialPotential = clamp(
    (context.genrePopularity * 0.5 + platformCount * 10 + sizeProfile.maxQualityCeiling * 0.3) / 1.5,
    0,
    100
  );

  return { cost, durationMonths, recommendedTeamSize, qualityPotential, risk, hypePotential, commercialPotential };
}

export function createProject(
  choice: NewProjectChoice,
  allocation: Allocation,
  estimate: NewProjectEstimate,
  assignedEmployeeIds: string[],
  month: number
): Project {
  return {
    id: createId("project"),
    name: generateGameTitle(choice.genre, choice.theme),
    genre: choice.genre,
    platforms: choice.platforms,
    size: choice.size,
    theme: choice.theme,
    allocation,
    assignedEmployeeIds,
    developmentCost: estimate.cost,
    durationMonths: estimate.durationMonths,
    monthsElapsed: 0,
    phaseIndex: 0,
    phaseProgress: 0,
    quality: { gameplay: 0, technology: 0, graphics: 0, sound: 0, story: 0 },
    bugs: 0,
    hype: Math.round(estimate.hypePotential * 0.3),
    teamMorale: 70,
    risk: estimate.risk,
    startedMonth: month,
    completed: false,
  };
}

export function defaultAllocationFor(genre: Genre): Allocation {
  const ideal = idealAllocationFor(genre);
  // Arrotonda l'allocazione ideale a multipli di 5 così la UI parte da uno
  // slider già sensato, modificabile liberamente dal giocatore.
  const rounded: Allocation = {
    gameplay: Math.round(ideal.gameplay / 5) * 5,
    technology: Math.round(ideal.technology / 5) * 5,
    graphics: Math.round(ideal.graphics / 5) * 5,
    sound: Math.round(ideal.sound / 5) * 5,
    story: Math.round(ideal.story / 5) * 5,
  };
  const total = rounded.gameplay + rounded.technology + rounded.graphics + rounded.sound + rounded.story;
  const diff = 100 - total;
  rounded.gameplay += diff; // compensa l'arrotondamento sull'asse più pesato
  return rounded;
}
