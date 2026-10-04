import type { AwardCategoryId } from "../types";

export const AWARD_CATEGORY_LABELS: Record<AwardCategoryId, string> = {
  GameOfTheYear: "Gioco dell'Anno",
  BestRPG: "Miglior RPG",
  BestAction: "Miglior Action",
  BestStrategy: "Miglior Strategico",
  BestIndie: "Miglior Indie",
  BestVisuals: "Migliore Grafica",
  BestSound: "Miglior Audio",
  BestInnovation: "Miglior Innovazione",
  BestMultiplayer: "Miglior Multiplayer",
  BestNarrative: "Miglior Narrativa",
  BestMobile: "Miglior Gioco Mobile",
};

export const AWARD_CATEGORY_ORDER: AwardCategoryId[] = [
  "GameOfTheYear",
  "BestRPG",
  "BestAction",
  "BestStrategy",
  "BestIndie",
  "BestVisuals",
  "BestSound",
  "BestInnovation",
  "BestMultiplayer",
  "BestNarrative",
  "BestMobile",
];
