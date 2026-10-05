import type {
  CarDef, TrackDef, DriverDef, ChampionshipDef, BossDef, PackDef,
  EventDef, AchievementDef, DailyRewardDay, CollectionCategoryDef,
} from '../types';

import carsJson from './cars.json';
import tracksJson from './tracks.json';
import driversJson from './drivers.json';
import championshipsJson from './championships.json';
import bossesJson from './bosses.json';
import packsJson from './packs.json';
import eventsJson from './events.json';
import achievementsJson from './achievements.json';
import dailyRewardsJson from './dailyRewards.json';
import collectionsJson from './collections.json';
import brandsJson from './brands.json';

export const CARS = carsJson as CarDef[];
export const TRACKS = tracksJson as TrackDef[];
export const DRIVERS = driversJson as DriverDef[];
export const CHAMPIONSHIPS = championshipsJson as unknown as ChampionshipDef[];
export const BOSSES = bossesJson as BossDef[];
export const PACKS = packsJson as PackDef[];
export const EVENTS = eventsJson as unknown as EventDef[];
export const ACHIEVEMENTS = achievementsJson as AchievementDef[];
export const DAILY_REWARDS = dailyRewardsJson as DailyRewardDay[];
export const COLLECTIONS = collectionsJson as CollectionCategoryDef[];
export const BRANDS = brandsJson as string[];

export const CAR_BY_ID: Record<string, CarDef> = Object.fromEntries(CARS.map(c => [c.id, c]));
export const TRACK_BY_ID: Record<string, TrackDef> = Object.fromEntries(TRACKS.map(t => [t.id, t]));
export const DRIVER_BY_ID: Record<string, DriverDef> = Object.fromEntries(DRIVERS.map(d => [d.id, d]));
export const BOSS_BY_ID: Record<string, BossDef> = Object.fromEntries(BOSSES.map(b => [b.id, b]));
export const PACK_BY_ID: Record<string, PackDef> = Object.fromEntries(PACKS.map(p => [p.id, p]));

export const STARTER_CAR_IDS = ['car_001', 'car_002', 'car_003'];
