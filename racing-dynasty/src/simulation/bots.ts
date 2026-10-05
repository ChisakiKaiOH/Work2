import type { CarDef, DriverDef, DriverArchetype, RaceParticipant, Strategy } from '../types';
import { CARS, DRIVERS } from '../data';
import { performanceRating } from '../services/performanceRating';
import { emptyUpgrades } from '../services/performanceRating';
import type { Rng } from '../simulation/raceSimulator';

const ARCHETYPE_STRATEGY: Record<DriverArchetype, Strategy> = {
  Aggressive: 'Attack',
  Defensive: 'Defend',
  Balanced: 'Balanced',
  Technical: 'Balanced',
  Risky: 'Risky',
};

/** Generates a bot driver profile on the fly (not every opponent needs a roster entry). */
function botDriver(seed: number, rng: Rng): DriverDef {
  const archetypes: DriverArchetype[] = ['Aggressive', 'Defensive', 'Balanced', 'Technical', 'Risky'];
  const archetype = archetypes[Math.floor(rng() * archetypes.length)];
  const names = ['Rival Vex', 'Rival Toro', 'Rival Nyx', 'Rival Sable', 'Rival Kade', 'Rival Orin', 'Rival Juno', 'Rival Rask'];
  return {
    id: `bot_${seed}`,
    name: names[seed % names.length],
    archetype,
    skill: Math.round(50 + rng() * 45),
    aggressiveness: Math.round(30 + rng() * 65),
    consistency: Math.round(40 + rng() * 55),
    specialty: 'AllRound',
    unlockLevel: 1,
    avatarSeed: `bot${seed}`,
  };
}

/** Picks `count` cars whose base PR sits close to `targetPR`, for a fair-but-not-identical grid. */
export function pickOpponentCars(targetPR: number, count: number, rng: Rng): CarDef[] {
  const scored = CARS.map(c => ({ car: c, pr: performanceRating(c.stats) }))
    .map(x => ({ ...x, diff: Math.abs(x.pr - targetPR) }))
    .sort((a, b) => a.diff - b.diff);
  const pool = scored.slice(0, Math.max(count * 3, 12));
  const chosen: CarDef[] = [];
  const used = new Set<string>();
  while (chosen.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    const candidate = pool[idx];
    if (!used.has(candidate.car.id)) {
      used.add(candidate.car.id);
      chosen.push(candidate.car);
    }
    pool.splice(idx, 1);
  }
  return chosen;
}

export function generateOpponents(targetPR: number, count: number, rng: Rng): RaceParticipant[] {
  const cars = pickOpponentCars(targetPR, count, rng);
  return cars.map((car, i) => {
    const driver = rng() < 0.3 ? DRIVERS[Math.floor(rng() * DRIVERS.length)] : botDriver(i + 1, rng);
    const strategy = ARCHETYPE_STRATEGY[driver.archetype];
    return {
      id: `opp_${i + 1}_${car.id}`,
      name: driver.name,
      isPlayer: false,
      carDef: car,
      carInstance: null,
      driver,
      strategy,
      pr: performanceRating(car.stats),
    } satisfies RaceParticipant;
  });
}

export function emptyInstanceUpgrades() {
  return emptyUpgrades();
}
