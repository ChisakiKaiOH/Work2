import type { Allocation, ResearchState } from "../types";
import { TECH_TREE, techById, prerequisitesMet, isTechAvailable } from "../data/technology";

export function canStartResearch(techId: string, research: ResearchState, money: number, currentMonth: number): boolean {
  if (research.active) return false;
  if (research.unlocked.includes(techId)) return false;
  const tech = techById(techId);
  if (!tech) return false;
  if (!isTechAvailable(tech, currentMonth)) return false;
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
  const has = (id: string) => unlockedTechIds.includes(id);
  if (has("engineBasic")) mult.technology *= 1.08;
  if (has("engineAdvanced")) mult.technology *= 1.1;
  if (has("advancedAI")) mult.gameplay *= 1.12;
  if (has("graphics3d")) mult.graphics *= 1.15;
  if (has("physicsEngine")) {
    mult.gameplay *= 1.08;
    mult.technology *= 1.08;
  }
  if (has("audioSpatial")) mult.sound *= 1.18;
  if (has("motionCapture")) {
    mult.graphics *= 1.1;
    mult.story *= 1.05;
  }
  if (has("rayTracing")) mult.graphics *= 1.2;
  if (has("voiceAI")) {
    mult.story *= 1.12;
    mult.sound *= 1.1;
  }
  if (has("quantumPhysics")) {
    mult.gameplay *= 1.1;
    mult.technology *= 1.1;
  }
  if (has("neuralAnimation")) {
    mult.graphics *= 1.15;
    mult.gameplay *= 1.05;
  }
  if (has("proceduralWorlds")) mult.gameplay *= 1.1;
  return mult;
}

export function availableTechs(unlocked: string[], currentMonth: number) {
  return TECH_TREE.map((tech) => ({
    tech,
    unlocked: unlocked.includes(tech.id),
    locked: !prerequisitesMet(tech, unlocked) || !isTechAvailable(tech, currentMonth),
    notYetAvailable: !isTechAvailable(tech, currentMonth),
  }));
}
