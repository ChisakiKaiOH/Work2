import { useContext } from "react";
import { GameStateContext, GameDispatchContext } from "../game/GameContext";

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState deve essere usato dentro <GameProvider>");
  return ctx;
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error("useGameDispatch deve essere usato dentro <GameProvider>");
  return ctx;
}
