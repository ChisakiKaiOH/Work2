import { useContext } from 'react';
import { GameStateContext, GameDispatchContext } from './GameContext';

export function useGameState() {
  return useContext(GameStateContext);
}

export function useGameDispatch() {
  const dispatch = useContext(GameDispatchContext);
  if (!dispatch) throw new Error('useGameDispatch must be used within a GameProvider');
  return dispatch;
}
