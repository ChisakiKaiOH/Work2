import type { RaceParticipant, DriverDef, CarDef } from '../types';
import { CARS, DRIVERS, AI_TEAMS } from '../data';
import { carRating } from '../services/carRating';
import type { Rng } from './rng';

/**
 * AI opponent rosters are generated per race from the static car/driver
 * pools rather than tracked as persistent AI-team ownership — a documented
 * Phase 1 simplification (full AI-team economy simulation is section 67-68
 * of the brief, planned for a later phase). Opponents are picked close to
 * the player's own car rating so the grid stays competitive.
 */
export function generateField(playerCarId: string, playerDriverId: string, count: number, rng: Rng): RaceParticipant[] {
  const targetRating = carRating(CARS.find(c => c.id === playerCarId)!.stats);
  const carPool = CARS.filter(c => c.id !== playerCarId && c.rarity !== 'Iconic');
  const driverPool = DRIVERS.filter(d => d.id !== playerDriverId);

  const scoredCars = carPool
    .map(c => ({ car: c, diff: Math.abs(carRating(c.stats) - targetRating) }))
    .sort((a, b) => a.diff - b.diff);
  const carSelection = pickRandomFromTopN(scoredCars.map(s => s.car), count, Math.max(count * 2, 8), rng);

  const field: RaceParticipant[] = [];
  for (let i = 0; i < count; i++) {
    const car: CarDef = carSelection[i % carSelection.length];
    const driver: DriverDef = driverPool[Math.floor(rng() * driverPool.length)];
    const team = AI_TEAMS[i % AI_TEAMS.length];
    field.push({
      id: `ai_${i}_${car.id}`,
      teamId: team.id,
      driverId: driver.id,
      driverName: driver.displayName,
      teamName: team.displayName,
      carInstanceId: null,
      carDefId: car.id,
      isPlayer: false,
      driverRef: driver,
    });
  }
  return field;
}

function pickRandomFromTopN<T>(sorted: T[], count: number, poolSize: number, rng: Rng): T[] {
  const pool = sorted.slice(0, Math.min(poolSize, sorted.length));
  const chosen: T[] = [];
  const used = new Set<number>();
  while (chosen.length < count && used.size < pool.length) {
    const idx = Math.floor(rng() * pool.length);
    if (used.has(idx)) continue;
    used.add(idx);
    chosen.push(pool[idx]);
  }
  while (chosen.length < count && pool.length > 0) chosen.push(pool[chosen.length % pool.length]);
  return chosen;
}
