import { describe, expect, it } from 'vitest';
import { gameReducer } from './reducer';
import { createCarInstance } from './initialState';
import { STARTER_CAR_IDS, PACKS } from '../data';
import { MAX_UPGRADE_LEVEL, UPGRADE_CATEGORIES } from '../types';
import type { RaceResult } from '../types';

function freshPlayer() {
  const p = gameReducer(null, { type: 'NEW_GAME', name: 'Test' });
  return gameReducer(p, { type: 'CHOOSE_STARTER_CAR', carDefId: STARTER_CAR_IDS[0] })!;
}

function fakeRaceResult(overrides: Partial<RaceResult> = {}): RaceResult {
  return {
    trackId: 'track_1', weather: 'Dry', laps: 3,
    standings: [{ participantId: 'player', name: 'Test', isPlayer: true, position: 1, totalTimeSec: 100, gapToLeaderSec: 0, pitStops: 0, overtakes: 2, dnf: false }],
    lapHistory: [], events: [],
    playerPosition: 1, playerDnf: false,
    creditsEarned: 500, xpEarned: 80, bonusCredits: 150,
    drops: [],
    ...overrides,
  };
}

describe('gameReducer — core flow', () => {
  it('NEW_GAME creates a player with the documented starting economy', () => {
    const player = gameReducer(null, { type: 'NEW_GAME', name: 'Pilota' });
    expect(player).not.toBeNull();
    expect(player!.credits).toBe(5000);
    expect(player!.tokens).toBe(50);
    expect(player!.firstCarChosen).toBe(false);
  });

  it('CHOOSE_STARTER_CAR grants exactly one car and can only be done once', () => {
    const p1 = gameReducer(null, { type: 'NEW_GAME', name: 'Test' })!;
    const p2 = gameReducer(p1, { type: 'CHOOSE_STARTER_CAR', carDefId: STARTER_CAR_IDS[0] })!;
    expect(p2.ownedCars).toHaveLength(1);
    expect(p2.firstCarChosen).toBe(true);

    const p3 = gameReducer(p2, { type: 'CHOOSE_STARTER_CAR', carDefId: STARTER_CAR_IDS[1] })!;
    expect(p3.ownedCars).toHaveLength(1); // ignored, already chosen
  });

  it('RESET_SAVE always returns null regardless of current state', () => {
    const player = freshPlayer();
    expect(gameReducer(player, { type: 'RESET_SAVE' })).toBeNull();
  });
});

describe('gameReducer — UPGRADE_CAR', () => {
  it('spends credits and raises the upgrade level by one', () => {
    const player = freshPlayer();
    const instanceId = player.ownedCars[0].instanceId;
    const next = gameReducer(player, { type: 'UPGRADE_CAR', instanceId, category: 'Engine' })!;
    expect(next.ownedCars[0].upgrades.Engine).toBe(1);
    expect(next.credits).toBeLessThan(player.credits);
  });

  it('refuses to upgrade when credits are insufficient (0 credits) — edge case', () => {
    const player = { ...freshPlayer(), credits: 0, upgradeParts: 0 };
    const instanceId = player.ownedCars[0].instanceId;
    const next = gameReducer(player, { type: 'UPGRADE_CAR', instanceId, category: 'Engine' });
    expect(next).toBe(player); // unchanged
  });

  it('refuses to upgrade past MAX_UPGRADE_LEVEL — edge case', () => {
    let player = freshPlayer();
    const instanceId = player.ownedCars[0].instanceId;
    player = { ...player, credits: 100_000_000, ownedCars: [{ ...player.ownedCars[0], upgrades: { ...player.ownedCars[0].upgrades, Engine: MAX_UPGRADE_LEVEL } }] };
    const next = gameReducer(player, { type: 'UPGRADE_CAR', instanceId, category: 'Engine' })!;
    expect(next.ownedCars[0].upgrades.Engine).toBe(MAX_UPGRADE_LEVEL);
    expect(next.credits).toBe(player.credits); // nothing spent
  });

  it('consumes an upgrade part for a discount when available', () => {
    const player = { ...freshPlayer(), upgradeParts: 1 };
    const instanceId = player.ownedCars[0].instanceId;
    const next = gameReducer(player, { type: 'UPGRADE_CAR', instanceId, category: 'Engine' })!;
    expect(next.upgradeParts).toBe(0);
  });
});

describe('gameReducer — APPLY_RACE_RESULT', () => {
  it('deducts energy, grants credits/xp, and records race history', () => {
    const player = freshPlayer();
    const instanceId = player.ownedCars[0].instanceId;
    const result = fakeRaceResult();
    const next = gameReducer(player, { type: 'APPLY_RACE_RESULT', result, instanceId, source: { kind: 'free' } })!;
    expect(next.energy).toBe(player.energy - 4);
    // >= rather than === because postProcess may also grant achievement rewards
    // (e.g. "first race completed") on top of the race's own payout.
    expect(next.credits).toBeGreaterThanOrEqual(player.credits + result.creditsEarned + result.bonusCredits);
    expect(next.completedRaceCount).toBe(1);
    expect(next.wonRaceCount).toBe(1);
    expect(next.raceHistory).toHaveLength(1);
  });

  it('refuses to apply a race result when energy is 0 — required edge case', () => {
    const player = { ...freshPlayer(), energy: 0 };
    const instanceId = player.ownedCars[0].instanceId;
    const result = fakeRaceResult();
    const next = gameReducer(player, { type: 'APPLY_RACE_RESULT', result, instanceId, source: { kind: 'free' } });
    expect(next).toBe(player); // unchanged
  });

  it('does not award a win when the player DNFs', () => {
    const player = freshPlayer();
    const instanceId = player.ownedCars[0].instanceId;
    const result = fakeRaceResult({ playerPosition: 8, playerDnf: true, creditsEarned: 0, bonusCredits: 0 });
    const next = gameReducer(player, { type: 'APPLY_RACE_RESULT', result, instanceId, source: { kind: 'free' } })!;
    expect(next.wonRaceCount).toBe(0);
    expect(next.completedRaceCount).toBe(1);
  });

  it('marks a championship complete once the final race is won with at least 3 wins', () => {
    let player = freshPlayer();
    const instanceId = player.ownedCars[0].instanceId;
    const championshipId = 'champ_01';
    player = { ...player, championshipProgress: { [championshipId]: { racesWon: 2, completed: false, standing: 1 } } };
    const result = fakeRaceResult();
    const next = gameReducer(player, { type: 'APPLY_RACE_RESULT', result, instanceId, source: { kind: 'championship', championshipId, raceIndex: 4 } })!;
    expect(next.championshipProgress[championshipId].completed).toBe(true);
  });
});

