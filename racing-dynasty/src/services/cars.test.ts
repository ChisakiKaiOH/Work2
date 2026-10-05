import { describe, expect, it } from 'vitest';
import { createCarInstance, isRentalDue } from './cars';

const date = { year: 1970, month: 1, day: 1 };

describe('cars', () => {
  it('createCarInstance starts at full condition with a unique id', () => {
    const a = createCarInstance('car_001', date, 'owned');
    const b = createCarInstance('car_001', date, 'owned');
    expect(a.condition).toBe(100);
    expect(a.instanceId).not.toBe(b.instanceId);
  });

  it('createCarInstance records the rental return point when provided', () => {
    const rented = createCarInstance('car_002', date, 'rented', 'entry_5');
    expect(rented.ownership).toBe('rented');
    expect(rented.rentalReturnsAtEntryId).toBe('entry_5');
  });

  it('isRentalDue is true only for a rented car whose return entry matches — edge case', () => {
    const owned = createCarInstance('car_001', date, 'owned');
    const rented = createCarInstance('car_001', date, 'rented', 'entry_5');
    expect(isRentalDue(owned, 'entry_5')).toBe(false);
    expect(isRentalDue(rented, 'entry_5')).toBe(true);
    expect(isRentalDue(rented, 'entry_6')).toBe(false);
  });
});
