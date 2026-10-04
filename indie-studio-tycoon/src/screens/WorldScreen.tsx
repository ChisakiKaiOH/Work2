import { useState } from "react";
import CompetitorsPanel from "./world/CompetitorsPanel";
import NewsPanel from "./world/NewsPanel";
import AwardsPanel from "./world/AwardsPanel";
import AchievementsPanel from "./world/AchievementsPanel";
import TimelinePanel from "./world/TimelinePanel";
import StockMarketPanel from "./world/StockMarketPanel";

type Tab = "competitors" | "news" | "awards" | "achievements" | "timeline" | "stocks";

const TABS: { id: Tab; label: string }[] = [
  { id: "competitors", label: "Concorrenti" },
  { id: "news", label: "News" },
  { id: "awards", label: "Premi" },
  { id: "achievements", label: "Obiettivi" },
  { id: "timeline", label: "Timeline" },
  { id: "stocks", label: "Borsa" },
];

export default function WorldScreen({
  onOpenCompany,
  initialTab = "competitors",
}: {
  onOpenCompany: (companyId: string) => void;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="screen world-screen">
      <h1>Mondo</h1>
      <div className="inner-tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "inner-tab inner-tab-active" : "inner-tab"} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "competitors" && <CompetitorsPanel onOpenCompany={onOpenCompany} />}
      {tab === "news" && <NewsPanel />}
      {tab === "awards" && <AwardsPanel />}
      {tab === "achievements" && <AchievementsPanel />}
      {tab === "timeline" && <TimelinePanel />}
      {tab === "stocks" && <StockMarketPanel />}
    </div>
  );
}
