import { describe, expect, it } from "vitest";
import type { Employee, OfficeUpgrade } from "../types";
import { computeMonthlyLedger, officeUpkeep, totalSalaries, STARTING_MONEY } from "./economy";
import { createInitialOfficeUpgrades } from "../data/officeUpgrades";

function makeEmployee(salary: number): Employee {
  return {
    id: "e1",
    name: "Test",
    role: "Programmer",
    level: 1,
    salary,
    productivity: 70,
    morale: 70,
    experience: 0,
    hiredMonth: 1,
    assignedProjectId: null,
  };
}

describe("economy", () => {
  it("sums salaries correctly", () => {
    const employees = [makeEmployee(2000), makeEmployee(3000)];
    expect(totalSalaries(employees)).toBe(5000);
  });

  it("computes office upkeep from upgrade levels", () => {
    const upgrades: OfficeUpgrade[] = createInitialOfficeUpgrades().map((u) => ({ ...u, level: 2 }));
    const expected = upgrades.reduce((sum, u) => sum + u.upkeepPerLevel * 2, 0);
    expect(officeUpkeep(upgrades)).toBe(expected);
  });

  it("computes a monthly ledger with profit = income - expenses", () => {
    const employees = [makeEmployee(2000)];
    const officeUpgrades = createInitialOfficeUpgrades();
    const ledger = computeMonthlyLedger({
      employees,
      officeUpgrades,
      marketingSpend: 500,
      researchSpend: 0,
      salesRevenue: 4000,
    });
    expect(ledger.salaries).toBe(2000);
    expect(ledger.marketing).toBe(500);
    expect(ledger.totalExpenses).toBe(ledger.salaries + ledger.rent + ledger.upkeep + ledger.marketing + ledger.research);
    expect(ledger.profit).toBe(ledger.totalIncome - ledger.totalExpenses);
  });

  it("starts with the specified starting capital", () => {
    expect(STARTING_MONEY).toBe(50_000);
  });
});
