import { describe, expect, it } from 'vitest';
import { generateUsedCarMarket, generateDriverOffers } from './market';
import { CAR_BY_ID, DRIVERS } from '../data';
import { mulberry32, hashSeed } from '../sim/rng';

describe('market', () => {
  it('generateUsedCarMarket produces 4-6 listings, never featuring an Iconic-rarity car', () => {
    const rng = mulberry32(hashSeed('market-1'));
    const listings = generateUsedCarMarket(rng, 'entry_1');
    expect(listings.length).toBeGreaterThanOrEqual(4);
    expect(listings.length).toBeLessThanOrEqual(6);
    for (const l of listings) {
      const def = CAR_BY_ID[l.defId];
      expect(def.rarity).not.toBe('Iconic');
      expect(l.condition).toBeGreaterThanOrEqual(55);
      expect(l.condition).toBeLessThanOrEqual(100);
      expect(l.price).toBeGreaterThan(0);
    }
  });

  it('generateDriverOffers only offers free agents, never more than the pool allows — edge case', () => {
    const rng = mulberry32(hashSeed('offers-1'));
    const allContracted = DRIVERS.map(d => ({ ...d, status: 'contracted' as const }));
    const offers = generateDriverOffers(rng, allContracted, 'entry_1');
    expect(offers).toHaveLength(0);
  });

  it('generateDriverOffers picks 3-4 distinct free agents when available', () => {
    const rng = mulberry32(hashSeed('offers-2'));
    const offers = generateDriverOffers(rng, DRIVERS, 'entry_1');
    expect(offers.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(offers.map(o => o.driverId));
    expect(ids.size).toBe(offers.length);
  });
});
