import { describe, expect, it } from 'vitest';
import { canAfford, spend, add, clamp, InsufficientFundsError } from './economy';

describe('economy', () => {
  it('canAfford is true exactly when balance >= cost, including the exact-match edge', () => {
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(99, 100)).toBe(false);
    expect(canAfford(0, 0)).toBe(true);
  });

  it('spend subtracts the cost when affordable', () => {
    expect(spend(500, 200, 'credits')).toBe(300);
  });

  it('spend throws InsufficientFundsError with 0 credits — required edge case', () => {
    expect(() => spend(0, 10, 'credits')).toThrow(InsufficientFundsError);
    try {
      spend(0, 10, 'credits');
    } catch (e) {
      expect(e).toBeInstanceOf(InsufficientFundsError);
      expect((e as InsufficientFundsError).currency).toBe('credits');
      expect((e as InsufficientFundsError).needed).toBe(10);
      expect((e as InsufficientFundsError).have).toBe(0);
    }
  });

  it('spend throws InsufficientFundsError with 0 energy — required edge case', () => {
    expect(() => spend(0, 4, 'energy')).toThrow(InsufficientFundsError);
  });

  it('add never produces a negative balance even with a large negative delta', () => {
    expect(add(50, -1000)).toBe(0);
    expect(add(50, 10)).toBe(60);
  });

  it('clamp keeps a value within [min, max], including out-of-range inputs on both sides', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
