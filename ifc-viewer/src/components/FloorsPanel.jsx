export default function FloorsPanel({ floors, onSelectFloor, onExitPlan, planActive }) {
  if (!floors) {
    return <div className="panel-empty">Apri un file IFC per vedere i piani.</div>;
  }
  if (floors.length === 0) {
    return (
      <div className="panel-empty">
        Nessun piano (IfcBuildingStorey) trovato in questo modello.
      </div>
    );
  }
  return (
    <div className="category-list">
      {planActive && (
        <button type="button" className="category-row" onClick={onExitPlan}>
          <span className="category-name">Esci dalla vista in pianta</span>
        </button>
      )}
      {floors.map((floor, i) => (
        <button
          key={floor.localId ?? i}
          type="button"
          className="category-row"
          onClick={() => onSelectFloor(floor)}
        >
          <span className="category-name">{floor.name ?? `Piano ${i + 1}`}</span>
          <span className="category-count">
            {floor.elevation != null ? `${floor.elevation.toFixed(2)} m` : `${floor.ids.length} el.`}
          </span>
        </button>
      ))}
    </div>
  );
}
