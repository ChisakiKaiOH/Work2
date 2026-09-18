import { useState } from "react";
import { formatCategoryLabel } from "./categoryLabels";

export default function SearchPanel({ hasModel, onSearch, onSelect, selectedLocalId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(value) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const found = await onSearch(value);
      setResults(found);
    } finally {
      setLoading(false);
    }
  }

  if (!hasModel) {
    return <div className="panel-empty">Apri un file IFC per cercare elementi per nome.</div>;
  }

  return (
    <div className="search-panel">
      <input
        type="search"
        className="search-input"
        placeholder="Cerca per nome…"
        value={query}
        onChange={(e) => runSearch(e.target.value)}
      />
      {loading && <div className="panel-empty">Ricerca in corso…</div>}
      {!loading && query.trim() && results.length === 0 && (
        <div className="panel-empty">Nessun risultato per "{query}".</div>
      )}
      <div className="search-results">
        {results.map((r) => (
          <button
            key={r.localId}
            type="button"
            className={
              r.localId === selectedLocalId
                ? "search-result-row search-result-selected"
                : "search-result-row"
            }
            onClick={() => onSelect(r.localId)}
          >
            <span className="search-result-name">{r.name ?? "(senza nome)"}</span>
            <span className="search-result-category">
              {formatCategoryLabel(r.category)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
