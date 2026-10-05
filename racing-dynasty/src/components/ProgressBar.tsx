interface ProgressBarProps {
  value: number; // 0-100 already clamped by caller is fine, but we clamp defensively
  colorVar?: string;
  trackClassName?: string;
  height?: number;
}

export default function ProgressBar({ value, colorVar = '--color-accent', trackClassName, height = 8 }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={['progress-track', trackClassName].filter(Boolean).join(' ')} style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: `var(${colorVar})` }} />
    </div>
  );
}
