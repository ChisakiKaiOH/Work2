import type { PlayerState } from '../types';

export const SAVE_VERSION = 1;
const SAVE_KEY = 'racing-dynasty-save-v1';

interface SaveFile {
  version: number;
  savedAt: number;
  player: PlayerState;
}

export const SaveManager = {
  save(player: PlayerState): boolean {
    try {
      const file: SaveFile = { version: SAVE_VERSION, savedAt: Date.now(), player };
      localStorage.setItem(SAVE_KEY, JSON.stringify(file));
      return true;
    } catch {
      return false;
    }
  },

  load(): PlayerState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const file = JSON.parse(raw) as SaveFile;
      if (!file || typeof file.version !== 'number') return null;
      // Future migrations would branch on file.version here.
      return file.player;
    } catch {
      return null;
    }
  },

  clear(): void {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  },

  exportJson(player: PlayerState): string {
    return JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), player }, null, 2);
  },

  importJson(json: string): PlayerState | null {
    try {
      const file = JSON.parse(json) as SaveFile;
      if (!file || typeof file.version !== 'number' || !file.player) return null;
      return file.player;
    } catch {
      return null;
    }
  },

  hasSave(): boolean {
    try { return localStorage.getItem(SAVE_KEY) !== null; } catch { return false; }
  },
};
