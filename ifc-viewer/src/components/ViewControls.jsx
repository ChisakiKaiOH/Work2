export default function ViewControls({
  visible,
  onView,
  onAddSection,
  onClearSections,
  onShowAll,
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
      <button type="button" className="view-btn" onClick={onShowAll}>
        Mostra tutto
      </button>
    </div>
  );
}
