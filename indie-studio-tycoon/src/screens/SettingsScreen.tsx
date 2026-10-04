import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";

export default function SettingsScreen({
  onOpenSave,
  onMainMenu,
}: {
  onOpenSave: () => void;
  onMainMenu: () => void;
}) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  return (
    <div className="screen settings-screen">
      <h1>Impostazioni</h1>

      <Card title="Partita">
        <p className="field-hint">Studio: {state.studioName}</p>
        <p className="field-hint">Slot attivo: {state.activeSlot ?? "nessuno"}</p>
        <Button variant="primary" fullWidth onClick={onOpenSave}>
          Salva / Carica partita
        </Button>
      </Card>

      <Card title="Aiuto">
        <Button variant="secondary" fullWidth onClick={() => dispatch({ type: "START_TUTORIAL" })}>
          Mostra di nuovo il tutorial
        </Button>
      </Card>

      <Card title="Accessibilità">
        <p className="office-description">
          L'interfaccia usa colori a contrasto elevato, testo leggibile e nessuna informazione affidata solo al
          colore: ogni stato importante è accompagnato anche da testo o icone.
        </p>
      </Card>

      <Button variant="ghost" fullWidth onClick={onMainMenu}>
        Torna al menu principale
      </Button>
    </div>
  );
}
