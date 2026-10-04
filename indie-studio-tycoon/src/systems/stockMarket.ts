import type { RivalCompany, StockHolding, StockMarketState } from "../types";
import { clamp } from "../utils/format";
import { randomFloat, type RandomFn, defaultRandom } from "../utils/random";

export const IPO_MIN_COMPANY_VALUE = 20_000_000;
export const PLAYER_SHARES_OUTSTANDING = 1_000_000;

export function canGoPublic(companyValue: number): boolean {
  return companyValue >= IPO_MIN_COMPANY_VALUE;
}

export function goPublic(companyValue: number): { sharePrice: number; sharesOutstanding: number } {
  return { sharePrice: Math.max(1, companyValue / PLAYER_SHARES_OUTSTANDING), sharesOutstanding: PLAYER_SHARES_OUTSTANDING };
}

// Il prezzo per azione reagisce al valore aziendale (fondamentali) e a una
// piccola componente di volatilità casuale (sentiment di mercato).
export function updateSharePrice(currentPrice: number, companyValue: number, sharesOutstanding: number, rng: RandomFn = defaultRandom): number {
  if (sharesOutstanding <= 0) return currentPrice;
  const fairValue = companyValue / sharesOutstanding;
  const drift = (fairValue - currentPrice) * 0.3;
  const volatility = currentPrice * randomFloat(-0.04, 0.04, rng);
  return Math.max(0.1, currentPrice + drift + volatility);
}

export function tickPublicCompanies(companies: RivalCompany[], rng: RandomFn = defaultRandom): RivalCompany[] {
  return companies.map((c) => {
    if (!c.isPublic) return c;
    const sharesOutstanding = c.sharesOutstanding || 1_000_000;
    const sharePrice = c.sharePrice > 0 ? updateSharePrice(c.sharePrice, c.companyValue, sharesOutstanding, rng) : c.companyValue / sharesOutstanding;
    return { ...c, sharesOutstanding, sharePrice };
  });
}

export function buyShares(market: StockMarketState, companyId: string, shares: number, price: number): StockMarketState {
  const existing = market.holdings.find((h) => h.companyId === companyId);
  if (!existing) {
    return { ...market, holdings: [...market.holdings, { companyId, shares, averagePrice: price }] };
  }
  const totalShares = existing.shares + shares;
  const averagePrice = (existing.averagePrice * existing.shares + price * shares) / totalShares;
  return {
    ...market,
    holdings: market.holdings.map((h) => (h.companyId === companyId ? { ...h, shares: totalShares, averagePrice } : h)),
  };
}

export function sellShares(market: StockMarketState, companyId: string, shares: number): { market: StockMarketState; proceedsShares: number } {
  const existing = market.holdings.find((h) => h.companyId === companyId);
  if (!existing) return { market, proceedsShares: 0 };
  const sold = Math.min(existing.shares, shares);
  const remaining = existing.shares - sold;
  const holdings = remaining > 0
    ? market.holdings.map((h) => (h.companyId === companyId ? { ...h, shares: remaining } : h))
    : market.holdings.filter((h) => h.companyId !== companyId);
  return { market: { ...market, holdings }, proceedsShares: sold };
}

export function holdingValue(holding: StockHolding, companies: RivalCompany[]): number {
  const company = companies.find((c) => c.id === holding.companyId);
  if (!company) return 0;
  return holding.shares * company.sharePrice;
}

export function portfolioValue(market: StockMarketState, companies: RivalCompany[]): number {
  return market.holdings.reduce((sum, h) => sum + holdingValue(h, companies), 0);
}

export function clampOwnershipShares(shares: number, sharesOutstanding: number): number {
  return clamp(shares, 0, sharesOutstanding);
}
