import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID } from '../data';
import { effectiveStats, performanceRating } from '../services/performanceRating';
import CarArt from '../components/CarArt';
import RarityBadge from '../components/RarityBadge';
import PRBadge from '../components/PRBadge';
import Card from '../components/Card';
import Button from '../components/Button';

export default function MarketScreen({ onBack }: { onBack: () => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  if (!player) return null;

  const hoursLeft = player.marketGeneratedAt ? Math.max(0, 24 - (Date.now() - player.marketGeneratedAt) / 3_600_000) : 0;

  return (
    <div className="screen market-screen">
      <Button variant="ghost" onClick={onBack}>← Altro</Button>
      <h1>Mercato dell&apos;usato</h1>
      <p className="muted">Si rinnova tra {hoursLeft.toFixed(1)} ore.</p>
      <div className="car-grid">
        {player.marketListings.map(listing => {
          const def = CAR_BY_ID[listing.defId];
          const pr = performanceRating(effectiveStats(def.stats, listing.upgrades));
          return (
            <Card key={listing.id} className="car-card">
              <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={110} />
              <div className="car-card-info">
                <div className="car-card-name">{def.name}</div>
                <div className="car-card-brand">{def.brand}</div>
                <div className="car-card-badges">
                  <RarityBadge rarity={def.rarity} />
                  <PRBadge pr={pr} />
                </div>
                <p className="muted">Condizione: {listing.condition}%</p>
              </div>
              <Button
                disabled={player.credits < listing.price || player.ownedCars.length >= player.garageSlots}
                onClick={() => dispatch({ type: 'BUY_MARKET_CAR', listingId: listing.id })}
              >
                Compra · {listing.price.toLocaleString('it-IT')} ◈
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
