import { useEffect, useRef, useState } from 'react';
import type { DecisionId, RaceEvent, RaceInput, RaceResult, Weather, LapDecisionPoint } from '../types';
import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID, TRACK_BY_ID } from '../data';
import { createEngineState, getDecisionPoint, advanceLap, finalizeRace, safePolicy, type EngineState } from '../sim/raceEngine';
import { generateField } from '../sim/fieldGenerator';
import { hashSeed, mulberry32 } from '../sim/rng';
import Card from '../components/Card';
import Button from '../components/Button';

function pickWeather(rainProbability: number, rng: () => number): Weather {
  const roll = rng();
  if (roll > rainProbability) return 'Dry';
  return roll > rainProbability * 0.4 ? 'LightRain' : 'HeavyRain';
}

export default function RaceScreen({ onFinish }: { onFinish: () => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();

  const entry = player?.calendar[player.currentEntryIndex] ?? null;
  const track = entry?.trackId ? TRACK_BY_ID[entry.trackId] : null;
  const carInstance = player?.selectedCarInstanceId ? player.cars[player.selectedCarInstanceId] : null;
  const carDef = carInstance ? CAR_BY_ID[carInstance.defId] : null;
  const driver = player?.selectedDriverId ? player.drivers[player.selectedDriverId] : null;

  const [engine, setEngine] = useState<EngineState | null>(null);
  const [step, setStep] = useState<'running' | 'decision' | 'result'>('running');
  const [decisionPoint, setDecisionPoint] = useState<LapDecisionPoint | null>(null);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [recentEvents, setRecentEvents] = useState<RaceEvent[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!player || !entry || !track || !carDef || !driver || engine) return;
    const rng = mulberry32(hashSeed(`race_${entry.id}_${Date.now()}`));
    const weather = pickWeather(track.rainProbability, rng);
    const field = generateField(carDef.id, driver.id, 5, rng);
    const input: RaceInput = {
      player: {
        id: 'player', teamId: player.playerTeamId, driverId: driver.id, driverName: driver.displayName,
        teamName: player.teams[player.playerTeamId].displayName, carInstanceId: carInstance!.instanceId,
        carDefId: carDef.id, isPlayer: true, driverRef: driver,
      },
      field, track, weather, championshipId: entry.championshipId,
      pointsForPosition: [9, 6, 4, 3, 2, 1], seed: hashSeed(`${entry.id}_seed`),
    };
    setEngine(createEngineState(input));
  }, [player, entry, track, carDef, driver, carInstance, engine]);

  useEffect(() => {
    if (!engine || step !== 'running') return;
    const dp = getDecisionPoint(engine);
    if (dp) {
      setDecisionPoint(dp);
      setStep('decision');
      return;
    }
    timerRef.current = window.setTimeout(() => {
      const { state, events, finished } = advanceLap(engine, null);
      setEngine(state);
      setRecentEvents(events);
      if (finished) { setResult(finalizeRace(state)); setStep('result'); }
    }, 220);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [engine, step]);

  if (!player || !entry || !track || !carDef || !driver) {
    return (
      <div className="screen race-screen">
        <p className="muted">Seleziona un'auto e un pilota prima di correre.</p>
        <Button onClick={onFinish}>Torna alla Home</Button>
      </div>
    );
  }

  if (!engine) return <div className="screen race-screen"><p className="muted">Preparazione della griglia di partenza…</p></div>;

  function chooseDecision(id: DecisionId) {
    if (!engine) return;
    const { state, events, finished } = advanceLap(engine, id);
    setEngine(state);
    setRecentEvents(events);
    setDecisionPoint(null);
    if (finished) { setResult(finalizeRace(state)); setStep('result'); }
    else setStep('running');
  }

  function skipToResult() {
    if (!engine) return;
    let s = engine;
    while (s.lap < s.totalLaps) {
      const dp = getDecisionPoint(s);
      const decision = dp ? safePolicy(dp) : null;
      s = advanceLap(s, decision).state;
    }
    setEngine(s);
    setResult(finalizeRace(s));
    setStep('result');
  }

  if (step === 'decision' && decisionPoint) {
    return (
      <div className="screen race-screen">
        <h1>{track.displayName}</h1>
        <p className="muted">{decisionPoint.context}</p>
        <div className="strategy-grid">
          {decisionPoint.options.map(opt => (
            <button key={opt.id} type="button" className="option-chip decision-option" onClick={() => chooseDecision(opt.id)}>
              <strong>{opt.label} — {opt.successChance}%</strong>
              <span className="muted">Rischio: {opt.risk}</span>
              <span className="muted">{opt.rewardDescription}</span>
              <span className="muted">{opt.penaltyDescription}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'result' && result) {
    return (
      <div className="screen race-screen">
        <h1>{result.playerDnf ? 'Ritirato' : `${result.playerPosition}° posto`}</h1>
        <Card>
          <ol className="result-standings">
            {result.standings.map(s => (
              <li key={s.participantId} className={s.isPlayer ? 'player-row' : ''}>
                <span>{s.position}. {s.name} ({s.teamName})</span>
                <span className="muted">{s.dnf ? 'Ritirato' : `+${s.gapToLeaderSec.toFixed(1)}s`}{s.points > 0 ? ` · ${s.points} pt` : ''}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <p>Montepremi: {result.prizeMoney.toLocaleString('it-IT')} ◈</p>
          <p>Reputazione: {result.reputationGained >= 0 ? '+' : ''}{result.reputationGained}</p>
          <p>Esperienza pilota: +{result.driverExperienceGained}</p>
        </Card>
        <Button
          fullWidth
          onClick={() => {
            dispatch({ type: 'APPLY_RACE_RESULT', result });
            onFinish();
          }}
        >
          Continua
        </Button>
      </div>
    );
  }

  const order = [...engine.runners].sort((a, b) => b.distance - a.distance);
  return (
    <div className="screen race-screen">
      <h1>{track.displayName}</h1>
      <p className="muted">Giro {Math.min(engine.lap + 1, engine.totalLaps)}/{engine.totalLaps} · Meteo: {engine.input.weather === 'Dry' ? 'Asciutto' : engine.input.weather === 'LightRain' ? 'Pioggia leggera' : 'Pioggia intensa'}</p>
      <Button variant="ghost" onClick={skipToResult}>Salta al risultato</Button>
      <Card>
        <ol className="live-positions">
          {order.map(r => (
            <li key={r.participant.id} className={r.participant.isPlayer ? 'player-row' : ''}>
              {r.participant.driverName}{r.dnf ? ' (ritirato)' : ''}
            </li>
          ))}
        </ol>
      </Card>
      <div className="event-ticker">
        {recentEvents.slice(-4).map((e, i) => <p key={i} className="muted">{e.description}</p>)}
      </div>
    </div>
  );
}
