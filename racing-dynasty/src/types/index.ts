// ---------------------------------------------------------------------------
// Racing Dynasty — core domain types.
// Every gameplay system (simulation, economy, progression, UI) is built on
// top of these shapes. Game *content* (cars, tracks, events, ...) lives in
// src/data/*.json and is typed against the Def interfaces below, so new
// content can be added without touching any logic.
// ---------------------------------------------------------------------------

export type CarCategory = 'Street' | 'Sport' | 'Super' | 'Hyper' | 'Prototype' | 'Legend';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export const RARITY_ORDER: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

export type EngineType = 'Combustion V6' | 'Combustion V8' | 'Combustion V10' | 'Combustion V12' | 'Turbo Hybrid' | 'Electric';

export type FuelType = 'Petrol' | 'Hybrid' | 'Electric' | 'Synthetic';

/** Raw, un-upgraded statistics of a car, each on a roughly 0-200 scale. */
export interface CarBaseStats {
  power: number;
  acceleration: number;
  topSpeed: number;
  braking: number;
  grip: number;
  stability: number;
  reliability: number;
  /** Lower is better; kilograms. Used by the simulator, not shown as a 0-200 bar. */
  weight: number;
  traction: number;
}

/** Static definition of a car model — this is what ships in cars.json. */
export interface CarDef {
  id: string;
  name: string;
  brand: string;
  category: CarCategory;
  rarity: Rarity;
  stats: CarBaseStats;
  engineType: EngineType;
  fuel: FuelType;
  baseValue: number;
  stars: number; // 1-6, derived from rarity but stored for display convenience
  colorPrimary: string;
  colorSecondary: string;
  silhouette: CarSilhouette;
  description: string;
}

/** Which procedural SVG body shape a car renders with (see components/CarArt.tsx). */
export type CarSilhouette = 'coupe' | 'roadster' | 'hypercar' | 'prototype' | 'suv-coupe' | 'classic';

export const UPGRADE_CATEGORIES = [
  'Engine', 'Turbo', 'ECU', 'Exhaust',
  'Gearbox', 'Clutch', 'Differential',
  'Suspension', 'WeightReduction', 'Chassis',
  'BrakeSystem', 'BrakeCooling',
] as const;
export type UpgradeCategory = typeof UPGRADE_CATEGORIES[number];

export const UPGRADE_GROUPS: Record<string, UpgradeCategory[]> = {
  Engine: ['Engine', 'Turbo', 'ECU', 'Exhaust'],
  Transmission: ['Gearbox', 'Clutch', 'Differential'],
  Chassis: ['Suspension', 'WeightReduction', 'Chassis'],
  Brakes: ['BrakeSystem', 'BrakeCooling'],
};

export const MAX_UPGRADE_LEVEL = 10;

export type TireType = 'Street' | 'Sport' | 'Racing' | 'Rain' | 'WetRacing';

export type Weather = 'Dry' | 'Rain' | 'HeavyRain' | 'Night' | 'Heat' | 'Cold';

export type Strategy = 'Attack' | 'Balanced' | 'Defend' | 'Risky';

/** A car the player actually owns, with its own upgrade/tyre/condition state. */
export interface CarInstance {
  instanceId: string;
  defId: string;
  acquiredAt: number;
  upgrades: Record<UpgradeCategory, number>;
  equippedTire: TireType;
  xp: number;
  racesCompleted: number;
  wins: number;
  favorite: boolean;
}

export type DriverArchetype = 'Aggressive' | 'Defensive' | 'Balanced' | 'Technical' | 'Risky';

export interface DriverDef {
  id: string;
  name: string;
  archetype: DriverArchetype;
  skill: number; // 0-100
  aggressiveness: number; // 0-100
  consistency: number; // 0-100
  specialty: 'Technical' | 'Speed' | 'Wet' | 'Endurance' | 'AllRound';
  unlockLevel: number;
  avatarSeed: string;
}

export type TrackSurface = 'Asphalt' | 'Street' | 'Mixed' | 'Concrete';
export type TrackType = 'Circuit' | 'StreetCircuit' | 'Sprint' | 'Endurance';

export interface TrackDef {
  id: string;
  name: string;
  region: Region;
  lengthKm: number;
  laps: number;
  type: TrackType;
  difficulty: number; // 1-5
  corners: number;
  straights: number;
  surface: TrackSurface;
  preferredConditions: Weather[];
  description: string;
}

export type Region = 'Europe' | 'Asia' | 'America' | 'Oceania' | 'MiddleEast' | 'North';

export interface ChampionshipDef {
  id: string;
  name: string;
  tier: 'Rookie' | 'Street' | 'Sport' | 'Super' | 'Hyper' | 'Legend';
  region: Region;
  requiredPR: number;
  trackIds: string[]; // 5 races
  creditReward: number;
  tokenReward: number;
  carRewardId?: string;
  description: string;
}

export interface BossDef {
  id: string;
  name: string;
  region: Region;
  personality: string;
  carDefId: string;
  pr: number;
  strategyPreference: Strategy;
  specialty: string;
  dialogueIntro: string;
  dialogueLose: string;
  dialogueWin: string;
  rewardCredits: number;
  rewardTokens: number;
  rewardCarId?: string;
}

export type PackCurrency = 'credits' | 'tokens';

export interface PackOdds {
  Common: number;
  Uncommon: number;
  Rare: number;
  Epic: number;
  Legendary: number;
  Mythic: number;
}

