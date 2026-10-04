import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { availableTechs, canStartResearch } from "../systems/research";
import { TECH_TREE } from "../data/technology";
import { formatMoney } from "../utils/format";

export default function TechnologyScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const techs = availableTechs(state.research.unlocked, state.month);
  const activeResearch = state.research.active;
  const activeTech = activeResearch ? TECH_TREE.find((t) => t.id === activeResearch.techId) : null;

  return (
    <div className="inner-screen">
      {activeResearch && activeTech && (
        <Card title="Ricerca in corso">
          <ProgressBar
            value={activeTech.durationMonths - activeResearch.monthsRemaining}
            max={activeTech.durationMonths}
            tone="accent"
            label={activeTech.name}
          />
          <p className="field-hint">{activeResearch.monthsRemaining} mesi rimanenti</p>
        </Card>
      )}

      {techs.map(({ tech, unlocked, locked, notYetAvailable }) => {
        const canStart = canStartResearch(tech.id, state.research, state.money, state.month);
        return (
          <Card
            key={tech.id}
            title={tech.name}
            subtitle={unlocked ? "Sbloccata" : notYetAvailable ? "Non ancora disponibile" : locked ? "Prerequisiti mancanti" : undefined}
          >
            <p className="office-description">{tech.description}</p>
            <p className="field-hint">
              Costo {formatMoney(tech.cost)} · Durata {tech.durationMonths} mesi · Categoria {tech.category}
            </p>
            {!unlocked && (
              <Button variant="primary" fullWidth disabled={!canStart} onClick={() => dispatch({ type: "START_RESEARCH", techId: tech.id })}>
                Avvia ricerca
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
}
