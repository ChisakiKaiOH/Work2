import { useMemo } from "react";
import Button from "../components/Button";
import Mascot from "../components/Mascot";
import { listSaveMeta } from "../systems/saveSystem";
import { formatMoney, formatMonth } from "../utils/format";

export default function MainMenuScreen({
  onNewGame,
  onLoad,
}: {
  onNewGame: () => void;
  onLoad: () => void;
}) {
  const saves = useMemo(() => listSaveMeta(), []);
  const hasAnySave = saves.some((s) => s != null);

  return (
    <div className="screen main-menu-screen">
      <div className="main-menu-logo">
        <Mascot seed="indie-studio-tycoon-mascot" size={96} />
        <h1>Indie Studio Tycoon</h1>
        <p>Costruisci la tua software house indipendente, un gioco alla volta.</p>
      </div>
      <div className="main-menu-actions">
        <Button variant="primary" fullWidth onClick={onNewGame}>
          Nuova Partita
        </Button>
        <Button variant="secondary" fullWidth onClick={onLoad} disabled={!hasAnySave}>
          Carica Partita
        </Button>
      </div>
      {hasAnySave && (
        <div className="main-menu-saves-preview">
          {saves.map((save, i) =>
            save ? (
              <div key={i} className="main-menu-save-row">
                <span>{save.studioName}</span>
                <span>
                  {formatMoney(save.money)} · {formatMonth(save.month)}
                </span>
              </div>
            ) : null
          )}
        </div>
      )}
      <p className="main-menu-footer">Gioco indipendente originale, ispirato al genere dei gestionali per studi di sviluppo.</p>
    </div>
  );
}
