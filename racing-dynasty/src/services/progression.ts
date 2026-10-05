export const MAX_LEVEL = 100;

/** XP required to go FROM `level` TO `level + 1`. Smooth, ever-increasing curve. */
export function xpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.35));
}

export interface LevelReward {
  credits: number;
  tokens: number;
  energy: number;
  packId?: string;
}

/** What the player receives for reaching `level`. Every 5th level is better, every 10th grants a pack. */
export function levelReward(level: number): LevelReward {
  const credits = 200 + level * 35;
  const tokens = level % 5 === 0 ? 10 + Math.floor(level / 5) * 2 : 0;
  const energy = 5;
  const packId = level % 10 === 0 ? (level % 20 === 0 ? 'pack_epic' : 'pack_sport') : undefined;
  return { credits, tokens, energy, packId };
}

/** Applies earned XP, resolving as many level-ups as the XP covers. Pure — returns a new state fragment. */
export function applyXp(level: number, xp: number, gained: number): { level: number; xp: number; rewards: LevelReward[] } {
  let curLevel = level;
  let curXp = xp + gained;
  const rewards: LevelReward[] = [];
  while (curLevel < MAX_LEVEL) {
    const needed = xpToNextLevel(curLevel);
    if (curXp < needed) break;
    curXp -= needed;
    curLevel += 1;
    rewards.push(levelReward(curLevel));
  }
  if (curLevel >= MAX_LEVEL) curXp = 0;
  return { level: curLevel, xp: curXp, rewards };
}

export function maxEnergyForLevel(level: number): number {
  return 20 + Math.floor(level / 5) * 2;
}

export const ENERGY_REGEN_MS = 3 * 60 * 1000; // 1 point every 3 minutes
export const ENERGY_PER_RACE = 4;

/** Pure function: given elapsed time, how much energy has regenerated (capped at max). */
export function tickEnergy(energy: number, maxEnergy: number, lastTick: number, now: number): { energy: number; lastTick: number } {
  if (energy >= maxEnergy) return { energy, lastTick: now };
  const elapsed = now - lastTick;
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (gained <= 0) return { energy, lastTick };
  const newEnergy = Math.min(maxEnergy, energy + gained);
  const consumedMs = gained * ENERGY_REGEN_MS;
  return { energy: newEnergy, lastTick: lastTick + consumedMs };
}
