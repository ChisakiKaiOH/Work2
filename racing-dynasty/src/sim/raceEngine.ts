// DynamicRaceEngine — a lap-by-lap race simulation driven by probabilistic
// events and a handful of player decision points, NOT a simple
// "PR > opponent = win" comparison (brief section 45). The engine is a pure,
// UI-independent state machine (createEngineState / getDecisionPoint /
// advanceLap) so the exact same code path drives both the interactive race
// screen (pausing at each decision point for the real player) and an
// instant/auto simulation used for tests and "skip to result".

import type {
  RaceInput, RaceResult, RaceResultEntry, RaceEvent, RaceParticipant, DriverSkills,
  DecisionId, DecisionOption, LapDecisionPoint, TrackDef, CarBaseStats, Weather, DriverDef,
} from '../types';
import { CAR_BY_ID } from '../data';
import { carRating } from '../services/carRating';
import { hashSeed, mulberry32, type Rng } from './rng';

interface RunnerState {
  participant: RaceParticipant;
  distance: number;
  tyreWear: number; // 0-100
  fuel: number; // 0-100
  dnf: boolean;
  dnfLap: number | null;
}

export interface EngineState {
  input: RaceInput;
  totalLaps: number;
  lap: number; // laps fully completed
  runners: RunnerState[];
  events: RaceEvent[];
  decisionsLog: { lap: number; chosen: DecisionId; success: boolean }[];
  decisionLaps: number[]; // "racing" decision laps (ATTACK/DEFEND/WAIT/PUSH_HARD)
  pitDecisionLap: number; // "pit strategy" decision lap (UNDERCUT_PIT/STAY_OUT/WAIT)
  safetyCarUsed: boolean;
  rng: Rng;
}

const NOMINAL_RATING = 140;
const NOMINAL_SPEED_KMH = 170;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function createEngineState(input: RaceInput): EngineState {
  const totalLaps = input.track.laps;
  const seedStr = input.seed != null ? String(input.seed) : `${input.track.id}-${Date.now()}`;
  const runners: RunnerState[] = [input.player, ...input.field].map(p => ({
    participant: p, distance: 0, tyreWear: 0, fuel: 100, dnf: false, dnfLap: null,
  }));
  return {
    input,
    totalLaps,
    lap: 0,
    runners,
    events: [],
    decisionsLog: [],
    decisionLaps: [Math.max(2, Math.round(totalLaps * 0.35)), Math.max(3, Math.round(totalLaps * 0.8))],
    pitDecisionLap: Math.max(2, Math.round(totalLaps * 0.55)),
    safetyCarUsed: false,
    rng: mulberry32(hashSeed(seedStr)),
  };
}

// --------------------------------------------------------------- Decisions

