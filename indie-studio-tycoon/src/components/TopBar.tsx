import { useGameDispatch, useGameState } from "../hooks/useGame";
import { formatMonth, formatMoney } from "../utils/format";
import type { TimeSpeed } from "../types";

const SPEEDS: TimeSpeed[] = [0, 1, 2, 4];

export default function TopBar() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const moneyTone = state.money < 0 ? "danger" : state.money < 5000 ? "warning" : "neutral";

  return (
    <header className="top-bar">
      <div className="top-bar-info">
        <div className="top-bar-studio">{state.studioName}</div>
        <div className="top-bar-month">{formatMonth(state.month)}</div>
      </div>
      <div className={`top-bar-money top-bar-money-${moneyTone}`}>{formatMoney(state.money)}</div>
      <div className="top-bar-speed" role="group" aria-label="Velocità del tempo">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            className={state.time.speed === speed ? "speed-btn speed-btn-active" : "speed-btn"}
            onClick={() => dispatch({ type: "SET_SPEED", speed })}
            aria-pressed={state.time.speed === speed}
            aria-label={speed === 0 ? "Pausa" : `Velocità ${speed}x`}
          >
            {speed === 0 ? "⏸" : `${speed}x`}
          </button>
        ))}
      </div>
    </header>
  );
}
