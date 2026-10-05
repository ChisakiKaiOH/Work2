import { describe, expect, it } from 'vitest';
import { checkNewAchievements, conditionValue } from './achievements';
import { createNewPlayer } from '../game/initialState';
import { UPGRADE_CATEGORIES, MAX_UPGRADE_LEVEL } from '../types';

describe('achievements', () => {
  it('unlocks nothing for a freshly-created player (no achievement has a 0 threshold)', () => {
    const player = createNewPlayer('Test');
    const unlocked = checkNewAchievements(player);
    expect(unlocked).toHaveLength(0);
  });

  it('unlocks a racesCompleted achievement once the threshold is met', () => {
    const player = { ...createNewPlayer('Test'), completedRaceCount: 50 };
    const unlocked = checkNewAchievements(player);
    expect(unlocked.length).toBeGreaterThan(0);
  });

  it('does not re-report an already-unlocked achievement', () => {
    let player = { ...createNewPlayer('Test'), completedRaceCount: 50 };
    const firstPass = checkNewAchievements(player);
    player = { ...player, achievementsUnlocked: [...player.achievementsUnlocked, ...firstPass] };
    const secondPass = checkNewAchievements(player);
    expect(secondPass).toHaveLength(0);
  });

  it('maxUpgradesOnCar distinguishes "any category maxed" from "every category maxed on one car"', () => {
    const player = createNewPlayer('Test');
    const car = player.ownedCars[0] ?? { instanceId: 'c', defId: 'car_001', acquiredAt: 0, upgrades: Object.fromEntries(UPGRADE_CATEGORIES.map(c => [c, 0])) as Record<string, number>, equippedTire: 'Sport' as const, xp: 0, racesCompleted: 0, wins: 0, favorite: false };

    const oneMaxed = { ...player, ownedCars: [{ ...car, upgrades: { ...car.upgrades, Engine: MAX_UPGRADE_LEVEL } }] };
    expect(conditionValue(oneMaxed, { type: 'maxUpgradesOnCar', count: 1 })).toBe(1);
    expect(conditionValue(oneMaxed, { type: 'maxUpgradesOnCar', count: UPGRADE_CATEGORIES.length })).toBe(1);

    const allMaxed = { ...player, ownedCars: [{ ...car, upgrades: Object.fromEntries(UPGRADE_CATEGORIES.map(c => [c, MAX_UPGRADE_LEVEL])) as Record<string, number> }] };
    expect(conditionValue(allMaxed, { type: 'maxUpgradesOnCar', count: UPGRADE_CATEGORIES.length })).toBe(UPGRADE_CATEGORIES.length);
  });

  it('conditionValue returns 0 for an empty-garage player on carsOwned/legendaryCarsOwned — edge case', () => {
    const player = { ...createNewPlayer('Test'), ownedCars: [] };
    expect(conditionValue(player, { type: 'carsOwned', count: 1 })).toBe(0);
    expect(conditionValue(player, { type: 'legendaryCarsOwned', count: 1 })).toBe(0);
  });
});
