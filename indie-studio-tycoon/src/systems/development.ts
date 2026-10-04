import type { Allocation, DevPhase, Employee, Project, QualityAxis } from "../types";
import { DEV_PHASES } from "../types";
import { ROLE_PROFILES } from "../data/employees";
import { idealAllocationFor } from "../data/genres";
import { clamp } from "../utils/format";

// Percentuale del tempo totale di sviluppo dedicata a ciascuna fase.
export const PHASE_WEIGHTS: Record<DevPhase, number> = {
  Concept: 0.1,
  Design: 0.15,
  Programming: 0.3,
  Art: 0.2,
  Audio: 0.1,
  Testing: 0.1,
  Polish: 0.05,
};

// Quali assi di qualità alimenta ciascuna fase, e con quale peso (0-1).
const PHASE_AXIS_FEED: Record<DevPhase, Partial<Record<QualityAxis, number>>> = {
  Concept: { story: 0.5, gameplay: 0.5 },
  Design: { gameplay: 0.7, story: 0.3 },
  Programming: { technology: 0.7, gameplay: 0.3 },
  Art: { graphics: 1 },
  Audio: { sound: 1 },
  Testing: { technology: 0.4 },
  Polish: { gameplay: 0.2, technology: 0.2, graphics: 0.2, sound: 0.2, story: 0.2 },
};

export interface OfficeMultipliers {
  workstationBoost: number; // moltiplicatore produttività Programmer/Artist
  bugReduction: number; // 0-1, riduzione percentuale dei bug generati
  moraleRegen: number; // punti di morale recuperati al mese
}

export function teamEfficiency(
  project: Project,
  employees: Employee[],
  office: OfficeMultipliers,
  currentPhase: DevPhase
): number {
  const team = employees.filter((e) => project.assignedEmployeeIds.includes(e.id));
  if (team.length === 0) return 0.15; // il progetto avanza molto lentamente senza team

  let totalWeight = 0;
  let producerBonus = 1;
  for (const emp of team) {
    const profile = ROLE_PROFILES[emp.role];
    const moraleFactor = clamp(emp.morale / 100, 0.3, 1.2);
    const levelFactor = 0.6 + emp.level * 0.15;
    const affinity = profile.phaseAffinity.includes(currentPhase) ? 1.4 : 0.8;
    const roleBoost = emp.role === "Programmer" || emp.role === "Artist" ? office.workstationBoost : 1;
    if (emp.role === "Producer") {
      producerBonus = 1 + 0.08 * emp.level;
      continue;
    }
    totalWeight += (emp.productivity / 100) * moraleFactor * levelFactor * affinity * roleBoost;
  }
  return clamp(totalWeight * producerBonus, 0.1, 6);
}

export interface DevelopmentTickResult {
  project: Project;
  bugsAdded: number;
}

