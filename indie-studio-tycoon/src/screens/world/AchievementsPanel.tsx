import { useGameState } from "../../hooks/useGame";
import { ACHIEVEMENTS } from "../../data/achievements";

export default function AchievementsPanel() {
  const state = useGameState();
  const unlocked = new Set(state.achievementsUnlocked);

  return (
    <div className="inner-screen">
      <p className="office-description">
        {unlocked.size} / {ACHIEVEMENTS.length} obiettivi sbloccati
      </p>
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.has(a.id);
          return (
            <div key={a.id} className={done ? "achievement-badge achievement-badge-done" : "achievement-badge"}>
              <span className="achievement-icon" aria-hidden="true">{done ? a.icon : "🔒"}</span>
              <span className="achievement-name">{a.name}</span>
              <span className="achievement-description">{done ? a.description : "???"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
