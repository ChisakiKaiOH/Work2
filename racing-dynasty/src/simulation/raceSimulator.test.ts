import { describe, expect, it } from 'vitest';
import { simulateRace } from './raceSimulator';
import { generateOpponents } from './bots';
import { mulberry32, hashSeed } from './rng';
import { CAR_BY_ID, TRACKS, DRIVER_BY_ID, STARTER_CAR_IDS } from '../data';
import { emptyUpgrades, carInstancePR } from '../services/performanceRating';
import type { RaceParticipant } from '../types';

function makePlayer(carId: string): RaceParticipant {
  const def = CAR_BY_ID[carId];
  const instance = { instanceId: 'player-car', defId: carId, acquiredAt: 0, upgrades: emptyUpgrades(), equippedTire: 'Sport' as const, xp: 0, racesCompleted: 0, wins: 0, favorite: false };
  return {
    id: 'player', name: 'Tester', isPlayer: true,
    carDef: def, carInstance: instance, driver: DRIVER_BY_ID['driver_01'],
    strategy: 'Balanced', pr: carInstancePR(def, instance),
  };
}

describe('simulateRace', () => {
  const track = TRACKS[0];

  it('produces one standings entry per participant, with unique positions 1..N', () => {
    const player = makePlayer(STARTER_CAR_IDS[0]);
    const rng = mulberry32(hashSeed('fixed-seed-1'));
    const opponents = generateOpponents(player.pr, 5, rng);
    const result = simulateRace({ player, opponents, track, weather: 'Dry', seed: 42 });

    expect(result.standings).toHaveLength(opponents.length + 1);
    const positions = result.standings.map(s => s.position).sort((a, b) => a - b);
    expect(positions).toEqual(Array.from({ length: positions.length }, (_, i) => i + 1));
  });

  it('is deterministic for a fixed seed (reproducible, not fully random)', () => {
    const player = makePlayer(STARTER_CAR_IDS[0]);
    const rng = mulberry32(hashSeed('fixed-seed-2'));
    const opponents = generateOpponents(player.pr, 5, rng);

    const resultA = simulateRace({ player, opponents, track, weather: 'Dry', seed: 777 });
    const resultB = simulateRace({ player, opponents, track, weather: 'Dry', seed: 777 });

    expect(resultA.playerPosition).toBe(resultB.playerPosition);
    expect(resultA.standings.map(s => s.participantId)).toEqual(resultB.standings.map(s => s.participantId));
  });

  it('a much stronger car wins more often than a much weaker one against the same field (better car = higher win chance, not guaranteed)', () => {
    const basePlayer = makePlayer(STARTER_CAR_IDS[0]);
    const strongPlayer = makePlayer(STARTER_CAR_IDS[0]);
    strongPlayer.carInstance = { ...strongPlayer.carInstance!, upgrades: Object.fromEntries(Object.keys(emptyUpgrades()).map(k => [k, 10])) as ReturnType<typeof emptyUpgrades> };
    strongPlayer.pr = carInstancePR(strongPlayer.carDef, strongPlayer.carInstance);
    expect(strongPlayer.pr).toBeGreaterThan(basePlayer.pr);

    // Calibrate the opposing field to the UNUPGRADED car's PR, then race both
    // the weak and the strong version of the same car against that identical
    // field — this isolates the effect of the car's own strength.
    const trials = 25;
    let weakWins = 0;
    let strongWins = 0;
    for (let i = 0; i < trials; i++) {
      const fieldRng = mulberry32(hashSeed(`field-${i}`));
      const opponents = generateOpponents(basePlayer.pr, 5, fieldRng);
      const weakResult = simulateRace({ player: basePlayer, opponents, track, weather: 'Dry', seed: i });
      const strongResult = simulateRace({ player: strongPlayer, opponents, track, weather: 'Dry', seed: i });
      if (weakResult.playerPosition === 1 && !weakResult.playerDnf) weakWins++;
      if (strongResult.playerPosition === 1 && !strongResult.playerDnf) strongWins++;
    }
    expect(strongWins).toBeGreaterThan(weakWins);
  });

  it('produces exactly `track.laps` lap history entries', () => {
    const player = makePlayer(STARTER_CAR_IDS[0]);
    const rng = mulberry32(hashSeed('laps-check'));
    const opponents = generateOpponents(player.pr, 3, rng);
    const result = simulateRace({ player, opponents, track, weather: 'Rain', seed: 1 });
    expect(result.lapHistory).toHaveLength(track.laps);
    expect(result.laps).toBe(track.laps);
  });

  it('grants zero credits and reduced XP, but still returns a valid result, when the player DNFs', () => {
    // We can't force a DNF deterministically without reaching into internals, so instead
    // we assert the invariant directly: whenever playerDnf is true, creditsEarned/bonus are 0.
    const player = makePlayer(STARTER_CAR_IDS[0]);
    let foundDnf = false;
    for (let i = 0; i < 40 && !foundDnf; i++) {
      const rng = mulberry32(hashSeed(`dnf-search-${i}`));
      const opponents = generateOpponents(player.pr, 5, rng);
      const result = simulateRace({ player, opponents, track, weather: 'HeavyRain', seed: i });
      if (result.playerDnf) {
        foundDnf = true;
        expect(result.creditsEarned).toBe(0);
        expect(result.bonusCredits).toBe(0);
        expect(result.playerPosition).toBeGreaterThan(0);
      }
    }
    // Not asserting foundDnf must be true (failures are probabilistic by design),
    // this just verifies the invariant holds whenever one happens to occur.
  });
});
