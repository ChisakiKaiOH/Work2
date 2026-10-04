import type { Employee, EmployeeRole } from "../types";
import { EMPLOYEE_ROLES, salaryForLevel } from "../data/employees";
import { generatePersonName } from "../utils/nameGenerator";
import { createId } from "../utils/id";
import { pick, randomInt, type RandomFn, defaultRandom } from "../utils/random";
import { clamp } from "../utils/format";

export function generateCandidate(month: number, rng: RandomFn = defaultRandom): Employee {
  const role = pick(EMPLOYEE_ROLES, rng);
  const level = randomInt(1, 3, rng);
  return {
    id: createId("emp"),
    name: generatePersonName(rng),
    role,
    level,
    salary: salaryForLevel(role, level),
    productivity: randomInt(55, 85, rng),
    morale: 75,
    experience: 0,
    hiredMonth: month,
    assignedProjectId: null,
  };
}

export function generateCandidatePool(month: number, count = 4, rng: RandomFn = defaultRandom): Employee[] {
  return Array.from({ length: count }, () => generateCandidate(month, rng));
}

export const SEVERANCE_MONTHS = 1;

export function fireCost(employee: Employee): number {
  return employee.salary * SEVERANCE_MONTHS;
}

export const PROMOTION_BASE_COST = 4000;

export function promotionCost(employee: Employee): number {
  return PROMOTION_BASE_COST * employee.level;
}

export function promoteEmployee(employee: Employee): Employee {
  const level = Math.min(5, employee.level + 1);
  return { ...employee, level, salary: salaryForLevel(employee.role, level), morale: clamp(employee.morale + 10, 0, 100) };
}

export const TRAINING_COST = 2500;

export function trainEmployee(employee: Employee, rng: RandomFn = defaultRandom): Employee {
  const xpGain = randomInt(15, 30, rng);
  const experience = employee.experience + xpGain;
  const productivity = clamp(employee.productivity + randomInt(2, 6, rng), 0, 100);
  return { ...employee, experience, productivity };
}

// Progressione passiva mensile: morale tende verso un valore base, l'esperienza
// cresce leggermente se assegnato a un progetto.
export function monthlyEmployeeDrift(employee: Employee, moraleRegen: number): Employee {
  const baseline = 70;
  const moraleDelta = employee.morale < baseline ? moraleRegen : -0.5;
  const morale = clamp(employee.morale + moraleDelta, 0, 100);
  const experience = employee.assignedProjectId ? employee.experience + 2 : employee.experience;
  return { ...employee, morale, experience };
}

export function roleLabel(role: EmployeeRole): string {
  switch (role) {
    case "Programmer":
      return "Programmatore";
    case "Designer":
      return "Designer";
    case "Artist":
      return "Artista";
    case "AudioDesigner":
      return "Sound Designer";
    case "Producer":
      return "Producer";
  }
}
