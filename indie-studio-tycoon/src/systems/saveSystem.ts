import type { GameState, SaveMeta } from "../types";

const SAVE_KEY_PREFIX = "ist_save_slot_";
const TUTORIAL_KEY = "ist_tutorial_seen";
export const SAVE_SLOT_COUNT = 3;

function slotKey(slot: number): string {
  return `${SAVE_KEY_PREFIX}${slot}`;
}

export interface SaveFile {
  state: GameState;
  savedAt: number;
}

export function saveToSlot(slot: number, state: GameState): boolean {
  try {
    const file: SaveFile = { state, savedAt: Date.now() };
    localStorage.setItem(slotKey(slot), JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export function loadFromSlot(slot: number): GameState | null {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    return file.state;
  } catch {
    return null;
  }
}

export function deleteSlot(slot: number): void {
  try {
    localStorage.removeItem(slotKey(slot));
  } catch {
    // ignora: nulla da rimuovere se lo storage non è disponibile
  }
}

export function getSaveMeta(slot: number): SaveMeta | null {
  try {
    const raw = localStorage.getItem(slotKey(slot));
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    return {
      slot,
      studioName: file.state.studioName,
      money: file.state.money,
      month: file.state.month,
      reputation: file.state.reputation,
      savedAt: file.savedAt,
    };
  } catch {
    return null;
  }
}

export function listSaveMeta(): (SaveMeta | null)[] {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => getSaveMeta(i + 1));
}

export function isTutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    // se il salvataggio del flag fallisce, il tutorial verrà semplicemente
    // riproposto alla partita successiva: non è un problema bloccante.
  }
}
