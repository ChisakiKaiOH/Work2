import { useState } from "react";
import { DEV_PHASES } from "../types";
import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import AllocationSliders from "../components/AllocationSliders";
import { axisLabel } from "../data/genres";
import { formatMoney } from "../utils/format";

export default function DevelopmentScreen({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [price, setPrice] = useState(15);

  const project = state.projects.find((p) => p.id === projectId);
  if (!project) {
    return (
      <div className="screen">
        <p className="panel-empty">Progetto non trovato.</p>
        <Button variant="ghost" onClick={onBack}>
          Indietro
        </Button>
      </div>
    );
  }

  const overallProgress =
    ((project.phaseIndex + project.phaseProgress / 100) / DEV_PHASES.length) * 100;
  const monthsRemaining = Math.max(0, project.durationMonths - project.monthsElapsed);
  const assignedEmployees = state.employees.filter((e) => project.assignedEmployeeIds.includes(e.id));
  const availableEmployees = state.employees.filter((e) => !e.assignedProjectId);

  return (
    <div className="screen development-screen">
      <Button variant="ghost" onClick={onBack}>
        ← Indietro
      </Button>
      <h1>{project.name}</h1>
      <p className="screen-subtitle">
        {project.genre} · {project.platforms.join(", ")} · {project.size} · {project.theme}
      </p>

      <Card title="Avanzamento">
        <ProgressBar value={overallProgress} label="Sviluppo complessivo" tone="accent" />
        <div className="phase-stepper">
          {DEV_PHASES.map((phase, i) => (
            <div
              key={phase}
              className={
                i < project.phaseIndex
                  ? "phase-step phase-step-done"
                  : i === project.phaseIndex
                    ? "phase-step phase-step-active"
                    : "phase-step"
              }
            >
              {phase}
            </div>
          ))}
        </div>
        <div className="dev-stat-row">
          <span>Mesi rimanenti: {monthsRemaining}</span>
          <span>Bug: {Math.round(project.bugs)}</span>
          <span>Hype: {Math.round(project.hype)}</span>
          <span>Morale team: {Math.round(project.teamMorale)}</span>
        </div>
      </Card>

      <Card title="Qualità per asse">
        {(Object.keys(project.quality) as (keyof typeof project.quality)[]).map((axis) => (
          <ProgressBar key={axis} value={project.quality[axis]} label={axisLabel(axis)} tone="success" />
        ))}
      </Card>

      <Card title="Distribuzione risorse">
        <AllocationSliders
          allocation={project.allocation}
          genre={project.genre}
          onChange={(next) => dispatch({ type: "UPDATE_PROJECT_ALLOCATION", projectId: project.id, allocation: next })}
        />
      </Card>

      <Card title="Team assegnato">
        {assignedEmployees.length === 0 && <p className="panel-empty">Nessun dipendente assegnato: lo sviluppo procede molto lentamente.</p>}
        {assignedEmployees.map((e) => (
          <div key={e.id} className="dashboard-list-row">
            <span>
              {e.name} · {e.role}
            </span>
            <Button variant="secondary" onClick={() => dispatch({ type: "UNASSIGN_EMPLOYEE", employeeId: e.id })}>
              Rimuovi
            </Button>
          </div>
        ))}
        {availableEmployees.length > 0 && (
          <>
            <div className="field-label">Aggiungi al team</div>
            {availableEmployees.map((e) => (
              <div key={e.id} className="dashboard-list-row">
                <span>
                  {e.name} · {e.role}
                </span>
                <Button variant="primary" onClick={() => dispatch({ type: "ASSIGN_EMPLOYEE", projectId: project.id, employeeId: e.id })}>
                  Assegna
                </Button>
              </div>
            ))}
          </>
        )}
      </Card>

      {project.completed && (
        <Card title="Pubblicazione" subtitle="Lo sviluppo è completo: imposta un prezzo e pubblica il gioco">
          <label className="field-label" htmlFor="price-input">
            Prezzo di lancio: {formatMoney(price)}
          </label>
          <input
            id="price-input"
            type="range"
            min={3}
            max={70}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              dispatch({ type: "PUBLISH_PROJECT", projectId: project.id, price });
              onBack();
            }}
          >
            Pubblica il gioco
          </Button>
        </Card>
      )}
    </div>
  );
}
