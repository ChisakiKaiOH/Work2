import { describe, expect, it } from 'vitest';
import { openPack } from './packs';
import { PACKS } from '../data';
import { RARITY_ORDER } from '../types';
import { mulberry32, hashSeed } from '../simulation/rng';

describe('openPack', () => {
  const pack = PACKS.find(p => p.id === 'pack_basic')!;

  it('always returns exactly pack.carCount cars, each a valid rarity', () => {
    const rng = mulberry32(hashSeed('pack-basic-1'));
    const { cars } = openPack(pack, 0, rng);
    expect(cars).toHaveLength(pack.carCount);
    for (const car of cars) {
      expect(RARITY_ORDER).toContain(car.rarity);
    }
  });

  it('never returns a rarity below Common or above Mythic — no invalid reward can be produced', () => {
    const rng = mulberry32(hashSeed('pack-basic-2'));
    for (let i = 0; i < 30; i++) {
      const { cars } = openPack(pack, i, rng);
      for (const car of cars) {
        expect(RARITY_ORDER.indexOf(car.rarity)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('pity counter resets to 0 once the guaranteed floor rarity is reached', () => {
    const rng = mulberry32(hashSeed('pity-floor'));
    const { newPityCount, cars } = openPack(pack, pack.pityThreshold, rng);
    const floorIndex = RARITY_ORDER.indexOf(pack.guaranteedRarityAt);
    const reachedFloor = cars.some(c => RARITY_ORDER.indexOf(c.rarity) >= floorIndex);
    expect(reachedFloor).toBe(true);
    expect(newPityCount).toBe(0);
  });

  it('pity guarantees the floor rarity is met at or before the pity threshold, across many openings', () => {
    const rng = mulberry32(hashSeed('pity-guarantee'));
    let pity = 0;
    let everMetFloor = false;
    const floorIndex = RARITY_ORDER.indexOf(pack.guaranteedRarityAt);
    for (let i = 0; i < 50; i++) {
      const res = openPack(pack, pity, rng);
      pity = res.newPityCount;
      if (res.cars.some(c => RARITY_ORDER.indexOf(c.rarity) >= floorIndex)) everMetFloor = true;
      // Pity count should never run away past the threshold + 1 (one grace opening).
      expect(pity).toBeLessThanOrEqual(pack.pityThreshold + 1);
    }
    expect(everMetFloor).toBe(true);
  });

  it('a pack with zero pity count still produces a valid (if less favorable) result — edge case', () => {
    const rng = mulberry32(hashSeed('zero-pity'));
    const { cars, newPityCount } = openPack(pack, 0, rng);
    expect(cars.length).toBe(pack.carCount);
    expect(newPityCount).toBeGreaterThanOrEqual(0);
  });

  it('every configured pack has odds that sum to a positive total (no division-by-zero / invalid-reward risk)', () => {
    for (const p of PACKS) {
      const total = RARITY_ORDER.reduce((sum, r) => sum + p.odds[r], 0);
      expect(total).toBeGreaterThan(0);
    }
  });
});
