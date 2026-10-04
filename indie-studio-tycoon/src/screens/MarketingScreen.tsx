import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import { formatMoney } from "../utils/format";

export default function MarketingScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const marketingDeptLevel = state.officeUpgrades.find((u) => u.id === "marketingDept")?.level ?? 0;

  return (
    <div className="inner-screen">
      <Card title="Budget di marketing mensile">
        <p className="office-description">
          Il budget di marketing aumenta l'hype dei progetti in sviluppo e sostiene le vendite dei giochi già
          pubblicati. Viene speso ogni mese finché non lo riduci.
        </p>
        <label className="field-label" htmlFor="marketing-range">
          Budget attuale: {formatMoney(state.marketingBudget)}/mese
        </label>
        <input
          id="marketing-range"
          type="range"
          min={0}
          max={20000}
          step={500}
          value={state.marketingBudget}
          onChange={(e) => dispatch({ type: "SET_MARKETING_BUDGET", amount: Number(e.target.value) })}
        />
        <p className="field-hint">
          Area marketing dell'ufficio: livello {marketingDeptLevel} (aumenta l'efficacia di ogni euro investito).
        </p>
      </Card>
    </div>
  );
}