export interface PackDef {
  id: string;
  name: string;
  description: string;
  carCount: number;
  price: number;
  currency: PackCurrency;
  odds: PackOdds;
  categoryPool?: CarCategory[];
  pityThreshold: number; // openings without Epic+ before odds start climbing
  guaranteedRarityAt: Rarity; // the pity floor rarity
  limited?: boolean;
}

export type EventType =
  | 'DailyRace' | 'DailyChallenge' | 'WeekendChampionship' | 'ManufacturerChallenge'
  | 'BossChallenge' | 'LegendaryEvent' | 'RainChallenge' | 'NightRace' | 'EnduranceEvent';

export interface EventDef {
  id: string;
  name: string;
  type: EventType;
  trackId: string;
  weather: Weather;
  requiredCategory?: CarCategory;
  requiredBrand?: string;
  creditReward: number;
  tokenReward: number;
  xpReward: number;
  description: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  condition: AchievementCondition;
  rewardCredits: number;
  rewardTokens: number;
}

export type AchievementCondition =
  | { type: 'racesCompleted'; count: number }
  | { type: 'racesWon'; count: number }
  | { type: 'creditsEarned'; count: number }
  | { type: 'carsOwned'; count: number }
  | { type: 'championshipsWon'; count: number }
  | { type: 'bossesDefeated'; count: number }
  | { type: 'legendaryCarsOwned'; count: number }
  | { type: 'playerLevel'; count: number }
  | { type: 'collectionsCompleted'; count: number }
  | { type: 'maxUpgradesOnCar'; count: number };

export type DailyRewardKind = 'credits' | 'energy' | 'upgradeParts' | 'tokens' | 'pack' | 'premiumPack';

export interface DailyRewardDay {
  day: number;
  kind: DailyRewardKind;
  amount: number;
}

export interface MarketListing {
  id: string;
  defId: string;
  price: number;
  condition: number; // 0-100
  upgrades: Record<UpgradeCategory, number>;
  expiresAt: number;
}

export interface CollectionCategoryDef {
  id: string;
  name: string;
  carDefIds: string[];
  rewardCredits: number;
  rewardTokens: number;
}

// -----------------------------------------------------------------------
// Save-game / live player state
// -----------------------------------------------------------------------

export interface Settings {
  musicOn: boolean;
  soundOn: boolean;
  notificationsOn: boolean;
  graphicsQuality: 'Low' | 'Medium' | 'High';
  batterySaver: boolean;
  language: 'it' | 'en';
}

export interface MonetizationFlags {
  adsRemoved: boolean;
}

export interface PackPity {
  [packId: string]: number; // openings since last Epic+ pull
}

export interface PlayerState {
  createdAt: number;
  name: string;
  level: number;
  xp: number;
  credits: number;
  tokens: number;
  upgradeParts: number;
  energy: number;
  maxEnergy: number;
  lastEnergyTick: number;

  ownedCars: CarInstance[];
  selectedCarInstanceId: string | null;
  garageSlots: number;

  ownedDriverIds: string[];
  selectedDriverId: string | null;

  championshipProgress: Record<string, { racesWon: number; completed: boolean; standing: number }>;
  bossesDefeated: string[];
  completedRaceCount: number;
  wonRaceCount: number;
  totalCreditsEarned: number;

  achievementsUnlocked: string[];
  dailyRewardStreak: number;
  lastDailyClaim: number | null;

  marketListings: MarketListing[];
  marketGeneratedAt: number | null;

  packPity: PackPity;
  collectionProgress: Record<string, boolean>;

  settings: Settings;
  monetization: MonetizationFlags;

  tutorialCompleted: boolean;
  firstCarChosen: boolean;

  raceHistory: RaceHistoryEntry[];
}

export interface RaceHistoryEntry {
  raceId: string;
  trackId: string;
  position: number;
  totalDrivers: number;
  creditsEarned: number;
  xpEarned: number;
  timestamp: number;
}

// -----------------------------------------------------------------------
// Race simulation
// -----------------------------------------------------------------------

export interface RaceParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  carDef: CarDef;
  carInstance: CarInstance | null; // null for AI-generated opponents
  driver: DriverDef;
  strategy: Strategy;
  pr: number;
}

export interface RaceEvent {
  lap: number;
  type: 'overtake' | 'pit' | 'incident' | 'fastestLap' | 'mechanicalFailure' | 'weatherChange';
  participantId: string;
  targetId?: string;
  description: string;
}

export interface RaceLapRecord {
  lap: number;
  order: string[]; // participant ids, position order
}

export interface RaceResultEntry {
  participantId: string;
  name: string;
  isPlayer: boolean;
  position: number;
  totalTimeSec: number;
  gapToLeaderSec: number;
  pitStops: number;
  overtakes: number;
  dnf: boolean;
}

export interface RaceResult {
  trackId: string;
  weather: Weather;
  laps: number;
  standings: RaceResultEntry[];
  lapHistory: RaceLapRecord[];
  events: RaceEvent[];
  playerPosition: number;
  playerDnf: boolean;
  creditsEarned: number;
  xpEarned: number;
  bonusCredits: number;
  drops: { kind: 'car' | 'upgradePart' | 'tokens'; id?: string; amount?: number }[];
}

export interface RaceInput {
  player: RaceParticipant;
  opponents: RaceParticipant[];
  track: TrackDef;
  weather: Weather;
  seed?: number;
}
