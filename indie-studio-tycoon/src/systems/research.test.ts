import { describe, expect, it } from "vitest";
import { canStartResearch, techQualityMultipliers } from "./research";

describe("research", () => {
  it("allows starting a prerequisite-free, available tech with enough money", () => {
    const research = { unlocked: [], active: null };
    expect(canStartResearch("engineBasic", research, 50_000, 1)).toBe(true);
  });

  it("blocks research without enough money", () => {
    const research = { unlocked: [], active: null };
    expect(canStartResearch("engineBasic", research, 100, 1)).toBe(false);
  });

  it("blocks research whose prerequisites are not yet unlocked", () => {
    const research = { unlocked: [], active: null };
    expect(canStartResearch("graphics3d", research, 1_000_000, 1)).toBe(false);
  });

  it("blocks a tech that is not yet available at the current month", () => {
    const research = { unlocked: ["engineBasic", "engineAdvanced", "graphics3d"], active: null };
    expect(canStartResearch("rayTracing", research, 1_000_000, 1)).toBe(false);
    expect(canStartResearch("rayTracing", research, 1_000_000, 24)).toBe(true);
  });

  it("blocks research while another is already active", () => {
    const research = { unlocked: [], active: { techId: "engineBasic", monthsRemaining: 1 } };
    expect(canStartResearch("audioSpatial", research, 1_000_000, 1)).toBe(false);
  });

  it("quality multipliers increase with more unlocked technologies", () => {
    const none = techQualityMultipliers([]);
    const some = techQualityMultipliers(["engineBasic", "engineAdvanced", "audioSpatial"]);
    expect(some.technology).toBeGreaterThan(none.technology);
    expect(some.sound).toBeGreaterThan(none.sound);
  });
});
