import { afterEach, describe, expect, it } from 'vitest';
import { SaveManager } from './SaveManager';
import { createNewPlayer } from '../game/initialState';

afterEach(() => {
  SaveManager.clear();
});

describe('SaveManager', () => {
  it('load() returns null when nothing has been saved yet — edge case', () => {
    expect(SaveManager.hasSave()).toBe(false);
    expect(SaveManager.load()).toBeNull();
  });

  it('round-trips a player through save/load without data loss', () => {
    const player = { ...createNewPlayer('RoundTrip'), credits: 12345, level: 7 };
    SaveManager.save(player);
    expect(SaveManager.hasSave()).toBe(true);
    const loaded = SaveManager.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe('RoundTrip');
    expect(loaded?.credits).toBe(12345);
    expect(loaded?.level).toBe(7);
  });

  it('clear() removes the save so load() goes back to null', () => {
    SaveManager.save(createNewPlayer('ToClear'));
    SaveManager.clear();
    expect(SaveManager.load()).toBeNull();
  });

  it('load() fails safe (returns null) on corrupted JSON instead of throwing — edge case', () => {
    localStorage.setItem('racing-dynasty-save-v1', '{not valid json');
    expect(SaveManager.load()).toBeNull();
  });

  it('exportJson/importJson round-trip matches save/load', () => {
    const player = createNewPlayer('Exported');
    const json = SaveManager.exportJson(player);
    const imported = SaveManager.importJson(json);
    expect(imported?.name).toBe('Exported');
  });

  it('importJson returns null for garbage input instead of throwing — edge case', () => {
    expect(SaveManager.importJson('not json at all')).toBeNull();
    expect(SaveManager.importJson('{}')).toBeNull();
  });
});
