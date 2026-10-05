import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID } from '../data';
import { carInstancePR } from '../services/performanceRating';
import CarArt from '../components/CarArt';
import PRBadge from '../components/PRBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import type { Screen } from './navigation';

const ONE_DAY = 24 * 60 * 60 * 1000;

export default function HomeScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  if (!player) return null;

  const selected = player.ownedCars.find(c => c.instanceId === player.selectedCarInstanceId) ?? player.ownedCars[0];
  const selectedDef = selected ? CAR_BY_ID[selected.defId] : null;
  const canClaimDaily = !player.lastDailyClaim || Date.now() - player.lastDailyClaim >= ONE_DAY;
  const recent = player.raceHistory.slice(-3).reverse();

  return (
    <div className="screen home-screen">
      <h1>Bentornato, {player.name}</h1>

      {selectedDef && selected && (
        <Card className="home-car-card">
          <CarArt silhouette={selectedDef.silhouette} colorPrimary={selectedDef.colorPrimary} colorSecondary={selectedDef.colorSecondary} size={140} />
          <div className="home-car-info">
            <div className="car-card-name">{selectedDef.name}</div>
            <div className="car-card-brand">{selectedDef.brand}</div>
            <PRBadge pr={carInstancePR(selectedDef, selected)} />
          </div>
          <Button variant="secondary" onClick={() => onNavigate('garage')}>Vai al Garage</Button>
        </Card>
      )}

      <div className="home-quick-actions">
        <Button fullWidth onClick={() => onNavigate('race')}>▶ Corsa libera</Button>
        <Button fullWidth variant="secondary" onClick={() => onNavigate('world')}>World Tour &amp; Campionati</Button>
        <Button fullWidth variant="secondary" onClick={() => onNavigate('packs')}>Apri un pacchetto</Button>
      </div>

      <Card className="daily-reward-card">
        <div>
          <strong>Ricompensa giornaliera</strong>
          <p className="muted">Serie attuale: giorno {player.dailyRewardStreak || 0}/7</p>
        </div>
        <Button
          disabled={!canClaimDaily}
          onClick={() => dispatch({ type: 'CLAIM_DAILY_REWARD' })}
        >
          {canClaimDaily ? 'Ritira' : 'Ritirata'}
        </Button>
      </Card>

      {recent.length > 0 && (
        <Card>
          <strong>Ultime gare</strong>
          <ul className="race-history-list">
            {recent.map(r => (
              <li key={r.raceId}>
                Posizione {r.position}/{r.totalDrivers} · +{r.creditsEarned.toLocaleString('it-IT')} ◈ · +{r.xpEarned} XP
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
