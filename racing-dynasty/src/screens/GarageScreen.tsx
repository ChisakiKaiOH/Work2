import { useState } from 'react';
import type { CarInstance, TireType, UpgradeCategory } from '../types';
import { UPGRADE_GROUPS, MAX_UPGRADE_LEVEL } from '../types';
import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID } from '../data';
import { carInstanceStats, carInstancePR, upgradeCost, isMaxLevel } from '../services/performanceRating';
import { TIRE_LABEL_IT } from '../services/conditions';
import CarArt from '../components/CarArt';
import CarCard from '../components/CarCard';
import RarityBadge from '../components/RarityBadge';
import PRBadge from '../components/PRBadge';
import StatBar from '../components/StatBar';
import Card from '../components/Card';
import Button from '../components/Button';

const TIRES: TireType[] = ['Street', 'Sport', 'Racing', 'Rain', 'WetRacing'];

function CarDetail({ instance }: { instance: CarInstance }) {
  const dispatch = useGameDispatch();
  const player = useGameState();
  const def = CAR_BY_ID[instance.defId];
  const stats = carInstanceStats(def, instance);
  const pr = carInstancePR(def, instance);
  if (!player) return null;

  return (
    <Card className="car-detail">
      <div className="car-detail-header">
        <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={120} />
        <div>
          <div className="car-card-name">{def.name}</div>
          <div className="car-card-brand">{def.brand}</div>
          <div className="car-card-badges">
            <RarityBadge rarity={def.rarity} />
            <PRBadge pr={pr} />
          </div>
        </div>
      </div>

      <div className="car-detail-actions">
        <Button
          variant={player.selectedCarInstanceId === instance.instanceId ? 'secondary' : 'primary'}
          disabled={player.selectedCarInstanceId === instance.instanceId}
          onClick={() => dispatch({ type: 'SELECT_CAR', instanceId: instance.instanceId })}
        >
          {player.selectedCarInstanceId === instance.instanceId ? 'In uso' : 'Usa in gara'}
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', instanceId: instance.instanceId })}>
          {instance.favorite ? '★ Preferita' : '☆ Preferisci'}
        </Button>
      </div>

      <h2>Statistiche</h2>
      <StatBar label="Potenza" value={stats.power} colorVar="--color-danger" />
      <StatBar label="Accelerazione" value={stats.acceleration} colorVar="--color-warning" />
      <StatBar label="Velocità massima" value={stats.topSpeed} colorVar="--color-blue" />
      <StatBar label="Frenata" value={stats.braking} colorVar="--color-accent" />
      <StatBar label="Grip" value={stats.grip} colorVar="--color-success" />
      <StatBar label="Stabilità" value={stats.stability} colorVar="--color-blue" />
      <StatBar label="Affidabilità" value={stats.reliability} colorVar="--color-success" />
      <StatBar label="Trazione" value={stats.traction} colorVar="--color-warning" />
      <div className="stat-bar">
        <div className="stat-bar-row">
          <span className="stat-bar-label">Peso</span>
          <span className="stat-bar-value">{Math.round(stats.weight)} kg</span>
        </div>
      </div>

      <h2>Gomme</h2>
      <div className="tire-row">
        {TIRES.map(t => (
          <button
            key={t}
            type="button"
            className={['tire-chip', instance.equippedTire === t ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => dispatch({ type: 'EQUIP_TIRE', instanceId: instance.instanceId, tire: t })}
          >
            {TIRE_LABEL_IT[t]}
          </button>
        ))}
      </div>

      <h2>Potenziamenti</h2>
      {Object.entries(UPGRADE_GROUPS).map(([group, categories]) => (
        <div key={group} className="upgrade-group">
          <h3>{group}</h3>
          {categories.map((cat: UpgradeCategory) => {
            const level = instance.upgrades[cat];
            const maxed = isMaxLevel(level);
            const cost = upgradeCost(cat, level);
            const discounted = player.upgradeParts > 0 ? Math.round(cost * 0.75) : cost;
            return (
              <div key={cat} className="upgrade-row">
                <div className="upgrade-row-label">
                  <span>{cat}</span>
                  <span className="upgrade-level">Lv {level}/{MAX_UPGRADE_LEVEL}</span>
                </div>
                <Button
                  variant="secondary"
                  disabled={maxed || player.credits < discounted}
                  onClick={() => dispatch({ type: 'UPGRADE_CAR', instanceId: instance.instanceId, category: cat })}
                >
                  {maxed ? 'Max' : `Potenzia · ${discounted.toLocaleString('it-IT')} ◈${player.upgradeParts > 0 ? ' (parte usata)' : ''}`}
                </Button>
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
}

export default function GarageScreen() {
  const player = useGameState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!player) return null;

  const detailInstance = player.ownedCars.find(c => c.instanceId === selectedId);

  if (detailInstance) {
    return (
      <div className="screen garage-screen">
        <Button variant="ghost" onClick={() => setSelectedId(null)}>← Torna al garage</Button>
        <CarDetail instance={detailInstance} />
      </div>
    );
  }

  return (
    <div className="screen garage-screen">
      <h1>Garage ({player.ownedCars.length}/{player.garageSlots})</h1>
      <div className="car-grid">
        {player.ownedCars.map(instance => {
          const def = CAR_BY_ID[instance.defId];
          return (
            <CarCard
              key={instance.instanceId}
              car={def}
              pr={carInstancePR(def, instance)}
              selected={player.selectedCarInstanceId === instance.instanceId}
              onClick={() => setSelectedId(instance.instanceId)}
              footer={instance.favorite ? <span className="favorite-star">★</span> : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
