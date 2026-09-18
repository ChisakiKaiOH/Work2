import { useEffect, useRef, useState } from "react";
import { createCastSender, createCastReceiver, isCastSupported } from "../cast";

const STATE_LABELS = {
  new: "Non connesso",
  connecting: "Connessione…",
  connected: "Connesso",
  disconnected: "Disconnesso",
  failed: "Connessione non riuscita",
  closed: "Chiusa",
};

export default function CastPanel({ getCanvas }) {
  const [mode, setMode] = useState(null); // 'send' | 'receive' | null
  const [step, setStep] = useState("idle");
  const [localCode, setLocalCode] = useState("");
  const [remoteCodeInput, setRemoteCodeInput] = useState("");
  const [connState, setConnState] = useState("new");
  const [error, setError] = useState(null);
  const sessionRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => () => sessionRef.current?.close(), []);

  function reset() {
    sessionRef.current?.close();
    sessionRef.current = null;
    setMode(null);
    setStep("idle");
    setLocalCode("");
    setRemoteCodeInput("");
    setConnState("new");
    setError(null);
  }

  async function startSend() {
    setError(null);
    const canvas = getCanvas?.();
    if (!canvas) {
      setError("Il motore 3D non è ancora pronto: riprova tra un istante.");
      return;
    }
    if (!canvas.captureStream) {
      setError("Questo browser/dispositivo non supporta la proiezione.");
      return;
    }
    setMode("send");
    setStep("generating");
    try {
      const session = createCastSender(canvas, { onStateChange: setConnState });
      sessionRef.current = session;
      const code = await session.createOfferCode();
      setLocalCode(code);
      setStep("waiting-answer");
    } catch (err) {
      console.error("createCastSender failed", err);
      setError("Impossibile avviare la trasmissione.");
      setMode(null);
      setStep("idle");
    }
  }

  async function applyAnswer() {
    if (!sessionRef.current || !remoteCodeInput.trim()) return;
    setError(null);
    try {
      await sessionRef.current.applyAnswerCode(remoteCodeInput.trim());
      setStep("connecting");
    } catch (err) {
      console.error("applyAnswerCode failed", err);
      setError("Codice di risposta non valido.");
    }
  }

  function startReceive() {
    if (!isCastSupported()) {
      setError("Questo browser/dispositivo non supporta la proiezione.");
      return;
    }
    setError(null);
    setMode("receive");
    setStep("waiting-offer");
    const session = createCastReceiver({
      onStateChange: setConnState,
      onTrack: (stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      },
    });
    sessionRef.current = session;
  }

  async function acceptOffer() {
    if (!sessionRef.current || !remoteCodeInput.trim()) return;
    setError(null);
    try {
      const code = await sessionRef.current.createAnswerCode(remoteCodeInput.trim());
      setLocalCode(code);
      setStep("connecting");
    } catch (err) {
      console.error("createAnswerCode failed", err);
      setError("Codice di trasmissione non valido.");
    }
  }

  async function handleCopy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard unavailable — the textarea's own content stays selectable.
    }
  }

  async function handleShare(text) {
    if (!navigator.share) return;
    try {
      await navigator.share({ text, title: "IFC Reader - Codice di proiezione" });
    } catch {
      // user cancelled the share sheet, or it's unsupported — code stays visible.
    }
  }

  if (!isCastSupported()) {
    return (
      <div className="panel-empty">
        La proiezione richiede il supporto WebRTC, non disponibile su questo dispositivo.
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="cast-panel">
        <p className="settings-note">
          Proietta la vista 3D su un altro dispositivo (un monitor, un PC o un
          altro telefono) sulla stessa rete Wi-Fi — senza bisogno di
          internet. I due dispositivi si accoppiano scambiandosi un breve
          codice, una volta sola.
        </p>
        <div className="settings-options">
          <button type="button" className="toolbar-button small" onClick={startSend}>
            Trasmetti da qui
          </button>
          <button type="button" className="toolbar-button-secondary small" onClick={startReceive}>
            Ricevi su questo dispositivo
          </button>
        </div>
        {error && <div className="cast-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="cast-panel">
      <div className="cast-status">
        <span>{mode === "send" ? "Trasmissione" : "Ricezione"}</span>
        <span className={`cast-status-badge cast-status-${connState}`}>
          {STATE_LABELS[connState] ?? connState}
        </span>
      </div>

      {mode === "receive" && (
        <>
          <video ref={videoRef} className="cast-preview" autoPlay playsInline muted />
          <div className="settings-options">
            <button
              type="button"
              className="toolbar-button-secondary small"
              onClick={() => videoRef.current?.requestFullscreen?.()}
            >
              Schermo intero
            </button>
          </div>
        </>
      )}

      {mode === "send" && step === "waiting-answer" && (
        <>
          <p className="settings-note">
            1. Invia questo codice all'altro dispositivo (copia o condividi);
            lì, apri "Ricevi su questo dispositivo" e incollalo.
          </p>
          <textarea className="cast-code" readOnly value={localCode} rows={4} />
          <div className="settings-options">
            <button type="button" className="toolbar-button-secondary small" onClick={() => handleCopy(localCode)}>
              Copia codice
            </button>
            <button type="button" className="toolbar-button-secondary small" onClick={() => handleShare(localCode)}>
              Condividi codice
            </button>
          </div>
          <p className="settings-note">2. Incolla qui il codice di risposta ricevuto:</p>
          <textarea
            className="cast-code"
            value={remoteCodeInput}
            onChange={(e) => setRemoteCodeInput(e.target.value)}
            rows={4}
            placeholder="Codice di risposta…"
          />
          <div className="settings-options">
            <button type="button" className="toolbar-button small" onClick={applyAnswer}>
              Connetti
            </button>
          </div>
        </>
      )}

      {mode === "receive" && step === "waiting-offer" && (
        <>
          <p className="settings-note">
            Incolla qui il codice di trasmissione ricevuto dall'altro dispositivo:
          </p>
          <textarea
            className="cast-code"
            value={remoteCodeInput}
            onChange={(e) => setRemoteCodeInput(e.target.value)}
            rows={4}
            placeholder="Codice di trasmissione…"
          />
          <div className="settings-options">
            <button type="button" className="toolbar-button small" onClick={acceptOffer}>
              Genera risposta
            </button>
          </div>
        </>
      )}

      {mode === "receive" && step === "connecting" && (
        <>
          <p className="settings-note">3. Invia questo codice di risposta al dispositivo che trasmette:</p>
          <textarea className="cast-code" readOnly value={localCode} rows={4} />
          <div className="settings-options">
            <button type="button" className="toolbar-button-secondary small" onClick={() => handleCopy(localCode)}>
              Copia codice
            </button>
            <button type="button" className="toolbar-button-secondary small" onClick={() => handleShare(localCode)}>
              Condividi codice
            </button>
          </div>
        </>
      )}

      {connState === "connected" && (
        <p className="settings-note">
          {mode === "send"
            ? "Connesso: la vista 3D è ora visibile sull'altro dispositivo."
            : "Connesso: ricezione della vista 3D dall'altro dispositivo."}
        </p>
      )}

      {error && <div className="cast-error">{error}</div>}

      <button type="button" className="toolbar-button-secondary small" onClick={reset}>
        {mode === "send" ? "Interrompi trasmissione" : "Interrompi ricezione"}
      </button>
    </div>
  );
}
