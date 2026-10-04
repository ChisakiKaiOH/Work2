import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import { formatMoney } from "../utils/format";

export default function OfficeScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <div className="inner-screen">
      {state.officeUpgrades.map((u) => {
        const maxed = u.level >= u.maxLevel;
        const cost = maxed ? null : u.costForNextLevel[u.level];
        const canAfford = cost != null && state.money >= cost;
        return (
          <Card key={u.id} title={u.name} subtitle={`Livello ${u.level}/${u.maxLevel}`}>
            <p className="office-description">{u.description}</p>
            <p className="field-hint">Costo mensile attuale: {formatMoney(u.upkeepPerLevel * u.level)}</p>
            <Button variant="primary" fullWidth disabled={maxed || !canAfford} onClick={() => dispatch({ type: "UPGRADE_OFFICE", upgradeId: u.id })}>
              {maxed ? "Livello massimo" : `Potenzia (${formatMoney(cost ?? 0)})`}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
