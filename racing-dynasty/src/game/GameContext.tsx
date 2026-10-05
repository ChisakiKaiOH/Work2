import { createContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { PlayerState } from '../types';
import type { GameAction } from './actions';
import { gameReducer } from './reducer';
import { SaveManager } from '../save/SaveManager';

export const GameStateContext = createContext<PlayerState | null>(null);
export const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

const ENERGY_TICK_MS = 30_000;
const AUTOSAVE_DEBOUNCE_MS = 1500;

function init(): PlayerState | null {
  return SaveManager.load();
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, init);

  // Energy regenerates passively over real time; re-check periodically so the
  // UI reflects regen even if the player leaves a screen open for a while.
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK_ENERGY' }), ENERGY_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Debounced autosave: any state change schedules a save a little later so
  // rapid-fire actions (e.g. several upgrades in a row) don't thrash storage.
  useEffect(() => {
    if (!state) return;
    const id = window.setTimeout(() => SaveManager.save(state), AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [state]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}
