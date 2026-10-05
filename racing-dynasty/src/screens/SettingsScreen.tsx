import { useState } from 'react';
import { useGameState, useGameDispatch } from '../game/hooks';
import { AudioManager } from '../audio/AudioManager';
import { SaveManager } from '../save/SaveManager';
import { STORE_PRODUCTS, monetizationService } from '../monetization/MonetizationService';
import Card from '../components/Card';
import Button from '../components/Button';

export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!player) return null;

  return (
    <div className="screen settings-screen">
      <Button variant="ghost" onClick={onBack}>← Altro</Button>
      <h1>Impostazioni</h1>

      <Card className="settings-card">
        <label className="settings-row">
          <span>Musica</span>
          <input
            type="checkbox"
            checked={player.settings.musicOn}
            onChange={e => { dispatch({ type: 'UPDATE_SETTINGS', settings: { musicOn: e.target.checked } }); AudioManager.setMusicOn(e.target.checked); }}
          />
        </label>
        <label className="settings-row">
          <span>Effetti sonori</span>
          <input
            type="checkbox"
            checked={player.settings.soundOn}
            onChange={e => { dispatch({ type: 'UPDATE_SETTINGS', settings: { soundOn: e.target.checked } }); AudioManager.setSoundOn(e.target.checked); }}
          />
        </label>
        <label className="settings-row">
          <span>Notifiche</span>
          <input
            type="checkbox"
            checked={player.settings.notificationsOn}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { notificationsOn: e.target.checked } })}
          />
        </label>
        <label className="settings-row">
          <span>Risparmio batteria</span>
          <input
            type="checkbox"
            checked={player.settings.batterySaver}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { batterySaver: e.target.checked } })}
          />
        </label>
        <div className="settings-row">
          <span>Qualità grafica</span>
          <select
            value={player.settings.graphicsQuality}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { graphicsQuality: e.target.value as 'Low' | 'Medium' | 'High' } })}
          >
            <option value="Low">Bassa</option>
            <option value="Medium">Media</option>
            <option value="High">Alta</option>
          </select>
        </div>
        <div className="settings-row">
          <span>Lingua</span>
          <select
            value={player.settings.language}
            onChange={e => dispatch({ type: 'UPDATE_SETTINGS', settings: { language: e.target.value as 'it' | 'en' } })}
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </select>
        </div>
      </Card>

      <h2>Negozio</h2>
      <p className="muted">Tutto qui è virtuale: nessun prodotto sblocca contenuti obbligatori per giocare.</p>
      <div className="store-grid">
        {STORE_PRODUCTS.map(p => (
          <Card key={p.id} className="store-card">
            <strong>{p.name}</strong>
            <p className="muted">{p.description}</p>
            <Button
              variant="secondary"
              disabled={p.id === 'remove_ads' && player.monetization.adsRemoved}
              onClick={async () => {
                const res = await monetizationService.purchase(p.id);
                if (res.success) dispatch({ type: 'PURCHASE_PRODUCT', productId: p.id });
              }}
            >
              {p.id === 'remove_ads' && player.monetization.adsRemoved ? 'Acquistato' : p.priceLabel}
            </Button>
          </Card>
        ))}
      </div>

      <h2>Salvataggio</h2>
      <Card className="settings-card">
        <Button variant="secondary" onClick={() => {
          const json = SaveManager.exportJson(player);
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'racing-dynasty-save.json'; a.click();
          URL.revokeObjectURL(url);
        }}>
          Esporta salvataggio
        </Button>
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)}>Ricomincia da zero</Button>
        ) : (
          <>
            <p className="muted">Sicuro? Tutti i progressi verranno persi.</p>
            <Button variant="danger" onClick={() => { SaveManager.clear(); dispatch({ type: 'RESET_SAVE' }); }}>Confermo, ricomincia</Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Annulla</Button>
          </>
        )}
      </Card>
    </div>
  );
}
