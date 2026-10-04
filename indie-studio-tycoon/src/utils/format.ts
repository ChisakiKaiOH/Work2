export function formatMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(Math.round(value));
  return `${sign}€${abs.toLocaleString("it-IT")}`;
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

const MONTH_NAMES = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

// month assoluto (1-based dalla fondazione) -> es. "Mar Anno 2"
export function formatMonth(month: number): string {
  const zeroBased = month - 1;
  const year = Math.floor(zeroBased / 12) + 1;
  const monthName = MONTH_NAMES[zeroBased % 12];
  return `${monthName} Anno ${year}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
