import { useEffect, useRef, useState } from 'react';
import { useGameState, useGameDispatch } from '../game/hooks';
import { PACKS, CAR_BY_ID } from '../data';
import { RARITY_ORDER } from '../types';
import { AudioManager } from '../audio/AudioManager';
import CarArt from '../components/CarArt';
import RarityBadge from '../components/RarityBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

export default function PacksScreen({ onBack }: { onBack: () => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  const [opening, setOpening] = useState<string | null>(null);
  const prevCountRef = useRef<number>(0);
  const [reveal, setReveal] = useState<string[] | null>(null);

  useEffect(() => {
    if (!player || !opening) return;
    if (player.ownedCars.length > prevCountRef.current) {
      const pack = PACKS.find(p => p.id === opening);
      const gained = pack ? player.ownedCars.slice(-pack.carCount) : [];
      setReveal(gained.map(c => c.defId));
      setOpening(null);
      AudioManager.play('reward');
    }
  }, [player, opening]);

  if (!player) return null;

  return (
    <div className="screen packs-screen">
      <Button variant="ghost" onClick={onBack}>← Altro</Button>
      <h1>Pacchetti</h1>
      <div className="pack-grid">
        {PACKS.map(pack => {
          const pity = player.packPity[pack.id] ?? 0;
          const balance = pack.currency === 'credits' ? player.credits : player.tokens;
          return (
            <Card key={pack.id} className="pack-card">
              <strong>{pack.name}{pack.limited ? ' · Limitato' : ''}</strong>
              <p className="muted">{pack.description}</p>
              <div className="pack-odds">
                {RARITY_ORDER.map(r => (
                  <span key={r} className="pack-odds-row">{r}: {(pack.odds[r] / RARITY_ORDER.reduce((s, x) => s + pack.odds[x], 0) * 100).toFixed(1)}%</span>
                ))}
              </div>
              <p className="muted">Pity: {pity}/{pack.pityThreshold} (garantisce {pack.guaranteedRarityAt}+)</p>
              <Button
                disabled={balance < pack.price}
                onClick={() => {
                  prevCountRef.current = player.ownedCars.length;
                  setOpening(pack.id);
                  AudioManager.play('packOpen');
                  dispatch({ type: 'OPEN_PACK', packId: pack.id });
                }}
              >
                Apri · {pack.price.toLocaleString('it-IT')} {pack.currency === 'credits' ? '◈' : '✦'}
              </Button>
            </Card>
          );
        })}
      </div>

      {reveal && (
        <Modal title="Nuove auto!" onClose={() => setReveal(null)}>
          <div className="reveal-grid">
            {reveal.map((defId, i) => {
              const def = CAR_BY_ID[defId];
              return (
                <div key={i} className="reveal-card">
                  <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={100} />
                  <strong>{def.name}</strong>
                  <RarityBadge rarity={def.rarity} />
                </div>
              );
            })}
          </div>
          <Button fullWidth onClick={() => setReveal(null)}>Fantastico!</Button>
        </Modal>
      )}
    </div>
  );
}
