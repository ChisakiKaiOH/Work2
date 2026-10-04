// Tipi condivisi da tutto il gioco "Indie Studio Tycoon".

export type Genre =
  | "Action"
  | "RPG"
  | "JRPG"
  | "Adventure"
  | "Horror"
  | "Survival"
  | "Strategy"
  | "Simulation"
  | "Racing"
  | "Sports"
  | "Fighting"
  | "Puzzle"
  | "Platform"
  | "Roguelike"
  | "MMO"
  | "MOBA"
  | "FPS"
  | "RTS"
  | "Tactical"
  | "Sandbox"
  | "VisualNovel"
  | "Casual"
  | "Educational";

export type Platform = "PC" | "Console" | "Mobile" | "VR";

export type ProjectSize = "Small" | "Medium" | "Large" | "AAA";

export type Theme =
  | "Fantasy"
  | "Sci-Fi"
  | "Horror"
  | "Cyberpunk"
  | "Medieval"
  | "Modern"
  | "Futuristic"
  | "Post-apocalyptic"
  | "Mystery"
  | "Superhero"
  | "Historical"
  | "Space"
  | "Military"
  | "Comedy"
  | "Noir"
  | "Sports";

export const DEV_PHASES = [
  "Concept",
  "Design",
  "Programming",
  "Art",
  "Audio",
  "Testing",
  "Polish",
] as const;
export type DevPhase = (typeof DEV_PHASES)[number];

export type QualityAxis = "gameplay" | "technology" | "graphics" | "sound" | "story";

export type Allocation = Record<QualityAxis, number>; // percentuali, somma 100

export type EmployeeRole = "Programmer" | "Designer" | "Artist" | "AudioDesigner" | "Producer";

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  level: number; // 1-5
  salary: number; // mensile
  productivity: number; // 0-100
  morale: number; // 0-100
  experience: number; // punti xp accumulati
  hiredMonth: number;
  assignedProjectId: string | null;
}

export interface Project {
  id: string;
  name: string;
  genre: Genre;
  platforms: Platform[];
  size: ProjectSize;
  theme: Theme;
  allocation: Allocation;
  assignedEmployeeIds: string[];

  developmentCost: number; // costo iniziale stimato/pagato
  durationMonths: number; // durata pianificata
  monthsElapsed: number;

  phaseIndex: number; // indice in DEV_PHASES
  phaseProgress: number; // 0-100 nella fase corrente

  quality: Allocation; // accumulo qualità per asse, 0-100
  bugs: number; // 0+
  hype: number; // 0-100
  teamMorale: number; // 0-100

  risk: "Basso" | "Medio" | "Alto" | "Molto Alto";
  startedMonth: number;
  completed: boolean;
}

export interface Review {
  id: string;
  author: string;
  score: number; // 1-10
  text: string;
}

export interface MonthlySales {
  month: number;
  unitsSold: number;
  revenue: number;
}

export type ReleasedGameStatus = "launch" | "active" | "declining" | "legacy";

export interface ReleasedGame {
  id: string;
  name: string;
  genre: Genre;
  platforms: Platform[];
  size: ProjectSize;
  theme: Theme;
  quality: Allocation;
  qualityScore: number; // 0-100 composito
  bugs: number;
  hype: number;
  price: number;
  releaseMonth: number;
  criticScore: number; // 1-10
  reviews: Review[];
  pros: string[];
  cons: string[];
  salesHistory: MonthlySales[];
  totalUnitsSold: number;
  totalRevenue: number;
  status: ReleasedGameStatus;
  marketingBudgetThisMonth: number;
  dlcCount: number;
  portedPlatforms: Platform[];
  hasSequel: boolean;
  onSaleDiscount: number; // 0-1, 0 = nessun saldo
}

export type TechCategory =
  | "Engine"
  | "Graphics"
  | "AI"
  | "Audio"
  | "Network"
  | "VR"
  | "Mobile"
  | "Cloud"
  | "Physics"
  | "Tools"
  | "Animation"
  | "Procedural"
  | "Online"
  | "Security";

export interface TechNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  durationMonths: number;
  prerequisites: string[];
  category: TechCategory;
  availableFromMonth: number; // 0 = disponibile da subito; simula la cronologia tecnologica
}

export interface ResearchState {
  unlocked: string[];
  active: { techId: string; monthsRemaining: number } | null;
}

export type OfficeUpgradeId =
  | "office"
  | "workstations"
  | "servers"
  | "meetingRoom"
  | "rndLab"
  | "marketingDept";

