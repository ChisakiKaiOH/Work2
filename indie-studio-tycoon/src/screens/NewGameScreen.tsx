import { useState } from "react";
import type { Difficulty, GameMode } from "../types";
import Button from "../components/Button";
import Card from "../components/Card";
import { listSaveMeta, isTutorialSeen } from "../systems/saveSystem";
import { DIFFICULTY_SETTINGS, CHALLENGE_SCENARIOS } from "../data/difficulty";
import { useGameDispatch } from "../hooks/useGame";
import { SAVE_SLOT_COUNT } from "../systems/saveSystem";

const MODES: { id: GameMode; label: string; description: string }[] = [
  { id: "Career", label: "Carriera", description: "La progressione classica: parti da zero e costruisci il tuo impero." },
  { id: "Sandbox", label: "Sandbox", description: "Risorse più abbondanti, pensato per sperimentare senza pressioni." },
  { id: "Challenge", label: "Scenario", description: "Uno scenario speciale con un obiettivo chiaro da raggiungere in tempo." },
];

const DIFFICULTIES: Difficulty[] = ["Easy", "Normal", "Hard", "Insane"];

export default function NewGameScreen({ onStarted, onBack }: { onStarted: () => void; onBack: () => void }) {
  const dispatch = useGameDispatch();
  const [name, setName] = useState("");
  const [slot, setSlot] = useState(1);
  const [mode, setMode] = useState<GameMode>("Career");
  const [difficulty, setDifficulty] = useState<Difficulty>("Normal");
  const saves = listSaveMeta();

  function handleStart() {
    dispatch({
      type: "NEW_GAME",
      studioName: name || "Nuovo Studio",
      mode,
      difficulty: mode === "Sandbox" ? "Easy" : difficulty,
      challengeId: mode === "Challenge" ? CHALLENGE_SCENARIOS[0].id : undefined,
    });
    dispatch({ type: "SET_ACTIVE_SLOT", slot });
    if (!isTutorialSeen()) {
      dispatch({ type: "START_TUTORIAL" });
    }
    onStarted();
  }

  return (
    <div className="screen new-game-screen">
      <h1>Nuova Partita</h1>
      <label className="field-label" htmlFor="studio-name">
        Nome dello studio
      </label>
      <input
        id="studio-name"
        className="text-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Es. Pixel Foglia Studio"
        maxLength={30}
      />

      <div className="field-label">Modalità</div>
      <div className="mode-grid">
        {MODES.map((m) => (
          <Card key={m.id} className={mode === m.id ? "mode-card mode-card-active" : "mode-card"} onClick={() => setMode(m.id)}>
            <div className="slot-card-title">{m.label}</div>
            <div className="slot-card-sub">{m.description}</div>
          </Card>
        ))}
      </div>

      {mode === "Challenge" && (
        <p className="field-hint">{CHALLENGE_SCENARIOS[0].name}: {CHALLENGE_SCENARIOS[0].objective}</p>
      )}

      {mode !== "Sandbox" && (
        <>
          <div className="field-label">Difficoltà</div>
          <div className="chip-grid">
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" className={difficulty === d ? "chip chip-active" : "chip"} onClick={() => setDifficulty(d)}>
                {DIFFICULTY_SETTINGS[d].label}
              </button>
            ))}
          </div>
          <p className="field-hint">{DIFFICULTY_SETTINGS[difficulty].description}</p>
        </>
      )}

      <div className="field-label">Slot di salvataggio</div>
      <div className="slot-picker">
        {Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => i + 1).map((s) => {
          const meta = saves[s - 1];
          return (
            <Card key={s} className={slot === s ? "slot-card slot-card-active" : "slot-card"} onClick={() => setSlot(s)}>
              <div className="slot-card-title">Slot {s}</div>
              <div className="slot-card-sub">{meta ? `${meta.studioName} — verrà sovrascritto` : "Vuoto"}</div>
            </Card>
          );
        })}
      </div>

      <div className="new-game-actions">
        <Button variant="ghost" onClick={onBack}>
          Indietro
        </Button>
        <Button variant="primary" onClick={handleStart}>
          Fonda lo studio
        </Button>
      </div>
    </div>
  );
}
