import { describe, expect, it } from 'vitest';
import { daysBetween, nextEntry, isSeasonOver, advanceCalendar } from './time';
import type { CalendarEntry } from '../types';

const sample: CalendarEntry[] = [
  { id: 'a', type: 'PRE_SEASON', date: { year: 1970, month: 2, day: 1 }, title: 'A', description: '', fictional: true, completed: false },
  { id: 'b', type: 'RACE', date: { year: 1970, month: 3, day: 1 }, title: 'B', description: '', fictional: true, completed: false },
];

describe('time', () => {
  it('daysBetween computes whole-day differences, including across months', () => {
    expect(daysBetween({ year: 1970, month: 1, day: 1 }, { year: 1970, month: 1, day: 11 })).toBe(10);
    expect(daysBetween({ year: 1970, month: 2, day: 1 }, { year: 1970, month: 3, day: 1 })).toBe(28);
  });

  it('nextEntry returns the entry at the current index, or null past the end — edge case', () => {
    expect(nextEntry(sample, 0)).toBe(sample[0]);
    expect(nextEntry(sample, 1)).toBe(sample[1]);
    expect(nextEntry(sample, 2)).toBeNull();
  });

  it('isSeasonOver is true only once the index runs past the calendar', () => {
    expect(isSeasonOver(sample, 1)).toBe(false);
    expect(isSeasonOver(sample, 2)).toBe(true);
  });

  it('advanceCalendar just increments the index', () => {
    expect(advanceCalendar(0)).toBe(1);
  });
});