export interface OfficeUpgrade {
  id: OfficeUpgradeId;
  name: string;
  description: string;
  level: number; // 0..maxLevel
  maxLevel: number;
  costForNextLevel: number[]; // costo per passare da level a level+1, indicizzato da `level`
  upkeepPerLevel: number; // costo mensile aggiunto per livello
}

export type GameEventId =
  | "talentApplies"
  | "criticalBug"
  | "viralPositiveReview"
  | "negativeReview"
  | "competitorRelease"
  | "platformFeeHike"
  | "suddenTrend"
  | "streamerPlay"
  | "raiseRequest"
  | "investmentOpportunity";

export interface PendingEventChoice {
  label: string;
  description: string;
}

export interface ActiveEvent {
  id: string;
  type: GameEventId;
  month: number;
  title: string;
  description: string;
  choices: PendingEventChoice[] | null; // null = evento informativo, si chiude con "Ok"
  context?: { employeeId?: string; releasedGameId?: string; genre?: Genre };
}

export interface EventLogEntry {
  id: string;
  month: number;
  title: string;
  description: string;
  outcome: string;
}

export type TimeSpeed = 0 | 1 | 2 | 4; // 0 = pausa

export interface Notification {
  id: string;
  month: number;
  text: string;
  tone: "info" | "success" | "warning" | "danger";
}

export interface StudioStats {
  foundedMonth: number;
  totalRevenue: number;
  totalExpenses: number;
  totalUnitsSold: number;
  totalGamesReleased: number;
  bestSellingGameId: string | null;
  totalMarketingSpend: number;
  hadPositiveMonth: boolean;
  hadBankruptcyWarning: boolean;
  acquisitionsCompleted: number;
  hostileTakeovers: number;
  partnerships: number;
}

// --- Fase di crescita dello studio -------------------------------------------

export const COMPANY_STAGES = [
  "Piccolo Studio",
  "Studio Indipendente",
  "Azienda Media",
  "Grande Software House",
  "Colosso dell'Industria",
  "Impero Multimediale",
] as const;
export type CompanyStage = (typeof COMPANY_STAGES)[number];

// --- Modalità e difficoltà ----------------------------------------------------

export type GameMode = "Career" | "Sandbox" | "Challenge";
export type Difficulty = "Easy" | "Normal" | "Hard" | "Insane";

// --- Aziende rivali (simulazione del mondo) -----------------------------------

export type CompanyStrategy =
  | "Aggressive"
  | "Innovative"
  | "Conservative"
  | "IndieFriendly"
  | "AAAFocused"
  | "MobileFocused"
  | "HardwareFocused";

export type BudgetTier = "Indie" | "Mid" | "AAA";

export interface RivalGame {
  id: string;
  name: string;
  genre: Genre;
  theme: Theme;
  platform: Platform;
  topAxis: QualityAxis;
  budgetTier: BudgetTier;
  qualityScore: number; // 0-100
  criticScore: number; // 1-10
  releaseMonth: number;
  unitsSold: number;
}

export interface RivalCompany {
  id: string;
  name: string;
  logoSeed: number; // seme deterministico per logo/mascotte procedurali
  founder: string;
  foundedMonth: number;
  strategy: CompanyStrategy;
  aggressiveness: number; // 0-100
  risk: number; // 0-100
  capital: number;
  companyValue: number;
  reputation: number; // 0-100
  employeeCount: number;
  marketShare: number; // 0-100
  games: RivalGame[];
  ipIds: string[];
  ownedPlatformIds: string[]; // piattaforme hardware create da questa azienda
  isPublic: boolean;
  sharePrice: number;
  sharesOutstanding: number;
  relationshipWithPlayer: number; // -100..100
  bankrupt: boolean;
  acquiredByPlayer: boolean;
}

// --- IP / franchise -------------------------------------------------------

export type FranchiseEntryKind =
  | "Original"
  | "Sequel"
  | "SpinOff"
  | "DLC"
  | "Remake"
  | "Remaster"
  | "Mobile"
  | "Film";

export interface FranchiseEntry {
  kind: FranchiseEntryKind;
  releasedGameId: string;
  month: number;
}

export interface IntellectualProperty {
  id: string;
  name: string;
  genre: Genre;
  theme: Theme;
  value: number;
  fanbase: number; // 0-100+
  reputation: number; // 0-100
  recognizability: number; // 0-100
  foundedMonth: number;
  entries: FranchiseEntry[];
  hasFilmOrSeries: boolean;
  ownerCompanyId: string | null; // null = posseduta dal giocatore
}

// --- Piattaforme hardware fittizie --------------------------------------------

