// EconomyService — the ONLY module allowed to change credits/tokens/energy.
// Screens must call these functions through the reducer instead of mutating
// PlayerState fields directly: that keeps every economic change in one
// auditable place, which is exactly what a future server-side validation
// pass (EconomyValidationService, see services/backendMocks.ts) would need
// to intercept without the UI code changing at all.

export class InsufficientFundsError extends Error {
  currency: 'credits' | 'tokens' | 'energy';
  needed: number;
  have: number;

  constructor(currency: 'credits' | 'tokens' | 'energy', needed: number, have: number) {
    super(`Not enough ${currency}: need ${needed}, have ${have}`);
    this.currency = currency;
    this.needed = needed;
    this.have = have;
  }
}

export function canAfford(balance: number, cost: number): boolean {
  return balance >= cost;
}

export function spend(balance: number, cost: number, currency: 'credits' | 'tokens' | 'energy'): number {
  if (balance < cost) throw new InsufficientFundsError(currency, cost, balance);
  return balance - cost;
}

export function add(balance: number, amount: number): number {
  return Math.max(0, balance + amount);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
