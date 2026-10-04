import { useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import StatPill from "../components/StatPill";
import ProgressBar from "../components/ProgressBar";
import Button from "../components/Button";
import { formatMoney } from "../utils/format";

export default function DashboardScreen({
  onNewProject,
  onOpenLibrary,
}: {
  onNewProject: () => void;
  onOpenLibrary: () => void;
}) {
  const state = useGameState();
  const activeProjects = state.projects.filter((p) => !p.completed);
  const readyToPublish = state.projects.filter((p) => p.completed);
  const recentNotifications = state.notifications.slice(-5).reverse();

  return (
    <div className="screen dashboard-screen">
      {state.gameOver && (
        <Card className="gameover-banner">
          <strong>Lo studio ha chiuso i battenti.</strong> Puoi comunque consultare lo storico, oppure iniziare una nuova
          partita dal menu principale.
        </Card>
      )}

      <div className="stat-grid">
        <StatPill label="Denaro" value={formatMoney(state.money)} tone={state.money < 0 ? "danger" : "neutral"} icon="💰" />
        <StatPill label="Reputazione" value={`${Math.round(state.reputation)}/100`} tone="gold" icon="⭐" />
        <StatPill label="Progetti attivi" value={activeProjects.length} icon="🛠" />
        <StatPill label="Giochi pubblicati" value={state.stats.totalGamesReleased} icon="📦" />
      </div>

      <Card title="Reputazione dello studio">
        <ProgressBar value={state.reputation} tone="gold" />
      </Card>

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
