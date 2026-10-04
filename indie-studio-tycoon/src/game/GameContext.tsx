import { createContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import type { GameState } from "../types";
import type { GameAction } from "./actions";
import { gameReducer } from "./reducer";
import { createNewGameState } from "./initialState";
import { saveToSlot } from "../systems/saveSystem";

export const GameStateContext = createContext<GameState | null>(null);
export const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

const SPEED_INTERVAL_MS: Record<number, number> = { 1: 3500, 2: 1750, 4: 900 };

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createNewGameState("Nuovo Studio"));

  useEffect(() => {
    if (state.time.speed === 0 || state.gameOver || state.activeEvent || state.tutorialStep != null) return;
    const interval = SPEED_INTERVAL_MS[state.time.speed] ?? SPEED_INTERVAL_MS[1];
    const id = window.setInterval(() => dispatch({ type: "TICK" }), interval);
    return () => window.clearInterval(id);
  }, [state.time.speed, state.gameOver, state.activeEvent, state.tutorialStep]);

  // Autosave: ogni volta che avanza il mese, se è impostato uno slot attivo
  // lo stato viene salvato automaticamente, così si può chiudere e riaprire
  // l'app senza perdere i progressi.
  useEffect(() => {
    if (state.activeSlot != null) {
      saveToSlot(state.activeSlot, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.month, state.activeSlot]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}
