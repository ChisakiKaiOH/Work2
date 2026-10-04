import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import { useGameDispatch, useGameState } from "../hooks/useGame";
import { SAVE_SLOT_COUNT, listSaveMeta, loadFromSlot, saveToSlot } from "../systems/saveSystem";
import { formatMoney, formatMonth } from "../utils/format";

export default function SaveLoadScreen({
  mode,
  onDone,
  onBack,
}: {
  mode: "save" | "load";
  onDone: () => void;
  onBack: () => void;
}) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [message, setMessage] = useState<string | null>(null);
  const saves = listSaveMeta();

  function handleSlotClick(slot: number) {
    if (mode === "save") {
      const ok = saveToSlot(slot, state);
      dispatch({ type: "SET_ACTIVE_SLOT", slot });
      setMessage(ok ? `Partita salvata nello slot ${slot}.` : "Salvataggio non riuscito.");
    } else {
      const loaded = loadFromSlot(slot);
      if (!loaded) {
        setMessage("Questo slot è vuoto.");
        return;
      }
      dispatch({ type: "LOAD_STATE", state: loaded });
      dispatch({ type: "SET_ACTIVE_SLOT", slot });
      onDone();
    }
  }

  return (
    <div className="screen save-load-screen">
      <h1>{mode === "save" ? "Salva partita" : "Carica partita"}</h1>
      <div className="slot-list">
        {Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => i + 1).map((slot) => {
          const meta = saves[slot - 1];
          return (
            <Card key={slot} onClick={() => handleSlotClick(slot)}>
              <div className="slot-row-title">
                Slot {slot}
                {state.activeSlot === slot && <span className="slot-badge">Attivo</span>}
              </div>
              {meta ? (
                <div className="slot-row-sub">
                  {meta.studioName} · {formatMoney(meta.money)} · {formatMonth(meta.month)} · Reputazione {Math.round(meta.reputation)}
                </div>
              ) : (
                <div className="slot-row-sub slot-row-empty">Vuoto</div>
              )}
            </Card>
          );
        })}
      </div>
      {message && <p className="save-load-message">{message}</p>}
      <Button variant="ghost" onClick={onBack}>
        Indietro
      </Button>
    </div>
  );
}
