import type {
  RaceInput, RaceResult, RaceResultEntry, RaceEvent, RaceLapRecord, RaceParticipant,
} from '../types';
import { performanceRating, carInstanceStats, emptyUpgrades } from '../services/performanceRating';
import { TIRE_GRIP_BY_WEATHER, TIRE_BRAKING_BY_WEATHER, WEATHER_ACCEL_MULT, WEATHER_RELIABILITY_MULT } from '../services/conditions';
import { STRATEGY_PROFILES } from '../services/strategy';
import { hashSeed, mulberry32 } from './rng';

export type Rng = () => number;

interface RunnerState {
  participant: RaceParticipant;
  distance: number;
  tireWear: number; // 0-100
  fuel: number; // 0-100
  pitStops: number;
  overtakes: number;
  dnf: boolean;
  dnfLap: number | null;
}

const NOMINAL_PR = 500;
const NOMINAL_SPEED_KMH = 180;

function runnerPace(state: RunnerState, weather: import('../types').Weather, rng: Rng): number {
  const { participant } = state;
  const stats = participant.carInstance
    ? carInstanceStats(participant.carDef, participant.carInstance)
    : participant.carDef.stats;
  const pr = performanceRating(stats);

  const tire = participant.carInstance?.equippedTire ?? 'Sport';
  const gripMult = TIRE_GRIP_BY_WEATHER[tire][weather];
  const brakingMult = TIRE_BRAKING_BY_WEATHER[tire][weather];
  const weatherAccel = WEATHER_ACCEL_MULT[weather];

  const strategyProfile = STRATEGY_PROFILES[participant.strategy];
  const driverMult = 0.90 + (participant.driver.skill / 100) * 0.20;
  const consistencyNoise = 1 - (participant.driver.consistency / 100) * 0.5;

  const wearPenalty = 1 - (state.tireWear / 100) * 0.28;
  const fuelPenalty = 1 - Math.max(0, (20 - state.fuel)) * 0.004;

  let pace = pr
    * (0.55 + 0.25 * gripMult + 0.20 * brakingMult)
    * weatherAccel
    * strategyProfile.paceMult
    * driverMult
    * wearPenalty
    * fuelPenalty;

  const noiseRange = 0.05 * consistencyNoise + 0.015;
  pace *= 1 + (rng() - 0.5) * 2 * noiseRange;

  return Math.max(10, pace);
}

function paceToSpeedKmh(pace: number): number {
  return NOMINAL_SPEED_KMH * (pace / NOMINAL_PR);
}

