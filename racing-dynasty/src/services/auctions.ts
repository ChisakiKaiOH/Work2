import type { AuctionDef, AuctionState, AuctionBid, TeamDef } from '../types';
import type { Rng } from '../sim/rng';

export function startAuction(def: AuctionDef): AuctionState {
  const opening: AuctionBid = { bidderId: 'house', bidderName: 'Base d\'asta', amount: def.startingPrice };
  return {
    id: def.id,
    carDefId: def.carDefId,
    startingPrice: def.startingPrice,
    bidIncrement: def.bidIncrement,
    currentBid: opening,
    bids: [opening],
    rounds: 0,
    maxRounds: def.maxRounds,
    status: 'open',
  };
}

export function minimumNextBid(auction: AuctionState): number {
  return auction.currentBid.amount + auction.bidIncrement;
}

export function placePlayerBid(auction: AuctionState, amount: number): AuctionState {
  const bid: AuctionBid = { bidderId: 'player', bidderName: 'La tua squadra', amount };
  return {
    ...auction,
    currentBid: bid,
    bids: [...auction.bids, bid],
    rounds: auction.rounds + 1,
  };
}

/**
 * Each rival team independently decides whether to outbid, based on its
 * budget headroom and reputation (a wealthier, more prestigious team is
 * more likely to chase an important car) plus a random-interest roll so the
 * outcome is never fully predictable.
 */
export function resolveRivalRound(auction: AuctionState, rivals: TeamDef[], rng: Rng): AuctionState {
  let current = auction;
  for (const rival of rivals) {
    const nextBid = minimumNextBid(current);
    if (nextBid > rival.budget * 0.6) continue; // won't risk more than 60% of budget on one car
    const interest = 0.15 + (rival.reputation / 100) * 0.35 + (rival.aiProfile?.riskTolerance ?? 50) / 100 * 0.2;
    if (rng() < interest) {
      const bid: AuctionBid = { bidderId: rival.id, bidderName: rival.displayName, amount: nextBid };
      current = { ...current, currentBid: bid, bids: [...current.bids, bid] };
    }
  }
  return { ...current, rounds: current.rounds + 1 };
}

export function closeAuction(auction: AuctionState): AuctionState {
  if (auction.currentBid.bidderId === 'player') return { ...auction, status: 'won_by_player' };
  if (auction.currentBid.bidderId === 'house') return { ...auction, status: 'passed' };
  return { ...auction, status: 'won_by_rival' };
}
