import { formatCategoryLabel } from "./categoryLabels";
import { formatLength } from "../settings";

export default function ModelInfoPanel({ fileName, categories, size, units }) {
  if (!fileName) {
    return <div className="panel-empty">Apri un file IFC per vedere le informazioni del modello.</div>;
  }

  const elementCount = (categories ?? []).reduce((sum, c) => sum + c.ids.length, 0);
  const topCategories = [...(categories ?? [])]
    .sort((a, b) => b.ids.length - a.ids.length)
    .slice(0, 8);

  return (
    <div className="model-info">
      <div className="prop-row">
        <span className="prop-name">File</span>
        <span className="prop-value">{fileName}</span>
      </div>
      <div className="prop-row">
        <span className="prop-name">Elementi totali</span>
        <span className="prop-value">{elementCount}</span>
      </div>
      <div className="prop-row">
        <span className="prop-name">Categorie</span>
        <span className="prop-value">{categories?.length ?? 0}</span>
      </div>
      {size && (
        <>
          <div className="prop-row">
            <span className="prop-name">Dimensioni (L × P × H)</span>
            <span className="prop-value">
              {formatLength(size.x, units)} × {formatLength(size.z, units)} ×{" "}
              {formatLength(size.y, units)}
            </span>
          </div>
        </>
      )}
      {topCategories.length > 0 && (
        <div className="prop-group">
          <div className="prop-group-header">Categorie principali</div>
          <div className="prop-group-body">
            {topCategories.map((c) => (
              <div className="prop-row" key={c.category}>
                <span className="prop-name">{formatCategoryLabel(c.category)}</span>
                <span className="prop-value">{c.ids.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
