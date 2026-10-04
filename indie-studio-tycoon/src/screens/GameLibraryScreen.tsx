import { DEV_PHASES } from "../types";
import { useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import GameCover from "../components/GameCover";
import { formatMoney } from "../utils/format";

export default function GameLibraryScreen({
  onNewProject,
  onOpenDevelopment,
  onOpenGameDetails,
}: {
  onNewProject: () => void;
  onOpenDevelopment: (projectId: string) => void;
  onOpenGameDetails: (gameId: string) => void;
}) {
  const state = useGameState();

  return (
    <div className="screen game-library-screen">
      <h1>Progetti</h1>
      <Button variant="primary" fullWidth onClick={onNewProject}>
        + Nuovo progetto
      </Button>

      <h2 className="section-title">In sviluppo</h2>
      {state.projects.length === 0 && <p className="panel-empty">Nessun progetto in corso.</p>}
      {state.projects.map((p) => {
        const overallProgress = ((p.phaseIndex + p.phaseProgress / 100) / DEV_PHASES.length) * 100;
        return (
          <Card key={p.id} onClick={() => onOpenDevelopment(p.id)}>
            <div className="card-row-header">
              <span className="card-row-title">{p.name}</span>
              {p.completed && <span className="tag tag-success">Pronto</span>}
            </div>
            <div className="card-row-sub">
              {p.genre} · {p.size}
            </div>
            <ProgressBar value={overallProgress} tone="accent" />
          </Card>
        );
      })}

      <h2 className="section-title">Pubblicati</h2>
      {state.releasedGames.length === 0 && <p className="panel-empty">Nessun gioco pubblicato ancora.</p>}
      <div className="portfolio-grid">
        {state.releasedGames.map((g) => (
          <button key={g.id} type="button" className="portfolio-item" onClick={() => onOpenGameDetails(g.id)}>
            <GameCover gameId={g.id} title={g.name} genre={g.genre} theme={g.theme} width={110} height={146} />
            <div className="portfolio-item-meta">
              <span className="tag">{g.criticScore.toFixed(1)}/10</span>
              <span className="portfolio-item-revenue">{formatMoney(g.totalRevenue)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
