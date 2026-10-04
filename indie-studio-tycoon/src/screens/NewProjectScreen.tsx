import { useMemo, useState } from "react";
import type { Allocation, Genre, Platform, ProjectSize, Theme } from "../types";
import { GENRES } from "../data/genres";
import { PLATFORMS, THEMES } from "../data/platformsThemes";
import { SIZES, SIZE_PROFILES } from "../data/sizes";
import { estimateProject, defaultAllocationFor } from "../systems/projectFactory";
import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import AllocationSliders from "../components/AllocationSliders";
import { formatMoney } from "../utils/format";

function Chip({ label, active, onClick, disabled }: { label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={active ? "chip chip-active" : "chip"}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export default function NewProjectScreen({ onCreated, onBack }: { onCreated: () => void; onBack: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const [genre, setGenre] = useState<Genre>("Action");
  const [platforms, setPlatforms] = useState<Platform[]>(["PC"]);
  const [size, setSize] = useState<ProjectSize>("Small");
  const [theme, setTheme] = useState<Theme>("Fantasy");
  const [allocation, setAllocation] = useState<Allocation>(defaultAllocationFor("Action"));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const availableEmployees = state.employees.filter((e) => !e.assignedProjectId);
  const sizeProfile = SIZE_PROFILES[size];
  const sizeLocked = sizeProfile.requiresTechId && !state.research.unlocked.includes(sizeProfile.requiresTechId);

  const estimate = useMemo(
    () =>
      estimateProject(
        { genre, platforms, size, theme },
        { teamSize: selectedEmployeeIds.length, unlockedTechIds: state.research.unlocked, genrePopularity: state.genrePopularity[genre] }
      ),
    [genre, platforms, size, theme, selectedEmployeeIds.length, state.research.unlocked, state.genrePopularity]
  );

  function handleGenreChange(next: Genre) {
    setGenre(next);
    setAllocation(defaultAllocationFor(next));
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function toggleEmployee(id: string) {
    setSelectedEmployeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const canAfford = state.money >= estimate.cost;
  const canCreate = platforms.length > 0 && !sizeLocked && canAfford;

  function handleCreate() {
    dispatch({ type: "START_PROJECT", choice: { genre, platforms, size, theme }, allocation, employeeIds: selectedEmployeeIds });
    onCreated();
  }

  return (
    <div className="screen new-project-screen">
      <h1>Nuovo progetto</h1>

      <Card title="Genere">
        <div className="chip-grid">
          {GENRES.map((g) => (
            <Chip key={g} label={g} active={genre === g} onClick={() => handleGenreChange(g)} />
          ))}
        </div>
      </Card>

      <Card title="Piattaforme" subtitle="Seleziona almeno una piattaforma">
        <div className="chip-grid">
          {PLATFORMS.map((p) => (
            <Chip key={p} label={p} active={platforms.includes(p)} onClick={() => togglePlatform(p)} />
          ))}
        </div>
      </Card>

      <Card title="Dimensione">
        <div className="chip-grid">
          {SIZES.map((s) => {
            const profile = SIZE_PROFILES[s];
            const locked = profile.requiresTechId && !state.research.unlocked.includes(profile.requiresTechId);
            return (
              <Chip key={s} label={locked ? `${s} 🔒` : s} active={size === s} onClick={() => setSize(s)} disabled={!!locked} />
            );
          })}
        </div>
        {sizeLocked && <p className="field-hint">Richiede una tecnologia non ancora sbloccata (vedi scheda Studio &gt; Tecnologia).</p>}
      </Card>

      <Card title="Tema">
        <div className="chip-grid">
          {THEMES.map((t) => (
            <Chip key={t} label={t} active={theme === t} onClick={() => setTheme(t)} />
          ))}
        </div>
      </Card>

      <Card title="Distribuzione risorse">
        <AllocationSliders allocation={allocation} onChange={setAllocation} genre={genre} />
      </Card>

      <Card title="Team assegnato" subtitle={availableEmployees.length === 0 ? "Nessun dipendente libero" : undefined}>
        {availableEmployees.map((e) => (
          <label key={e.id} className="employee-checkbox-row">
            <input type="checkbox" checked={selectedEmployeeIds.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
            <span>
              {e.name} · {e.role} (Lv.{e.level})
            </span>
          </label>
        ))}
      </Card>

      <Card title="Stima progetto" className="estimate-card">
        <div className="estimate-grid">
          <div>
            <span className="estimate-label">Costo</span>
            <span className={canAfford ? "estimate-value" : "estimate-value estimate-warning"}>{formatMoney(estimate.cost)}</span>
          </div>
          <div>
            <span className="estimate-label">Durata</span>
            <span className="estimate-value">{estimate.durationMonths} mesi</span>
          </div>
          <div>
            <span className="estimate-label">Team consigliato</span>
            <span className="estimate-value">{estimate.recommendedTeamSize}</span>
          </div>
          <div>
            <span className="estimate-label">Qualità potenziale</span>
            <span className="estimate-value">{Math.round(estimate.qualityPotential)}/100</span>
          </div>
          <div>
            <span className="estimate-label">Rischio</span>
            <span className="estimate-value">{estimate.risk}</span>
          </div>
          <div>
            <span className="estimate-label">Potenziale commerciale</span>
            <span className="estimate-value">{Math.round(estimate.commercialPotential)}/100</span>
          </div>
        </div>
      </Card>

      <div className="new-project-actions">
        <Button variant="ghost" onClick={onBack}>
          Annulla
        </Button>
        <Button variant="primary" disabled={!canCreate} onClick={handleCreate}>
          Avvia sviluppo
        </Button>
      </div>
    </div>
  );
}
