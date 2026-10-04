import { useState } from "react";
import OfficeScreen from "./OfficeScreen";
import TechnologyScreen from "./TechnologyScreen";
import MarketingScreen from "./MarketingScreen";

type Tab = "office" | "technology" | "marketing";

export default function StudioScreen() {
  const [tab, setTab] = useState<Tab>("office");

  return (
    <div className="screen studio-screen">
      <h1>Studio</h1>
      <div className="inner-tabs">
        {(["office", "technology", "marketing"] as Tab[]).map((t) => (
          <button key={t} type="button" className={tab === t ? "inner-tab inner-tab-active" : "inner-tab"} onClick={() => setTab(t)}>
            {t === "office" ? "Ufficio" : t === "technology" ? "Tecnologia" : "Marketing"}
          </button>
        ))}
      </div>
      {tab === "office" && <OfficeScreen />}
      {tab === "technology" && <TechnologyScreen />}
      {tab === "marketing" && <MarketingScreen />}
    </div>
  );
}
