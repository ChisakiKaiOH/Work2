// Tipi condivisi da tutto il gioco "Indie Studio Tycoon".

export type Genre =
  | "Action"
  | "RPG"
  | "Adventure"
  | "Strategy"
  | "Simulation"
  | "Horror"
  | "Racing"
  | "Sports"
  | "Puzzle"
  | "Casual";

export type Platform = "PC" | "Console" | "Mobile";

export type ProjectSize = "Small" | "Medium" | "Large" | "AAA";

export type Theme =
  | "Fantasy"
  | "Sci-Fi"
  | "Horror"
  | "Medieval"
  | "Modern"
  | "Futuristic"
  | "Mystery"
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

export interface TechNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  durationMonths: number;
  prerequisites: string[];
  category: "Engine" | "Graphics" | "Gameplay" | "Online" | "Immersive";
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
}

export interface GameState {
  studioName: string;
  money: number;
  month: number; // mese assoluto dalla fondazione (1 = primo mese)
  reputation: number; // 0-100
  negativeMonthsStreak: number; // mesi consecutivi con denaro <= 0

  employees: Employee[];
  candidatePool: Employee[];

  projects: Project[];
  releasedGames: ReleasedGame[];

  research: ResearchState;
  officeUpgrades: OfficeUpgrade[];

  genrePopularity: Record<Genre, number>; // 0-100, modificata da trend/eventi

  activeEvent: ActiveEvent | null;
  eventLog: EventLogEntry[];
  notifications: Notification[];

  time: { speed: TimeSpeed };
  marketingBudget: number; // spesa mensile di marketing corrente

  stats: StudioStats;

  activeSlot: number | null;
  tutorialStep: number | null; // null = tutorial non attivo
  gameOver: boolean;

  isNew?: boolean;
}

export interface SaveMeta {
  slot: number;
  studioName: string;
  money: number;
  month: number;
  reputation: number;
  savedAt: number;
}
