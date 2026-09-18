import { formatCategoryLabel } from "./categoryLabels";

export default function CategoryBrowser({ categories, onIsolate }) {
  if (!categories) {
    return <div className="panel-empty">Apri un file IFC per esplorare le categorie.</div>;
  }
  if (categories.length === 0) {
    return <div className="panel-empty">Nessuna categoria trovata nel modello.</div>;
  }
  return (
    <div className="category-list">
      {categories.map(({ category, ids }) => (
        <button
          key={category}
          type="button"
          className="category-row"
          onClick={() => onIsolate(category, ids)}
        >
          <span className="category-name">{formatCategoryLabel(category)}</span>
          <span className="category-count">{ids.length}</span>
        </button>
      ))}
    </div>
  );
}
