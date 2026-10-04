// Helper casuali semplici basati su Math.random(); le funzioni che hanno
// bisogno di determinismo per i test accettano un generatore iniettabile.
export type RandomFn = () => number;

export const defaultRandom: RandomFn = Math.random;

export function randomInt(min: number, max: number, rng: RandomFn = defaultRandom): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, rng: RandomFn = defaultRandom): number {
  return rng() * (max - min) + min;
}

export function pick<T>(arr: readonly T[], rng: RandomFn = defaultRandom): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickMany<T>(arr: readonly T[], count: number, rng: RandomFn = defaultRandom): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(rng() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1);
  }
  return result;
}

export function weightedPick<T extends { weight: number }>(items: readonly T[], rng: RandomFn = defaultRandom): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function chance(probability: number, rng: RandomFn = defaultRandom): boolean {
  return rng() < probability;
}