interface DecisionSpec {
  base: number;
  driverSkill: keyof DriverSkills;
  driverWeight: number;
  carStat: keyof CarBaseStats;
  carWeight: number;
  trackFactor: (t: TrackDef) => number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

const RACING_SPECS: Record<'ATTACK' | 'DEFEND' | 'WAIT' | 'PUSH_HARD', DecisionSpec> = {
  ATTACK: { base: 58, driverSkill: 'overtaking', driverWeight: 0.45, carStat: 'handling', carWeight: 0.18, trackFactor: t => -(t.overtakeDifficulty - 50) * 0.3, risk: 'MEDIUM' },
  DEFEND: { base: 72, driverSkill: 'defending', driverWeight: 0.40, carStat: 'handling', carWeight: 0.20, trackFactor: t => (t.overtakeDifficulty - 50) * 0.2, risk: 'LOW' },
  WAIT: { base: 90, driverSkill: 'consistency', driverWeight: 0.20, carStat: 'reliability', carWeight: 0.15, trackFactor: () => 0, risk: 'LOW' },
  PUSH_HARD: { base: 55, driverSkill: 'aggressiveness', driverWeight: 0.30, carStat: 'power', carWeight: 0.25, trackFactor: t => -(t.difficulty - 3) * 4, risk: 'HIGH' },
};

const PIT_SPECS: Record<'UNDERCUT_PIT' | 'STAY_OUT' | 'WAIT', DecisionSpec> = {
  UNDERCUT_PIT: { base: 55, driverSkill: 'fuelManagement', driverWeight: 0.25, carStat: 'reliability', carWeight: 0.15, trackFactor: t => -(t.overtakeDifficulty - 50) * 0.1, risk: 'MEDIUM' },
  STAY_OUT: { base: 75, driverSkill: 'tyreManagement', driverWeight: 0.25, carStat: 'reliability', carWeight: 0.15, trackFactor: () => 0, risk: 'LOW' },
  WAIT: RACING_SPECS.WAIT,
};

const LABELS: Record<DecisionId, string> = {
  ATTACK: 'Attacca', DEFEND: 'Difendi', WAIT: 'Gestisci', PUSH_HARD: 'Spingi al massimo',
  LATE_BRAKING: 'Staccata al limite', SAVE_TIRES: 'Risparmia le gomme',
  UNDERCUT_PIT: 'Entra ai box (undercut)', STAY_OUT: 'Resta in pista',
};

const REWARD: Record<DecisionId, string> = {
  ATTACK: 'Possibile guadagno di posizione.',
  DEFEND: 'Mantieni la posizione attuale.',
  WAIT: 'Conservi gomme e carburante.',
  PUSH_HARD: 'Grande guadagno di ritmo, se riesce.',
  LATE_BRAKING: 'Sorpasso deciso in frenata.',
  SAVE_TIRES: 'Gomme molto più fresche nel finale.',
  UNDERCUT_PIT: 'Esci davanti a chi resta in pista.',
  STAY_OUT: 'Mantieni la posizione in pista.',
};
const PENALTY: Record<DecisionId, string> = {
  ATTACK: 'Rischio di perdere tempo e aderenza.',
  DEFEND: 'Rischio di essere comunque superato.',
  WAIT: 'Nessun vero rischio, ma nessun guadagno.',
  PUSH_HARD: 'Più usura e rischio guasto meccanico.',
  LATE_BRAKING: 'Alto rischio di bloccaggio o testacoda.',
  SAVE_TIRES: 'Perdi ritmo rispetto agli avversari.',
  UNDERCUT_PIT: 'Una sosta lenta ti fa perdere posizioni.',
  STAY_OUT: 'Le gomme vecchie possono cedere di ritmo.',
};

function computeOption(id: DecisionId, spec: DecisionSpec, driver: DriverDef, stats: CarBaseStats, track: TrackDef, weather: Weather): DecisionOption {
  const driverMod = (driver.skills[spec.driverSkill] - 50) * spec.driverWeight;
  const carMod = ((stats[spec.carStat] - 140) / 2) * spec.carWeight;
  const trackMod = spec.trackFactor(track);
  const wetPenalty = weather === 'Dry' ? 0 : (70 - driver.skills.wetWeather) * (weather === 'HeavyRain' ? 0.22 : 0.15);
  const expMod = (driver.experience - 50) * 0.12;
  const chance = clamp(Math.round(spec.base + driverMod + carMod + trackMod - wetPenalty + expMod), 5, 95);
  return { id, label: LABELS[id], successChance: chance, risk: spec.risk, rewardDescription: REWARD[id], penaltyDescription: PENALTY[id] };
}

function playerRunner(state: EngineState): RunnerState {
  return state.runners[0];
}

/** The decision point the player will face on the UPCOMING lap, or null if that lap has none. */
export function getDecisionPoint(state: EngineState): LapDecisionPoint | null {
  const lap = state.lap + 1;
  if (lap > state.totalLaps) return null;
  const player = playerRunner(state);
  if (player.dnf) return null;

  const def = CAR_BY_ID[player.participant.carDefId];
  const driver = driverForParticipant(state.input.player);
  if (!def || !driver) return null;

  if (state.decisionLaps.includes(lap)) {
    const leaderDistance = Math.max(...state.runners.filter(r => !r.dnf).map(r => r.distance), 0);
    const isLeading = player.distance >= leaderDistance - 0.001;
    const context = isLeading
      ? `Giro ${lap}/${state.totalLaps} — sei al comando.`
      : `Giro ${lap}/${state.totalLaps} — devi recuperare terreno.`;
    const options = (['ATTACK', 'DEFEND', 'WAIT', 'PUSH_HARD'] as const)
      .map(id => computeOption(id, RACING_SPECS[id], driver, def.stats, state.input.track, state.input.weather));
    return { lap, context, options };
  }

  if (lap === state.pitDecisionLap) {
    const context = `Giro ${lap}/${state.totalLaps} — finestra pit stop.`;
    const options = (['UNDERCUT_PIT', 'STAY_OUT', 'WAIT'] as const)
      .map(id => computeOption(id, PIT_SPECS[id], driver, def.stats, state.input.track, state.input.weather));
    return { lap, context, options };
  }

  return null;
}

function driverForParticipant(p: RaceParticipant): DriverDef {
  return p.driverRef;
}

// ------------------------------------------------------------------ Effects

interface DecisionEffect {
  paceMult: number;
  wearDelta: number;
  fuelDelta: number;
  incidentChance: number;
}

const EFFECTS: Record<DecisionId, { success: DecisionEffect; failure: DecisionEffect }> = {
  ATTACK: {
    success: { paceMult: 1.22, wearDelta: 4, fuelDelta: -1, incidentChance: 0 },
    failure: { paceMult: 0.85, wearDelta: 4, fuelDelta: -1, incidentChance: 0.15 },
  },
  LATE_BRAKING: {
    success: { paceMult: 1.30, wearDelta: 3, fuelDelta: -1, incidentChance: 0 },
    failure: { paceMult: 0.78, wearDelta: 3, fuelDelta: -1, incidentChance: 0.30 },
  },
  DEFEND: {
    success: { paceMult: 1.06, wearDelta: 1, fuelDelta: 0, incidentChance: 0 },
    failure: { paceMult: 0.90, wearDelta: 1, fuelDelta: 0, incidentChance: 0.06 },
  },
  WAIT: {
    success: { paceMult: 1.00, wearDelta: -3, fuelDelta: 1, incidentChance: 0 },
    failure: { paceMult: 0.97, wearDelta: -3, fuelDelta: 1, incidentChance: 0.02 },
  },
  PUSH_HARD: {
    success: { paceMult: 1.30, wearDelta: 6, fuelDelta: -3, incidentChance: 0 },
    failure: { paceMult: 0.78, wearDelta: 6, fuelDelta: -3, incidentChance: 0.25 },
  },
  SAVE_TIRES: {
    success: { paceMult: 0.97, wearDelta: -6, fuelDelta: 0, incidentChance: 0 },
    failure: { paceMult: 0.90, wearDelta: -6, fuelDelta: 0, incidentChance: 0.02 },
  },
  UNDERCUT_PIT: {
    success: { paceMult: 1.08, wearDelta: -95, fuelDelta: 45, incidentChance: 0 },
    failure: { paceMult: 0.65, wearDelta: -95, fuelDelta: 45, incidentChance: 0.06 },
  },
  STAY_OUT: {
    success: { paceMult: 1.02, wearDelta: 5, fuelDelta: 0, incidentChance: 0 },
    failure: { paceMult: 0.80, wearDelta: 5, fuelDelta: 0, incidentChance: 0.10 },
  },
};

// -------------------------------------------------------------------- Pace

function runnerPace(runner: RunnerState, weather: Weather, rng: Rng): number {
  const def = CAR_BY_ID[runner.participant.carDefId];
  const driver = driverForParticipant(runner.participant);
  if (!def || !driver) return 0;

  const rating = carRating(def.stats);
  const driverFactor = 0.82 + clamp(driver.rating + driver.form, 0, 100) / 100 * 0.30;
  const weatherFactor = weather === 'Dry' ? 1 : weather === 'LightRain'
    ? 0.90 + (driver.skills.wetWeather / 100) * 0.14
    : 0.76 + (driver.skills.wetWeather / 100) * 0.18;
  const wearPenalty = 1 - (runner.tyreWear / 100) * 0.22;
  const fuelPenalty = 1 - Math.max(0, 12 - runner.fuel) * 0.008;
  const noiseRange = 0.05 * (1 - driver.skills.consistency / 150) + 0.01;

  let pace = rating * driverFactor * weatherFactor * wearPenalty * fuelPenalty;
  pace *= 1 + (rng() - 0.5) * 2 * noiseRange;
  return Math.max(5, pace);
}

function paceToSpeedKmh(pace: number): number {
  return NOMINAL_SPEED_KMH * (pace / NOMINAL_RATING);
}

// ---------------------------------------------------------------- Advance

/**
 * Resolves exactly one lap for every runner. If the upcoming lap has a
 * decision point for the player (see getDecisionPoint) and `playerDecision`
 * is null, the caller must supply one — this function assumes the caller
 * already consulted getDecisionPoint and is passing the player's choice (or
 * null for a lap that has no decision point at all).
 */
export function advanceLap(state: EngineState, playerDecision: DecisionId | null): { state: EngineState; events: RaceEvent[]; finished: boolean } {
  const lap = state.lap + 1;
  if (lap > state.totalLaps) return { state, events: [], finished: true };

  const rng = state.rng;
  const events: RaceEvent[] = [];
  const decisionsLog = [...state.decisionsLog];
  const prevOrder = [...state.runners].sort((a, b) => b.distance - a.distance).map(r => r.participant.id);

  const runners = state.runners.map(r => ({ ...r }));

  for (let i = 0; i < runners.length; i++) {
    const runner = runners[i];
    if (runner.dnf) continue;
    const def = CAR_BY_ID[runner.participant.carDefId];
    const driver = driverForParticipant(runner.participant);
    if (!def || !driver) continue;

    const normalWear = (100 / state.totalLaps) * 2.2;
    const normalFuel = 100 / state.totalLaps;

    const isPlayer = i === 0;
    const decisionHere = isPlayer ? playerDecision : null;

    let pace = runnerPace(runner, state.input.weather, rng);

    if (decisionHere) {
      const spec = RACING_SPECS[decisionHere as keyof typeof RACING_SPECS] ?? PIT_SPECS[decisionHere as keyof typeof PIT_SPECS];
      const option = computeOption(decisionHere, spec, driver, def.stats, state.input.track, state.input.weather);
      const success = rng() * 100 < option.successChance;
      const effect = EFFECTS[decisionHere][success ? 'success' : 'failure'];
      pace *= effect.paceMult;
      runner.tyreWear = clamp(runner.tyreWear + normalWear + effect.wearDelta, 0, 100);
      runner.fuel = clamp(runner.fuel - normalFuel + effect.fuelDelta, 0, 100);
      decisionsLog.push({ lap, chosen: decisionHere, success });
      events.push({
        lap, type: success ? decisionEventType(decisionHere, true) : decisionEventType(decisionHere, false),
        participantId: runner.participant.id,
        description: `${runner.participant.driverName} sceglie "${option.label}" — ${success ? 'riuscito' : 'fallito'}.`,
      });
      if (!success && rng() < effect.incidentChance) {
        const incidentType = decisionHere === 'LATE_BRAKING' ? 'LOCKUP' : 'DRIVER_ERROR';
        pace *= 0.8;
        events.push({ lap, type: incidentType, participantId: runner.participant.id, description: `${runner.participant.driverName} commette un errore.` });
      }
    } else {
      runner.tyreWear = clamp(runner.tyreWear + normalWear, 0, 100);
      runner.fuel = clamp(runner.fuel - normalFuel, 0, 100);
    }

    // Mechanical failure risk: low reliability + harsh weather, every lap for every runner.
    const weatherReliabilityMult = state.input.weather === 'Dry' ? 1 : state.input.weather === 'LightRain' ? 0.95 : 0.85;
    const failureChance = Math.max(0, 75 - def.stats.reliability) * 0.00022 * (2 - weatherReliabilityMult);
    if (rng() < failureChance) {
      runner.dnf = true;
      runner.dnfLap = lap;
      events.push({ lap, type: 'MECHANICAL_FAILURE', participantId: runner.participant.id, description: `${runner.participant.driverName} è costretto al ritiro per un guasto meccanico.` });
      continue;
    }

    // Background driver-error risk for laps without an explicit decision (AI field, and the
    // player on non-decision laps), scaled by aggressiveness and dampened by consistency.
    if (!decisionHere) {
      const errorChance = 0.012 * (driver.skills.aggressiveness / 100) * (1 - driver.skills.consistency / 150);
      if (rng() < errorChance) {
        pace *= 0.82;
        events.push({ lap, type: 'DRIVER_ERROR', participantId: runner.participant.id, description: `${runner.participant.driverName} perde qualche decimo per un piccolo errore.` });
      }
    }

    runner.distance += pace;
  }

  // Rare safety car, at most once per race — bunches the field together.
  if (!state.safetyCarUsed && lap > 2 && lap < state.totalLaps - 1 && rng() < 0.012) {
    const distances = runners.filter(r => !r.dnf).map(r => r.distance);
    const median = distances.sort((a, b) => a - b)[Math.floor(distances.length / 2)] ?? 0;
    runners.forEach(r => { if (!r.dnf) r.distance = median + (r.distance - median) * 0.35; });
    events.push({ lap, type: 'SAFETY_CAR', participantId: 'field', description: 'Safety car in pista: il gruppo si ricompatta.' });
  }

  const newOrder = [...runners].sort((a, b) => b.distance - a.distance).map(r => r.participant.id);
  newOrder.forEach((id, pos) => {
    const prevPos = prevOrder.indexOf(id);
    if (prevPos > pos && prevPos !== -1) {
      const overtaken = prevOrder[pos];
      const runner = runners.find(r => r.participant.id === id)!;
      if (id === state.input.player.id || overtaken === state.input.player.id) {
        events.push({ lap, type: 'OVERTAKE', participantId: id, targetId: overtaken, description: `${runner.participant.driverName} guadagna una posizione.` });
      }
    }
  });

  const nextState: EngineState = {
    ...state,
    lap,
    runners,
    events: [...state.events, ...events],
    decisionsLog,
    safetyCarUsed: state.safetyCarUsed || events.some(e => e.type === 'SAFETY_CAR'),
  };
  return { state: nextState, events, finished: lap >= state.totalLaps };
}

function decisionEventType(id: DecisionId, success: boolean): RaceEvent['type'] {
  if (id === 'LATE_BRAKING') return success ? 'LATE_BRAKING' : 'LOCKUP';
  if (id === 'UNDERCUT_PIT') return 'PIT_STOP';
  if (id === 'STAY_OUT') return success ? 'SAVE_TIRES_OK' : 'TRAFFIC';
  if (id === 'SAVE_TIRES') return 'SAVE_TIRES_OK';
  if (id === 'DEFEND') return 'DEFEND_HOLD';
  return success ? 'OVERTAKE' : 'DRIVER_ERROR';
}

// ------------------------------------------------------------------- Final

export function finalizeRace(state: EngineState): RaceResult {
  const { track, weather, championshipId } = state.input;
  const championship = state.input.pointsForPosition;

  const finishers = state.runners.filter(r => !r.dnf).sort((a, b) => b.distance - a.distance);
  const dnfs = state.runners.filter(r => r.dnf);
  const leaderDistance = finishers[0]?.distance ?? 1;
  const leaderSpeed = paceToSpeedKmh(leaderDistance / state.totalLaps);
  const leaderTime = (track.lengthKm * state.totalLaps) / Math.max(30, leaderSpeed) * 3600;

  const standings: RaceResultEntry[] = [];
  finishers.forEach((r, i) => {
    const speed = paceToSpeedKmh(r.distance / state.totalLaps);
    const totalTime = (track.lengthKm * state.totalLaps) / Math.max(30, speed) * 3600;
    const points = championship?.[i] ?? 0;
    standings.push({
      participantId: r.participant.id, name: r.participant.driverName, teamName: r.participant.teamName,
      isPlayer: r.participant.isPlayer, position: i + 1,
      gapToLeaderSec: Math.round((totalTime - leaderTime) * 10) / 10,
      dnf: false, points,
    });
  });
  dnfs.forEach(r => {
    standings.push({
      participantId: r.participant.id, name: r.participant.driverName, teamName: r.participant.teamName,
      isPlayer: r.participant.isPlayer, position: standings.length + 1,
      gapToLeaderSec: 0, dnf: true, points: 0,
    });
  });

  const playerEntry = standings.find(s => s.isPlayer)!;
  const fieldSize = state.runners.length;
  const basePrize = Math.round(track.lengthKm * 900 * track.difficulty);
  const positionMult = playerEntry.dnf ? 0 : Math.max(0.1, (fieldSize - playerEntry.position + 1) / fieldSize);
  const prizeMoney = Math.round(basePrize * positionMult);
  const reputationGained = playerEntry.dnf ? -1 : Math.max(0, 6 - playerEntry.position);
  const driverExperienceGained = playerEntry.dnf ? 1 : Math.max(2, 8 - playerEntry.position);

  return {
    championshipId, trackId: track.id, weather, laps: state.totalLaps,
    standings, events: state.events, decisionsLog: state.decisionsLog,
    playerPosition: playerEntry.position, playerDnf: playerEntry.dnf,
    prizeMoney, reputationGained, driverExperienceGained,
  };
}

/** Full instant simulation (used for tests, and for the "skip to result" UI control). */
export function simulateRaceAuto(input: RaceInput, autoPolicy: (dp: LapDecisionPoint) => DecisionId = safePolicy): RaceResult {
  let state = createEngineState(input);
  while (state.lap < state.totalLaps) {
    const dp = getDecisionPoint(state);
    const decision = dp ? autoPolicy(dp) : null;
    state = advanceLap(state, decision).state;
  }
  return finalizeRace(state);
}

/** Default auto-policy: always take the option with the highest success chance. */
export function safePolicy(dp: LapDecisionPoint): DecisionId {
  return dp.options.reduce((best, o) => (o.successChance > best.successChance ? o : best)).id;
}
