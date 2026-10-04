import type { Allocation, ResearchState } from "../types";
import { TECH_TREE, techById, prerequisitesMet } from "../data/technology";

export function canStartResearch(techId: string, research: ResearchState, money: number): boolean {
  if (research.active) return false;
  if (research.unlocked.includes(techId)) return false;
  const tech = techById(techId);
  if (!tech) return false;
  if (!prerequisitesMet(tech, research.unlocked)) return false;
  return money >= tech.cost;
}

export function startResearch(research: ResearchState, techId: string, rndLabBonus: number): ResearchState {
  const tech = techById(techId);
  if (!tech) return research;
  const duration = Math.max(1, Math.round(tech.durationMonths * (1 - rndLabBonus)));
  return { ...research, active: { techId, monthsRemaining: duration } };
}

export interface ResearchTickResult {
  research: ResearchState;
  completedTechId: string | null;
}

export function advanceResearch(research: ResearchState): ResearchTickResult {
  if (!research.active) return { research, completedTechId: null };
  const monthsRemaining = research.active.monthsRemaining - 1;
  if (monthsRemaining <= 0) {
    const techId = research.active.techId;
    return {
      research: { unlocked: [...research.unlocked, techId], active: null },
      completedTechId: techId,
    };
  }
  return { research: { ...research, active: { ...research.active, monthsRemaining } }, completedTechId: null };
}

export function researchCost(techId: string): number {
  return techById(techId)?.cost ?? 0;
}

export function techQualityMultipliers(unlockedTechIds: string[]): Allocation {
  const mult: Allocation = { gameplay: 1, technology: 1, graphics: 1, sound: 1, story: 1 };
  if (unlockedTechIds.includes("engineBasic")) mult.technology *= 1.08;
  if (unlockedTechIds.includes("engineAdvanced")) mult.technology *= 1.1;
  if (unlockedTechIds.includes("advancedAI")) mult.gameplay *= 1.12;
  if (unlockedTechIds.includes("graphics3d")) mult.graphics *= 1.15;
  if (unlockedTechIds.includes("physicsEngine")) {
    mult.gameplay *= 1.08;
    mult.technology *= 1.08;
  }
  if (unlockedTechIds.includes("rayTracing")) mult.graphics *= 1.2;
  return mult;
}

export function availableTechs(unlocked: string[]) {
  return TECH_TREE.map((tech) => ({
    tech,
    unlocked: unlocked.includes(tech.id),
    locked: !prerequisitesMet(tech, unlocked),
  }));
}
