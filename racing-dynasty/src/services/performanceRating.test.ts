import { describe, expect, it } from 'vitest';
import { performanceRating, effectiveStats, emptyUpgrades, upgradeCost, isMaxLevel, prTier, carInstancePR } from './performanceRating';
import { CAR_BY_ID, STARTER_CAR_IDS } from '../data';
import { MAX_UPGRADE_LEVEL } from '../types';

describe('performanceRating', () => {
  it('is deterministic — same stats always produce the same PR (never random)', () => {
    const stats = { power: 150, acceleration: 120, topSpeed: 140, braking: 100, grip: 110, stability: 90, reliability: 80, weight: 1200, traction: 95 };
    const a = performanceRating(stats);
    const b = performanceRating(stats);
    expect(a).toBe(b);
  });

  it('increases monotonically as every stat improves', () => {
    const base = { power: 100, acceleration: 100, topSpeed: 100, braking: 100, grip: 100, stability: 100, reliability: 100, weight: 1400, traction: 100 };
    const better = { ...base, power: 150, acceleration: 150 };
    expect(performanceRating(better)).toBeGreaterThan(performanceRating(base));
  });

  it('places the three starter cars around PR ~180 as specified', () => {
    for (const id of STARTER_CAR_IDS) {
      const def = CAR_BY_ID[id];
      const pr = performanceRating(def.stats);
      expect(pr).toBeGreaterThanOrEqual(150);
      expect(pr).toBeLessThanOrEqual(210);
    }
  });

  it('category tiers increase monotonically with PR', () => {
    expect(prTier(50)).toBe('Rookie');
    expect(prTier(300)).toBe('Street');
    expect(prTier(400)).toBe('Sport');
    expect(prTier(500)).toBe('Super');
    expect(prTier(600)).toBe('Hyper');
    expect(prTier(700)).toBe('Legend');
    expect(prTier(999)).toBe('Legend');
  });
});

describe('upgrades', () => {
  it('starts every category at level 0', () => {
    const upgrades = emptyUpgrades();
    expect(Object.values(upgrades).every(v => v === 0)).toBe(true);
  });

  it('upgradeCost increases as level increases (never cheaper later)', () => {
    const c0 = upgradeCost('Engine', 0);
    const c5 = upgradeCost('Engine', 5);
    const c9 = upgradeCost('Engine', 9);
    expect(c5).toBeGreaterThan(c0);
    expect(c9).toBeGreaterThan(c5);
  });

  it('isMaxLevel is true exactly at MAX_UPGRADE_LEVEL (edge case)', () => {
    expect(isMaxLevel(MAX_UPGRADE_LEVEL - 1)).toBe(false);
    expect(isMaxLevel(MAX_UPGRADE_LEVEL)).toBe(true);
    expect(isMaxLevel(MAX_UPGRADE_LEVEL + 5)).toBe(true);
  });

  it('effectiveStats raises PR as upgrade levels increase, and clamps at the max level', () => {
    const def = CAR_BY_ID[STARTER_CAR_IDS[0]];
    const none = effectiveStats(def.stats, emptyUpgrades());
    const half = effectiveStats(def.stats, { ...emptyUpgrades(), Engine: 5, Turbo: 5 });
    const maxed = effectiveStats(def.stats, Object.fromEntries(Object.keys(emptyUpgrades()).map(k => [k, MAX_UPGRADE_LEVEL])) as ReturnType<typeof emptyUpgrades>);
    expect(performanceRating(half)).toBeGreaterThan(performanceRating(none));
    expect(performanceRating(maxed)).toBeGreaterThan(performanceRating(half));
    // every stat stays within the documented 10-260 band regardless of how many categories are maxed
    for (const key of Object.keys(maxed) as (keyof typeof maxed)[]) {
      if (key === 'weight') continue;
      expect(maxed[key]).toBeLessThanOrEqual(260);
      expect(maxed[key]).toBeGreaterThanOrEqual(10);
    }
    expect(maxed.weight).toBeGreaterThanOrEqual(650);
  });

  it('carInstancePR matches performanceRating(effectiveStats(...))', () => {
    const def = CAR_BY_ID[STARTER_CAR_IDS[1]];
    const instance = { instanceId: 'x', defId: def.id, acquiredAt: 0, upgrades: emptyUpgrades(), equippedTire: 'Sport' as const, xp: 0, racesCompleted: 0, wins: 0, favorite: false };
    expect(carInstancePR(def, instance)).toBe(performanceRating(effectiveStats(def.stats, instance.upgrades)));
  });
});
