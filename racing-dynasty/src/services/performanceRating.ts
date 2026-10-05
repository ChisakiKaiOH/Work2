import type { CarBaseStats, CarInstance, CarDef, UpgradeCategory } from '../types';
import { MAX_UPGRADE_LEVEL } from '../types';

/**
 * Per-level stat increments granted by each upgrade category, at level 10
 * (fully maxed) totals shown in comments. Each level contributes an equal
 * fraction of the max-level total — simple, predictable, and easy to retune
 * from one place. `weight` entries are negative (lighter is better).
 */
export const UPGRADE_EFFECTS: Record<UpgradeCategory, Partial<Record<keyof CarBaseStats, number>>> = {
  Engine: { power: 7.2 },                                   // +72 power at lv10
  Turbo: { power: 4.8, topSpeed: 4.0 },                      // +48 power, +40 topSpeed
  ECU: { power: 2.4, reliability: 1.6 },                     // +24 power, +16 reliability
  Exhaust: { power: 1.6, weight: -2.4 },                     // +16 power, -24 weight
  Gearbox: { acceleration: 4.8, topSpeed: 3.2 },             // +48 accel, +32 topSpeed
  Clutch: { acceleration: 4.0 },                             // +40 accel
  Differential: { traction: 4.8, grip: 2.4 },                // +48 traction, +24 grip
  Suspension: { grip: 4.8, stability: 3.2 },                 // +48 grip, +32 stability
  WeightReduction: { weight: -9.6, acceleration: 1.6 },      // -96 weight, +16 accel
  Chassis: { stability: 4.8, grip: 2.4 },                    // +48 stability, +24 grip
  BrakeSystem: { braking: 6.4 },                             // +64 braking
  BrakeCooling: { braking: 2.4, reliability: 1.6 },          // +24 braking, +16 reliability
};

const UPGRADE_BASE_COST: Record<UpgradeCategory, number> = {
  Engine: 520, Turbo: 480, ECU: 420, Exhaust: 360,
  Gearbox: 460, Clutch: 400, Differential: 440,
  Suspension: 420, WeightReduction: 500, Chassis: 440,
  BrakeSystem: 380, BrakeCooling: 340,
};

/** Credit cost to go from `level` to `level + 1` (level is the level BEFORE the upgrade, 0-9). */
export function upgradeCost(category: UpgradeCategory, level: number): number {
  const nextLevel = level + 1;
  return Math.round(UPGRADE_BASE_COST[category] * Math.pow(nextLevel, 1.55));
}

export function isMaxLevel(level: number): boolean {
  return level >= MAX_UPGRADE_LEVEL;
}

export function emptyUpgrades(): Record<UpgradeCategory, number> {
  return {
    Engine: 0, Turbo: 0, ECU: 0, Exhaust: 0,
    Gearbox: 0, Clutch: 0, Differential: 0,
    Suspension: 0, WeightReduction: 0, Chassis: 0,
    BrakeSystem: 0, BrakeCooling: 0,
  };
}

/** Applies a car's upgrade levels on top of its base stats. Pure function. */
export function effectiveStats(base: CarBaseStats, upgrades: Record<UpgradeCategory, number>): CarBaseStats {
  const result: CarBaseStats = { ...base };
  for (const category of Object.keys(upgrades) as UpgradeCategory[]) {
    const level = upgrades[category];
    if (!level) continue;
    const effects = UPGRADE_EFFECTS[category];
    for (const key of Object.keys(effects) as (keyof CarBaseStats)[]) {
      const perLevel = effects[key] ?? 0;
      result[key] = (result[key] ?? 0) + perLevel * level;
    }
  }
  result.weight = Math.max(650, result.weight);
  (Object.keys(result) as (keyof CarBaseStats)[]).forEach(k => {
    if (k === 'weight') return;
    result[k] = Math.max(10, Math.min(260, result[k]));
  });
  return result;
}

const PR_WEIGHTS = {
  power: 0.20, acceleration: 0.15, topSpeed: 0.17, braking: 0.12,
  grip: 0.14, stability: 0.08, reliability: 0.06, traction: 0.08,
};
const PR_MULT = 1.9;
const PR_OFFSET = 15;

/** The core, deterministic Performance Rating formula — never random. */
export function performanceRating(stats: CarBaseStats): number {
  const raw =
    stats.power * PR_WEIGHTS.power +
    stats.acceleration * PR_WEIGHTS.acceleration +
    stats.topSpeed * PR_WEIGHTS.topSpeed +
    stats.braking * PR_WEIGHTS.braking +
    stats.grip * PR_WEIGHTS.grip +
    stats.stability * PR_WEIGHTS.stability +
    stats.reliability * PR_WEIGHTS.reliability +
    stats.traction * PR_WEIGHTS.traction;
  const weightBonus = Math.max(-20, Math.min(40, (1500 - stats.weight) / 10));
  return Math.round(raw * PR_MULT + weightBonus + PR_OFFSET);
}

export function carInstanceStats(def: CarDef, instance: CarInstance): CarBaseStats {
  return effectiveStats(def.stats, instance.upgrades);
}

export function carInstancePR(def: CarDef, instance: CarInstance): number {
  return performanceRating(carInstanceStats(def, instance));
}

export type PrTier = 'Rookie' | 'Street' | 'Sport' | 'Super' | 'Hyper' | 'Legend';

export function prTier(pr: number): PrTier {
  if (pr >= 700) return 'Legend';
  if (pr >= 600) return 'Hyper';
  if (pr >= 500) return 'Super';
  if (pr >= 400) return 'Sport';
  if (pr >= 300) return 'Street';
  return 'Rookie';
}
