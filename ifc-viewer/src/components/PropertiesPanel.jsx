import { useState } from "react";

function humanize(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  }
  return String(value);
}

function isAttribute(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "value" in value
  );
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

export default function PropertiesPanel({ selection }) {
  if (!selection) {
    return (
      <div className="panel-empty">
        Tocca un oggetto nel modello 3D per vedere le sue proprietà.
      </div>
    );
  }

  const { data, guid, category } = selection;
  const name = data?.Name?.value ?? null;

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <div className="properties-title">{name ?? category ?? "Elemento"}</div>
        {category && <div className="properties-subtitle">{category}</div>}
        {guid && <div className="properties-guid">GUID: {guid}</div>}
      </div>
      <div className="properties-body">
        <ItemDataView data={data} />
      </div>
    </div>
  );
}
