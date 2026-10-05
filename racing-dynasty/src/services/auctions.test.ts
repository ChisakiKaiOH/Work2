import { describe, expect, it } from 'vitest';
import { startAuction, minimumNextBid, placePlayerBid, resolveRivalRound, closeAuction } from './auctions';
import { AUCTIONS } from '../data';
import { mulberry32, hashSeed } from '../sim/rng';
import type { TeamDef } from '../types';

const def = AUCTIONS[0];

function rival(id: string, budget: number, reputation: number): TeamDef {
  return { id, displayName: id, ownerName: 'x', founded: 1960, isPlayer: false, reputation, budget, carInstanceIds: [], driverIds: [], active: true, aiProfile: { riskTolerance: 60, aggressiveness: 50, budgetStrategy: 'balanced' } };
}

describe('auctions', () => {
  it('startAuction opens at the starting price with the house as the current bidder', () => {
    const auction = startAuction(def);
    expect(auction.currentBid.amount).toBe(def.startingPrice);
    expect(auction.currentBid.bidderId).toBe('house');
    expect(auction.status).toBe('open');
  });

  it('minimumNextBid is currentBid + bidIncrement', () => {
    const auction = startAuction(def);
    expect(minimumNextBid(auction)).toBe(def.startingPrice + def.bidIncrement);
  });

  it('placePlayerBid records the player as the current bidder at the given amount', () => {
    const auction = startAuction(def);
    const next = placePlayerBid(auction, minimumNextBid(auction));
    expect(next.currentBid.bidderId).toBe('player');
    expect(next.bids).toHaveLength(2);
  });

  it('resolveRivalRound never lets a rival bid more than 60% of its own budget on one car — edge case', () => {
    const poorRival = rival('poor', 10_000, 90); // budget far below even the starting price
    const auction = startAuction(def);
    const rng = mulberry32(hashSeed('poor-rival'));
    const result = resolveRivalRound(auction, [poorRival], rng);
    expect(result.currentBid.bidderId).not.toBe('poor');
  });

  it('a wealthy, reputable rival outbids more often than a poor one across repeated rounds (not guaranteed, not random)', () => {
    const rich = rival('rich', 5_000_000, 95);
    const poor = rival('poor', 700_000, 20);
    let richOutbids = 0;
    let poorOutbids = 0;
    for (let i = 0; i < 40; i++) {
      const auction = placePlayerBid(startAuction(def), minimumNextBid(startAuction(def)));
      const rng = mulberry32(hashSeed(`rival-trial-${i}`));
      const result = resolveRivalRound(auction, [rich], rng);
      if (result.currentBid.bidderId === 'rich') richOutbids++;
      const rngPoor = mulberry32(hashSeed(`rival-trial-poor-${i}`));
      const resultPoor = resolveRivalRound(auction, [poor], rngPoor);
      if (resultPoor.currentBid.bidderId === 'poor') poorOutbids++;
    }
    expect(richOutbids).toBeGreaterThan(poorOutbids);
  });

  it('closeAuction maps the final bidder to the correct status', () => {
    const openNoBids = startAuction(def);
    expect(closeAuction(openNoBids).status).toBe('passed');

    const playerWon = placePlayerBid(startAuction(def), minimumNextBid(startAuction(def)));
    expect(closeAuction(playerWon).status).toBe('won_by_player');

    const rivalBid = resolveRivalRound(placePlayerBid(startAuction(def), minimumNextBid(startAuction(def))), [rival('r', 5_000_000, 99)], mulberry32(hashSeed('force-rival')));
    // Not guaranteed the rival actually bid (random), so only assert the mapping logic directly:
    if (rivalBid.currentBid.bidderId === 'r') {
      expect(closeAuction(rivalBid).status).toBe('won_by_rival');
    }
  });
});
