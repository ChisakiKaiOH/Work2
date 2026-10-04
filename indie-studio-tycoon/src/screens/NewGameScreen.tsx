import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import { listSaveMeta, isTutorialSeen } from "../systems/saveSystem";
import { useGameDispatch } from "../hooks/useGame";
import { SAVE_SLOT_COUNT } from "../systems/saveSystem";

export default function NewGameScreen({ onStarted, onBack }: { onStarted: () => void; onBack: () => void }) {
  const dispatch = useGameDispatch();
  const [name, setName] = useState("");
  const [slot, setSlot] = useState(1);
  const saves = listSaveMeta();

  function handleStart() {
    dispatch({ type: "NEW_GAME", studioName: name || "Nuovo Studio" });
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
