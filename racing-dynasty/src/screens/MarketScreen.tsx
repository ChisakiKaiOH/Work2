import { useState } from 'react';
import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID, CARS } from '../data';
import { carRating } from '../services/carRating';
import CarArt from '../components/CarArt';
import RarityBadge from '../components/RarityBadge';
import Card from '../components/Card';
import Button from '../components/Button';

type Tab = 'buy' | 'rent';

export default function MarketScreen() {
  const player = useGameState();
  const dispatch = useGameDispatch();
  const [tab, setTab] = useState<Tab>('buy');
  if (!player) return null;

  const team = player.teams[player.playerTeamId];
  const rentableCars = CARS.filter(c => c.rarity !== 'Iconic');

  return (
    <div className="screen market-screen">
      <h1>Mercato</h1>
      <div className="strategy-grid">
        <button type="button" className={['option-chip', tab === 'buy' ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setTab('buy')}>Acquista</button>
        <button type="button" className={['option-chip', tab === 'rent' ? 'active' : ''].filter(Boolean).join(' ')} onClick={() => setTab('rent')}>Noleggia</button>
      </div>

      {tab === 'buy' && (
        <>
          <p className="muted">Auto usate disponibili, rinnovate periodicamente.</p>
          <div className="car-grid">
            {player.usedCarMarket.map(listing => {
              const def = CAR_BY_ID[listing.defId];
              if (!def) return null;
              return (
                <Card key={listing.id} className="car-card">
                  <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={100} />
                  <div className="car-card-info">
                    <div className="car-card-name">{def.displayName}</div>
                    <div className="car-card-brand">Condizione {listing.condition}%</div>
                    <div className="car-card-badges">
                      <RarityBadge rarity={def.rarity} />
                      <span className="badge pr-badge">Rating {carRating(def.stats)}</span>
                    </div>
                  </div>
                  <Button disabled={team.budget < listing.price} onClick={() => dispatch({ type: 'BUY_CAR', listingId: listing.id })}>
                    Compra · {listing.price.toLocaleString('it-IT')} ◈
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {tab === 'rent' && (
        <>
          <p className="muted">Il noleggio costa meno dell'acquisto e l'auto torna al proprietario a fine contratto.</p>
          <div className="car-grid">
            {rentableCars.map(def => {
              const price1 = def.rentPricePerEvent;
              const price3 = Math.round(def.rentPricePerEvent * 3 * 0.9);
              return (
                <Card key={def.id} className="car-card">
                  <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={100} />
                  <div className="car-card-info">
                    <div className="car-card-name">{def.displayName}</div>
                    <div className="car-card-badges">
                      <RarityBadge rarity={def.rarity} />
                      <span className="badge pr-badge">Rating {carRating(def.stats)}</span>
                    </div>
                  </div>
                  <div className="car-detail-actions">
                    <Button variant="secondary" disabled={team.budget < price1} onClick={() => dispatch({ type: 'RENT_CAR', defId: def.id, durationEvents: 1 })}>
                      1 gara · {price1.toLocaleString('it-IT')} ◈
                    </Button>
                    <Button variant="ghost" disabled={team.budget < price3} onClick={() => dispatch({ type: 'RENT_CAR', defId: def.id, durationEvents: 3 })}>
                      3 gare · {price3.toLocaleString('it-IT')} ◈
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
