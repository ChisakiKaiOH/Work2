import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID, TRACK_BY_ID, CHAMPIONSHIP_BY_ID } from '../data';
import { carRating } from '../services/carRating';
import CarArt from '../components/CarArt';
import Card from '../components/Card';
import Button from '../components/Button';
import type { EventScreen } from './navigation';

const ENTRY_LABEL_IT: Record<string, string> = {
  PRE_SEASON: 'Pre-Stagione', TEST: 'Test Privati', RACE: 'Gara', MARKET: 'Mercato',
  AUCTION: 'Asta', CHAMPIONSHIP_END: 'Fine Campionato', SEASON_END: 'Fine Stagione',
};

export default function HomeScreen({ onOpenEvent }: { onOpenEvent: (screen: EventScreen) => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  if (!player) return null;

  const team = player.teams[player.playerTeamId];
  const entry = player.calendar[player.currentEntryIndex] ?? null;
  const upcoming = player.calendar.slice(player.currentEntryIndex, player.currentEntryIndex + 4);

  const selectedCar = player.selectedCarInstanceId ? player.cars[player.selectedCarInstanceId] : null;
  const selectedCarDef = selectedCar ? CAR_BY_ID[selectedCar.defId] : null;
  const selectedDriver = player.selectedDriverId ? player.drivers[player.selectedDriverId] : null;

  if (!entry) {
    const lastSeason = player.seasonHistory[player.seasonHistory.length - 1];
    return (
      <div className="screen home-screen">
        <h1>{team.displayName}</h1>
        <Card>
          <h2>Fine dell'Era 1970</h2>
          {lastSeason && (
            <>
              <p>Vittorie: {lastSeason.wins} · Podi: {lastSeason.podiums}</p>
              <p>Guadagni stagionali: {lastSeason.moneyEarned.toLocaleString('it-IT')} ◈</p>
            </>
          )}
          <p className="muted">La Fase 1 di Racing Dynasty copre la stagione 1970. Le stagioni successive arriveranno in una fase futura.</p>
        </Card>
      </div>
    );
  }

  const track = entry.trackId ? TRACK_BY_ID[entry.trackId] : null;
  const championship = entry.championshipId ? CHAMPIONSHIP_BY_ID[entry.championshipId] : null;

  return (
    <div className="screen home-screen">
      <h1>{team.displayName}</h1>

      {selectedCarDef && selectedCar && selectedDriver && (
        <Card className="home-car-card">
          <CarArt silhouette={selectedCarDef.silhouette} colorPrimary={selectedCarDef.colorPrimary} colorSecondary={selectedCarDef.colorSecondary} size={110} />
          <div className="home-car-info">
            <div className="car-card-name">{selectedCarDef.displayName}</div>
            <div className="car-card-brand">{selectedDriver.displayName}</div>
            <span className="badge pr-badge">Rating {carRating(selectedCarDef.stats)}</span>
          </div>
        </Card>
      )}
      {(!selectedCarDef || !selectedDriver) && (
        <Card>
          <p className="muted">Ti serve un'auto e un pilota selezionati per correre. Vai in Garage e Piloti.</p>
        </Card>
      )}

      <Card className="next-event-card">
        <span className="badge">{ENTRY_LABEL_IT[entry.type]}</span>
        <h2>{entry.title}</h2>
        <p className="muted">{entry.description}</p>
        {track && <p className="muted">{track.displayName} · {track.laps} giri · {track.lengthKm} km</p>}
        {championship && <p className="muted">{championship.displayName}</p>}

        {entry.type === 'RACE' && (
          <Button fullWidth disabled={!selectedCarDef || !selectedDriver} onClick={() => onOpenEvent('race')}>
            Vai alla gara
          </Button>
        )}
        {entry.type === 'AUCTION' && (
          <Button fullWidth onClick={() => onOpenEvent('auction')}>Vai all'asta</Button>
        )}
        {entry.type !== 'RACE' && entry.type !== 'AUCTION' && (
          <Button fullWidth onClick={() => dispatch({ type: 'ADVANCE_TIME' })}>Avanza nel tempo</Button>
        )}
      </Card>

      <h2>Calendario</h2>
      <div className="timeline">
        {upcoming.map((e, i) => (
          <div key={e.id} className={['timeline-item', i === 0 ? 'current' : ''].filter(Boolean).join(' ')}>
            <span className="timeline-dot" />
            <div>
              <strong>{ENTRY_LABEL_IT[e.type]}</strong>
              <p className="muted">{e.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
