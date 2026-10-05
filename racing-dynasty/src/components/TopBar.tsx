import type { PlayerState } from '../types';
import { formatDate } from '../types';

export default function TopBar({ player }: { player: PlayerState }) {
  const team = player.teams[player.playerTeamId];
  return (
    <div className="top-bar">
      <div className="top-bar-date">{formatDate(player.currentDate)}</div>
      <div className="top-bar-currencies">
        <span className="currency budget" title="Budget">◈ {team.budget.toLocaleString('it-IT')}</span>
        <span className="currency reputation" title="Reputazione">★ {team.reputation}</span>
      </div>
    </div>
  );
}
