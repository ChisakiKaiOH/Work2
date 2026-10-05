import { useEffect, useState } from 'react';
import type { AuctionState } from '../types';
import { useGameState, useGameDispatch } from '../game/hooks';
import { CAR_BY_ID } from '../data';
import { carRating } from '../services/carRating';
import { minimumNextBid } from '../services/auctions';
import CarArt from '../components/CarArt';
import RarityBadge from '../components/RarityBadge';
import Card from '../components/Card';
import Button from '../components/Button';

export default function AuctionScreen({ onFinish }: { onFinish: () => void }) {
  const player = useGameState();
  const dispatch = useGameDispatch();
  const [lastAuction, setLastAuction] = useState<AuctionState | null>(null);
  const auction = player?.activeAuction ?? null;

  useEffect(() => {
    if (auction) setLastAuction(auction);
  }, [auction]);

  if (!player) return null;

  if (!auction) {
    const wasLeading = lastAuction?.currentBid.bidderId === 'player';
    return (
      <div className="screen auction-screen">
        <Card>
          <h2>{wasLeading ? 'Hai vinto l’asta!' : 'Asta conclusa'}</h2>
          <p className="muted">{wasLeading ? 'L’auto è stata aggiunta al tuo garage.' : 'Un rivale si è aggiudicato l’auto, o nessuno ha offerto abbastanza.'}</p>
        </Card>
        <Button onClick={onFinish}>Torna alla Home</Button>
      </div>
    );
  }

  const def = CAR_BY_ID[auction.carDefId];
  const team = player.teams[player.playerTeamId];
  const nextBid = minimumNextBid(auction);
  const isPlayerLeading = auction.currentBid.bidderId === 'player';

  return (
    <div className="screen auction-screen">
      <h1>Asta</h1>
      {def && (
        <Card>
          <CarArt silhouette={def.silhouette} colorPrimary={def.colorPrimary} colorSecondary={def.colorSecondary} size={140} />
          <div className="car-card-info">
            <div className="car-card-name">{def.displayName}</div>
            <div className="car-card-brand">{def.description}</div>
            <div className="car-card-badges">
              <RarityBadge rarity={def.rarity} />
              <span className="badge pr-badge">Rating {carRating(def.stats)}</span>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <p>Offerta attuale: <strong>{auction.currentBid.amount.toLocaleString('it-IT')} ◈</strong></p>
        <p className="muted">di {auction.currentBid.bidderName}{isPlayerLeading ? ' (tu sei in testa!)' : ''}</p>
        <p className="muted">Round {auction.rounds}/{auction.maxRounds}</p>
      </Card>

      <div className="auction-history">
        {auction.bids.slice(-6).reverse().map((b, i) => (
          <p key={i} className="muted">{b.bidderName}: {b.amount.toLocaleString('it-IT')} ◈</p>
        ))}
      </div>

      <Button fullWidth disabled={team.budget < nextBid} onClick={() => dispatch({ type: 'AUCTION_BID' })}>
        Offri {nextBid.toLocaleString('it-IT')} ◈
      </Button>
      <Button fullWidth variant="secondary" onClick={() => { dispatch({ type: 'AUCTION_PASS' }); onFinish(); }}>
        {isPlayerLeading ? 'Ferma le offerte e vinci' : 'Passa'}
      </Button>
    </div>
  );
}
