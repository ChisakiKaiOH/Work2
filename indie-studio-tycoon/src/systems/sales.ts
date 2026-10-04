import type { Platform, ReleasedGame } from "../types";
import { PLATFORM_PROFILES } from "../data/platformsThemes";
import { clamp } from "../utils/format";

const BASE_DEMAND = 1_300;

function platformReach(platforms: Platform[]): number {
  return platforms.reduce((sum, p) => sum + PLATFORM_PROFILES[p].reachMultiplier, 0);
}

function averagePlatformCut(platforms: Platform[], feeHike = 0): number {
  const avg = platforms.reduce((sum, p) => sum + PLATFORM_PROFILES[p].platformCut, 0) / Math.max(1, platforms.length);
  return clamp(avg + feeHike, 0, 0.7);
}

export interface LaunchParams {
  platforms: Platform[];
  hype: number; // 0-100
  criticScore: number; // 1-10
  reputation: number; // 0-100
  price: number;
  marketingBoost: number; // moltiplicatore marketing dipartimento ufficio
  onlineMultiplayerUnlocked: boolean;
}

export function launchUnits(params: LaunchParams): number {
  const hypeFactor = 0.5 + (params.hype / 100) * 1.5;
  const reviewFactor = 0.3 + (params.criticScore / 10) * 1.4;
  const reach = platformReach(params.platforms);
  const priceFactor = clamp(1.5 - params.price / 45, 0.35, 1.4);
  const reputationFactor = 0.6 + (params.reputation / 100) * 0.8;
  const onlineBonus = params.onlineMultiplayerUnlocked ? 1.15 : 1;

  return Math.round(
    BASE_DEMAND * hypeFactor * reviewFactor * reach * priceFactor * reputationFactor * params.marketingBoost * onlineBonus
  );
}

export function retentionFor(criticScore: number): number {
  return clamp(0.35 + (criticScore / 10) * 0.45, 0.35, 0.85);
}

export interface SalesStepResult {
  unitsSold: number;
  revenue: number;
  status: ReleasedGame["status"];
}

export function monthlySalesStep(
  game: ReleasedGame,
  month: number,
  feeHike = 0,
  marketingBoost = 1
): SalesStepResult {
  const monthsSinceRelease = month - game.releaseMonth;
  const lastEntry = game.salesHistory[game.salesHistory.length - 1];
  const previousUnits = lastEntry?.unitsSold ?? 0;

  let unitsSold: number;
  if (monthsSinceRelease === 0) {
    unitsSold = launchUnits({
      platforms: game.platforms,
      hype: game.hype,
      criticScore: game.criticScore,
      reputation: 50,
      price: game.price,
      marketingBoost,
      onlineMultiplayerUnlocked: false,
    });
  } else {
    const retention = retentionFor(game.criticScore);
    unitsSold = Math.round(previousUnits * retention * marketingBoost);
  }

  if (game.onSaleDiscount > 0) {
    unitsSold = Math.round(unitsSold * (1 + game.onSaleDiscount * 1.6));
  }
  if (unitsSold < 4) unitsSold = 0;

  const effectivePrice = game.price * (1 - game.onSaleDiscount);
  const cut = averagePlatformCut(game.platforms, feeHike);
  const revenue = Math.round(unitsSold * effectivePrice * (1 - cut));

  let status: ReleasedGame["status"] = "active";
  if (monthsSinceRelease === 0) status = "launch";
  else if (unitsSold === 0) status = "legacy";
  else if (unitsSold < previousUnits * 0.4) status = "declining";

  return { unitsSold, revenue, status };
}

export function dlcRevenue(game: ReleasedGame, price: number): number {
  const fanbaseShare = 0.1 + game.criticScore / 100;
  return Math.round(game.totalUnitsSold * fanbaseShare * price);
}

export const DLC_PRICE = 6;
export const DLC_COST = 8_000;
export const PORT_COST = 15_000;
export const UPDATE_COST = 4_000;

export function portLaunchUnits(game: ReleasedGame, platform: Platform): number {
  return Math.round(
    launchUnits({
      platforms: [platform],
      hype: game.hype * 0.6,
      criticScore: game.criticScore,
      reputation: 50,
      price: game.price,
      marketingBoost: 1,
      onlineMultiplayerUnlocked: false,
    }) * 0.5
  );
}

export function sequelHypeSeed(game: ReleasedGame): number {
  return clamp(20 + game.criticScore * 6, 20, 90);
}
