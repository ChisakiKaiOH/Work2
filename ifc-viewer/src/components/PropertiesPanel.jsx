import { useState } from "react";
import { formatCategoryLabel } from "./categoryLabels";
import { humanize, isAttribute, serializeSelection, downloadReport, sendReportByEmail } from "../export";

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  return String(value);
}

function AttributeRow({ name, attr }) {
  return (
    <div className="prop-row">
      <span className="prop-name">{humanize(name)}</span>
      <span className="prop-value">{formatValue(attr.value)}</span>
    </div>
  );
}

function DataGroup({ name, items }) {
  const [open, setOpen] = useState(true);
  if (!items.length) return null;
  return (
    <div className="prop-group">
      <button
        type="button"
        className="prop-group-header"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chevron">{open ? "▾" : "▸"}</span>
        {humanize(name)} ({items.length})
      </button>
      {open && (
        <div className="prop-group-body">
          {items.map((item, i) => (
            <ItemDataView key={i} data={item} />
          ))}
        </div>
      )}
    </div>
  );
}

const HIDDEN_KEYS = new Set(["_category", "_guid", "_localId"]);

function ItemDataView({ data }) {
  if (!data || typeof data !== "object") return null;
  const label = data.Name?.value ?? data.NominalValue?.value ?? null;
  const entries = Object.entries(data).filter(([key]) => !HIDDEN_KEYS.has(key));
  return (
    <div className="prop-item">
      {label != null && <div className="prop-item-label">{String(label)}</div>}
      {entries.map(([key, value]) => {
        if (Array.isArray(value)) {
          return <DataGroup key={key} name={key} items={value} />;
        }
        if (isAttribute(value)) {
          return <AttributeRow key={key} name={key} attr={value} />;
        }
        return null;
      })}
    </div>
  );
}

export default function PropertiesPanel({ selection, onIsolate, path }) {
  const [copied, setCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  if (!selection) {
    return (
      <div className="panel-empty">
        Tocca un oggetto nel modello 3D per vedere le sue proprietà.
      </div>
    );
  }

  const { data, guid, category, modelId, localId } = selection;
  const name = data?.Name?.value ?? null;

  async function handleCopy() {
    const text = serializeSelection(selection);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable (e.g. no permission) — ignore silently.
    }
  }

  function handleExport() {
    const text = serializeSelection(selection);
    downloadReport(`${name ?? category ?? "elemento"}.txt`, text);
  }

  async function handleSendEmail() {
    const text = serializeSelection(selection);
    const subject = `IFC Reader - ${name ?? category ?? "Elemento"}`;
    await sendReportByEmail(`${name ?? category ?? "elemento"}.txt`, text, subject);
    setEmailStatus("Inviato");
    setTimeout(() => setEmailStatus(null), 1500);
  }

  return (
    <div className="properties-panel">
      <div className="properties-header">
        {path && path.length > 0 && (
          <div className="properties-breadcrumb">
            {path.map(formatCategoryLabel).join(" › ")}
          </div>
        )}
        <div className="properties-title">{name ?? category ?? "Elemento"}</div>
        {category && <div className="properties-subtitle">{category}</div>}
        {guid && <div className="properties-guid">GUID: {guid}</div>}
        <div className="properties-actions">
          <button type="button" className="toolbar-button-secondary small" onClick={handleCopy}>
            {copied ? "Copiato ✓" : "Copia proprietà"}
          </button>
          <button type="button" className="toolbar-button-secondary small" onClick={handleExport}>
            Esporta
          </button>
          <button type="button" className="toolbar-button-secondary small" onClick={handleSendEmail}>
            {emailStatus ?? "Invia email"}
          </button>
          {onIsolate && (
            <button
              type="button"
              className="toolbar-button-secondary small"
              onClick={() => onIsolate(modelId, localId)}
            >
              Isola elemento
            </button>
          )}
        </div>
      </div>
      <div className="properties-body">
        <ItemDataView data={data} />
      </div>
    </div>
  );
}
