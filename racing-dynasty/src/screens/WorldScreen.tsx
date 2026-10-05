import { useState } from 'react';
import type { Region } from '../types';
import { useGameState } from '../game/hooks';
import { CHAMPIONSHIPS, BOSSES, TRACKS, CAR_BY_ID } from '../data';
import Card from '../components/Card';
import Button from '../components/Button';
import RarityBadge from '../components/RarityBadge';
import type { RaceLaunch } from './navigation';

const REGIONS: { id: Region; name: string }[] = [
  { id: 'Europe', name: 'Europa' },
  { id: 'Asia', name: 'Asia' },
  { id: 'America', name: 'America' },
  { id: 'Oceania', name: 'Oceania' },
  { id: 'MiddleEast', name: 'Medio Oriente' },
  { id: 'North', name: 'Territori del Nord' },
];

export default function WorldScreen({ onRace }: { onRace: (launch: RaceLaunch) => void }) {
  const player = useGameState();
  const [region, setRegion] = useState<Region | null>(null);
  const [championshipId, setChampionshipId] = useState<string | null>(null);
  if (!player) return null;

  if (!region) {
    return (
      <div className="screen world-screen">
        <h1>World Tour</h1>
        <div className="region-grid">
          {REGIONS.map(r => (
            <Card key={r.id} className="region-card clickable" onClick={() => setRegion(r.id)}>
              <strong>{r.name}</strong>
              <p className="muted">
                {CHAMPIONSHIPS.filter(c => c.region === r.id).length} campionati · {BOSSES.filter(b => b.region === r.id).length} boss
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const champ = championshipId ? CHAMPIONSHIPS.find(c => c.id === championshipId) : null;
  if (champ) {
    return (
      <div className="screen world-screen">
        <Button variant="ghost" onClick={() => setChampionshipId(null)}>← {REGIONS.find(r => r.id === region)?.name}</Button>
        <h1>{champ.name}</h1>
        <p className="muted">{champ.description}</p>
        <p className="muted">PR richiesto: {champ.requiredPR} · Ricompensa: {champ.creditReward.toLocaleString('it-IT')} ◈ + {champ.tokenReward} ✦</p>
        <div className="race-list">
          {champ.trackIds.map((trackId, i) => {
            const track = TRACKS.find(t => t.id === trackId);
            if (!track) return null;
            return (
              <Card key={trackId} className="track-card">
                <div>
                  <strong>Gara {i + 1}: {track.name}</strong>
                  <p className="muted">{track.laps} giri · {track.lengthKm} km</p>
                </div>
                <Button onClick={() => onRace({ source: { kind: 'championship', championshipId: champ.id, raceIndex: i }, trackId, opponentTargetPR: champ.requiredPR })}>
                  Gareggia
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const regionChamps = CHAMPIONSHIPS.filter(c => c.region === region);
  const regionBosses = BOSSES.filter(b => b.region === region);
  const regionTracks = TRACKS.filter(t => t.region === region);

  return (
    <div className="screen world-screen">
      <Button variant="ghost" onClick={() => setRegion(null)}>← World Tour</Button>
      <h1>{REGIONS.find(r => r.id === region)?.name}</h1>

      <h2>Campionati</h2>
      <div className="race-list">
        {regionChamps.map(c => {
          const progress = player.championshipProgress[c.id];
          return (
            <Card key={c.id} className="track-card clickable" onClick={() => setChampionshipId(c.id)}>
              <div>
                <strong>{c.name}</strong>
                <p className="muted">Tier {c.tier} · PR {c.requiredPR}+ {progress?.completed ? '· Completato ✓' : progress ? `· ${progress.racesWon} vittorie` : ''}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <h2>Boss</h2>
      <div className="race-list">
        {regionBosses.map(boss => {
          const bossCar = CAR_BY_ID[boss.carDefId];
          const defeated = player.bossesDefeated.includes(boss.id);
          const track = regionTracks[Math.abs(boss.id.length + boss.pr) % Math.max(1, regionTracks.length)] ?? TRACKS[0];
          return (
            <Card key={boss.id} className="track-card">
              <div>
                <strong>{boss.name}</strong> {defeated && <RarityBadge rarity="Legendary" />}
                <p className="muted">{boss.personality} · {bossCar?.name} · PR {boss.pr}</p>
              </div>
              <Button onClick={() => onRace({ source: { kind: 'boss', bossId: boss.id }, trackId: track.id, opponentTargetPR: boss.pr })}>
                Sfida
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