describe('gameReducer — OPEN_PACK', () => {
  it('rejects an invalid pack id instead of crashing — required edge case', () => {
    const player = freshPlayer();
    const next = gameReducer(player, { type: 'OPEN_PACK', packId: 'not_a_real_pack' });
    expect(next).toBe(player);
  });

  it('spends currency and adds the correct number of cars for a valid pack', () => {
    const pack = PACKS.find(p => p.currency === 'credits')!;
    const player = { ...freshPlayer(), credits: 1_000_000 };
    const before = player.ownedCars.length;
    const next = gameReducer(player, { type: 'OPEN_PACK', packId: pack.id })!;
    expect(next.ownedCars.length).toBe(before + pack.carCount);
    expect(next.credits).toBe(player.credits - pack.price);
  });

  it('refuses to open a pack that would overflow a full garage — required edge case', () => {
    const pack = PACKS.find(p => p.currency === 'credits')!;
    const base = freshPlayer();
    const fullGarage = Array.from({ length: base.garageSlots }, () => createCarInstance(STARTER_CAR_IDS[0]));
    const player = { ...base, credits: 1_000_000, ownedCars: fullGarage };
    const next = gameReducer(player, { type: 'OPEN_PACK', packId: pack.id });
    expect(next).toBe(player); // unchanged: no room, no currency spent
  });
});

describe('gameReducer — BUY_MARKET_CAR', () => {
  it('refuses to buy a car when the garage is already full — required edge case', () => {
    const base = freshPlayer();
    const fullGarage = Array.from({ length: base.garageSlots }, () => createCarInstance(STARTER_CAR_IDS[0]));
    const player = {
      ...base,
      credits: 1_000_000,
      ownedCars: fullGarage,
      marketListings: [{ id: 'listing_1', defId: STARTER_CAR_IDS[0], price: 100, condition: 80, upgrades: fullGarage[0].upgrades, expiresAt: Date.now() + 1000 }],
    };
    const next = gameReducer(player, { type: 'BUY_MARKET_CAR', listingId: 'listing_1' });
    expect(next).toBe(player);
  });
});

describe('gameReducer — CLAIM_DAILY_REWARD', () => {
  it('grants day-1 reward and advances the streak on first claim', () => {
    const player = freshPlayer();
    const next = gameReducer(player, { type: 'CLAIM_DAILY_REWARD' })!;
    expect(next.dailyRewardStreak).toBe(1);
    expect(next.lastDailyClaim).not.toBeNull();
  });

  it('refuses a second claim within the same day', () => {
    const player = freshPlayer();
    const first = gameReducer(player, { type: 'CLAIM_DAILY_REWARD' })!;
    const second = gameReducer(first, { type: 'CLAIM_DAILY_REWARD' });
    expect(second).toBe(first);
  });

  it('resets the streak (not excessively punishing: back to day 1, not locked out) if more than 2 days were missed', () => {
    const player = { ...freshPlayer(), dailyRewardStreak: 5, lastDailyClaim: Date.now() - 3 * 24 * 60 * 60 * 1000 };
    const next = gameReducer(player, { type: 'CLAIM_DAILY_REWARD' })!;
    expect(next.dailyRewardStreak).toBe(1);
  });

  it('wraps from day 7 back to day 1 when claimed on consecutive days', () => {
    const player = { ...freshPlayer(), dailyRewardStreak: 7, lastDailyClaim: Date.now() - 25 * 60 * 60 * 1000 };
    const next = gameReducer(player, { type: 'CLAIM_DAILY_REWARD' })!;
    expect(next.dailyRewardStreak).toBe(1);
  });
});

describe('gameReducer — achievements integration', () => {
  it('unlocks an achievement automatically via postProcess after a qualifying action', () => {
    let player = freshPlayer();
    const instanceId = player.ownedCars[0].instanceId;
    for (let i = 0; i < 5; i++) {
      player = gameReducer(player, {
        type: 'APPLY_RACE_RESULT',
        result: fakeRaceResult(),
        instanceId,
        source: { kind: 'free' },
      })!;
    }
    expect(player.completedRaceCount).toBe(5);
    expect(player.achievementsUnlocked.length).toBeGreaterThan(0);
  });
});

describe('gameReducer — null-state guard', () => {
  it('ignores every action except NEW_GAME/LOAD_SAVE/RESET_SAVE when state is null', () => {
    expect(gameReducer(null, { type: 'TICK_ENERGY' })).toBeNull();
    expect(gameReducer(null, { type: 'UPGRADE_CAR', instanceId: 'x', category: UPGRADE_CATEGORIES[0] })).toBeNull();
  });
});
