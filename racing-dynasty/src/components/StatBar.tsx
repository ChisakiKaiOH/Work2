import ProgressBar from './ProgressBar';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  colorVar?: string;
}

export default function StatBar({ label, value, max = 260, colorVar = '--color-blue' }: StatBarProps) {
  return (
    <div className="stat-bar">
      <div className="stat-bar-row">
        <span className="stat-bar-label">{label}</span>
        <span className="stat-bar-value">{Math.round(value)}</span>
      </div>
      <ProgressBar value={(value / max) * 100} colorVar={colorVar} />
    </div>
  );
}
