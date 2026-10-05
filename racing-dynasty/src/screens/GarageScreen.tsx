import { useState } from 'react';
import type { CarInstance } from '../types';
import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID } from '../data';
import { carRating } from '../services/carRating';
import CarArt from '../components/CarArt';
import RarityBadge from '../components/RarityBadge';
import StatBar from '../components/StatBar';
import Card from '../components/Card';
import Button from '../components/Button';

function CarDetail({ instance, onBack }: { instance: CarInstance; onBack: () => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  const def = CAR_BY_ID[instance.defId];
  if (!player || !def) return null;
  const isSelected = player.selectedCarInstanceId === instance.instanceId;

  return (
    <div className="screen garage-screen">
      <Button variant="ghost" onClick={onBack}>← Torna al garage</Button>
      <Card className="car-detail">
        <div className="car-detail-header">
          <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={120} />
          <div>
            <div className="car-card-name">{def.displayName}</div>
            <div className="car-card-brand">{def.year} · {def.category}</div>
            <div className="car-card-badges">
              <RarityBadge rarity={def.rarity} />
              <span className="badge pr-badge">Rating {carRating(def.stats)}</span>
            </div>
          </div>
        </div>

        <p className="muted">{def.description}</p>
        <p className="muted">{instance.ownership === 'owned' ? `Condizione: ${instance.condition}%` : 'Auto a noleggio — verrà restituita al termine del contratto.'}</p>

        <div className="car-detail-actions">
          <Button variant={isSelected ? 'secondary' : 'primary'} disabled={isSelected} onClick={() => dispatch({ type: 'SELECT_RACE_CAR', instanceId: instance.instanceId })}>
            {isSelected ? 'In uso per la prossima gara' : 'Usa per la prossima gara'}
          </Button>
          {instance.ownership === 'owned' && (
            <Button variant="danger" onClick={() => { dispatch({ type: 'SELL_CAR', instanceId: instance.instanceId }); onBack(); }}>
              Vendi
            </Button>
          )}
        </div>

        <h2>Statistiche</h2>
        <StatBar label="Potenza" value={def.stats.power} max={230} colorVar="--color-danger" />
        <StatBar label="Velocità massima" value={def.stats.topSpeed} max={230} colorVar="--color-blue" />
        <StatBar label="Maneggevolezza" value={def.stats.handling} max={200} colorVar="--color-success" />
        <StatBar label="Frenata" value={def.stats.braking} max={200} colorVar="--color-accent" />
        <StatBar label="Affidabilità" value={def.stats.reliability} max={200} colorVar="--color-success" />
        <StatBar label="Aerodinamica" value={def.stats.aerodynamics} max={200} colorVar="--color-warning" />
        <p className="muted">Peso: {def.stats.weight} kg</p>
      </Card>
    </div>
  );
}

export default function GarageScreen() {
  const player = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!player) return null;

  const team = player.teams[player.playerTeamId];
  const instances = team.carInstanceIds.map(id => player.cars[id]).filter(Boolean);

  const detail = instances.find(i => i.instanceId === selectedId);
  if (detail) return <CarDetail instance={detail} onBack={() => setSelectedId(null)} />;

  return (
    <div className="screen garage-screen">
      <h1>Garage ({instances.length})</h1>
      {instances.length === 0 && <p className="muted">Non hai ancora nessuna auto. Vai al Mercato per comprarne o noleggiarne una.</p>}
      <div className="car-grid">
        {instances.map(instance => {
          const def = CAR_BY_ID[instance.defId];
          if (!def) return null;
          return (
            <Card key={instance.instanceId} className={['car-card', 'clickable', player.selectedCarInstanceId === instance.instanceId ? 'selected' : ''].join(' ')} onClick={() => setSelectedId(instance.instanceId)}>
              <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={110} />
              <div className="car-card-info">
                <div className="car-card-name">{def.displayName}</div>
                <div className="car-card-brand">{instance.ownership === 'owned' ? 'Di proprietà' : 'Noleggiata'}</div>
                <div className="car-card-badges">
                  <RarityBadge rarity={def.rarity} />
                  <span className="badge pr-badge">Rating {carRating(def.stats)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
