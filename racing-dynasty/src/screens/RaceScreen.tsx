import { useEffect, useRef, useState } from 'react';
import type { Strategy, TireType, Weather, RaceResult, RaceParticipant, TrackDef } from '../types';
import { useGameState, useGameDispatch } from '../game/hooks';
import { TRACKS, DRIVER_BY_ID, CAR_BY_ID, BOSS_BY_ID, CHAMPIONSHIPS } from '../data';
import { carInstancePR } from '../services/performanceRating';
import { simulateRace } from '../simulation/raceSimulator';
import { generateOpponents } from '../simulation/bots';
import { hashSeed, mulberry32 } from '../simulation/rng';
import { STRATEGY_LABEL_IT, STRATEGY_DESCRIPTION_IT } from '../services/strategy';
import { TIRE_LABEL_IT, WEATHER_LABEL_IT, TIRE_GRIP_BY_WEATHER } from '../services/conditions';
import { AudioManager } from '../audio/AudioManager';
import { adService } from '../ads/AdService';
import Button from '../components/Button';
import Card from '../components/Card';
import type { RaceLaunch } from './navigation';

const STRATEGIES: Strategy[] = ['Attack', 'Balanced', 'Defend', 'Risky'];
const TIRES: TireType[] = ['Street', 'Sport', 'Racing', 'Rain', 'WetRacing'];
type Speed = 1 | 2 | 4;
const SPEED_MS: Record<Speed, number> = { 1: 850, 2: 420, 4: 180 };

interface RaceContext {
  source: import('../game/actions').RaceSource;
  track: TrackDef;
  weather: Weather;
  opponentTargetPR: number;
}

function pickWeather(track: TrackDef, rng: () => number): Weather {
  if (track.preferredConditions.length && rng() < 0.75) {
    return track.preferredConditions[Math.floor(rng() * track.preferredConditions.length)];
  }
  const all: Weather[] = ['Dry', 'Rain', 'HeavyRain', 'Night', 'Heat', 'Cold'];
  return all[Math.floor(rng() * all.length)];
}

function contextFromLaunch(launch: RaceLaunch): RaceContext {
  const track = TRACKS.find(t => t.id === launch.trackId) ?? TRACKS[0];
  const rng = mulberry32(hashSeed(`launch_${launch.trackId}_${Date.now()}`));
  return { source: launch.source, track, weather: pickWeather(track, rng), opponentTargetPR: launch.opponentTargetPR };
}

