import type { PlayerState, CarInstance } from '../types';
import { emptyUpgrades } from '../services/performanceRating';
import { maxEnergyForLevel } from '../services/progression';

export function createCarInstance(defId: string): CarInstance {
  return {
    instanceId: `inst_${defId}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    defId,
    acquiredAt: Date.now(),
    upgrades: emptyUpgrades(),
    equippedTire: 'Sport',
    xp: 0,
    racesCompleted: 0,
    wins: 0,
    favorite: false,
  };
}

export function createNewPlayer(name: string): PlayerState {
  const now = Date.now();
  return {
    createdAt: now,
    name,
    level: 1,
    xp: 0,
    credits: 5000,
    tokens: 50,
    upgradeParts: 2,
    energy: maxEnergyForLevel(1),
    maxEnergy: maxEnergyForLevel(1),
    lastEnergyTick: now,

    ownedCars: [],
    selectedCarInstanceId: null,
    garageSlots: 60,

    ownedDriverIds: ['driver_01', 'driver_02', 'driver_03'],
    selectedDriverId: 'driver_01',

    championshipProgress: {},
    bossesDefeated: [],
    completedRaceCount: 0,
    wonRaceCount: 0,
    totalCreditsEarned: 5000,

    achievementsUnlocked: [],
    dailyRewardStreak: 0,
    lastDailyClaim: null,

    marketListings: [],
    marketGeneratedAt: null,

    packPity: {},
    collectionProgress: {},

    settings: {
      musicOn: true,
      soundOn: true,
      notificationsOn: true,
      graphicsQuality: 'High',
      batterySaver: false,
      language: 'it',
    },
    monetization: { adsRemoved: false },

    tutorialCompleted: false,
    firstCarChosen: false,

    raceHistory: [],
  };
}
