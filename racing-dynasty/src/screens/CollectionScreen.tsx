import { useGameState } from '../game/hooks';
import { COLLECTIONS, CAR_BY_ID } from '../data';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';

export default function CollectionScreen({ onBack }: { onBack: () => void }) {
  const player = useGameState();
  if (!player) return null;
  const ownedDefIds = new Set(player.ownedCars.map(c => c.defId));

  return (
    <div className="screen collection-screen">
      <Button variant="ghost" onClick={onBack}>← Altro</Button>
      <h1>Collezione</h1>
      {COLLECTIONS.map(col => {
        const owned = col.carDefIds.filter(id => ownedDefIds.has(id)).length;
        const complete = player.collectionProgress[col.id] === true;
        return (
          <Card key={col.id} className="collection-card">
            <div className="collection-header">
              <strong>{col.name}</strong>
              <span className="muted">{owned}/{col.carDefIds.length}{complete ? ' ✓' : ''}</span>
            </div>
            <ProgressBar value={(owned / col.carDefIds.length) * 100} colorVar={complete ? '--color-success' : '--color-accent'} />
            <div className="collection-cars">
              {col.carDefIds.map(id => (
                <span key={id} className={['collection-chip', ownedDefIds.has(id) ? 'owned' : ''].filter(Boolean).join(' ')}>
                  {CAR_BY_ID[id]?.name ?? id}
                </span>
              ))}
            </div>
            <p className="muted">Ricompensa: {col.rewardCredits.toLocaleString('it-IT')} ◈ + {col.rewardTokens} ✦</p>
          </Card>
        );
      })}
    </div>
  );
}
