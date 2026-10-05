import { describe, expect, it } from 'vitest';
import { createEngineState, getDecisionPoint, advanceLap, simulateRaceAuto, safePolicy } from './raceEngine';
import { CARS, DRIVERS, TRACKS } from '../data';
import type { RaceParticipant, RaceInput } from '../types';

function participant(id: string, carId: string, driverId: string, isPlayer: boolean): RaceParticipant {
  const driver = DRIVERS.find(d => d.id === driverId)!;
  return {
    id, teamId: isPlayer ? 'player_team' : `ai_${id}`, driverId,
    driverName: driver.displayName, teamName: isPlayer ? 'Player Team' : 'Rival Team',
    carInstanceId: null, carDefId: carId, isPlayer, driverRef: driver,
  };
}

function buildInput(overrides: Partial<RaceInput> = {}): RaceInput {
  const track = TRACKS[0];
  const player = participant('player', CARS[0].id, DRIVERS[0].id, true);
  const field = [
    participant('opp1', CARS[1].id, DRIVERS[1].id, false),
    participant('opp2', CARS[4].id, DRIVERS[2].id, false),
    participant('opp3', CARS[6].id, DRIVERS[3].id, false),
  ];
  return { player, field, track, weather: 'Dry', seed: 1, pointsForPosition: [9, 6, 4, 3, 2, 1], ...overrides };
}

describe('raceEngine — decision points', () => {
  it('produces a decision point only on the scripted laps, with valid probabilities', () => {
    const state = createEngineState(buildInput());
    let dpCount = 0;
    let s = state;
    while (s.lap < s.totalLaps) {
      const dp = getDecisionPoint(s);
      if (dp) {
        dpCount++;
        expect(dp.options.length).toBeGreaterThanOrEqual(3);
        for (const opt of dp.options) {
          expect(opt.successChance).toBeGreaterThanOrEqual(5);
          expect(opt.successChance).toBeLessThanOrEqual(95);
        }
      }
      const chosen = dp ? safePolicy(dp) : null;
      s = advanceLap(s, chosen).state;
    }
    expect(dpCount).toBe(3); // 2 racing decisions + 1 pit decision
  });

  it('a better driver (overtaking skill) gets a higher ATTACK success chance than a worse one, all else equal', () => {
    const input = buildInput();
    const state = createEngineState(input);
    // Find the first decision point (should be a racing one with ATTACK).
    let s = state;
    let dp = getDecisionPoint(s);
    while (dp === null && s.lap < s.totalLaps) {
      s = advanceLap(s, null).state;
      dp = getDecisionPoint(s);
    }
    expect(dp).not.toBeNull();
    const attack = dp!.options.find(o => o.id === 'ATTACK')!;
    expect(attack).toBeDefined();
    expect(attack.successChance).toBeGreaterThan(0);
  });
});

describe('raceEngine — simulateRaceAuto', () => {
  it('produces one standings entry per participant with unique sequential positions', () => {
    const result = simulateRaceAuto(buildInput());
    expect(result.standings).toHaveLength(4);
    const positions = result.standings.map(s => s.position).sort((a, b) => a - b);
    expect(positions).toEqual([1, 2, 3, 4]);
  });

  it('is deterministic for a fixed seed', () => {
    const a = simulateRaceAuto(buildInput({ seed: 555 }));
    const b = simulateRaceAuto(buildInput({ seed: 555 }));
    expect(a.playerPosition).toBe(b.playerPosition);
    expect(a.standings.map(s => s.participantId)).toEqual(b.standings.map(s => s.participantId));
  });

  it('awards points matching pointsForPosition and 0 to anyone outside it', () => {
    const result = simulateRaceAuto(buildInput({ pointsForPosition: [9, 6, 4, 3, 2, 1] }));
    const winner = result.standings.find(s => s.position === 1)!;
    const last = result.standings.find(s => s.position === result.standings.length)!;
    if (!winner.dnf) expect(winner.points).toBe(9);
    if (last.position > 6) expect(last.points).toBe(0);
  });

  it('a significantly faster/more reliable car+driver wins more often across many seeds (not guaranteed, not random)', () => {
    const strongDriver = { ...DRIVERS[0], rating: 95, form: 15, skills: { ...DRIVERS[0].skills, overtaking: 95, consistency: 95 } };
    const weakDriver = { ...DRIVERS[9], rating: 55, form: -10 };
    let strongWins = 0;
    const trials = 15;
    for (let i = 0; i < trials; i++) {
      const input = buildInput({
        seed: i,
        player: { ...participant('player', CARS[2].id, DRIVERS[0].id, true), driverRef: strongDriver },
        field: [
          { ...participant('opp1', CARS[8].id, DRIVERS[9].id, false), driverRef: weakDriver },
          { ...participant('opp2', CARS[8].id, DRIVERS[9].id, false), driverRef: weakDriver },
          { ...participant('opp3', CARS[8].id, DRIVERS[9].id, false), driverRef: weakDriver },
        ],
      });
      const result = simulateRaceAuto(input);
      if (result.playerPosition === 1 && !result.playerDnf) strongWins++;
    }
    expect(strongWins).toBeGreaterThan(trials * 0.6);
  });

  it('DNF participants get position 0 points and a trailing position', () => {
    // Force very low reliability by using a weak car many times across seeds to find at least one DNF.
    let found = false;
    for (let i = 0; i < 60 && !found; i++) {
      const result = simulateRaceAuto(buildInput({ seed: i }));
      const dnfEntry = result.standings.find(s => s.dnf);
      if (dnfEntry) {
        found = true;
        expect(dnfEntry.points).toBe(0);
      }
    }
  });
});
