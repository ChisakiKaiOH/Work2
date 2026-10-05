import { useState } from 'react';
import { useGameState, useGameDispatch } from '../game/hooks';
import { SaveManager } from '../save/SaveManager';
import { formatDate } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';

export default function TeamScreen() {
  const player = useGameState();
  const dispatch = useGameDispatch();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!player) return null;

  const team = player.teams[player.playerTeamId];
  const recentLedger = player.finance.ledger.slice(-10).reverse();

  return (
    <div className="screen team-screen">
      <h1>{team.displayName}</h1>
      <Card>
        <p>Proprietario: {team.ownerName}</p>
        <p>Fondata: {team.founded}</p>
        <p>Reputazione: {team.reputation}/100</p>
        <p>Budget: {team.budget.toLocaleString('it-IT')} ◈</p>
      </Card>

      {player.seasonHistory.length > 0 && (
        <>
          <h2>Storico stagioni</h2>
          {player.seasonHistory.map(s => (
            <Card key={s.year}>
              <strong>{s.year}</strong>
              <p className="muted">{s.wins} vittorie · {s.podiums} podi · {s.moneyEarned.toLocaleString('it-IT')} ◈ guadagnati</p>
            </Card>
          ))}
        </>
      )}

      <h2>Movimenti recenti</h2>
      <Card>
        {recentLedger.length === 0 && <p className="muted">Nessun movimento ancora.</p>}
        <ul className="race-history-list">
          {recentLedger.map((entry, i) => (
            <li key={i}>
              {formatDate(entry.date)} — {entry.label}: <span style={{ color: entry.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {entry.amount >= 0 ? '+' : ''}{entry.amount.toLocaleString('it-IT')} ◈
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <h2>Impostazioni</h2>
      <Card className="settings-card">
        <label className="settings-row">
          <span>Musica</span>
          <input type="checkbox" checked={player.settings.musicOn} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { musicOn: e.target.checked } })} />
        </label>
        <label className="settings-row">
          <span>Effetti sonori</span>
          <input type="checkbox" checked={player.settings.soundOn} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { soundOn: e.target.checked } })} />
        </label>
        <label className="settings-row">
          <span>Notifiche</span>
          <input type="checkbox" checked={player.settings.notificationsOn} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { notificationsOn: e.target.checked } })} />
        </label>
        <div className="settings-row">
          <span>Lingua</span>
          <select value={player.settings.language} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { language: e.target.value as 'it' | 'en' } })}>
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
        </div>
      </Card>

      <Card className="settings-card">
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Ricomincia da zero</Button>
        ) : (
          <>
            <p className="muted">Sicuro? Tutti i progressi andranno persi.</p>
            <Button variant="danger" onClick={() => { SaveManager.clear(); dispatch({ type: 'RESET_SAVE' }); }}>Confermo, ricomincia</Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Annulla</Button>
          </>
        )}
      </Card>
    </div>
  );
}
