import { useGameDispatch, useGameState } from "../hooks/useGame";
import { markTutorialSeen } from "../systems/saveSystem";
import Modal from "./Modal";
import Button from "./Button";

const STEPS = [
  {
    title: "Benvenuto in Indie Studio Tycoon",
    text: "Gestisci una piccola software house indipendente: crea videogiochi, fai crescere il team e trasforma il tuo studio in un successo.",
  },
  {
    title: "Dashboard",
    text: "Qui vedi lo stato dello studio: denaro, reputazione, progetti attivi e notifiche. È il punto di partenza di ogni mese.",
  },
  {
    title: "Creare un gioco",
    text: "Dalla scheda Progetti scegli genere, piattaforme, dimensione e tema. Ogni combinazione ha un costo, una durata e un potenziale diverso.",
  },
  {
    title: "Sviluppo",
    text: "Assegna il team e distribuisci le risorse tra Gameplay, Tecnologia, Grafica, Audio e Narrativa. Le fasi si susseguono automaticamente col passare dei mesi.",
  },
  {
    title: "Marketing",
    text: "Nella scheda Studio puoi impostare un budget di marketing mensile: aumenta l'hype dei progetti in sviluppo e le vendite dei giochi pubblicati.",
  },
  {
    title: "Pubblicazione",
    text: "Quando lo sviluppo è completo, pubblica il gioco impostando un prezzo. Arriveranno recensioni, vendite e ricavi reali.",
  },
  {
    title: "Economia",
    text: "Ogni mese paghi stipendi, affitto e spese fisse. Se il denaro scende a zero hai alcuni mesi per recuperare prima della chiusura dello studio.",
  },
  {
    title: "Personale",
    text: "Dalla scheda Team puoi assumere, licenziare, promuovere e formare i tuoi dipendenti. Morale e livello influenzano la qualità dei giochi.",
  },
];

export default function TutorialOverlay() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const step = state.tutorialStep;
  if (step == null) return null;

  const current = STEPS[Math.min(step, STEPS.length - 1)];
  const isLast = step >= STEPS.length - 1;

  function finish() {
    markTutorialSeen();
    dispatch({ type: "SKIP_TUTORIAL" });
  }

  return (
    <Modal title={current.title}>
      <p className="tutorial-text">{current.text}</p>
      <div className="tutorial-progress">
        Passo {Math.min(step, STEPS.length - 1) + 1} di {STEPS.length}
      </div>
      <div className="tutorial-actions">
        <Button variant="ghost" onClick={finish}>
          Salta tutorial
        </Button>
        <Button variant="primary" onClick={isLast ? finish : () => dispatch({ type: "ADVANCE_TUTORIAL" })}>
          {isLast ? "Inizia a giocare" : "Avanti"}
        </Button>
      </div>
    </Modal>
  );
}
