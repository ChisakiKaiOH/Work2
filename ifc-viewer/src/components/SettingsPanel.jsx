const THEME_OPTIONS = [
  ["auto", "Sistema"],
  ["light", "Chiaro"],
  ["dark", "Scuro"],
];

const UNIT_OPTIONS = [
  ["m", "Metri"],
  ["ft", "Piedi"],
];

const COLOR_OPTIONS = ["#ff9800", "#e91e63", "#2ecc71", "#00bcd4", "#ffeb3b"];

export default function SettingsPanel({ settings, onChange }) {
  return (
    <div className="settings-panel">
      <div className="settings-group">
        <div className="settings-label">Tema</div>
        <div className="settings-options">
          {THEME_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                settings.theme === key
                  ? "toolbar-button-secondary small active"
                  : "toolbar-button-secondary small"
              }
              onClick={() => onChange({ theme: key })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">Unità di misura</div>
        <div className="settings-options">
          {UNIT_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                settings.units === key
                  ? "toolbar-button-secondary small active"
                  : "toolbar-button-secondary small"
              }
              onClick={() => onChange({ units: key })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">Colore selezione</div>
        <div className="settings-options">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              className="color-swatch"
              style={{
                backgroundColor: color,
                outline:
                  settings.selectColor === color ? "2px solid var(--text)" : "none",
              }}
              aria-label={`Colore ${color}`}
              onClick={() => onChange({ selectColor: color })}
            />
          ))}
        </div>
      </div>

      <div className="settings-note">
        Le impostazioni sono salvate sul dispositivo e si applicano a ogni
        apertura dell'app.
      </div>
    </div>
  );
}