export default function RaceScreen({ launch }: { launch?: RaceLaunch }) {
  const player = useGameState();
  const dispatch = useGameDispatch();

  const initialInstance = player?.ownedCars.find(c => c.instanceId === player.selectedCarInstanceId) ?? player?.ownedCars[0];

  const [ctx, setCtx] = useState<RaceContext | null>(launch ? contextFromLaunch(launch) : null);
  const [strategy, setStrategy] = useState<Strategy>('Balanced');
  const [tire, setTire] = useState<TireType>(initialInstance?.equippedTire ?? 'Sport');
  const [step, setStep] = useState<'select' | 'setup' | 'running' | 'result'>(launch ? 'setup' : 'select');
  const [result, setResult] = useState<RaceResult | null>(null);
  const [lapIndex, setLapIndex] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [adUsed, setAdUsed] = useState(false);
  const timerRef = useRef<number | null>(null);

  const selectedInstance = initialInstance;
  const selectedDef = selectedInstance ? CAR_BY_ID[selectedInstance.defId] : null;

  useEffect(() => {
    if (step !== 'running' || !result) return;
    if (lapIndex >= result.laps) return;
    timerRef.current = window.setTimeout(() => setLapIndex(i => i + 1), SPEED_MS[speed]);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [step, result, lapIndex, speed]);

  useEffect(() => {
    if (step === 'running' && result && lapIndex >= result.laps) {
      AudioManager.stopMusic();
      AudioManager.play(result.playerPosition === 1 && !result.playerDnf ? 'victory' : 'defeat');
      if (ctx) dispatch({ type: 'APPLY_RACE_RESULT', result, instanceId: selectedInstance!.instanceId, source: ctx.source });
      setStep('result');
    }
  }, [step, result, lapIndex]);

  if (!player || !selectedInstance || !selectedDef) {
    return <div className="screen race-screen"><p className="muted">Nessuna auto disponibile. Scegli un&apos;auto dal Garage.</p></div>;
  }

  if (player.energy < 4 && step !== 'result') {
    return (
      <div className="screen race-screen">
        <Card>
          <h2>Energia esaurita</h2>
          <p className="muted">Ti serve energia per correre. Si rigenera nel tempo, oppure guarda una pubblicità per ricaricarla subito.</p>
          <Button onClick={async () => { await adService.show('restore_energy'); dispatch({ type: 'WATCH_AD_REWARD', placement: 'restore_energy' }); }}>
            Guarda pubblicità e ricarica
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 'select') {
    return (
      <div className="screen race-screen">
        <h1>Corsa libera</h1>
        <p className="muted">Scegli un circuito. Gli avversari verranno calibrati sul PR della tua auto.</p>
        <div className="track-list">
          {TRACKS.map(track => (
            <Card
              key={track.id}
              className="track-card clickable"
              onClick={() => {
                const rng = mulberry32(hashSeed(`${track.id}_${Date.now()}`));
                setCtx({ source: { kind: 'free' }, track, weather: pickWeather(track, rng), opponentTargetPR: carInstancePR(selectedDef, selectedInstance) });
                setStep('setup');
              }}
            >
              <div className="track-card-name">{track.name}</div>
              <div className="muted">{track.region} · {track.laps} giri · {track.lengthKm} km · Difficoltà {track.difficulty}/5</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'setup' && ctx) {
    const grip = TIRE_GRIP_BY_WEATHER;
    const bestTire = TIRES.reduce((best, t) => (grip[t][ctx.weather] > grip[best][ctx.weather] ? t : best), TIRES[0]);
    const pr = carInstancePR(selectedDef, selectedInstance);
    return (
      <div className="screen race-screen">
        <h1>{ctx.track.name}</h1>
        <p className="muted">{ctx.track.region} · {ctx.track.laps} giri · Meteo: {WEATHER_LABEL_IT[ctx.weather]}</p>

        <Card>
          <strong>{selectedDef.name}</strong> — PR {pr}
        </Card>

        <h2>Strategia</h2>
        <div className="strategy-grid">
          {STRATEGIES.map(s => (
            <button key={s} type="button" className={['option-chip', strategy === s ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setStrategy(s)}>
              <strong>{STRATEGY_LABEL_IT[s]}</strong>
              <span className="muted">{STRATEGY_DESCRIPTION_IT[s]}</span>
            </button>
          ))}
        </div>

        <h2>Gomme</h2>
        <div className="tire-row">
          {TIRES.map(t => (
            <button key={t} type="button" className={['tire-chip', tire === t ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setTire(t)}>
              {TIRE_LABEL_IT[t]}{t === bestTire ? ' ★' : ''}
            </button>
          ))}
        </div>
        <p className="muted">★ = gomma più adatta a questo meteo.</p>

        <Button
          fullWidth
          onClick={() => {
            if (tire !== selectedInstance.equippedTire) dispatch({ type: 'EQUIP_TIRE', instanceId: selectedInstance.instanceId, tire });
            const rng = mulberry32(hashSeed(`opp_${ctx.track.id}_${Date.now()}`));
            let opponents: RaceParticipant[];
            if (ctx.source.kind === 'boss') {
              const boss = BOSS_BY_ID[ctx.source.bossId];
              const bossCar = CAR_BY_ID[boss.carDefId];
              const bossParticipant: RaceParticipant = {
                id: `boss_${boss.id}`, name: boss.name, isPlayer: false,
                carDef: bossCar, carInstance: null,
                driver: { id: `boss_driver_${boss.id}`, name: boss.name, archetype: 'Technical', skill: 85, aggressiveness: 60, consistency: 80, specialty: 'AllRound', unlockLevel: 1, avatarSeed: boss.id },
                strategy: boss.strategyPreference,
                pr: boss.pr,
              };
              opponents = [bossParticipant, ...generateOpponents(ctx.opponentTargetPR, 5, rng)];
            } else {
              opponents = generateOpponents(ctx.opponentTargetPR, 7, rng);
            }
            const driver = player.selectedDriverId ? DRIVER_BY_ID[player.selectedDriverId] : DRIVER_BY_ID['driver_01'];
            const playerParticipant: RaceParticipant = {
              id: 'player', name: player.name, isPlayer: true,
              carDef: selectedDef,
              carInstance: { ...selectedInstance, equippedTire: tire },
              driver,
              strategy,
              pr: carInstancePR(selectedDef, selectedInstance),
            };
            const raceResult = simulateRace({ player: playerParticipant, opponents, track: ctx.track, weather: ctx.weather });
            setResult(raceResult);
            setLapIndex(0);
            setStep('running');
            AudioManager.play('raceStart');
            AudioManager.playMusic('race');
          }}
        >
          Via!
        </Button>
      </div>
    );
  }

  if (step === 'running' && result && ctx) {
    const order = result.lapHistory[Math.min(lapIndex, result.lapHistory.length - 1)]?.order ?? [];
    const visibleEvents = result.events.filter(e => e.lap <= lapIndex + 1).slice(-4);
    return (
      <div className="screen race-screen">
        <h1>{ctx.track.name}</h1>
        <p className="muted">Giro {Math.min(lapIndex + 1, result.laps)}/{result.laps}</p>
        <div className="speed-controls">
          {([1, 2, 4] as Speed[]).map(s => (
            <button key={s} type="button" className={['option-chip', speed === s ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setSpeed(s)}>{s}x</button>
          ))}
          <Button variant="ghost" onClick={() => setLapIndex(result.laps)}>Salta al risultato</Button>
        </div>
        <Card>
          <ol className="live-positions">
            {order.map(id => {
              const entry = [result.standings.find(s => s.participantId === id)];
              const isPlayer = id === 'player';
              return <li key={id} className={isPlayer ? 'player-row' : ''}>{isPlayer ? player.name : entry[0]?.name ?? id}</li>;
            })}
          </ol>
        </Card>
        <div className="event-ticker">
          {visibleEvents.map((e, i) => <p key={i} className="muted">{e.description}</p>)}
        </div>
      </div>
    );
  }

  if (step === 'result' && result && ctx) {
    const source = ctx.source;
    const boss = source.kind === 'boss' ? BOSS_BY_ID[source.bossId] : null;
    const champ = source.kind === 'championship' ? CHAMPIONSHIPS.find(c => c.id === source.championshipId) : null;
    const won = result.playerPosition === 1 && !result.playerDnf;
    return (
      <div className="screen race-screen">
        <h1>{result.playerDnf ? 'Ritirato' : `${result.playerPosition}° posto`}</h1>
        {boss && <p className={won ? 'muted success-text' : 'muted'}>{won ? boss.dialogueWin : boss.dialogueLose}</p>}
        {champ && <p className="muted">{champ.name}</p>}

        <Card>
          <ol className="result-standings">
            {result.standings.map(s => (
              <li key={s.participantId} className={s.isPlayer ? 'player-row' : ''}>
                <span>{s.position}. {s.name}</span>
                <span className="muted">{s.dnf ? 'DNF' : `+${s.gapToLeaderSec.toFixed(1)}s`}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <p>Crediti: +{(result.creditsEarned + result.bonusCredits).toLocaleString('it-IT')} ◈</p>
          <p>XP: +{result.xpEarned}</p>
          {result.drops.map((d, i) => (
            <p key={i} className="muted">
              {d.kind === 'tokens' ? `+${d.amount} token trovati` : d.kind === 'upgradePart' ? '+1 parte di potenziamento' : ''}
            </p>
          ))}
        </Card>

        {!adUsed && (
          <Button
            variant="secondary"
            fullWidth
            onClick={async () => {
              const ad = await adService.show('double_reward');
              if (ad.rewarded) {
                dispatch({ type: 'GRANT_BONUS', credits: result.creditsEarned + result.bonusCredits, tokens: 0, xp: result.xpEarned });
                setAdUsed(true);
              }
            }}
          >
            ▶ Guarda pubblicità per raddoppiare
          </Button>
        )}

        <Button
          fullWidth
          onClick={() => { setStep('select'); setCtx(null); setResult(null); setAdUsed(false); }}
        >
          Nuova gara
        </Button>
      </div>
    );
  }

  return null;
}
