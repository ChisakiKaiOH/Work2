import type { Allocation, Genre, QualityAxis } from "../types";
import { axisLabel, genreWeightSummary } from "../data/genres";
import { compatibilityFit, compatibilityLabel } from "../systems/development";

const AXES: QualityAxis[] = ["gameplay", "technology", "graphics", "sound", "story"];

function redistribute(allocation: Allocation, axis: QualityAxis, newValue: number): Allocation {
  const clamped = Math.max(0, Math.min(100, newValue));
  const others = AXES.filter((a) => a !== axis);
  const othersTotal = others.reduce((sum, a) => sum + allocation[a], 0);
  const remaining = 100 - clamped;

  const next: Allocation = { ...allocation, [axis]: clamped };
  if (othersTotal === 0) {
    const share = remaining / others.length;
    for (const a of others) next[a] = share;
  } else {
    for (const a of others) next[a] = (allocation[a] / othersTotal) * remaining;
  }
  return next;
}

export default function AllocationSliders({
  allocation,
  onChange,
  genre,
  disabled,
}: {
  allocation: Allocation;
  onChange: (next: Allocation) => void;
  genre: Genre;
  disabled?: boolean;
}) {
  const fit = compatibilityFit(genre, allocation);
  const label = compatibilityLabel(fit);
  const toneClass = fit >= 0.8 ? "fit-great" : fit >= 0.55 ? "fit-good" : fit >= 0.3 ? "fit-poor" : "fit-bad";

  return (
    <div className="allocation-sliders">
      {AXES.map((axis) => (
        <div key={axis} className="allocation-row">
          <div className="allocation-row-label">
            <span>{axisLabel(axis)}</span>
            <span>{Math.round(allocation[axis])}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(allocation[axis])}
            disabled={disabled}
            onChange={(e) => onChange(redistribute(allocation, axis, Number(e.target.value)))}
            aria-label={`Allocazione ${axisLabel(axis)}`}
          />
        </div>
      ))}
      <div className={`allocation-fit ${toneClass}`}>
        <strong>{label}</strong>
        <p className="allocation-fit-hint">Profilo ideale per {genre}: {genreWeightSummary(genre)}</p>
      </div>
    </div>
  );
}
