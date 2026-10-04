import { describe, expect, it } from "vitest";
import type { Employee, Project } from "../types";
import { advanceDevelopment, compatibilityFit, compatibilityLabel, compositeQualityScore } from "./development";
import { createProject, estimateProject, defaultAllocationFor } from "./projectFactory";

function makeEmployee(role: Employee["role"], id: string): Employee {
  return {
    id,
    name: "Dev",
    role,
    level: 3,
    salary: 3000,
    productivity: 80,
    morale: 80,
    experience: 0,
    hiredMonth: 1,
    assignedProjectId: null,
  };
}

const NO_OFFICE_BONUS = { workstationBoost: 1, bugReduction: 0, moraleRegen: 1 };

describe("development", () => {
  it("compatibilityFit is 1 for an allocation matching the genre's ideal exactly, and lower when unbalanced", () => {
    const allocation = defaultAllocationFor("RPG");
    const perfectFit = compatibilityFit("RPG", allocation);
    const badFit = compatibilityFit("RPG", { gameplay: 100, technology: 0, graphics: 0, sound: 0, story: 0 });
    expect(perfectFit).toBeGreaterThan(0.9);
    expect(compatibilityLabel(perfectFit)).toBe("Combinazione perfetta per il genere");
    expect(badFit).toBeLessThan(perfectFit);
  });

  it("advances phase progress and months elapsed each tick, eventually completing", () => {
    const choice = { genre: "Action" as const, platforms: ["PC" as const], size: "Small" as const, theme: "Modern" as const };
    const estimate = estimateProject(choice, { teamSize: 1, unlockedTechIds: [], genrePopularity: 50 });
    const employee = makeEmployee("Programmer", "p1");
    let project: Project = createProject(choice, defaultAllocationFor("Action"), estimate, [employee.id], 1);

    let guard = 0;
    while (!project.completed && guard < 500) {
      const result = advanceDevelopment(project, [employee], NO_OFFICE_BONUS);
      project = result.project;
      guard += 1;
    }

    expect(project.completed).toBe(true);
    expect(project.monthsElapsed).toBeGreaterThan(0);
    expect(guard).toBeLessThan(500);
  });

  it("progresses far more slowly with no team assigned than with a team", () => {
    const choice = { genre: "Puzzle" as const, platforms: ["Mobile" as const], size: "Small" as const, theme: "Modern" as const };
    const estimate = estimateProject(choice, { teamSize: 0, unlockedTechIds: [], genrePopularity: 50 });
    const unstaffed = createProject(choice, defaultAllocationFor("Puzzle"), estimate, [], 1);
    const staffed = createProject(choice, defaultAllocationFor("Puzzle"), estimate, ["p1"], 1);
    const employee = makeEmployee("Designer", "p1");

    const afterUnstaffed = advanceDevelopment(unstaffed, [], NO_OFFICE_BONUS).project;
    const afterStaffed = advanceDevelopment(staffed, [employee], NO_OFFICE_BONUS).project;

    const unstaffedProgress = afterUnstaffed.phaseIndex * 100 + afterUnstaffed.phaseProgress;
    const staffedProgress = afterStaffed.phaseIndex * 100 + afterStaffed.phaseProgress;
    expect(staffedProgress).toBeGreaterThan(unstaffedProgress);
  });

  it("composite quality score is reduced by bugs", () => {
    const base: Pick<Project, "quality" | "bugs" | "genre"> = {
      quality: { gameplay: 70, technology: 70, graphics: 70, sound: 70, story: 70 },
      bugs: 0,
      genre: "Strategy",
    };
    const clean = compositeQualityScore(base as Project);
    const buggy = compositeQualityScore({ ...base, bugs: 20 } as Project);
    expect(buggy).toBeLessThan(clean);
  });
});
