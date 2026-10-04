import type { Employee, OfficeUpgrade, ReleasedGame } from "../types";

export const STARTING_MONEY = 50_000;
export const BASE_RENT = 700;
export const BANKRUPTCY_GRACE_MONTHS = 3;

export interface MonthlyLedger {
  salaries: number;
  rent: number;
  upkeep: number;
  marketing: number;
  research: number;
  totalExpenses: number;
  salesRevenue: number;
  totalIncome: number;
  profit: number;
}

export function totalSalaries(employees: Employee[]): number {
  return employees.reduce((sum, e) => sum + e.salary, 0);
}

export function officeUpkeep(officeUpgrades: OfficeUpgrade[]): number {
  return officeUpgrades.reduce((sum, upgrade) => sum + upgrade.upkeepPerLevel * upgrade.level, 0);
}

export function computeMonthlyLedger(params: {
  employees: Employee[];
  officeUpgrades: OfficeUpgrade[];
  marketingSpend: number;
  researchSpend: number;
  salesRevenue: number;
}): MonthlyLedger {
  const salaries = totalSalaries(params.employees);
  const upkeep = officeUpkeep(params.officeUpgrades);
  const rent = BASE_RENT;
  const totalExpenses = salaries + rent + upkeep + params.marketingSpend + params.researchSpend;
  const totalIncome = params.salesRevenue;
  return {
    salaries,
    rent,
    upkeep,
    marketing: params.marketingSpend,
    research: params.researchSpend,
    totalExpenses,
    salesRevenue: params.salesRevenue,
    totalIncome,
    profit: totalIncome - totalExpenses,
  };
}

export function sumReleasedRevenueThisMonth(games: ReleasedGame[], month: number): number {
  return games.reduce((sum, game) => {
    const entry = game.salesHistory.find((h) => h.month === month);
    return sum + (entry?.revenue ?? 0);
  }, 0);
}
