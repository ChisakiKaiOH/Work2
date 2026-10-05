import { useGameState } from '../game/hooks';
import Card from '../components/Card';
import type { Screen } from './navigation';

const ITEMS: { screen: Screen; label: string; icon: string; desc: string }[] = [
  { screen: 'market', label: 'Mercato dell’usato', icon: '⇄', desc: 'Auto in vendita, rinnovate ogni giorno.' },
  { screen: 'packs', label: 'Pacchetti', icon: '◪', desc: 'Apri pacchetti per nuove auto, probabilità sempre visibili.' },
  { screen: 'collection', label: 'Collezione', icon: '▣', desc: 'Completa i set di marche per bonus esclusivi.' },
  { screen: 'achievements', label: 'Obiettivi', icon: '▲', desc: 'Traguardi e ricompense per i tuoi progressi.' },
  { screen: 'leaderboard', label: 'Classifica', icon: '▤', desc: 'Confrontati con i rivali di Racing Dynasty.' },
  { screen: 'settings', label: 'Impostazioni', icon: '⚙', desc: 'Audio, grafica, notifiche e lingua.' },
];

export default function MoreScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const player = useGameState();
  if (!player) return null;
  return (
    <div className="screen more-screen">
      <h1>Altro</h1>
      <div className="more-list">
        {ITEMS.map(item => (
          <Card key={item.screen} className="more-item clickable" onClick={() => onNavigate(item.screen)}>
            <span className="more-icon">{item.icon}</span>
            <div>
              <strong>{item.label}</strong>
              <p className="muted">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
