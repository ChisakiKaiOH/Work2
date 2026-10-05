import { createContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { PlayerState } from '../types';
import type { GameAction } from './actions';
import { gameReducer } from './reducer';
import { SaveManager } from '../save/SaveManager';

export const GameStateContext = createContext<PlayerState | null>(null);
export const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

const AUTOSAVE_DEBOUNCE_MS = 1200;

function init(): PlayerState | null {
  return SaveManager.load();
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, init);

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
