import type { MarketListing } from '../types';
import { CARS } from '../data';
import { emptyUpgrades } from './performanceRating';
import type { Rng } from '../simulation/raceSimulator';

export const MARKET_REFRESH_MS = 24 * 60 * 60 * 1000;

/** Procedurally generates the day's second-hand market: 5-10 cars, random condition and light used-upgrades. */
export function generateMarket(rng: Rng, now: number): MarketListing[] {
  const count = 5 + Math.floor(rng() * 6); // 5-10
  const listings: MarketListing[] = [];
  const used = new Set<number>();
  while (listings.length < count) {
    const idx = Math.floor(rng() * CARS.length);
    if (used.has(idx)) continue;
    used.add(idx);
    const car = CARS[idx];
    const condition = Math.round(40 + rng() * 60); // 40-100
    const upgrades = emptyUpgrades();
    const preOwnedUpgradeCount = Math.floor(rng() * 3);
    const categories = Object.keys(upgrades) as (keyof typeof upgrades)[];
    for (let i = 0; i < preOwnedUpgradeCount; i++) {
      const cat = categories[Math.floor(rng() * categories.length)];
      upgrades[cat] = Math.min(10, upgrades[cat] + 1 + Math.floor(rng() * 3));
    }
    const conditionMult = 0.5 + (condition / 100) * 0.7;
    const price = Math.round(car.baseValue * conditionMult * (1 + preOwnedUpgradeCount * 0.08));
    listings.push({
      id: `listing_${now}_${idx}`,
      defId: car.id,
      price,
      condition,
      upgrades,
      expiresAt: now + MARKET_REFRESH_MS,
    });
  }
  return listings;
}
