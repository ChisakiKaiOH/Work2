const STYLES = [
  ["shaded", "Ombreggiato"],
  ["wireframe", "Wireframe"],
  ["xray", "Trasparente"],
];

export default function ViewControls({
  visible,
  onView,
  onAddSection,
  onClearSections,
  onShowAll,
  renderStyle,
  onSetRenderStyle,
  gridVisible,
  onToggleGrid,
  measureMode,
  onToggleMeasure,
  onClearMeasurements,
  onScreenshot,
  planMode,
  onTogglePlan,
}) {
  if (!visible) return null;
  return (
    <div className="view-controls">
      <button type="button" className="view-btn" onClick={() => onView("fit")}>
        Adatta
      </button>
      <button type="button" className="view-btn" onClick={() => onView("top")}>
        Alto
      </button>
      <button type="button" className="view-btn" onClick={() => onView("front")}>
        Fronte
      </button>
      <button type="button" className="view-btn" onClick={() => onView("iso")}>
        Iso
      </button>
      <button
        type="button"
        className={planMode ? "view-btn view-btn-active" : "view-btn"}
        onClick={() => onTogglePlan(!planMode)}
        title="Vista dall'alto in ortogonale, con pan/zoom senza rotazione"
      >
        Pianta
      </button>

      <div className="view-controls-separator" />
      {STYLES.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={
            renderStyle === key ? "view-btn view-btn-active" : "view-btn"
          }
          onClick={() => onSetRenderStyle(key)}
        >
          {label}
        </button>
      ))}
      <button type="button" className="view-btn" onClick={() => onToggleGrid(!gridVisible)}>
        {gridVisible ? "Nascondi griglia" : "Mostra griglia"}
      </button>

      <div className="view-controls-separator" />
      <button
        type="button"
        className="view-btn"
        onClick={() => onAddSection("horizontal")}
        title="Aggiungi una sezione orizzontale"
      >
        Sez. ↔
      </button>
      <button
        type="button"
        className="view-btn"
        onClick={() => onAddSection("vertical")}
        title="Aggiungi una sezione verticale rivolta verso la camera"
      >
        Sez. ↕
      </button>
      <button type="button" className="view-btn" onClick={onClearSections}>
        Rimuovi sez.
      </button>

      <div className="view-controls-separator" />
      <button
        type="button"
        className={measureMode ? "view-btn view-btn-active" : "view-btn"}
        onClick={() => onToggleMeasure(!measureMode)}
        title="Tocca due punti nel modello per misurare la distanza"
      >
        {measureMode ? "Misura: tocca 2 punti" : "Misura"}
      </button>
      <button type="button" className="view-btn" onClick={onClearMeasurements}>
        Cancella misure
      </button>
      <button type="button" className="view-btn" onClick={onScreenshot}>
        Screenshot
      </button>

      <div className="view-controls-separator" />
      <button type="button" className="view-btn" onClick={onShowAll}>
        Mostra tutto
      </button>
    </div>
  );
}
