import type { CalendarEntry, GameDate } from '../types';

/** Converts a GameDate to a JS Date (UTC) purely for day-count math — never stored. */
function toJsDate(d: GameDate): Date {
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

export function daysBetween(a: GameDate, b: GameDate): number {
  const ms = toJsDate(b).getTime() - toJsDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** The next not-yet-completed calendar entry, or null if the season is over. */
export function nextEntry(calendar: CalendarEntry[], currentIndex: number): CalendarEntry | null {
  return calendar[currentIndex] ?? null;
}

export function isSeasonOver(calendar: CalendarEntry[], currentIndex: number): boolean {
  return currentIndex >= calendar.length;
}

/** Advancing time just means moving to the next calendar entry; entries carry their own date. */
export function advanceCalendar(currentIndex: number): number {
  return currentIndex + 1;
}
