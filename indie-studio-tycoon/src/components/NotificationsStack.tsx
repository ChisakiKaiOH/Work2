import { useEffect } from "react";
import { useGameDispatch, useGameState } from "../hooks/useGame";

const AUTO_DISMISS_MS = 5000;

export default function NotificationsStack() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const visible = state.notifications.slice(-3);

  // Le notifiche si chiudono da sole dopo qualche secondo: altrimenti
  // restano impilate sopra ai controlli di schermate scorrevoli, bloccando
  // i tocchi sui pulsanti sottostanti.
  useEffect(() => {
    if (visible.length === 0) return;
    const oldest = visible[0];
    const timer = window.setTimeout(() => dispatch({ type: "DISMISS_NOTIFICATION", id: oldest.id }), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [visible, dispatch]);

  if (visible.length === 0) return null;

  return (
    <div className="notifications-stack" aria-live="polite">
      {visible.map((n) => (
        <div key={n.id} className={`notification notification-${n.tone}`}>
          <span>{n.text}</span>
          <button
            type="button"
            className="notification-dismiss"
            onClick={() => dispatch({ type: "DISMISS_NOTIFICATION", id: n.id })}
            aria-label="Chiudi notifica"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
