import { useGameState } from '../game/hooks';
import { ACHIEVEMENTS } from '../data';
import { conditionValue } from '../services/achievements';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';

export default function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const player = useGameState();
  if (!player) return null;

  return (
    <div className="screen achievements-screen">
      <Button variant="ghost" onClick={onBack}>← Altro</Button>
      <h1>Obiettivi ({player.achievementsUnlocked.length}/{ACHIEVEMENTS.length})</h1>
      {ACHIEVEMENTS.map(ach => {
        const unlocked = player.achievementsUnlocked.includes(ach.id);
        const value = conditionValue(player, ach.condition);
        return (
          <Card key={ach.id} className={['achievement-card', unlocked ? 'unlocked' : ''].filter(Boolean).join(' ')}>
            <div className="collection-header">
              <strong>{unlocked ? '✓ ' : ''}{ach.name}</strong>
              <span className="muted">{Math.min(value, ach.condition.count)}/{ach.condition.count}</span>
            </div>
            <p className="muted">{ach.description}</p>
            {!unlocked && <ProgressBar value={(value / ach.condition.count) * 100} />}
            <p className="muted">Ricompensa: {ach.rewardCredits.toLocaleString('it-IT')} ◈ + {ach.rewardTokens} ✦</p>
          </Card>
        );
      })}
    </div>
  );
}
