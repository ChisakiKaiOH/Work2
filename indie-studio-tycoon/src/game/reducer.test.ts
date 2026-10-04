import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gameReducer } from "./reducer";
import { createNewGameState } from "./initialState";

// Il motore degli eventi casuali usa Math.random(): per rendere questi test
// deterministici (non dipendenti dall'eventuale comparsa di un evento) lo
// fissiamo a un valore che non fa mai scattare un evento nel tick.
beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.99);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("gameReducer — time and core flow", () => {
  it("TICK advances the month by one and settles salaries against money", () => {
    const state = createNewGameState("Test Studio");
    const salaries = state.employees.reduce((sum, e) => sum + e.salary, 0);
    const next = gameReducer(state, { type: "TICK" });

    expect(next.month).toBe(state.month + 1);
    // Nessuna vendita ancora: il denaro deve scendere almeno dell'importo degli stipendi.
    expect(next.money).toBeLessThanOrEqual(state.money - salaries + 1);
  });

  it("SET_SPEED updates the time speed without side effects", () => {
    const state = createNewGameState("Test Studio");
    const paused = gameReducer(state, { type: "SET_SPEED", speed: 0 });
    expect(paused.time.speed).toBe(0);
    expect(paused.month).toBe(state.month);
  });

  it("START_PROJECT deducts the budget and creates a project assigned to the chosen employees", () => {
    const state = createNewGameState("Test Studio");
    const employeeId = state.employees[0].id;
    const moneyBefore = state.money;

    const next = gameReducer(state, {
      type: "START_PROJECT",
      choice: { genre: "Puzzle", platforms: ["Mobile"], size: "Small", theme: "Modern" },
      allocation: { gameplay: 50, technology: 15, graphics: 15, sound: 10, story: 10 },
      employeeIds: [employeeId],
    });

    expect(next.projects).toHaveLength(1);
    expect(next.money).toBeLessThan(moneyBefore);
    expect(next.employees.find((e) => e.id === employeeId)?.assignedProjectId).toBe(next.projects[0].id);
  });

  it("repeated TICKs eventually complete a Small project and allow publishing it", () => {
    let state = createNewGameState("Test Studio");
    const employeeId = state.employees[0].id;
    state = gameReducer(state, {
      type: "START_PROJECT",
      choice: { genre: "Casual", platforms: ["Mobile"], size: "Small", theme: "Modern" },
      allocation: { gameplay: 40, technology: 20, graphics: 20, sound: 10, story: 10 },
      employeeIds: [employeeId],
    });

    let guard = 0;
    while (state.projects.length > 0 && !state.projects[0].completed && guard < 200) {
      state = gameReducer(state, { type: "TICK" });
      guard += 1;
    }

    expect(state.projects[0].completed).toBe(true);

    const projectId = state.projects[0].id;
    const published = gameReducer(state, { type: "PUBLISH_PROJECT", projectId, price: 10 });
    expect(published.projects).toHaveLength(0);
    expect(published.releasedGames).toHaveLength(1);
    expect(published.releasedGames[0].criticScore).toBeGreaterThanOrEqual(1);
  });

  it("bankruptcy triggers game over only after the grace period of negative months", () => {
    let state = createNewGameState("Test Studio");
    state = { ...state, money: 100 };

    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, { type: "TICK" });
    }
    expect(state.gameOver).toBe(false);

    state = gameReducer(state, { type: "TICK" });
    expect(state.gameOver).toBe(true);
  });

  it("NEW_GAME applies the chosen mode/difficulty starting money", () => {
    const easy = gameReducer(createNewGameState("X"), { type: "NEW_GAME", studioName: "Easy Co", mode: "Career", difficulty: "Easy" });
    const insane = gameReducer(createNewGameState("X"), { type: "NEW_GAME", studioName: "Insane Co", mode: "Career", difficulty: "Insane" });
    expect(easy.money).toBeGreaterThan(insane.money);
    expect(easy.difficulty).toBe("Easy");
  });

  it("publishing a project creates a matching IP", () => {
    let state = createNewGameState("Test Studio");
    const employeeId = state.employees[0].id;
    state = gameReducer(state, {
      type: "START_PROJECT",
      choice: { genre: "Casual", platforms: ["Mobile"], size: "Small", theme: "Modern" },
      allocation: { gameplay: 40, technology: 20, graphics: 20, sound: 10, story: 10 },
      employeeIds: [employeeId],
    });
    let guard = 0;
    while (!state.projects[0].completed && guard < 200) {
      state = gameReducer(state, { type: "TICK" });
      guard += 1;
    }
    const projectId = state.projects[0].id;
    state = gameReducer(state, { type: "PUBLISH_PROJECT", projectId, price: 10 });
    expect(state.ips).toHaveLength(1);
    expect(state.ips[0].entries[0].kind).toBe("Original");
  });

  it("ACQUIRE_COMPANY (full) absorbs the target and removes it from the world", () => {
    let state = createNewGameState("Test Studio");
    // Denaro ben oltre il valore massimo generabile per una qualunque azienda
    // iniziale, così il test non dipende da quale azienda casuale capiti prima.
    state = { ...state, money: 2_000_000_000 };
    const target = state.companies[0];
    const next = gameReducer(state, { type: "ACQUIRE_COMPANY", companyId: target.id, mode: "full", postChoice: "integrate" });
    expect(next.companies.find((c) => c.id === target.id)).toBeUndefined();
    expect(next.money).toBeLessThan(state.money);
    expect(next.stats.acquisitionsCompleted).toBe(1);
  });

  it("ACQUIRE_COMPANY is a no-op when the player cannot afford the offer", () => {
    let state = createNewGameState("Test Studio");
    const target = { ...state.companies[0], companyValue: 500_000_000 };
    state = { ...state, companies: [target, ...state.companies.slice(1)] };
    const next = gameReducer(state, { type: "ACQUIRE_COMPANY", companyId: target.id, mode: "full", postChoice: "integrate" });
    expect(next.money).toBe(state.money);
    expect(next.companies.find((c) => c.id === target.id)).toBeDefined();
  });

  it("GO_PUBLIC requires a minimum company value, then BUY_SHARES/SELL_SHARES work against a public rival", () => {
    let state = createNewGameState("Test Studio");
    const blocked = gameReducer(state, { type: "GO_PUBLIC" });
    expect(blocked.stockMarket.playerIsPublic).toBe(false);

    state = { ...state, companyValue: 25_000_000, money: 1_000_000 };
    state = gameReducer(state, { type: "GO_PUBLIC" });
    expect(state.stockMarket.playerIsPublic).toBe(true);
    expect(state.stockMarket.playerSharePrice).toBeGreaterThan(0);

    const rival = { ...state.companies[0], isPublic: true, sharePrice: 10, sharesOutstanding: 1_000_000 };
    state = { ...state, companies: [rival, ...state.companies.slice(1)] };
    state = gameReducer(state, { type: "BUY_SHARES", companyId: rival.id, shares: 100 });
    expect(state.stockMarket.holdings).toHaveLength(1);
    expect(state.money).toBe(1_000_000 - 1000);

    state = gameReducer(state, { type: "SELL_SHARES", companyId: rival.id, shares: 100 });
    expect(state.stockMarket.holdings).toHaveLength(0);
  });
});
