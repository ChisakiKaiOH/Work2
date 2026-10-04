import { useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import { formatMonth } from "../utils/format";

export default function EventsScreen() {
  const state = useGameState();
  const log = [...state.eventLog].reverse();

  return (
    <div className="screen events-screen">
      <h1>Eventi</h1>
      {log.length === 0 && <p className="panel-empty">Nessun evento si è ancora verificato. Continua a giocare.</p>}
      {log.map((entry) => (
        <Card key={entry.id} title={entry.title} subtitle={formatMonth(entry.month)}>
          <p>{entry.description}</p>
          <p className="event-outcome">{entry.outcome}</p>
        </Card>
      ))}
    </div>
  );
}
