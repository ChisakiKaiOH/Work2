import type { UsedCarListing, DriverOffer, DriverDef } from '../types';
import { CARS } from '../data';
import type { Rng } from '../sim/rng';

/**
 * Historically-important ('Iconic') cars never appear in the random used
 * market — those are reserved for a dedicated auction event (section 16-18
 * of the brief), so the market only rolls from everything below that rarity.
 */
const MARKETABLE_CARS = CARS.filter(c => c.rarity !== 'Iconic');

export function generateUsedCarMarket(rng: Rng, expiresAtEntryId: string): UsedCarListing[] {
  const count = 4 + Math.floor(rng() * 3); // 4-6
  const listings: UsedCarListing[] = [];
  const used = new Set<number>();
  while (listings.length < count && used.size < MARKETABLE_CARS.length) {
    const idx = Math.floor(rng() * MARKETABLE_CARS.length);
    if (used.has(idx)) continue;
    used.add(idx);
    const car = MARKETABLE_CARS[idx];
    const condition = Math.round(55 + rng() * 45); // 55-100
    const conditionMult = 0.55 + (condition / 100) * 0.55;
    listings.push({
      id: `listing_${expiresAtEntryId}_${idx}`,
      defId: car.id,
      price: Math.round(car.baseValue * conditionMult),
      condition,
      expiresAtEntryId,
    });
  }
  return listings;
}

export function generateDriverOffers(rng: Rng, drivers: DriverDef[], expiresAtEntryId: string): DriverOffer[] {
  const freeAgents = drivers.filter(d => d.status === 'free_agent');
  const count = Math.min(freeAgents.length, 3 + Math.floor(rng() * 2)); // 3-4
  const pool = [...freeAgents];
  const offers: DriverOffer[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    const driver = pool.splice(idx, 1)[0];
    offers.push({
      id: `offer_${expiresAtEntryId}_${driver.id}`,
      driverId: driver.id,
      fromTeamId: 'market',
      salaryPerEvent: driver.salaryPerEvent,
      durationEvents: 3,
      expiresAtEntryId,
    });
  }
  return offers;
}
