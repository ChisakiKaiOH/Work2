import type { CarBaseStats } from '../types';

/**
 * A single at-a-glance pace rating for a car, used for display (Garage) and
 * as one input among several to the race engine's lap pace — it is NOT, by
 * itself, what decides a race (see sim/raceEngine.ts: the engine also
 * weighs driver skill, weather, track, wear/fuel and the player's own
 * decisions during the race).
 */
export function carRating(stats: CarBaseStats): number {
  const raw =
    stats.power * 0.26 +
    stats.topSpeed * 0.20 +
    stats.handling * 0.18 +
    stats.braking * 0.12 +
    stats.aerodynamics * 0.14 +
    stats.reliability * 0.10;
  const weightBonus = Math.max(-15, Math.min(30, (1100 - stats.weight) / 8));
  return Math.round(raw + weightBonus);
}
