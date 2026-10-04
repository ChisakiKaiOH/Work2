import { useGameState } from "../../hooks/useGame";
import Card from "../../components/Card";
import { formatMonth } from "../../utils/format";

const CATEGORY_ICON: Record<string, string> = {
  Industry: "🏭",
  Studio: "🏠",
  Market: "📊",
  Awards: "🏆",
  Acquisition: "🤝",
};

export default function NewsPanel() {
  const state = useGameState();
  const items = [...state.news].reverse();

  if (items.length === 0) return <p className="panel-empty">Nessuna notizia per ora.</p>;

  return (
    <div className="inner-screen">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="news-row">
            <span className="news-icon" aria-hidden="true">{CATEGORY_ICON[item.category] ?? "📰"}</span>
            <div>
              <div className="news-headline">{item.headline}</div>
              <div className="card-row-sub">{formatMonth(item.month)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
