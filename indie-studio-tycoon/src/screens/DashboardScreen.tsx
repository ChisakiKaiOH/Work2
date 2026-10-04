import { useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import StatPill from "../components/StatPill";
import ProgressBar from "../components/ProgressBar";
import Button from "../components/Button";
import { formatMoney } from "../utils/format";

export default function DashboardScreen({
  onNewProject,
  onOpenLibrary,
  onOpenAwards,
}: {
  onNewProject: () => void;
  onOpenLibrary: () => void;
  onOpenAwards: () => void;
}) {
  const state = useGameState();
  const activeProjects = state.projects.filter((p) => !p.completed);
  const readyToPublish = state.projects.filter((p) => p.completed);
  const recentNotifications = state.notifications.slice(-5).reverse();

  const topGenres = (Object.entries(state.genrePopularity) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topGames = [...state.releasedGames].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3);

  return (
    <div className="screen dashboard-screen">
      {state.gameOver && (
        <Card className="gameover-banner">
          <strong>Lo studio ha chiuso i battenti.</strong> Puoi comunque consultare lo storico, oppure iniziare una nuova
          partita dal menu principale.
        </Card>
      )}

      {state.pendingAwardCeremonyId && (
        <Card className="award-banner" onClick={onOpenAwards}>
          <strong>🏆 I Global Game Awards di quest'anno sono pronti!</strong>
          <p>Tocca per vedere i vincitori.</p>
        </Card>
      )}

      <div className="stat-grid">
        <StatPill label="Denaro" value={formatMoney(state.money)} tone={state.money < 0 ? "danger" : "neutral"} icon="💰" />
        <StatPill label="Reputazione" value={`${Math.round(state.reputation)}/100`} tone="gold" icon="⭐" />
        <StatPill label="Valore azienda" value={formatMoney(state.companyValue)} tone="success" icon="📈" />
        <StatPill label="Fan" value={Math.round(state.fanbase).toLocaleString("it-IT")} icon="❤️" />
      </div>

      <Card title={state.stage} subtitle={`${activeProjects.length} progetti in sviluppo · ${state.stats.totalGamesReleased} giochi pubblicati`}>
        <ProgressBar value={state.reputation} tone="gold" label="Reputazione" />
      </Card>

      <Card title="Mercato" subtitle={state.marketTrend.label}>
        {topGenres.map(([genre, value]) => (
          <div key={genre} className="dashboard-list-row">
            <span>{genre}</span>
            <span>{Math.round(value)}</span>
          </div>
        ))}
      </Card>

      {topGames.length > 0 && (
        <Card title="I tuoi giochi migliori">
          {topGames.map((g) => (
            <div key={g.id} className="dashboard-list-row">
              <span>{g.name}</span>
              <span>{formatMoney(g.totalRevenue)}</span>
            </div>
          ))}
        </Card>
      )}

      {readyToPublish.length > 0 && (
        <Card title="Pronti per la pubblicazione" subtitle="Vai alla scheda Progetti per pubblicarli">
          {readyToPublish.map((p) => (
            <div key={p.id} className="dashboard-list-row">
              <span>{p.name}</span>
              <span className="tag tag-success">Completato</span>
            </div>
          ))}
        </Card>
      )}

      <Card title="Attività recente">
        {recentNotifications.length === 0 ? (
          <p className="panel-empty">Nessuna novità per ora.</p>
        ) : (
          recentNotifications.map((n) => (
            <div key={n.id} className={`dashboard-notif dashboard-notif-${n.tone}`}>
              {n.text}
            </div>
          ))
        )}
      </Card>

      <div className="dashboard-actions">
        <Button variant="primary" fullWidth onClick={onNewProject}>
          + Nuovo progetto
        </Button>
        <Button variant="secondary" fullWidth onClick={onOpenLibrary}>
          Vai alla libreria giochi
        </Button>
      </div>
    </div>
  );
}
