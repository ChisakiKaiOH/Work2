import { useGameState } from "../../hooks/useGame";
import { formatMonth } from "../../utils/format";

export default function TimelinePanel() {
  const state = useGameState();
  const entries = [...state.timeline].reverse();

  return (
    <div className="inner-screen">
      <div className="timeline">
        {entries.map((entry) => (
          <div key={entry.id} className="timeline-entry">
            <div className="timeline-month">{formatMonth(entry.month)}</div>
            <div className="timeline-dot" aria-hidden="true" />
            <div className="timeline-content">
              <div className="timeline-title">{entry.title}</div>
              <div className="timeline-description">{entry.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
