import type { PlayerState } from '../types';
import { xpToNextLevel } from '../services/progression';
import ProgressBar from './ProgressBar';

export default function TopBar({ player }: { player: PlayerState }) {
  const needed = xpToNextLevel(player.level);
  return (
    <div className="top-bar">
      <div className="top-bar-level">
        <div className="level-chip">Lv {player.level}</div>
        <div className="top-bar-xp">
          <ProgressBar value={(player.xp / needed) * 100} colorVar="--color-accent" height={6} />
        </div>
      </div>
      <div className="top-bar-currencies">
        <span className="currency credits" title="Crediti">◈ {player.credits.toLocaleString('it-IT')}</span>
        <span className="currency tokens" title="Token">✦ {player.tokens.toLocaleString('it-IT')}</span>
        <span className="currency energy" title="Energia">⚡ {player.energy}/{player.maxEnergy}</span>
      </div>
    </div>
  );
}
