import { useEffect, useState } from 'react';
import { useGameState } from '../game/hooks';
import { leaderboardService, type LeaderboardEntry, type LeaderboardScope } from '../services/backendMocks';
import Card from '../components/Card';
import Button from '../components/Button';

const SCOPES: LeaderboardScope[] = ['Weekly', 'Monthly', 'AllTime'];
const SCOPE_LABEL_IT: Record<LeaderboardScope, string> = { Weekly: 'Settimanale', Monthly: 'Mensile', AllTime: 'Sempre' };

export default function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const player = useGameState();
  const [scope, setScope] = useState<LeaderboardScope>('Weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    leaderboardService.getLeaderboard(scope, 'points').then(setEntries);
  }, [scope]);

  if (!player) return null;
  const playerPoints = player.wonRaceCount * 100 + player.completedRaceCount * 20;

  return (
    <div className="screen leaderboard-screen">
      <Button variant="ghost" onClick={onBack}>← Altro</Button>
      <h1>Classifica</h1>
      <div className="strategy-grid">
        {SCOPES.map(s => (
          <button key={s} type="button" className={['option-chip', scope === s ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setScope(s)}>
            {SCOPE_LABEL_IT[s]}
          </button>
        ))}
      </div>
      <Card>
        <ol className="result-standings">
          {entries.map(e => (
            <li key={e.userId}><span>{e.rank}. {e.displayName}</span><span className="muted">{e.value.toLocaleString('it-IT')} pt</span></li>
          ))}
          <li className="player-row"><span>• {player.name} (tu)</span><span className="muted">{playerPoints.toLocaleString('it-IT')} pt</span></li>
        </ol>
      </Card>
    </div>
  );
}
