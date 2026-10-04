import { useState } from "react";
import type { Platform } from "../types";
import { PLATFORMS } from "../data/platformsThemes";
import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import Sparkline from "../components/Sparkline";
import { axisLabel } from "../data/genres";
import { formatMoney } from "../utils/format";
import { DLC_COST, PORT_COST, UPDATE_COST } from "../systems/sales";

type Tab = "overview" | "sales" | "reviews";

export default function GameDetailsScreen({ gameId, onBack }: { gameId: string; onBack: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [tab, setTab] = useState<Tab>("overview");
  const [discount, setDiscount] = useState(20);

  const game = state.releasedGames.find((g) => g.id === gameId);
  if (!game) {
    return (
      <div className="screen">
        <p className="panel-empty">Gioco non trovato.</p>
        <Button variant="ghost" onClick={onBack}>
          Indietro
        </Button>
      </div>
    );
  }

  const missingPlatforms = PLATFORMS.filter((p) => !game.platforms.includes(p));

  return (
    <div className="screen game-details-screen">
      <Button variant="ghost" onClick={onBack}>
        ← Indietro
      </Button>
      <h1>{game.name}</h1>
      <p className="screen-subtitle">
        {game.genre} · {game.platforms.join(", ")} · {game.theme}
      </p>

      <div className="inner-tabs">
        {(["overview", "sales", "reviews"] as Tab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? "inner-tab inner-tab-active" : "inner-tab"} onClick={() => setTab(t)}>
            {t === "overview" ? "Panoramica" : t === "sales" ? "Vendite" : "Recensioni"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <Card title="Qualità">
            {(Object.keys(game.quality) as (keyof typeof game.quality)[]).map((axis) => (
              <ProgressBar key={axis} value={game.quality[axis]} label={axisLabel(axis)} tone="success" />
            ))}
          </Card>
          <Card title="Punti di forza e debolezza">
            <div className="pros-cons">
              <div>
                <strong>Punti di forza</strong>
                <ul>
                  {game.pros.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Punti debaili</strong>
                <ul>
                  {game.cons.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
          <Card title="Statistiche">
            <div className="dashboard-list-row">
              <span>Voto critica</span>
              <span>{game.criticScore.toFixed(1)}/10</span>
            </div>
            <div className="dashboard-list-row">
              <span>Prezzo</span>
              <span>{formatMoney(game.price)}</span>
            </div>
            <div className="dashboard-list-row">
              <span>Unità vendute</span>
              <span>{game.totalUnitsSold.toLocaleString("it-IT")}</span>
            </div>
            <div className="dashboard-list-row">
              <span>Ricavi totali</span>
              <span>{formatMoney(game.totalRevenue)}</span>
            </div>
            <div className="dashboard-list-row">
              <span>Stato</span>
              <span>{game.status}</span>
            </div>
          </Card>
        </>
      )}

      {tab === "sales" && (
        <>
          <Card title="Andamento vendite (unità/mese)">
            <Sparkline values={game.salesHistory.map((h) => h.unitsSold)} />
          </Card>
          <Card title="Andamento ricavi (€/mese)">
            <Sparkline values={game.salesHistory.map((h) => h.revenue)} color="var(--color-gold)" />
          </Card>

          <Card title="Saldi">
            <label className="field-label" htmlFor="discount-range">
              Sconto per questo mese: {discount}%
            </label>
            <input
              id="discount-range"
              type="range"
              min={0}
              max={70}
              step={5}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            <Button variant="primary" fullWidth onClick={() => dispatch({ type: "APPLY_DISCOUNT", gameId: game.id, discount: discount / 100 })}>
              Applica sconto
            </Button>
          </Card>

          <Card title="Azioni post-lancio">
            <Button
              variant="secondary"
              fullWidth
              disabled={state.money < UPDATE_COST}
              onClick={() => dispatch({ type: "RELEASE_UPDATE", gameId: game.id })}
            >
              Pubblica aggiornamento ({formatMoney(UPDATE_COST)})
            </Button>
            <Button
              variant="secondary"
              fullWidth
              disabled={state.money < DLC_COST}
              onClick={() => dispatch({ type: "RELEASE_DLC", gameId: game.id })}
            >
              Pubblica DLC ({formatMoney(DLC_COST)}) · {game.dlcCount} rilasciati
            </Button>
            {missingPlatforms.map((p) => (
              <Button
                key={p}
                variant="secondary"
                fullWidth
                disabled={state.money < PORT_COST}
                onClick={() => dispatch({ type: "PORT_GAME", gameId: game.id, platform: p as Platform })}
              >
                Porta su {p} ({formatMoney(PORT_COST)})
              </Button>
            ))}
            <Button variant="primary" fullWidth disabled={game.hasSequel} onClick={() => dispatch({ type: "MAKE_SEQUEL", gameId: game.id })}>
              {game.hasSequel ? "Sequel già avviato" : "Avvia un sequel"}
            </Button>
          </Card>
        </>
      )}

      {tab === "reviews" && (
        <Card title={`Recensioni (voto medio ${game.criticScore.toFixed(1)}/10)`}>
          {game.reviews.map((r) => (
            <div key={r.id} className="review-row">
              <div className="review-row-header">
                <strong>{r.author}</strong>
                <span>{r.score.toFixed(1)}/10</span>
              </div>
              <p>{r.text}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
