import { describe, expect, it } from 'vitest';
import { carRating } from './carRating';
import { CARS } from '../data';

describe('carRating', () => {
  it('is deterministic — same stats always produce the same rating (never random)', () => {
    const stats = CARS[0].stats;
    expect(carRating(stats)).toBe(carRating(stats));
  });

  it('increases as power, top speed and handling improve', () => {
    const base = { power: 100, weight: 1200, topSpeed: 140, handling: 100, braking: 100, reliability: 100, aerodynamics: 100 };
    const better = { ...base, power: 160, topSpeed: 180, handling: 140 };
    expect(carRating(better)).toBeGreaterThan(carRating(base));
  });

  it('a lighter car rates higher than an identical but heavier one', () => {
    const heavy = { power: 150, weight: 1600, topSpeed: 160, handling: 120, braking: 120, reliability: 120, aerodynamics: 120 };
    const light = { ...heavy, weight: 900 };
    expect(carRating(light)).toBeGreaterThan(carRating(heavy));
  });

  it('the Iconic Veltara 917K rates higher than an ordinary Common touring car', () => {
    const iconic = CARS.find(c => c.rarity === 'Iconic')!;
    const common = CARS.find(c => c.rarity === 'Common')!;
    expect(carRating(iconic.stats)).toBeGreaterThan(carRating(common.stats));
  });
});