export function advanceDevelopment(
  project: Project,
  employees: Employee[],
  office: OfficeMultipliers,
  techMultipliers: Allocation = { gameplay: 1, technology: 1, graphics: 1, sound: 1, story: 1 }
): DevelopmentTickResult {
  if (project.completed) return { project, bugsAdded: 0 };

  const phase = DEV_PHASES[project.phaseIndex];
  const phaseDurationMonths = Math.max(0.2, project.durationMonths * PHASE_WEIGHTS[phase]);
  const efficiency = teamEfficiency(project, employees, office, phase);
  const progressGain = (100 / phaseDurationMonths) * efficiency;

  const feed = PHASE_AXIS_FEED[phase];
  const newQuality: Allocation = { ...project.quality };
  for (const axis of Object.keys(feed) as QualityAxis[]) {
    const weight = feed[axis] ?? 0;
    const allocationShare = project.allocation[axis] / 100;
    const gain = progressGain * weight * (0.4 + allocationShare * 1.6) * 0.18 * techMultipliers[axis];
    newQuality[axis] = clamp(newQuality[axis] + gain, 0, 100);
  }

  // I bug si accumulano soprattutto durante Programming se si corre troppo,
  // e si riducono durante Testing/Polish in base all'investimento in Technology.
  let bugsAdded = 0;
  if (phase === "Programming") {
    const rushFactor = clamp(efficiency / 2, 0.3, 2.5);
    const techShare = project.allocation.technology / 100;
    bugsAdded = Math.max(0, rushFactor * (1.4 - techShare) * 4 * (1 - office.bugReduction));
  }
  let bugsRemoved = 0;
  if (phase === "Testing" || phase === "Polish") {
    bugsRemoved = Math.min(project.bugs, (2 + project.allocation.technology / 20) * efficiency);
  }

  // Un team molto efficiente può chiudere più fasi nello stesso mese: la
  // progress-bar lo gestisce come riporto, invece di bloccare l'avanzamento
  // a "una fase per mese" (che renderebbe anche i progetti Small lenti
  // quanto quelli AAA, indipendentemente dal team assegnato).
  let phaseIndex = project.phaseIndex;
  let phaseProgress = project.phaseProgress + progressGain;
  while (phaseProgress >= 100 && phaseIndex < DEV_PHASES.length - 1) {
    phaseProgress -= 100;
    phaseIndex += 1;
  }
  if (phaseIndex === DEV_PHASES.length - 1 && phaseProgress > 100) {
    phaseProgress = 100;
  }

  const monthsElapsed = project.monthsElapsed + 1;
  const completed = phaseIndex === DEV_PHASES.length - 1 && phaseProgress >= 100;

  // Il morale del team scende se il progetto è sotto organico rispetto al
  // rischio dichiarato, sale leggermente con la sala riunioni.
  const moraleDrift = project.risk === "Molto Alto" ? -3 : project.risk === "Alto" ? -1.5 : 0.5;
  const teamMorale = clamp(project.teamMorale + moraleDrift + office.moraleRegen * 0.3, 0, 100);

  return {
    project: {
      ...project,
      quality: newQuality,
      bugs: Math.max(0, project.bugs + bugsAdded - bugsRemoved),
      phaseIndex,
      phaseProgress,
      monthsElapsed,
      completed,
      teamMorale,
      hype: clamp(project.hype + (phase === "Polish" ? 1 : 0.3), 0, 100),
    },
    bugsAdded,
  };
}

export type CompatibilityLabel =
  | "Combinazione perfetta per il genere"
  | "Buon equilibrio per il genere"
  | "Investimenti sbilanciati rispetto al genere"
  | "Combinazione inadatta al genere";

export function compatibilityFit(genre: Project["genre"], allocation: Allocation): number {
  const ideal = idealAllocationFor(genre);
  const axes: QualityAxis[] = ["gameplay", "technology", "graphics", "sound", "story"];
  let distance = 0;
  for (const axis of axes) {
    distance += Math.abs(ideal[axis] - allocation[axis]);
  }
  // distanza massima teorica ~ 160 (tutto su un asse contro distribuzione ideale)
  return clamp(1 - distance / 160, 0, 1);
}

export function compatibilityLabel(fit: number): CompatibilityLabel {
  if (fit >= 0.8) return "Combinazione perfetta per il genere";
  if (fit >= 0.55) return "Buon equilibrio per il genere";
  if (fit >= 0.3) return "Investimenti sbilanciati rispetto al genere";
  return "Combinazione inadatta al genere";
}

// Punteggio di qualità complessivo 0-100 usato per recensioni e vendite.
// Accetta qualunque oggetto con questi tre campi (Project o ReleasedGame),
// così può essere richiamato anche dopo la pubblicazione (es. remaster).
export function compositeQualityScore(project: Pick<Project, "quality" | "bugs" | "genre">): number {
  const axes: QualityAxis[] = ["gameplay", "technology", "graphics", "sound", "story"];
  const ideal = idealAllocationFor(project.genre);
  let weightedSum = 0;
  let weightTotal = 0;
  for (const axis of axes) {
    const weight = ideal[axis] / 100 + 0.2; // anche gli assi secondari contano un po'
    weightedSum += project.quality[axis] * weight;
    weightTotal += weight;
  }
  const rawScore = weightedSum / weightTotal;
  const bugPenalty = clamp(project.bugs * 0.8, 0, 35);
  return clamp(rawScore - bugPenalty, 0, 100);
}