export function simulateRace(input: RaceInput): RaceResult {
  const { player, opponents, track, weather } = input;
  const seedStr = input.seed != null ? String(input.seed) : `${track.id}-${weather}-${Date.now()}`;
  const rng = mulberry32(hashSeed(seedStr));

  const participants = [player, ...opponents];
  const states: RunnerState[] = participants.map(p => ({
    participant: p, distance: 0, tireWear: 0, fuel: 100, pitStops: 0, overtakes: 0, dnf: false, dnfLap: null,
  }));

  const events: RaceEvent[] = [];
  const lapHistory: RaceLapRecord[] = [];
  let fastestLap = { participantId: '', pace: 0 };

  const laps = track.laps;
  for (let lap = 1; lap <= laps; lap++) {
    const prevOrder = [...states]
      .sort((a, b) => b.distance - a.distance)
      .map(s => s.participant.id);

    for (const state of states) {
      if (state.dnf) continue;
      const strategyProfile = STRATEGY_PROFILES[state.participant.strategy];
      const reliability = (state.participant.carInstance
        ? carInstanceStats(state.participant.carDef, state.participant.carInstance)
        : state.participant.carDef.stats).reliability;
      const weatherReliability = WEATHER_RELIABILITY_MULT[weather];

      // Tyre & fuel wear.
      const wearRate = 3.2 * strategyProfile.tireWearMult * (weather === 'HeavyRain' ? 1.15 : 1);
      state.tireWear = Math.min(100, state.tireWear + wearRate);
      state.fuel = Math.max(0, state.fuel - 100 / laps * strategyProfile.fuelWearMult);

      // Pit stop when tyres are too worn (skip on the final lap — not worth it).
      if (state.tireWear >= 72 && lap < laps) {
        state.pitStops += 1;
        state.tireWear = 5;
        state.fuel = Math.min(100, state.fuel + 40);
        events.push({
          lap, type: 'pit', participantId: state.participant.id,
          description: `${state.participant.name} entra ai box per il cambio gomme.`,
        });
      }

      // Mechanical failure risk: low reliability + harsh conditions + risky strategy.
      const failureChance = Math.max(0, (70 - reliability)) * 0.00018
        * (2 - weatherReliability)
        * strategyProfile.incidentRisk;
      if (rng() < failureChance) {
        state.dnf = true;
        state.dnfLap = lap;
        events.push({
          lap, type: 'mechanicalFailure', participantId: state.participant.id,
          description: `${state.participant.name} è costretto al ritiro per un guasto meccanico!`,
        });
        continue;
      }

      // Incident risk (loses pace for this lap, does not DNF).
      const incidentChance = 0.012 * strategyProfile.incidentRisk * (state.participant.driver.aggressiveness / 100);
      let incidentPenalty = 1;
      if (rng() < incidentChance) {
        incidentPenalty = 0.72;
        events.push({
          lap, type: 'incident', participantId: state.participant.id,
          description: `${state.participant.name} commette un errore e perde terreno.`,
        });
      }

      const pace = runnerPace(state, weather, rng) * incidentPenalty;
      state.distance += pace;
      if (pace > fastestLap.pace) fastestLap = { participantId: state.participant.id, pace };
    }

    const newOrder = [...states]
      .sort((a, b) => b.distance - a.distance)
      .map(s => s.participant.id);

    // Detect overtakes vs. previous lap order.
    newOrder.forEach((id, pos) => {
      const prevPos = prevOrder.indexOf(id);
      if (prevPos > pos && prevPos !== -1) {
        const overtaken = prevOrder[pos];
        const state = states.find(s => s.participant.id === id)!;
        state.overtakes += 1;
        if (id === player.id || overtaken === player.id) {
          events.push({
            lap, type: 'overtake', participantId: id, targetId: overtaken,
            description: `${state.participant.name} sorpassa per la posizione ${pos + 1}.`,
          });
        }
      }
    });

    lapHistory.push({ lap, order: newOrder });
  }

  if (fastestLap.participantId) {
    const who = participants.find(p => p.id === fastestLap.participantId);
    events.push({
      lap: laps, type: 'fastestLap', participantId: fastestLap.participantId,
      description: `${who?.name ?? 'Un pilota'} segna il giro più veloce della gara.`,
    });
  }

  const finishers = states.filter(s => !s.dnf).sort((a, b) => b.distance - a.distance);
  const dnfs = states.filter(s => s.dnf);

  const leaderDistance = finishers[0]?.distance ?? 1;
  const leaderSpeed = paceToSpeedKmh(leaderDistance / laps);
  const leaderTime = (track.lengthKm * laps) / Math.max(40, leaderSpeed) * 3600;

  const standings: RaceResultEntry[] = [];
  finishers.forEach((s, i) => {
    const speed = paceToSpeedKmh(s.distance / laps);
    const totalTime = (track.lengthKm * laps) / Math.max(40, speed) * 3600;
    standings.push({
      participantId: s.participant.id,
      name: s.participant.name,
      isPlayer: s.participant.isPlayer,
      position: i + 1,
      totalTimeSec: Math.round(totalTime * 10) / 10,
      gapToLeaderSec: Math.round((totalTime - leaderTime) * 10) / 10,
      pitStops: s.pitStops,
      overtakes: s.overtakes,
      dnf: false,
    });
  });
  dnfs.forEach((s) => {
    standings.push({
      participantId: s.participant.id,
      name: s.participant.name,
      isPlayer: s.participant.isPlayer,
      position: standings.length + 1,
      totalTimeSec: 0,
      gapToLeaderSec: 0,
      pitStops: s.pitStops,
      overtakes: s.overtakes,
      dnf: true,
    });
  });

  const playerEntry = standings.find(s => s.isPlayer)!;
  const playerPosition = playerEntry.position;
  const playerDnf = playerEntry.dnf;

  const fieldSize = participants.length;
  const baseCredits = Math.round(track.lengthKm * 120 * track.difficulty);
  const positionMult = playerDnf ? 0 : Math.max(0.15, (fieldSize - playerPosition + 1) / fieldSize);
  const creditsEarned = Math.round(baseCredits * positionMult);
  const bonusCredits = playerPosition === 1 && !playerDnf ? Math.round(baseCredits * 0.35) : 0;
  const xpEarned = playerDnf ? 15 : Math.round(40 + (fieldSize - playerPosition + 1) * 12);

  const drops: RaceResult['drops'] = [];
  if (playerPosition === 1 && !playerDnf && rng() < 0.12) {
    drops.push({ kind: 'tokens', amount: 5 + Math.floor(rng() * 10) });
  }
  if (!playerDnf && rng() < 0.2) {
    drops.push({ kind: 'upgradePart', amount: 1 });
  }

  return {
    trackId: track.id,
    weather,
    laps,
    standings,
    lapHistory,
    events,
    playerPosition,
    playerDnf,
    creditsEarned,
    xpEarned,
    bonusCredits,
    drops,
  };
}

export { emptyUpgrades };
