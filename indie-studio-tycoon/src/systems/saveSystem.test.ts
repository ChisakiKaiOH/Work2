import { beforeEach, describe, expect, it } from "vitest";
import { createNewGameState } from "../game/initialState";
import { deleteSlot, getSaveMeta, isTutorialSeen, listSaveMeta, loadFromSlot, markTutorialSeen, saveToSlot } from "./saveSystem";

beforeEach(() => {
  localStorage.clear();
});

describe("saveSystem", () => {
  it("round-trips a full game state through a save slot", () => {
    const state = createNewGameState("Pixel Foglia");
    state.money = 12345;
    state.month = 7;

    saveToSlot(1, state);
    const loaded = loadFromSlot(1);

    expect(loaded).not.toBeNull();
    expect(loaded?.studioName).toBe("Pixel Foglia");
    expect(loaded?.money).toBe(12345);
    expect(loaded?.month).toBe(7);
    expect(loaded?.employees.length).toBe(state.employees.length);
  });

  it("returns null for an empty slot", () => {
    expect(loadFromSlot(2)).toBeNull();
    expect(getSaveMeta(2)).toBeNull();
  });

  it("lists metadata for all slots, including empty ones", () => {
    saveToSlot(1, createNewGameState("Studio A"));
    const metas = listSaveMeta();
    expect(metas).toHaveLength(3);
    expect(metas[0]?.studioName).toBe("Studio A");
    expect(metas[1]).toBeNull();
  });

  it("deletes a slot", () => {
    saveToSlot(3, createNewGameState("Studio C"));
    expect(loadFromSlot(3)).not.toBeNull();
    deleteSlot(3);
    expect(loadFromSlot(3)).toBeNull();
  });

  it("tracks whether the tutorial has been seen", () => {
    expect(isTutorialSeen()).toBe(false);
    markTutorialSeen();
    expect(isTutorialSeen()).toBe(true);
  });
});