export interface FictionalPlatform {
  id: string;
  name: string;
  ownerCompanyId: string | null; // null = piattaforma storica neutra (tipo PC)
  category: Platform;
  launchMonth: number;
  installedBase: number; // milioni di unità stimate
  power: number; // 0-100
  royaltyRate: number; // 0-1
  lifecycleStage: "Launch" | "Growth" | "Mature" | "Decline" | "Discontinued";
}

// --- Achievement ------------------------------------------------------------

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// --- News / mercato -----------------------------------------------------------

export type NewsCategory = "Industry" | "Studio" | "Market" | "Awards" | "Acquisition";

export interface NewsItem {
  id: string;
  month: number;
  headline: string;
  category: NewsCategory;
}

export interface MarketTrendState {
  year: number;
  label: string;
  risingGenres: Genre[];
  decliningGenres: Genre[];
}

// --- Eventi globali -------------------------------------------------------

export type GlobalEventId =
  | "pandemic"
  | "economicCrisis"
  | "techBoom"
  | "newConsoleLaunch"
  | "hardwareShortage"
  | "industryScandal"
  | "dataLeak"
  | "cyberAttack"
  | "viralSuccess"
  | "famousInfluencer"
  | "revolutionaryTech"
  | "competitorBankruptcy"
  | "historicAcquisition";

export interface GlobalEventRecord {
  id: string;
  type: GlobalEventId;
  month: number;
  headline: string;
  description: string;
}

// --- Global Game Awards --------------------------------------------------

export type AwardCategoryId =
  | "GameOfTheYear"
  | "BestRPG"
  | "BestAction"
  | "BestStrategy"
  | "BestIndie"
  | "BestVisuals"
  | "BestSound"
  | "BestInnovation"
  | "BestMultiplayer"
  | "BestNarrative"
  | "BestMobile";

export interface AwardNominee {
  releasedGameId: string;
  gameName: string;
  companyName: string;
  isPlayer: boolean;
  score: number;
}

export interface AwardCategoryResult {
  categoryId: AwardCategoryId;
  nominees: AwardNominee[]; // ordinati per punteggio decrescente, max 5
}

export interface AwardCeremony {
  id: string;
  year: number;
  month: number;
  categories: AwardCategoryResult[];
}

// --- Borsa --------------------------------------------------------------------

export interface StockHolding {
  companyId: string;
  shares: number;
  averagePrice: number;
}

export interface StockMarketState {
  playerIsPublic: boolean;
  playerSharePrice: number;
  playerSharesOutstanding: number;
  holdings: StockHolding[];
}

// --- Timeline dello studio -----------------------------------------------

export interface TimelineEntry {
  id: string;
  month: number;
  title: string;
  description: string;
}

export interface GameState {
  studioName: string;
  money: number;
  month: number; // mese assoluto dalla fondazione (1 = primo mese)
  reputation: number; // 0-100
  negativeMonthsStreak: number; // mesi consecutivi con denaro <= 0

  mode: GameMode;
  difficulty: Difficulty;
  stage: CompanyStage;
  companyValue: number; // valore stimato dell'azienda del giocatore
  fanbase: number; // fan complessivi accumulati dal giocatore

  employees: Employee[];
  candidatePool: Employee[];

  projects: Project[];
  releasedGames: ReleasedGame[];
  ips: IntellectualProperty[];

  research: ResearchState;
  officeUpgrades: OfficeUpgrade[];

  genrePopularity: Record<Genre, number>; // 0-100, modificata da trend/eventi

  companies: RivalCompany[];
  platformsCatalog: FictionalPlatform[];

  activeEvent: ActiveEvent | null;
  eventLog: EventLogEntry[];
  notifications: Notification[];
  news: NewsItem[];
  globalEvents: GlobalEventRecord[];

  marketTrend: MarketTrendState;
  awardCeremonies: AwardCeremony[];
  pendingAwardCeremonyId: string | null;

  stockMarket: StockMarketState;
  achievementsUnlocked: string[];
  timeline: TimelineEntry[];

  time: { speed: TimeSpeed };
  marketingBudget: number; // spesa mensile di marketing corrente

  stats: StudioStats;

  activeSlot: number | null;
  tutorialStep: number | null; // null = tutorial non attivo
  gameOver: boolean;

  saveVersion: number;
  isNew?: boolean;
}

export const SAVE_FORMAT_VERSION = 2;

export interface SaveMeta {
  slot: number;
  studioName: string;
  money: number;
  month: number;
  reputation: number;
  stage: CompanyStage;
  savedAt: number;
}
