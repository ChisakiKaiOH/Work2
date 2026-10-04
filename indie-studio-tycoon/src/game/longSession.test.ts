import { describe, expect, it } from "vitest";
import { gameReducer } from "./reducer";
import { createNewGameState } from "./initialState";

// Verifica di stabilità/performance su una sessione molto lunga (50 anni di
// gioco): nessun crash, nessuna crescita illimitata delle liste che si
// accumulano nel tempo (notifiche, news, eventi, cataloghi dei rivali), e
// tempo di esecuzione contenuto anche su centinaia di tick consecutivi.
describe("long session stability", () => {
  it("runs 600 ticks (50 game-years) without throwing and keeps bounded arrays", () => {
    // Denaro effettivamente infinito: qui si verifica la stabilità/
    // performance della simulazione del mondo nel lungo periodo, non la
    // sopravvivenza economica (già coperta da altri test sulla bancarotta).
    let state = { ...createNewGameState("Marathon Studio"), money: 1_000_000_000_000 };
    const start = Date.now();
    for (let i = 0; i < 600; i++) {
      state = gameReducer(state, { type: "TICK" });
      if (state.activeEvent) {
        state = gameReducer(state, { type: "RESOLVE_EVENT", choiceIndex: 0 });
      }
    }
    const elapsedMs = Date.now() - start;

    expect(state.month).toBe(601);
    expect(state.notifications.length).toBeLessThanOrEqual(40);
    expect(state.news.length).toBeLessThanOrEqual(60);
    expect(state.globalEvents.length).toBeLessThanOrEqual(40);
    expect(state.awardCeremonies.length).toBeLessThanOrEqual(30);
    expect(state.eventLog.length).toBeLessThanOrEqual(50);
    for (const company of state.companies) {
      expect(company.games.length).toBeLessThanOrEqual(60);
    }
    // Molto permissivo: serve solo a intercettare una regressione grave di
    // performance (es. un ciclo accidentalmente quadratico), non a misurare
    // con precisione la velocità della macchina che esegue il test.
    expect(elapsedMs).toBeLessThan(5000);
  });

  it("the world keeps at least a few active companies alive after decades of simulation", () => {
    let state = { ...createNewGameState("Marathon Studio"), money: 1_000_000_000_000 };
    for (let i = 0; i < 600; i++) {
      state = gameReducer(state, { type: "TICK" });
      if (state.activeEvent) state = gameReducer(state, { type: "RESOLVE_EVENT", choiceIndex: 0 });
    }
    expect(state.companies.length).toBeGreaterThan(0);
  });
});
