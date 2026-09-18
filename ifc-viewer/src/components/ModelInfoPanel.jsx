import { useState } from "react";
import { formatCategoryLabel } from "./categoryLabels";
import { formatLength } from "../settings";
import { buildModelReport, downloadReport, sendReportByEmail } from "../export";

export default function ModelInfoPanel({ fileName, categories, size, units, floors }) {
  const [emailStatus, setEmailStatus] = useState(null);

  if (!fileName) {
    return <div className="panel-empty">Apri un file IFC per vedere le informazioni del modello.</div>;
  }

  const elementCount = (categories ?? []).reduce((sum, c) => sum + c.ids.length, 0);
  const topCategories = [...(categories ?? [])]
    .sort((a, b) => b.ids.length - a.ids.length)
    .slice(0, 8);

  function handleExport() {
    const text = buildModelReport({ fileName, categories, size, units, floors });
    downloadReport(`${fileName}-report.txt`, text);
  }

  async function handleSendEmail() {
    const text = buildModelReport({ fileName, categories, size, units, floors });
    await sendReportByEmail(`${fileName}-report.txt`, text, `IFC Reader - Report ${fileName}`);
    setEmailStatus("Inviato");
    setTimeout(() => setEmailStatus(null), 1500);
  }

  return (
    <div className="model-info">
      <div className="properties-actions">
        <button type="button" className="toolbar-button-secondary small" onClick={handleExport}>
          Esporta report
        </button>
        <button type="button" className="toolbar-button-secondary small" onClick={handleSendEmail}>
          {emailStatus ?? "Invia email"}
        </button>
      </div>
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
