import { describe, expect, it } from 'vitest';
import { canAfford, applyTransaction, ledgerBalance } from './finance';
import type { TeamDef } from '../types';

const team: TeamDef = {
  id: 't1', displayName: 'Test Team', ownerName: 'X', founded: 1970, isPlayer: true,
  reputation: 50, budget: 1000, carInstanceIds: [], driverIds: [], active: true,
};
const date = { year: 1970, month: 1, day: 1 };

describe('finance', () => {
  it('canAfford is true exactly when budget >= amount, including the exact-match edge', () => {
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(99, 100)).toBe(false);
    expect(canAfford(0, 0)).toBe(true);
  });

  it('applyTransaction adjusts budget and appends a ledger line with the signed amount', () => {
    const { team: next, ledger } = applyTransaction(team, [], date, 'Test income', 500);
    expect(next.budget).toBe(1500);
    expect(ledger).toHaveLength(1);
    expect(ledger[0].amount).toBe(500);
  });

  it('applyTransaction allows a negative delta to push budget below zero (not blocked here — the reducer checks affordability first)', () => {
    const { team: next } = applyTransaction(team, [], date, 'Big expense', -2000);
    expect(next.budget).toBe(-1000);
  });

  it('ledgerBalance sums income and expenses correctly', () => {
    const ledger = [
      { date, label: 'a', amount: 100 },
      { date, label: 'b', amount: -40 },
      { date, label: 'c', amount: 10 },
    ];
    expect(ledgerBalance(ledger)).toBe(70);
  });

  it('ledgerBalance of an empty ledger is 0 — edge case', () => {
    expect(ledgerBalance([])).toBe(0);
  });
});
