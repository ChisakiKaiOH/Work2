// ---------------------------------------------------------------------------
// Racing Dynasty — Historical Motorsport Manager (1970-2026).
// Domain model for the time-driven career sim: a calendar of events, a
// garage of owned/rented cars, a roster of contracted/rented drivers,
// contracts and negotiations, a used-car/driver market, auctions for
// historically important cars, and a dynamic, decision-driven race engine.
//
// Every entity uses an internal id + a DISPLAY name. Display names are
// original inventions clearly evocative of real-world motorsport eras
// without reproducing any real manufacturer, team, driver or event name,
// logo or photo — see ASSET_LICENSES.md and NameVariantManager.
// ---------------------------------------------------------------------------

export type Era = 'CLASSIC' | 'TURBO' | 'MODERNIZATION' | 'DIGITAL' | 'HYBRID' | 'MODERN';

export function eraForYear(year: number): Era {
  if (year < 1980) return 'CLASSIC';
  if (year < 1990) return 'TURBO';
  if (year < 2000) return 'MODERNIZATION';
  if (year < 2010) return 'DIGITAL';
  if (year < 2020) return 'HYBRID';
  return 'MODERN';
}

// -----------------------------------------------------------------------
// Time & calendar
// -----------------------------------------------------------------------

export interface GameDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export function compareDates(a: GameDate, b: GameDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function formatDate(d: GameDate): string {
  const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  return `${d.day} ${months[d.month - 1]} ${d.year}`;
}

export type CalendarEntryType =
  | 'PRE_SEASON' | 'TEST' | 'RACE' | 'MARKET' | 'AUCTION' | 'CHAMPIONSHIP_END' | 'SEASON_END';

export interface CalendarEntry {
  id: string;
  type: CalendarEntryType;
  date: GameDate;
  championshipId?: string;
  trackId?: string;
  auctionId?: string;
  title: string;
  description: string;
  fictional: boolean;
  completed: boolean;
}

// -----------------------------------------------------------------------
// Manufacturers, cars
// -----------------------------------------------------------------------

export interface ManufacturerDef {
  id: string;
  displayName: string;
  country: string;
  founded: number;
}

export type CarCategory = 'Formula' | 'SportsCar' | 'GT' | 'Touring' | 'Prototype';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Iconic';
export const RARITY_ORDER: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Iconic'];
export type CarSilhouette = 'coupe' | 'roadster' | 'hypercar' | 'prototype' | 'suv-coupe' | 'classic';

export interface CarBaseStats {
  power: number;
  weight: number; // kg, lower is better
  topSpeed: number;
  handling: number;
  braking: number;
  reliability: number;
  aerodynamics: number;
}

/** Static definition of a car model — what ships in cars.json. */
export interface CarDef {
  id: string;
  displayName: string;
  manufacturerId: string;
  year: number;
  category: CarCategory;
  rarity: Rarity;
  stats: CarBaseStats;
  baseValue: number;
  rentPricePerEvent: number;
  historicalImportance: number; // 0-100; high values can trigger an auction event when the year arrives
  colorPrimary: string;
  colorSecondary: string;
  silhouette: CarSilhouette;
  description: string;
}

export type CarOwnership = 'owned' | 'rented';

/** A specific unit of a car model, owned or rented by a team. */
export interface CarInstance {
  instanceId: string;
  defId: string;
  ownership: CarOwnership;
  condition: number; // 0-100
  acquiredDate: GameDate;
  /** For rented cars: the calendar entry id after which the car must be returned. */
  rentalReturnsAtEntryId?: string;
}

// -----------------------------------------------------------------------
// Drivers
// -----------------------------------------------------------------------

export interface DriverSkills {
  qualifying: number;
  overtaking: number;
  defending: number;
  wetWeather: number;
  tyreManagement: number;
  fuelManagement: number;
  consistency: number; // lowers random-event variance
  aggressiveness: number; // raises both reward and risk
}

export type DriverStatus = 'free_agent' | 'contracted' | 'retired';

export interface DriverContract {
  teamId: string;
  startDate: GameDate;
  /** Contract lasts this many calendar RACE entries; null = rental for a single event. */
  durationEvents: number;
  eventsServed: number;
  salaryPerEvent: number;
}

export interface DriverDef {
  id: string;
  displayName: string;
  nationality: string;
  birthYear: number;
  rating: number; // 0-100, current overall ability
  potential: number; // 0-100, ceiling rating can grow toward
  experience: number; // 0-100
  popularity: number; // 0-100
  skills: DriverSkills;
  salaryPerEvent: number; // base market salary
  rentPricePerEvent: number;
  marketValue: number;
  status: DriverStatus;
  contract?: DriverContract;
  teamId?: string;
  form: number; // -20..+20, short-term modifier from recent results
  morale: number; // 0-100
}

// -----------------------------------------------------------------------
// Teams
// -----------------------------------------------------------------------

export interface AiTeamProfile {
  riskTolerance: number; // 0-100
  aggressiveness: number; // 0-100
  budgetStrategy: 'conservative' | 'balanced' | 'aggressive';
}

export interface TeamDef {
  id: string;
  displayName: string;
  ownerName: string;
  founded: number;
  isPlayer: boolean;
  reputation: number; // 0-100
  budget: number;
  carInstanceIds: string[];
  driverIds: string[];
  aiProfile?: AiTeamProfile;
  active: boolean;
  foldedDate?: GameDate;
}

// -----------------------------------------------------------------------
// Tracks & championships
// -----------------------------------------------------------------------

export interface TrackDef {
  id: string;
  displayName: string;
  country: string;
  lengthKm: number;
  laps: number;
  corners: number;
  difficulty: number; // 1-5
  grip: number; // 0-100
  overtakeDifficulty: number; // 0-100, higher = harder to pass
  rainProbability: number; // 0-1
}

export interface ChampionshipDef {
  id: string;
  displayName: string;
  year: number;
  category: CarCategory;
  trackIds: string[]; // ordered calendar of races
  pointsForPosition: number[]; // index 0 = 1st place points
  prizeMoneyPool: number;
  fictional: boolean;
}

export interface ChampionshipStandingEntry {
  entrantId: string; // driverId for driver standings, teamId for team standings
  points: number;
  wins: number;
  podiums: number;
}

export interface ChampionshipProgress {
  championshipId: string;
  racesCompleted: number;
  driverStandings: Record<string, ChampionshipStandingEntry>;
  teamStandings: Record<string, ChampionshipStandingEntry>;
}

// -----------------------------------------------------------------------
// Race engine — dynamic, decision-driven (never just PR > opponent)
// -----------------------------------------------------------------------

export type Weather = 'Dry' | 'LightRain' | 'HeavyRain';

export interface RaceParticipant {
  id: string; // `${teamId}:${driverId}`
  teamId: string;
  driverId: string;
  driverName: string;
  teamName: string;
  carInstanceId: string | null; // null for AI-generated filler entrants
  carDefId: string;
  isPlayer: boolean;
  /**
   * A snapshot of the driver's live stats at race time. Unlike cars (static
   * catalogue data, looked up by id), driver ratings/skills/form live in
   * mutable PlayerState, so the engine needs the actual object rather than
   * an id it could re-resolve itself.
   */
  driverRef: DriverDef;
}

export type DecisionId =
  | 'ATTACK' | 'DEFEND' | 'WAIT' | 'PUSH_HARD' | 'LATE_BRAKING' | 'SAVE_TIRES'
  | 'UNDERCUT_PIT' | 'STAY_OUT';

export interface DecisionOption {
  id: DecisionId;
  label: string;
  successChance: number; // 0-100, already resolved with all modifiers
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  rewardDescription: string;
  penaltyDescription: string;
}

export interface LapDecisionPoint {
  lap: number;
  context: string; // short flavor text describing the situation
  options: DecisionOption[];
}

export type RaceEventType =
  | 'OVERTAKE' | 'DEFEND_HOLD' | 'LATE_BRAKING' | 'PIT_STOP' | 'UNDERCUT' | 'SAVE_TIRES_OK'
  | 'DRIVER_ERROR' | 'LOCKUP' | 'SPIN' | 'MECHANICAL_FAILURE' | 'TRAFFIC'
  | 'WEATHER_CHANGE' | 'SAFETY_CAR' | 'PENALTY' | 'FASTEST_LAP';

export interface RaceEvent {
  lap: number;
  type: RaceEventType;
  participantId: string;
  targetId?: string;
  description: string;
}

export interface RaceResultEntry {
  participantId: string;
  name: string;
  teamName: string;
  isPlayer: boolean;
  position: number;
  gapToLeaderSec: number;
  dnf: boolean;
  points: number;
}

export interface RaceResult {
  championshipId?: string;
  trackId: string;
  weather: Weather;
  laps: number;
  standings: RaceResultEntry[];
  events: RaceEvent[];
  decisionsLog: { lap: number; chosen: DecisionId; success: boolean }[];
  playerPosition: number;
  playerDnf: boolean;
  prizeMoney: number;
  reputationGained: number;
  driverExperienceGained: number;
}

export interface RaceInput {
  player: RaceParticipant;
  field: RaceParticipant[]; // AI opponents, does not include player
  track: TrackDef;
  weather: Weather;
  championshipId?: string;
  pointsForPosition?: number[];
  seed?: number;
}

// -----------------------------------------------------------------------
// Market, contracts, auctions
// -----------------------------------------------------------------------

export interface UsedCarListing {
  id: string;
  defId: string;
  price: number;
  condition: number;
  expiresAtEntryId: string;
}

export interface DriverOffer {
  id: string;
  driverId: string;
  fromTeamId: string; // rival team making the player an offer to poach a contracted driver, or "market" for a free agent
  salaryPerEvent: number;
  durationEvents: number;
  expiresAtEntryId: string;
}

/** Static template for an auction event, as it ships in auctions.json. */
export interface AuctionDef {
  id: string;
  carDefId: string;
  startingPrice: number;
  bidIncrement: number;
  maxRounds: number;
}

export interface AuctionBid {
  bidderId: string; // teamId, or 'player'
  bidderName: string;
  amount: number;
}

export interface AuctionState {
  id: string;
  carDefId: string;
  startingPrice: number;
  bidIncrement: number;
  currentBid: AuctionBid;
  bids: AuctionBid[];
  rounds: number;
  maxRounds: number;
  status: 'open' | 'won_by_player' | 'won_by_rival' | 'passed';
}

// -----------------------------------------------------------------------
// Save-game / live player state
// -----------------------------------------------------------------------

export interface Settings {
  musicOn: boolean;
  soundOn: boolean;
  notificationsOn: boolean;
  language: 'it' | 'en';
}

export interface FinanceLedgerEntry {
  date: GameDate;
  label: string;
  amount: number; // positive = income, negative = expense
}

export interface SeasonRecord {
  year: number;
  championshipId: string;
  teamStanding: number;
  driverStanding: number;
  wins: number;
  podiums: number;
  moneyEarned: number;
}

export interface PlayerState {
  saveVersion: number;
  currentDate: GameDate;
  playerTeamId: string;

  teams: Record<string, TeamDef>;
  cars: Record<string, CarInstance>;
  drivers: Record<string, DriverDef>;
  selectedCarInstanceId: string | null;
  selectedDriverId: string | null;

  calendar: CalendarEntry[];
  currentEntryIndex: number;

  championships: Record<string, ChampionshipDef>;
  championshipProgress: Record<string, ChampionshipProgress>;

  usedCarMarket: UsedCarListing[];
  driverOffers: DriverOffer[];
  marketGeneratedAtEntryId: string | null;

  activeAuction: AuctionState | null;

  finance: {
    ledger: FinanceLedgerEntry[];
  };

  seasonHistory: SeasonRecord[];
  achievementsUnlocked: string[];
  notifications: { id: string; date: GameDate; title: string; body: string; read: boolean }[];

  settings: Settings;
}
