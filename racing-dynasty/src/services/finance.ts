import type { FinanceLedgerEntry, GameDate, TeamDef } from '../types';

export function canAfford(budget: number, amount: number): boolean {
  return budget >= amount;
}

/**
 * Applies a transaction to a team's budget and appends a ledger line.
 * `amount` is positive for income, negative for an expense — the sign is
 * what the Finance screen uses to color the entry, nothing is inferred.
 */
export function applyTransaction(
  team: TeamDef,
  ledger: FinanceLedgerEntry[],
  date: GameDate,
  label: string,
  amount: number,
): { team: TeamDef; ledger: FinanceLedgerEntry[] } {
  return {
    team: { ...team, budget: team.budget + amount },
    ledger: [...ledger, { date, label, amount }],
  };
}

export function ledgerBalance(ledger: FinanceLedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.amount, 0);
}
