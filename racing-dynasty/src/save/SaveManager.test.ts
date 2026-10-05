import { afterEach, describe, expect, it } from 'vitest';
import { SaveManager } from './SaveManager';
import { createNewCareer } from '../game/initialState';

afterEach(() => {
  SaveManager.clear();
});

describe('SaveManager', () => {
  it('load() returns null when nothing has been saved yet — edge case', () => {
    expect(SaveManager.hasSave()).toBe(false);
    expect(SaveManager.load()).toBeNull();
  });

  it('round-trips a career through save/load without data loss', () => {
    const player = { ...createNewCareer('RoundTrip Racing', 'Tester'), currentEntryIndex: 2 };
    SaveManager.save(player);
    expect(SaveManager.hasSave()).toBe(true);
    const loaded = SaveManager.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.teams[loaded!.playerTeamId].displayName).toBe('RoundTrip Racing');
    expect(loaded?.currentEntryIndex).toBe(2);
  });

  it('clear() removes the save so load() goes back to null', () => {
    SaveManager.save(createNewCareer('ToClear', 'Tester'));
    SaveManager.clear();
    expect(SaveManager.load()).toBeNull();
  });

  it('load() fails safe (returns null) on corrupted JSON instead of throwing — edge case', () => {
    localStorage.setItem('racing-dynasty-save-v1', '{not valid json');
    expect(SaveManager.load()).toBeNull();
  });

  it('exportJson/importJson round-trip matches save/load', () => {
    const player = createNewCareer('Exported', 'Tester');
    const json = SaveManager.exportJson(player);
    const imported = SaveManager.importJson(json);
    expect(imported?.teams[imported!.playerTeamId].displayName).toBe('Exported');
  });

  it('importJson returns null for garbage input instead of throwing — edge case', () => {
    expect(SaveManager.importJson('not json at all')).toBeNull();
    expect(SaveManager.importJson('{}')).toBeNull();
  });
});
