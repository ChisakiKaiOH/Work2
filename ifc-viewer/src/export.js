// Export/report generation shared by the properties panel (single element)
// and the model info panel (whole model), plus the "send via email" action
// both use: try the Web Share API with an attached file first (so on
// Android the user picks Gmail/Outlook/etc. from the normal share sheet),
// and fall back to a plain mailto: (text-only) with the full report also
// offered as a download, since mailto can't carry attachments.

import { formatCategoryLabel } from "./components/categoryLabels";
import { formatLength } from "./settings";

export function humanize(name) {
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

export function isAttribute(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "value" in value
  );
}

export function serializeItemData(data, indent = "") {
  if (!data || typeof data !== "object") return "";
  const lines = [];
  const label = data.Name?.value ?? data.NominalValue?.value ?? null;
  if (label != null) lines.push(`${indent}${label}`);
  for (const [key, value] of Object.entries(data)) {
    if (key === "_category" || key === "_guid" || key === "_localId") continue;
    if (Array.isArray(value)) {
      if (!value.length) continue;
      lines.push(`${indent}${humanize(key)}:`);
      for (const item of value) {
        lines.push(serializeItemData(item, indent + "  "));
      }
    } else if (isAttribute(value)) {
      lines.push(`${indent}${humanize(key)}: ${formatValue(value.value)}`);
    }
  }
  return lines.filter(Boolean).join("\n");
}

export function serializeSelection(selection) {
  const { data, guid, category } = selection;
  const name = data?.Name?.value ?? category ?? "Elemento";
  const header = [name, category ? `Categoria: ${category}` : null, guid ? `GUID: ${guid}` : null]
    .filter(Boolean)
    .join("\n");
  return `${header}\n\n${serializeItemData(data)}`;
}

export function buildModelReport({ fileName, categories, size, units, floors }) {
  const elementCount = (categories ?? []).reduce((sum, c) => sum + c.ids.length, 0);
  const lines = [
    "Report modello IFC",
    `File: ${fileName ?? "—"}`,
    `Elementi totali: ${elementCount}`,
    `Categorie: ${categories?.length ?? 0}`,
  ];
  if (size) {
    lines.push(
      `Dimensioni (L x P x H): ${formatLength(size.x, units)} x ${formatLength(size.z, units)} x ${formatLength(size.y, units)}`
    );
  }
  if (categories?.length) {
    lines.push("", "Categorie:");
    for (const c of [...categories].sort((a, b) => b.ids.length - a.ids.length)) {
      lines.push(`  ${formatCategoryLabel(c.category)}: ${c.ids.length}`);
    }
  }
  if (floors?.length) {
    lines.push("", "Piani:");
    for (const floor of floors) {
      const elevation = floor.elevation != null ? ` (quota ${formatLength(floor.elevation, units)})` : "";
      lines.push(`  ${floor.name ?? "Piano"}${elevation}`);
    }
  }
  return lines.join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadReport(filename, text) {
  downloadTextFile(filename, text);
}

function openMailto(subject, body) {
  const a = document.createElement("a");
  a.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  a.click();
}

// mailto: URLs are capped well below the ~2000 char limit some mail apps
// enforce on the whole link; keep the body short and point to the
// downloaded file for the full content.
const MAILTO_BODY_LIMIT = 1500;

export async function sendReportByEmail(filename, text, subject) {
  const file = new File([text], filename, { type: "text/plain" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: subject });
      return "share";
    } catch {
      // user cancelled the share sheet, or it failed — fall back below.
    }
  }
  downloadTextFile(filename, text);
  const truncated = text.length > MAILTO_BODY_LIMIT;
  const body = truncated
    ? `${text.slice(0, MAILTO_BODY_LIMIT)}…\n\n[Report completo scaricato come ${filename}: allegalo manualmente all'email]`
    : text;
  openMailto(subject, body);
  return "mailto-download";
}
