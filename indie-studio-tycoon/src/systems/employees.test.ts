import { describe, expect, it } from "vitest";
import { fireCost, generateCandidatePool, promoteEmployee, promotionCost, trainEmployee } from "./employees";

describe("employees", () => {
  it("generates the requested number of candidates with valid roles/levels", () => {
    const pool = generateCandidatePool(1, 5);
    expect(pool).toHaveLength(5);
    for (const e of pool) {
      expect(e.level).toBeGreaterThanOrEqual(1);
      expect(e.salary).toBeGreaterThan(0);
    }
  });

  it("promoting an employee raises level and salary", () => {
    const pool = generateCandidatePool(1, 1);
    const promoted = promoteEmployee(pool[0]);
    expect(promoted.level).toBe(pool[0].level + 1);
    expect(promoted.salary).toBeGreaterThan(pool[0].salary);
  });

  it("promotion cost scales with current level", () => {
    const pool = generateCandidatePool(1, 1);
    const low = { ...pool[0], level: 1 };
    const high = { ...pool[0], level: 4 };
    expect(promotionCost(high)).toBeGreaterThan(promotionCost(low));
  });

  it("training increases productivity and experience", () => {
    const pool = generateCandidatePool(1, 1);
    const trained = trainEmployee(pool[0]);
    expect(trained.experience).toBeGreaterThan(pool[0].experience);
    expect(trained.productivity).toBeGreaterThanOrEqual(pool[0].productivity);
  });

  it("fire cost equals one month of salary", () => {
    const pool = generateCandidatePool(1, 1);
    expect(fireCost(pool[0])).toBe(pool[0].salary);
  });
});
