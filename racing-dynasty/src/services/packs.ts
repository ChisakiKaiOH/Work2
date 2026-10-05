import type { CarDef, PackDef, Rarity } from '../types';
import { RARITY_ORDER } from '../types';
import { CARS } from '../data';
import type { Rng } from '../simulation/raceSimulator';

/**
 * Pack odds are exactly the numbers shown to the player in the UI (see
 * PackOdds on PackDef) — nothing here secretly reweights them beyond the
 * documented pity mechanic, which itself is shown as a counter in the UI.
 */
function rollRarity(odds: PackDef['odds'], pityBoost: number, rng: Rng): Rarity {
  const boosted: Record<Rarity, number> = { ...odds };
  (['Epic', 'Legendary', 'Mythic'] as Rarity[]).forEach(r => {
    boosted[r] = odds[r] * (1 + pityBoost * 2.2);
  });
  const total = RARITY_ORDER.reduce((s, r) => s + boosted[r], 0);
  let roll = rng() * total;
  for (const r of RARITY_ORDER) {
    roll -= boosted[r];
    if (roll <= 0) return r;
  }
  return 'Common';
}

function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

function pickCarForRarity(pack: PackDef, rarity: Rarity, rng: Rng): CarDef {
  let pool = CARS.filter(c => c.rarity === rarity);
  if (pack.categoryPool && pack.categoryPool.length) {
    const narrowed = pool.filter(c => pack.categoryPool!.includes(c.category));
    if (narrowed.length) pool = narrowed;
  }
  if (!pool.length) pool = CARS;
  return pool[Math.floor(rng() * pool.length)];
}

export interface PackOpenResult {
  cars: CarDef[];
  newPityCount: number;
  pityTriggered: boolean;
}

/** Pure: opening a pack never touches global state directly — the reducer applies the result. */
export function openPack(pack: PackDef, pityCount: number, rng: Rng): PackOpenResult {
  const pityBoost = Math.min(1, pityCount / pack.pityThreshold);
  const floorIndex = rarityIndex(pack.guaranteedRarityAt);
  let reachedFloor = false;
  const pityTriggered = pityCount >= pack.pityThreshold;

  const cars: CarDef[] = [];
  for (let i = 0; i < pack.carCount; i++) {
    const isLastRoll = i === pack.carCount - 1;
    let rarity = rollRarity(pack.odds, pityBoost, rng);
    if (isLastRoll && pityTriggered && !reachedFloor) {
      rarity = pack.guaranteedRarityAt;
    }
    if (rarityIndex(rarity) >= floorIndex) reachedFloor = true;
    cars.push(pickCarForRarity(pack, rarity, rng));
  }

  const newPityCount = reachedFloor ? 0 : pityCount + 1;
  return { cars, newPityCount, pityTriggered };
}
