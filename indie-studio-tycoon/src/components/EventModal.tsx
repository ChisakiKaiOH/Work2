import { useGameDispatch, useGameState } from "../hooks/useGame";
import Modal from "./Modal";
import Button from "./Button";

export default function EventModal() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const event = state.activeEvent;
  if (!event) return null;

  return (
    <Modal title={event.title}>
      <p className="event-description">{event.description}</p>
      <div className="event-choices">
        {event.choices ? (
          event.choices.map((choice, index) => (
            <Button
              key={choice.label}
              variant={index === 0 ? "primary" : "secondary"}
              fullWidth
              onClick={() => dispatch({ type: "RESOLVE_EVENT", choiceIndex: index })}
            >
              <span className="event-choice-label">{choice.label}</span>
              <span className="event-choice-description">{choice.description}</span>
            </Button>
          ))
        ) : (
          <Button variant="primary" fullWidth onClick={() => dispatch({ type: "RESOLVE_EVENT", choiceIndex: null })}>
            Ok, capito
          </Button>
        )}
      </div>
    </Modal>
  );
}
