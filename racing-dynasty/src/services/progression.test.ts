import { describe, expect, it } from 'vitest';
import { xpToNextLevel, applyXp, maxEnergyForLevel, tickEnergy, ENERGY_REGEN_MS, MAX_LEVEL } from './progression';

describe('progression', () => {
  it('xpToNextLevel increases with level (the climb never gets easier)', () => {
    expect(xpToNextLevel(10)).toBeGreaterThan(xpToNextLevel(1));
    expect(xpToNextLevel(50)).toBeGreaterThan(xpToNextLevel(10));
  });

  it('applyXp resolves a single level-up correctly', () => {
    const needed = xpToNextLevel(1);
    const { level, xp, rewards } = applyXp(1, 0, needed);
    expect(level).toBe(2);
    expect(xp).toBe(0);
    expect(rewards).toHaveLength(1);
  });

  it('applyXp cascades multiple level-ups from one large XP grant', () => {
    const hugeXp = xpToNextLevel(1) + xpToNextLevel(2) + xpToNextLevel(3) + 50;
    const { level, rewards } = applyXp(1, 0, hugeXp);
    expect(level).toBe(4);
    expect(rewards).toHaveLength(3);
  });

  it('applyXp never exceeds MAX_LEVEL even with an absurd XP grant — edge case', () => {
    const { level, xp } = applyXp(1, 0, 10_000_000);
    expect(level).toBe(MAX_LEVEL);
    expect(xp).toBe(0);
  });

  it('applyXp with 0 XP gained makes no progress', () => {
    const { level, xp, rewards } = applyXp(5, 10, 0);
    expect(level).toBe(5);
    expect(xp).toBe(10);
    expect(rewards).toHaveLength(0);
  });

  it('maxEnergyForLevel increases every 5 levels', () => {
    expect(maxEnergyForLevel(1)).toBe(20);
    expect(maxEnergyForLevel(5)).toBeGreaterThan(maxEnergyForLevel(1));
    expect(maxEnergyForLevel(100)).toBeGreaterThan(maxEnergyForLevel(50));
  });

  describe('tickEnergy', () => {
    it('regenerates 1 point per ENERGY_REGEN_MS elapsed', () => {
      const { energy, lastTick } = tickEnergy(10, 20, 0, ENERGY_REGEN_MS * 3);
      expect(energy).toBe(13);
      expect(lastTick).toBe(ENERGY_REGEN_MS * 3);
    });

    it('never exceeds maxEnergy, even with a huge elapsed time', () => {
      const { energy } = tickEnergy(18, 20, 0, ENERGY_REGEN_MS * 1000);
      expect(energy).toBe(20);
    });

    it('does nothing when energy is already at 0 and no time has passed — edge case', () => {
      const { energy, lastTick } = tickEnergy(0, 20, 1000, 1000);
      expect(energy).toBe(0);
      expect(lastTick).toBe(1000);
    });

    it('is a no-op once energy is already at the max', () => {
      const { energy, lastTick } = tickEnergy(20, 20, 1000, 999_999);
      expect(energy).toBe(20);
      expect(lastTick).toBe(999_999);
    });

    it('carries over leftover (non-whole-interval) time instead of discarding it', () => {
      const partial = ENERGY_REGEN_MS * 1.5;
      const { energy, lastTick } = tickEnergy(0, 20, 0, partial);
      expect(energy).toBe(1);
      expect(lastTick).toBe(ENERGY_REGEN_MS);
    });
  });
});
