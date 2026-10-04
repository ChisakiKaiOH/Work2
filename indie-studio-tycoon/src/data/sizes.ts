import type { ProjectSize } from "../types";

export interface SizeProfile {
  size: ProjectSize;
  baseCost: number; // costo base di sviluppo
  baseDurationMonths: number;
  teamSizeHint: number; // numero di sviluppatori consigliato
  maxQualityCeiling: number; // tetto massimo di qualità raggiungibile senza tecnologie extra
  requiresTechId?: string; // tecnologia minima richiesta per sbloccare la dimensione
}

export const SIZE_PROFILES: Record<ProjectSize, SizeProfile> = {
  Small: {
    size: "Small",
    baseCost: 8_000,
    baseDurationMonths: 2,
    teamSizeHint: 1,
    maxQualityCeiling: 70,
  },
  Medium: {
    size: "Medium",
    baseCost: 25_000,
    baseDurationMonths: 4,
    teamSizeHint: 3,
    maxQualityCeiling: 85,
  },
  Large: {
    size: "Large",
    baseCost: 70_000,
    baseDurationMonths: 7,
    teamSizeHint: 5,
    maxQualityCeiling: 95,
    requiresTechId: "engineAdvanced",
  },
  AAA: {
    size: "AAA",
    baseCost: 180_000,
    baseDurationMonths: 12,
    teamSizeHint: 8,
    maxQualityCeiling: 100,
    requiresTechId: "graphics3d",
  },
};

export const SIZES: ProjectSize[] = ["Small", "Medium", "Large", "AAA"];
