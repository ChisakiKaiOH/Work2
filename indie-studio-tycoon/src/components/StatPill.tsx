import type { ReactNode } from "react";

export default function StatPill({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "gold";
  icon?: ReactNode;
}) {
  return (
    <div className={`stat-pill stat-pill-${tone}`}>
      {icon && <span className="stat-pill-icon" aria-hidden="true">{icon}</span>}
      <div className="stat-pill-text">
        <span className="stat-pill-label">{label}</span>
        <span className="stat-pill-value">{value}</span>
      </div>
    </div>
  );
}
