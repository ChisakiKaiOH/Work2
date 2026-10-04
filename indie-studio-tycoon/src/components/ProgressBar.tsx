export default function ProgressBar({
  value,
  max = 100,
  tone = "accent",
  label,
}: {
  value: number;
  max?: number;
  tone?: "accent" | "success" | "warning" | "danger" | "gold";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-wrap" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="progress-track">
        <div className={`progress-fill progress-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
