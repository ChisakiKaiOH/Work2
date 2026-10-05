import type { PlayerState, AchievementCondition } from '../types';
import { ACHIEVEMENTS, CAR_BY_ID } from '../data';
import { MAX_UPGRADE_LEVEL, UPGRADE_CATEGORIES } from '../types';

export function conditionValue(player: PlayerState, cond: AchievementCondition): number {
  switch (cond.type) {
    case 'racesCompleted': return player.completedRaceCount;
    case 'racesWon': return player.wonRaceCount;
    case 'creditsEarned': return player.totalCreditsEarned;
    case 'carsOwned': return player.ownedCars.length;
    case 'championshipsWon': return Object.values(player.championshipProgress).filter(c => c.completed).length;
    case 'bossesDefeated': return player.bossesDefeated.length;
    case 'legendaryCarsOwned':
      return player.ownedCars.filter(ci => {
        const def = CAR_BY_ID[ci.defId];
        return def && (def.rarity === 'Legendary' || def.rarity === 'Mythic');
      }).length;
    case 'playerLevel': return player.level;
    case 'collectionsCompleted': return Object.values(player.collectionProgress).filter(Boolean).length;
    case 'maxUpgradesOnCar': {
      // special-cased: "count: 1" means "at least one category maxed on any car",
      // "count: 12" means "every category maxed on the same car".
      let bestSingle = 0;
      let bestFullCar = 0;
      for (const ci of player.ownedCars) {
        const maxed = UPGRADE_CATEGORIES.filter(c => ci.upgrades[c] >= MAX_UPGRADE_LEVEL).length;
        bestSingle = Math.max(bestSingle, maxed > 0 ? 1 : 0);
        bestFullCar = Math.max(bestFullCar, maxed);
      }
      return cond.count >= UPGRADE_CATEGORIES.length ? bestFullCar : bestSingle;
    }
    default: return 0;
  }
}

/** Returns the ids of achievements that just became unlocked (not yet in player.achievementsUnlocked). */
export function checkNewAchievements(player: PlayerState): string[] {
  const unlocked: string[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (player.achievementsUnlocked.includes(ach.id)) continue;
    const value = conditionValue(player, ach.condition);
    if (value >= ach.condition.count) unlocked.push(ach.id);
  }
  return unlocked;
}
