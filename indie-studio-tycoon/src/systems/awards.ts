import type {
  AwardCategoryId,
  AwardCategoryResult,
  AwardCeremony,
  AwardNominee,
  BudgetTier,
  Genre,
  Platform,
  QualityAxis,
  ReleasedGame,
  RivalCompany,
} from "../types";
import { AWARD_CATEGORY_ORDER } from "../data/awardCategories";
import { createId } from "../utils/id";

interface AwardCandidate {
  releasedGameId: string;
  gameName: string;
  companyName: string;
  isPlayer: boolean;
  genre: Genre;
  platform: Platform;
  topAxis: QualityAxis;
  budgetTier: BudgetTier;
  qualityScore: number;
  criticScore: number;
  unitsSold: number;
  releaseMonth: number;
}

function budgetTierForSize(size: ReleasedGame["size"]): BudgetTier {
  if (size === "Small") return "Indie";
  if (size === "Medium") return "Mid";
  return "AAA";
}

function topAxisForQuality(quality: Record<QualityAxis, number>): QualityAxis {
  const axes: QualityAxis[] = ["gameplay", "technology", "graphics", "sound", "story"];
  return axes.reduce((best, axis) => (quality[axis] > quality[best] ? axis : best), axes[0]);
}

function playerCandidates(studioName: string, games: ReleasedGame[], sinceMonth: number): AwardCandidate[] {
  return games
    .filter((g) => g.releaseMonth >= sinceMonth)
    .map((g) => ({
      releasedGameId: g.id,
      gameName: g.name,
      companyName: studioName,
      isPlayer: true,
      genre: g.genre,
      platform: g.platforms[0] ?? "PC",
      topAxis: topAxisForQuality(g.quality),
      budgetTier: budgetTierForSize(g.size),
      qualityScore: g.qualityScore,
      criticScore: g.criticScore,
      unitsSold: g.totalUnitsSold,
      releaseMonth: g.releaseMonth,
    }));
}

function rivalCandidates(companies: RivalCompany[], sinceMonth: number): AwardCandidate[] {
  const out: AwardCandidate[] = [];
  for (const company of companies) {
    for (const game of company.games) {
      if (game.releaseMonth < sinceMonth) continue;
      out.push({
        releasedGameId: game.id,
        gameName: game.name,
        companyName: company.name,
        isPlayer: false,
        genre: game.genre,
        platform: game.platform,
        topAxis: game.topAxis,
        budgetTier: game.budgetTier,
        qualityScore: game.qualityScore,
        criticScore: game.criticScore,
        unitsSold: game.unitsSold,
        releaseMonth: game.releaseMonth,
      });
    }
  }
  return out;
}

const GENRE_GROUPS: Partial<Record<AwardCategoryId, Genre[]>> = {
  BestRPG: ["RPG", "JRPG"],
  BestAction: ["Action", "FPS", "Fighting"],
  BestStrategy: ["Strategy", "RTS", "Tactical"],
  BestMultiplayer: ["MMO", "MOBA"],
};

function isEligible(candidate: AwardCandidate, categoryId: AwardCategoryId): boolean {
  switch (categoryId) {
    case "GameOfTheYear":
      return true;
    case "BestIndie":
      return candidate.budgetTier === "Indie";
    case "BestMobile":
      return candidate.platform === "Mobile";
    case "BestVisuals":
    case "BestSound":
    case "BestNarrative":
    case "BestInnovation":
      return true;
    default: {
      const genres = GENRE_GROUPS[categoryId];
      return genres ? genres.includes(candidate.genre) : true;
    }
  }
}

function scoreFor(candidate: AwardCandidate, categoryId: AwardCategoryId): number {
  const base = candidate.qualityScore + candidate.criticScore * 6 + Math.log10(Math.max(1, candidate.unitsSold)) * 8;
  switch (categoryId) {
    case "BestVisuals":
      return base + (candidate.topAxis === "graphics" ? 40 : 0);
    case "BestSound":
      return base + (candidate.topAxis === "sound" ? 40 : 0);
    case "BestNarrative":
      return base + (candidate.topAxis === "story" ? 40 : 0);
    case "BestInnovation": {
      // Pseudo-casuale ma deterministico sull'id, per dare varietà senza
      // dipendere da uno stato extra: l'innovazione premia anche la sorpresa.
      const hash = candidate.releasedGameId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
      return candidate.qualityScore * 0.6 + (hash % 40);
    }
    default:
      return base;
  }
}

export function runAwardCeremony(
  month: number,
  year: number,
  studioName: string,
  playerGames: ReleasedGame[],
  companies: RivalCompany[]
): AwardCeremony {
  const sinceMonth = Math.max(1, month - 12);
  const candidates = [...playerCandidates(studioName, playerGames, sinceMonth), ...rivalCandidates(companies, sinceMonth)];

  const categories: AwardCategoryResult[] = AWARD_CATEGORY_ORDER.map((categoryId) => {
    const eligible = candidates.filter((c) => isEligible(c, categoryId));
    const nominees: AwardNominee[] = eligible
      .map((c) => ({
        releasedGameId: c.releasedGameId,
        gameName: c.gameName,
        companyName: c.companyName,
        isPlayer: c.isPlayer,
        score: scoreFor(c, categoryId),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return { categoryId, nominees };
  });

  return { id: createId("award"), year, month, categories };
}

export function playerWonCategory(ceremony: AwardCeremony, categoryId: AwardCategoryId): boolean {
  const category = ceremony.categories.find((c) => c.categoryId === categoryId);
  return category?.nominees[0]?.isPlayer ?? false;
}

export function playerWins(ceremony: AwardCeremony): AwardCategoryResult[] {
  return ceremony.categories.filter((c) => c.nominees[0]?.isPlayer);
}
