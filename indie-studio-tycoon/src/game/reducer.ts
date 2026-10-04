import type {
  ActiveEvent,
  Allocation,
  AwardCategoryId,
  Employee,
  EventLogEntry,
  FranchiseEntryKind,
  GameState,
  GlobalEventRecord,
  IntellectualProperty,
  Notification,
  OfficeUpgrade,
  Project,
  ReleasedGame,
  RivalCompany,
  TimelineEntry,
} from "../types";
import type { GameAction } from "./actions";
import { createNewGameState } from "./initialState";
import { createId } from "../utils/id";
import { clamp } from "../utils/format";
import { GENRES } from "../data/genres";
import { PLATFORM_TECH_REQUIREMENT } from "../data/platformsThemes";
import { DIFFICULTY_SETTINGS } from "../data/difficulty";
import { AWARD_CATEGORY_LABELS } from "../data/awardCategories";
import {
  advanceDevelopment,
  compositeQualityScore,
  type OfficeMultipliers,
} from "../systems/development";
import { computeMonthlyLedger } from "../systems/economy";
import {
  fireCost,
  generateCandidatePool,
  monthlyEmployeeDrift,
  promoteEmployee,
  promotionCost,
  trainEmployee,
  TRAINING_COST,
} from "../systems/employees";
import { createProject, estimateProject, type NewProjectChoice } from "../systems/projectFactory";
import { generateReviews } from "../systems/reviews";
import {
  DLC_COST,
  DLC_PRICE,
  PORT_COST,
  UPDATE_COST,
  dlcRevenue,
  monthlySalesStep,
  portLaunchUnits,
  sequelHypeSeed,
} from "../systems/sales";
import { advanceResearch, canStartResearch, researchCost, startResearch, techQualityMultipliers } from "../systems/research";
import { EVENT_CHANCE_PER_MONTH, buildActiveEvent, pickEventDefinition } from "../systems/events";
import { GLOBAL_EVENT_CHANCE_PER_MONTH, rollGlobalEvent } from "../systems/globalEvents";
import { rollYearlyTrend } from "../systems/market";
import {
  companyStageFor,
  computePlayerCompanyValue,
  createFictionalPlatform,
  createRivalCompany,
  simulateCompanyMonth,
  COMPANY_STAGES_INDEX,
} from "../systems/companies";
import { runAwardCeremony } from "../systems/awards";
import { checkAchievements } from "../systems/achievements";
import { ACHIEVEMENTS } from "../data/achievements";
import {
  addFranchiseEntry,
  createIpFromGame,
  franchisePotential,
  FILM_MIN_STAGE_INDEX,
  REMASTER_COST,
  REMAKE_COST,
  FILM_COST,
} from "../systems/ip";
import { makeOffer, resolveAcquisition, type AcquisitionMode, type PostAcquisitionChoice } from "../systems/acquisitions";
import { buyShares, canGoPublic, goPublic, sellShares, tickPublicCompanies, updateSharePrice } from "../systems/stockMarket";
import {
  newsForAwardWin,
  newsForCompetitorBankruptcy,
  newsForGlobalEvent,
  newsForMarketTrend,
  newsForPlayerAcquisition,
  newsForRivalAcquisition,
  newsForRivalAwardWin,
  newsForRivalRelease,
  trimNews,
} from "../systems/news";

function pushNotification(state: GameState, text: string, tone: Notification["tone"]): Notification[] {
  const notif: Notification = { id: createId("notif"), month: state.month, text, tone };
  return [...state.notifications, notif].slice(-40);
}

function officeLevel(state: GameState, id: OfficeUpgrade["id"]): number {
  return state.officeUpgrades.find((u) => u.id === id)?.level ?? 0;
}

function officeMultipliers(state: GameState): OfficeMultipliers {
  return {
    workstationBoost: 1 + officeLevel(state, "workstations") * 0.12,
    bugReduction: clamp(officeLevel(state, "servers") * 0.1, 0, 0.4),
    moraleRegen: 1 + officeLevel(state, "meetingRoom") * 1.5,
  };
}

function marketingBoostFor(state: GameState): number {
  const deptLevel = officeLevel(state, "marketingDept");
  return 1 + (state.marketingBudget / 10_000) * (1 + deptLevel * 0.25);
}

function maxTeamSize(state: GameState): number {
  return 3 + officeLevel(state, "office") * 3;
}

function findIpForGame(state: GameState, releasedGameId: string): IntellectualProperty | undefined {
  return state.ips.find((ip) => ip.entries.some((e) => e.releasedGameId === releasedGameId));
}

function updateIp(state: GameState, ipId: string, updater: (ip: IntellectualProperty) => IntellectualProperty): IntellectualProperty[] {
  return state.ips.map((ip) => (ip.id === ipId ? updater(ip) : ip));
}

// --- TICK: avanza di un mese tutta la simulazione --------------------------

function runTick(state: GameState): GameState {
  if (state.gameOver) return state;

  const diff = DIFFICULTY_SETTINGS[state.difficulty];
  const office = officeMultipliers(state);
  const techMult = techQualityMultipliers(state.research.unlocked);
  let notifications = state.notifications;
  let news = state.news;
  let globalEvents = state.globalEvents;
  let timeline = state.timeline;

  // 1. Evento globale (prima delle vendite, così il suo effetto si applica
  // subito ai ricavi di questo stesso mese).
  let globalSalesMultiplier = 1;
  let platformsCatalog = state.platformsCatalog;
  if (Math.random() < GLOBAL_EVENT_CHANCE_PER_MONTH * diff.eventChanceMultiplier) {
    const effect = rollGlobalEvent(state.month);
    if (effect) {
      globalEvents = [...globalEvents, effect.record].slice(-40);
      news = [...news, newsForGlobalEvent(effect.record.headline, state.month)];
      notifications = pushNotification(state, effect.record.headline, "info");
      if (effect.salesMultiplierAllReleased) globalSalesMultiplier *= effect.salesMultiplierAllReleased;
      if (effect.spawnPlatform) platformsCatalog = [...platformsCatalog, createFictionalPlatform(state.month, "Console", null)];
    }
  }

  // 2. Sviluppo progetti attivi
  const projects: Project[] = [];
  for (const project of state.projects) {
    const { project: advanced } = advanceDevelopment(project, state.employees, office, techMult);
    if (advanced.completed) {
      notifications = pushNotification(
        state,
        `"${advanced.name}" ha completato lo sviluppo: ora puoi pubblicarlo dalla scheda Libreria giochi.`,
        "success"
      );
    }
    projects.push(advanced);
  }

  // 3. Dipendenti: drift morale/esperienza, libera assegnazione se progetto pubblicato
  const activeProjectIds = new Set(projects.filter((p) => !p.completed).map((p) => p.id));
  const employees: Employee[] = state.employees.map((emp) => {
    const stillAssigned = emp.assignedProjectId && activeProjectIds.has(emp.assignedProjectId);
    const drifted = monthlyEmployeeDrift(emp, office.moraleRegen);
    return { ...drifted, assignedProjectId: stillAssigned ? emp.assignedProjectId : null };
  });

  // 4. Mondo: simulazione delle aziende rivali
  const acquiredTargetIds = new Set<string>();
  const simResults = state.companies.map((company) =>
    simulateCompanyMonth(company, {
      month: state.month,
      genrePopularity: state.genrePopularity,
      otherCompanies: state.companies,
      difficultyMult: diff.competitorAggressivenessMultiplier,
    })
  );
  for (const result of simResults) {
    if (result.releasedGame) {
      news = [...news, newsForRivalRelease(result.company.name, result.releasedGame.name, state.month)];
    }
    if (result.wentBankrupt) {
      news = [...news, newsForCompetitorBankruptcy(result.company.name, state.month)];
      const bankruptcyRecord: GlobalEventRecord = {
        id: createId("gevent"),
        type: "competitorBankruptcy",
        month: state.month,
        headline: `${result.company.name} dichiara bancarotta`,
        description: "Una società del settore chiude i battenti.",
      };
      globalEvents = [...globalEvents, bankruptcyRecord].slice(-40);
    }
    if (result.acquiredCompanyId) {
      acquiredTargetIds.add(result.acquiredCompanyId);
      const target = state.companies.find((c) => c.id === result.acquiredCompanyId);
      if (target) {
        news = [...news, newsForRivalAcquisition(result.company.name, target.name, state.month)];
        const acquisitionRecord: GlobalEventRecord = {
          id: createId("gevent"),
          type: "historicAcquisition",
          month: state.month,
          headline: `${result.company.name} acquisisce ${target.name}`,
          description: "Un'acquisizione ridisegna gli equilibri del settore.",
        };
        globalEvents = [...globalEvents, acquisitionRecord].slice(-40);
      }
    }
  }
  let companies: RivalCompany[] = simResults
    .map((r) => {
      // Il catalogo di ogni rivale resta limitato agli ultimi 60 giochi: su
      // partite molto lunghe evita che l'array (e il salvataggio) crescano
      // all'infinito, senza alterare l'ammissibilità ai Game Awards (che
      // guarda solo all'ultimo anno).
      const company = r.releasedGame ? { ...r.company, games: [...r.company.games, r.releasedGame].slice(-60) } : r.company;
      return company;
    })
    .filter((c) => !c.bankrupt && !acquiredTargetIds.has(c.id));
  companies = tickPublicCompanies(companies);

  // Il mondo resta vivo nel lungo periodo: se troppe aziende sono fallite o
  // sono state acquisite, ne nasce occasionalmente una nuova.
  if (companies.length < 6 && Math.random() < 0.3) {
    companies = [...companies, createRivalCompany(state.month)];
  }

  // 5. Vendite dei giochi pubblicati
  let salesRevenue = 0;
  const marketingBoost = marketingBoostFor(state) * globalSalesMultiplier * diff.salesMultiplier;
  const releasedGames: ReleasedGame[] = state.releasedGames.map((game) => {
    if (game.status === "legacy" && state.month - game.releaseMonth > 1) return game;
    const step = monthlySalesStep(game, state.month, 0, marketingBoost);
    salesRevenue += step.revenue;
    return {
      ...game,
      salesHistory: [...game.salesHistory, { month: state.month, unitsSold: step.unitsSold, revenue: step.revenue }],
      totalUnitsSold: game.totalUnitsSold + step.unitsSold,
      totalRevenue: game.totalRevenue + step.revenue,
      status: step.status,
      onSaleDiscount: 0,
    };
  });

  // 6. Ricerca
  const researchResult = advanceResearch(state.research);
  let research = researchResult.research;
  if (researchResult.completedTechId) {
    notifications = pushNotification(state, `Ricerca completata: nuova tecnologia disponibile.`, "success");
  }

  // 7. Economia
  const ledger = computeMonthlyLedger({
    employees,
    officeUpgrades: state.officeUpgrades,
    marketingSpend: state.marketingBudget,
    researchSpend: 0,
    salesRevenue,
  });
  const scaledExpenses = ledger.totalExpenses * diff.expenseMultiplier;
  const profit = ledger.totalIncome - scaledExpenses;
  let money = state.money + profit;

  // 8. Reputazione: deriva lentamente verso la media qualità/vendite recenti
  let reputation = state.reputation;
  if (releasedGames.length > 0) {
    const avgScore = releasedGames.reduce((s, g) => s + g.criticScore, 0) / releasedGames.length;
    reputation = clamp(reputation + (avgScore - 5.5) * 0.4, 0, 100);
  }

  // 9. Fallimento
  let negativeMonthsStreak = state.negativeMonthsStreak;
  let gameOver: boolean = state.gameOver;
  let hadBankruptcyWarning = state.stats.hadBankruptcyWarning;
  if (money <= 0) {
    negativeMonthsStreak += 1;
    if (negativeMonthsStreak === 1) {
      hadBankruptcyWarning = true;
      notifications = pushNotification(
        state,
        `Attenzione: il conto è a zero. Hai ${diff.bankruptcyGraceMonths} mesi per recuperare prima della chiusura dello studio.`,
        "danger"
      );
    }
    if (negativeMonthsStreak > diff.bankruptcyGraceMonths) {
      gameOver = true;
      notifications = pushNotification(state, `Lo studio ha chiuso i battenti per bancarotta.`, "danger");
    }
  } else {
    negativeMonthsStreak = 0;
  }

  const month = state.month + 1;

  // 10. Evento personale casuale (studio): solo gli eventi con una scelta
  // reale mettono in pausa il gioco con un popup bloccante.
  let activeEvent: ActiveEvent | null = state.activeEvent;
  let autoResolvedEvent: ActiveEvent | null = null;
  if (!activeEvent && Math.random() < EVENT_CHANCE_PER_MONTH * diff.eventChanceMultiplier) {
    const def = pickEventDefinition({ employees, releasedGames, genres: GENRES });
    if (def) {
      const built = buildActiveEvent(def, month, { employees, releasedGames, genres: GENRES });
      if (def.hasChoices) activeEvent = built;
      else autoResolvedEvent = built;
    }
  }

  // 11. Tendenze annuali di mercato + Global Game Awards (ogni 12 mesi)
  let genrePopularity = state.genrePopularity;
  let marketTrend = state.marketTrend;
  let awardCeremonies = state.awardCeremonies;
  let pendingAwardCeremonyId = state.pendingAwardCeremonyId;
  let ips = state.ips;
  let companyValueAwardBonus = 0;
  let fanbase = state.fanbase;

  if (month % 12 === 1 && month > 1) {
    const year = Math.floor((month - 1) / 12) + 1;
    const trendResult = rollYearlyTrend(genrePopularity, year);
    genrePopularity = trendResult.genrePopularity;
    marketTrend = trendResult.trend;
    news = [...news, newsForMarketTrend(trendResult.trend.label, month)];

    const ceremony = runAwardCeremony(month, year - 1, state.studioName, releasedGames, companies);
    awardCeremonies = [...awardCeremonies, ceremony].slice(-30);
    pendingAwardCeremonyId = ceremony.id;

    for (const category of ceremony.categories) {
      const winner = category.nominees[0];
      if (!winner) continue;
      const label = AWARD_CATEGORY_LABELS[category.categoryId as AwardCategoryId];
      if (winner.isPlayer) {
        news = [...news, newsForAwardWin(state.studioName, winner.gameName, label, month)];
        reputation = clamp(reputation + (category.categoryId === "GameOfTheYear" ? 15 : 6), 0, 100);
        companyValueAwardBonus += category.categoryId === "GameOfTheYear" ? 500_000 : 150_000;
        fanbase = clamp(fanbase + (category.categoryId === "GameOfTheYear" ? 20 : 8), 0, 100000);
        const ip = findIpForGame({ ...state, releasedGames }, winner.releasedGameId);
        if (ip) {
          ips = updateIp({ ...state, ips }, ip.id, (cur) => ({
            ...cur,
            value: Math.round(cur.value * 1.3),
            fanbase: clamp(cur.fanbase + 15, 0, 150),
            recognizability: clamp(cur.recognizability + 15, 0, 100),
          }));
        }
      } else if (category.categoryId === "GameOfTheYear") {
        news = [...news, newsForRivalAwardWin(winner.companyName, winner.gameName, label, month)];
      }
    }
  }

  // 12. Borsa: aggiorna il prezzo delle azioni del giocatore, se quotato
  let stockMarket = state.stockMarket;
  if (stockMarket.playerIsPublic) {
    const projectedValue = Math.max(0, money) + companyValueAwardBonus;
    stockMarket = { ...stockMarket, playerSharePrice: updateSharePrice(stockMarket.playerSharePrice, projectedValue, stockMarket.playerSharesOutstanding) };
  }

  // 13. Valore aziendale e stadio di crescita
  const ipValueSum = ips.reduce((s, ip) => s + ip.value, 0);
  const releasedGamesRevenueSum = releasedGames.reduce((s, g) => s + g.totalRevenue, 0);
  const companyValue =
    computePlayerCompanyValue({
      money,
      totalRevenueAllTime: state.stats.totalRevenue + ledger.totalIncome,
      ipValueSum,
      releasedGamesRevenueSum,
      reputation,
    }) + companyValueAwardBonus;
  const stage = companyStageFor(companyValue);
  if (stage !== state.stage) {
    timeline = [
      ...timeline,
      { id: createId("timeline"), month, title: stage, description: `${state.studioName} raggiunge lo stadio: ${stage}.` },
    ];
    notifications = pushNotification(state, `Il tuo studio è ora una ${stage}!`, "success");
  }

  const stats = {
    ...state.stats,
    totalRevenue: state.stats.totalRevenue + ledger.totalIncome,
    totalExpenses: state.stats.totalExpenses + scaledExpenses,
    totalUnitsSold: releasedGames.reduce((s, g) => s + g.totalUnitsSold, 0),
    totalMarketingSpend: state.stats.totalMarketingSpend + state.marketingBudget,
    hadPositiveMonth: state.stats.hadPositiveMonth || profit > 0,
    hadBankruptcyWarning,
  };

  let next: GameState = {
    ...state,
    month,
    money,
    reputation,
    negativeMonthsStreak,
    gameOver,
    employees,
    projects,
    releasedGames,
    research,
    notifications,
    activeEvent,
    stats,
    companies,
    platformsCatalog,
    genrePopularity,
    marketTrend,
    awardCeremonies,
    pendingAwardCeremonyId,
    ips,
    stockMarket,
    companyValue,
    stage,
    fanbase,
    news: trimNews(news),
    globalEvents,
    timeline,
  };

  if (autoResolvedEvent) {
    next = resolveEvent({ ...next, activeEvent: autoResolvedEvent }, null);
  }

  const newAchievements = checkAchievements(next);
  if (newAchievements.length > 0) {
    let achievementNotifications = next.notifications;
    for (const id of newAchievements) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) {
        const notif: Notification = { id: createId("notif"), month: next.month, text: `Obiettivo sbloccato: ${def.icon} ${def.name}`, tone: "success" };
        achievementNotifications = [...achievementNotifications, notif].slice(-40);
      }
    }
    next = { ...next, achievementsUnlocked: [...next.achievementsUnlocked, ...newAchievements], notifications: achievementNotifications };
  }

  return next;
}

// --- Azioni singole ----------------------------------------------------------

function startProject(state: GameState, choice: NewProjectChoice, allocation: Allocation, employeeIds: string[]): GameState {
  for (const platform of choice.platforms) {
    const requiredTech = PLATFORM_TECH_REQUIREMENT[platform];
    if (requiredTech && !state.research.unlocked.includes(requiredTech)) {
      return { ...state, notifications: pushNotification(state, `La piattaforma ${platform} richiede una tecnologia non ancora sbloccata.`, "warning") };
    }
  }
  const estimate = estimateProject(choice, {
    teamSize: employeeIds.length,
    unlockedTechIds: state.research.unlocked,
    genrePopularity: state.genrePopularity[choice.genre],
  });
  if (state.money < estimate.cost) {
    return { ...state, notifications: pushNotification(state, "Budget insufficiente per avviare questo progetto.", "warning") };
  }
  const project = createProject(choice, allocation, estimate, employeeIds, state.month);
  const employees = state.employees.map((e) => (employeeIds.includes(e.id) ? { ...e, assignedProjectId: project.id } : e));
  return {
    ...state,
    money: state.money - estimate.cost,
    projects: [...state.projects, project],
    employees,
    notifications: pushNotification(state, `Hai avviato lo sviluppo di "${project.name}".`, "info"),
  };
}

function publishProject(state: GameState, projectId: string, price: number): GameState {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project || !project.completed) return state;

  const { reviews, pros, cons, criticScore } = generateReviews(project);
  const qualityScore = compositeQualityScore(project);

  const released: ReleasedGame = {
    id: project.id,
    name: project.name,
    genre: project.genre,
    platforms: project.platforms,
    size: project.size,
    theme: project.theme,
    quality: project.quality,
    qualityScore,
    bugs: project.bugs,
    hype: project.hype,
    price,
    releaseMonth: state.month,
    criticScore,
    reviews,
    pros,
    cons,
    salesHistory: [],
    totalUnitsSold: 0,
    totalRevenue: 0,
    status: "launch",
    marketingBudgetThisMonth: state.marketingBudget,
    dlcCount: 0,
    portedPlatforms: [],
    hasSequel: false,
    onSaleDiscount: 0,
  };

  const employees = state.employees.map((e) => (e.assignedProjectId === projectId ? { ...e, assignedProjectId: null } : e));
  const ip = createIpFromGame(released, state.month);

  const stats = {
    ...state.stats,
    totalGamesReleased: state.stats.totalGamesReleased + 1,
  };

  return {
    ...state,
    projects: state.projects.filter((p) => p.id !== projectId),
    releasedGames: [...state.releasedGames, released],
    ips: [...state.ips, ip],
    employees,
    stats,
    notifications: pushNotification(state, `"${project.name}" è stato pubblicato! Voto della critica: ${criticScore}/10.`, "success"),
  };
}

function addFranchiseAction(state: GameState, gameId: string, kind: FranchiseEntryKind): GameState {
  const game = state.releasedGames.find((g) => g.id === gameId);
  if (!game) return state;
  const ip = findIpForGame(state, gameId);
  const choice: NewProjectChoice = { genre: game.genre, platforms: game.platforms, size: game.size, theme: game.theme };
  const estimate = estimateProject(choice, {
    teamSize: 0,
    unlockedTechIds: state.research.unlocked,
    genrePopularity: state.genrePopularity[game.genre],
  });
  const costMultiplier = kind === "SpinOff" ? 0.7 : 1;
  const cost = Math.round(estimate.cost * costMultiplier);
  if (state.money < cost) {
    return { ...state, notifications: pushNotification(state, "Budget insufficiente per questo progetto.", "warning") };
  }
  const project = createProject(choice, { ...game.quality }, { ...estimate, cost }, [], state.month);
  project.hype = sequelHypeSeed(game);
  project.name = kind === "Sequel" ? `${game.name} II` : `${game.name}: Spin-off`;

  const ips = ip ? updateIp(state, ip.id, (cur) => addFranchiseEntry(cur, kind, project.id, state.month)) : state.ips;

  return {
    ...state,
    money: state.money - cost,
    projects: [...state.projects, project],
    ips,
    releasedGames: state.releasedGames.map((g) => (g.id === gameId && kind === "Sequel" ? { ...g, hasSequel: true } : g)),
    notifications: pushNotification(state, `Hai avviato lo sviluppo di "${project.name}".`, "info"),
  };
}

function remasterOrRemake(state: GameState, gameId: string, kind: "Remaster" | "Remake"): GameState {
  const game = state.releasedGames.find((g) => g.id === gameId);
  if (!game) return state;
  const cost = kind === "Remaster" ? REMASTER_COST : REMAKE_COST;
  if (state.money < cost) {
    return { ...state, notifications: pushNotification(state, "Budget insufficiente.", "warning") };
  }
  const qualityBoost = kind === "Remaster" ? 1.1 : 1.25;
  const updatedQuality = Object.fromEntries(
    (Object.entries(game.quality) as [keyof typeof game.quality, number][]).map(([axis, value]) => [axis, clamp(value * qualityBoost, 0, 100)])
  ) as typeof game.quality;
  const criticScore = clamp(game.criticScore * qualityBoost, 1, 10);

  const ip = findIpForGame(state, gameId);
  const ips = ip ? updateIp(state, ip.id, (cur) => addFranchiseEntry(cur, kind, gameId, state.month)) : state.ips;

  return {
    ...state,
    money: state.money - cost,
    ips,
    releasedGames: state.releasedGames.map((g) =>
      g.id === gameId
        ? { ...g, quality: updatedQuality, qualityScore: compositeQualityScore({ ...g, quality: updatedQuality }), criticScore, bugs: 0, hype: clamp(g.hype + 20, 0, 100) }
        : g
    ),
    notifications: pushNotification(state, `"${game.name}" ha ricevuto un ${kind === "Remaster" ? "remaster" : "remake"}!`, "success"),
  };
}

function produceFilm(state: GameState, ipId: string): GameState {
  const ip = state.ips.find((i) => i.id === ipId);
  if (!ip) return state;
  if (COMPANY_STAGES_INDEX[state.stage] < FILM_MIN_STAGE_INDEX) {
    return { ...state, notifications: pushNotification(state, "Il tuo studio non è ancora grande abbastanza per produrre un film/serie TV.", "warning") };
  }
  if (franchisePotential(ip) !== "Film o Serie TV") {
    return { ...state, notifications: pushNotification(state, `"${ip.name}" non ha ancora il riconoscimento necessario per un adattamento.`, "warning") };
  }
  if (state.money < FILM_COST) {
    return { ...state, notifications: pushNotification(state, "Budget insufficiente per produrre il film/serie TV.", "warning") };
  }
  const anyGameId = ip.entries[0]?.releasedGameId ?? "";
  const ips = updateIp(state, ip.id, (cur) => addFranchiseEntry(cur, "Film", anyGameId, state.month, FILM_COST * 2));
  return {
    ...state,
    money: state.money - FILM_COST,
    ips,
    reputation: clamp(state.reputation + 5, 0, 100),
    fanbase: clamp(state.fanbase + 15, 0, 100000),
    notifications: pushNotification(state, `"${ip.name}" diventa un film/serie TV!`, "success"),
  };
}

function acquireCompany(state: GameState, companyId: string, mode: AcquisitionMode, postChoice: PostAcquisitionChoice | null): GameState {
  const target = state.companies.find((c) => c.id === companyId);
  if (!target) return state;
  const offer = makeOffer(target, mode);
  if (state.money < offer.price) {
    return { ...state, notifications: pushNotification(state, "Budget insufficiente per questa operazione.", "warning") };
  }
  const outcome = resolveAcquisition(offer, target, postChoice);

  const companies = offer.absorbsCompany
    ? state.companies.filter((c) => c.id !== companyId)
    : state.companies.map((c) => (c.id === companyId ? { ...c, relationshipWithPlayer: clamp(c.relationshipWithPlayer + outcome.relationshipDelta, -100, 100) } : c));

  const candidatePool =
    outcome.employeesGained > 0
      ? [...state.candidatePool, ...generateCandidatePool(state.month, Math.min(4, outcome.employeesGained))]
      : state.candidatePool;

  const employees = outcome.moraleShock !== 0 ? state.employees.map((e) => ({ ...e, morale: clamp(e.morale + outcome.moraleShock, 0, 100) })) : state.employees;

  const stats = {
    ...state.stats,
    acquisitionsCompleted: state.stats.acquisitionsCompleted + (offer.absorbsCompany ? 1 : 0),
    hostileTakeovers: state.stats.hostileTakeovers + (mode === "hostile" ? 1 : 0),
    partnerships: state.stats.partnerships + (mode === "partnership" ? 1 : 0),
  };

  const timeline = offer.absorbsCompany
    ? [...state.timeline, { id: createId("timeline"), month: state.month, title: "Acquisizione", description: `${state.studioName} acquisisce ${target.name}.` } as TimelineEntry]
    : state.timeline;

  const news = offer.absorbsCompany ? [...state.news, newsForPlayerAcquisition(state.studioName, target.name, state.month)] : state.news;

  return {
    ...state,
    money: state.money - offer.price,
    companies,
    candidatePool,
    employees,
    stats,
    timeline,
    news: trimNews(news),
    companyValue: state.companyValue + outcome.companyValueGain,
    reputation: clamp(state.reputation + outcome.reputationDelta, 0, 100),
    notifications: pushNotification(
      state,
      offer.absorbsCompany ? `Hai acquisito ${target.name}!` : `Hai stretto un accordo con ${target.name}.`,
      "success"
    ),
  };
}

function resolveEvent(state: GameState, choiceIndex: number | null): GameState {
  const event = state.activeEvent;
  if (!event) return state;

  let money = state.money;
  let employees = state.employees;
  const candidatePool = state.candidatePool;
  let releasedGames = state.releasedGames;
  let genrePopularity = state.genrePopularity;
  let projects = state.projects;
  let reputation = state.reputation;
  let outcome = "Nessun effetto.";

  const log: EventLogEntry = {
    id: createId("log"),
    month: event.month,
    title: event.title,
    description: event.description,
    outcome,
  };

  switch (event.type) {
    case "talentApplies": {
      if (choiceIndex === 0) {
        const pool = generateCandidatePool(state.month, 1);
        const hire: Employee = { ...pool[0], salary: Math.round(pool[0].salary * 0.85), level: Math.max(2, pool[0].level) };
        employees = [...employees, hire];
        outcome = `${hire.name} si è unito al team come ${hire.role}.`;
      } else {
        outcome = "L'offerta è stata rifiutata.";
      }
      break;
    }
    case "criticalBug": {
      const target = projects[0];
      if (target) {
        if (choiceIndex === 0) {
          const cost = 3000;
          money -= cost;
          projects = projects.map((p) => (p.id === target.id ? { ...p, bugs: Math.max(0, p.bugs - 8) } : p));
          outcome = `Bug corretto su "${target.name}" per ${cost}€.`;
        } else {
          projects = projects.map((p) => (p.id === target.id ? { ...p, bugs: p.bugs + 5 } : p));
          outcome = `Il bug resta in "${target.name}": qualità futura a rischio.`;
        }
      }
      break;
    }
    case "viralPositiveReview": {
      releasedGames = releasedGames.map((g) =>
        g.id === event.context?.releasedGameId ? { ...g, hype: clamp(g.hype + 25, 0, 100) } : g
      );
      reputation = clamp(reputation + 4, 0, 100);
      outcome = "Il gioco ha ricevuto un'ondata di nuovo interesse.";
      break;
    }
    case "negativeReview": {
      releasedGames = releasedGames.map((g) =>
        g.id === event.context?.releasedGameId ? { ...g, hype: clamp(g.hype - 15, 0, 100) } : g
      );
      reputation = clamp(reputation - 3, 0, 100);
      outcome = "La reputazione dello studio ne ha risentito.";
      break;
    }
    case "competitorRelease": {
      if (event.context?.genre) {
        genrePopularity = { ...genrePopularity, [event.context.genre]: clamp(genrePopularity[event.context.genre] - 10, 0, 100) };
      }
      outcome = "La concorrenza ha eroso parte dell'interesse del pubblico per questo genere.";
      break;
    }
    case "platformFeeHike": {
      outcome = "Le commissioni più alte ridurranno leggermente i ricavi futuri.";
      break;
    }
    case "suddenTrend": {
      if (event.context?.genre) {
        genrePopularity = { ...genrePopularity, [event.context.genre]: clamp(genrePopularity[event.context.genre] + 15, 0, 100) };
      }
      outcome = "Il genere è ora molto più richiesto dal pubblico.";
      break;
    }
    case "streamerPlay": {
      releasedGames = releasedGames.map((g) =>
        g.id === event.context?.releasedGameId ? { ...g, hype: clamp(g.hype + 20, 0, 100) } : g
      );
      outcome = "Lo streaming ha generato un picco di visibilità.";
      break;
    }
    case "raiseRequest": {
      const emp = employees.find((e) => e.id === event.context?.employeeId);
      if (emp) {
        if (choiceIndex === 0) {
          employees = employees.map((e) => (e.id === emp.id ? { ...e, salary: Math.round(e.salary * 1.15), morale: clamp(e.morale + 15, 0, 100) } : e));
          outcome = `${emp.name} ha ricevuto l'aumento richiesto.`;
        } else {
          employees = employees.map((e) => (e.id === emp.id ? { ...e, morale: clamp(e.morale - 20, 0, 100) } : e));
          outcome = `${emp.name} è rimasto deluso dal rifiuto.`;
        }
      }
      break;
    }
    case "investmentOpportunity": {
      if (choiceIndex === 0) {
        money += 15_000;
        outcome = "Hai accettato l'investimento: +15.000€ immediati (da restituire in futuro con gli interessi).";
      } else {
        outcome = "Hai rifiutato l'investimento.";
      }
      break;
    }
  }

  log.outcome = outcome;

  return {
    ...state,
    money,
    employees,
    candidatePool,
    releasedGames,
    genrePopularity,
    projects,
    reputation,
    activeEvent: null,
    eventLog: [...state.eventLog, log].slice(-50),
    notifications: pushNotification(state, outcome, "info"),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK":
      return runTick(state);

    case "SET_SPEED":
      return { ...state, time: { speed: action.speed } };

    case "START_PROJECT":
      return startProject(state, action.choice, action.allocation, action.employeeIds);

    case "UPDATE_PROJECT_ALLOCATION":
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.projectId ? { ...p, allocation: action.allocation } : p)),
      };

    case "ASSIGN_EMPLOYEE": {
      const maxSize = maxTeamSize(state);
      const project = state.projects.find((p) => p.id === action.projectId);
      if (!project || project.assignedEmployeeIds.length >= maxSize) return state;
      const employees = state.employees.map((e) => (e.id === action.employeeId ? { ...e, assignedProjectId: action.projectId } : e));
      const projects = state.projects.map((p) =>
        p.id === action.projectId ? { ...p, assignedEmployeeIds: [...p.assignedEmployeeIds, action.employeeId] } : p
      );
      return { ...state, employees, projects };
    }

    case "UNASSIGN_EMPLOYEE": {
      const employees = state.employees.map((e) => (e.id === action.employeeId ? { ...e, assignedProjectId: null } : e));
      const projects = state.projects.map((p) => ({
        ...p,
        assignedEmployeeIds: p.assignedEmployeeIds.filter((id) => id !== action.employeeId),
      }));
      return { ...state, employees, projects };
    }

    case "PUBLISH_PROJECT":
      return publishProject(state, action.projectId, action.price);

    case "HIRE_EMPLOYEE": {
      const candidate = state.candidatePool.find((c) => c.id === action.candidateId);
      if (!candidate || state.employees.length >= maxTeamSize(state)) return state;
      return {
        ...state,
        employees: [...state.employees, candidate],
        candidatePool: state.candidatePool.filter((c) => c.id !== action.candidateId),
        notifications: pushNotification(state, `${candidate.name} è stato assunto come ${candidate.role}.`, "success"),
      };
    }

    case "FIRE_EMPLOYEE": {
      const emp = state.employees.find((e) => e.id === action.employeeId);
      if (!emp) return state;
      const cost = fireCost(emp);
      if (state.money < cost) return state;
      const employees = state.employees
        .filter((e) => e.id !== action.employeeId)
        .map((e) => (e.morale ? { ...e, morale: clamp(e.morale - 5, 0, 100) } : e));
      const projects = state.projects.map((p) => ({
        ...p,
        assignedEmployeeIds: p.assignedEmployeeIds.filter((id) => id !== action.employeeId),
      }));
      return {
        ...state,
        money: state.money - cost,
        employees,
        projects,
        notifications: pushNotification(state, `${emp.name} è stato licenziato (costo di buonuscita: ${cost}€).`, "warning"),
      };
    }

    case "PROMOTE_EMPLOYEE": {
      const emp = state.employees.find((e) => e.id === action.employeeId);
      if (!emp || emp.level >= 5) return state;
      const cost = promotionCost(emp);
      if (state.money < cost) return state;
      return {
        ...state,
        money: state.money - cost,
        employees: state.employees.map((e) => (e.id === action.employeeId ? promoteEmployee(e) : e)),
        notifications: pushNotification(state, `${emp.name} è stato promosso al livello ${emp.level + 1}.`, "success"),
      };
    }

    case "TRAIN_EMPLOYEE": {
      const emp = state.employees.find((e) => e.id === action.employeeId);
      if (!emp || state.money < TRAINING_COST) return state;
      return {
        ...state,
        money: state.money - TRAINING_COST,
        employees: state.employees.map((e) => (e.id === action.employeeId ? trainEmployee(e) : e)),
        notifications: pushNotification(state, `${emp.name} ha completato un corso di formazione.`, "info"),
      };
    }

    case "REFRESH_CANDIDATES":
      return { ...state, candidatePool: generateCandidatePool(state.month) };

    case "START_RESEARCH": {
      if (!canStartResearch(action.techId, state.research, state.money, state.month)) return state;
      const cost = researchCost(action.techId);
      const rndLabBonus = clamp(officeLevel(state, "rndLab") * 0.15, 0, 0.45);
      return {
        ...state,
        money: state.money - cost,
        research: startResearch(state.research, action.techId, rndLabBonus),
        notifications: pushNotification(state, "Hai avviato una nuova ricerca tecnologica.", "info"),
      };
    }

    case "UPGRADE_OFFICE": {
      const upgrade = state.officeUpgrades.find((u) => u.id === action.upgradeId);
      if (!upgrade || upgrade.level >= upgrade.maxLevel) return state;
      const cost = upgrade.costForNextLevel[upgrade.level];
      if (state.money < cost) return state;
      return {
        ...state,
        money: state.money - cost,
        officeUpgrades: state.officeUpgrades.map((u) => (u.id === action.upgradeId ? { ...u, level: u.level + 1 } : u)),
        notifications: pushNotification(state, `${upgrade.name} potenziato al livello ${upgrade.level + 1}.`, "success"),
      };
    }

    case "SET_MARKETING_BUDGET":
      return { ...state, marketingBudget: Math.max(0, action.amount) };

    case "APPLY_DISCOUNT":
      return {
        ...state,
        releasedGames: state.releasedGames.map((g) => (g.id === action.gameId ? { ...g, onSaleDiscount: action.discount } : g)),
      };

    case "RELEASE_UPDATE": {
      const game = state.releasedGames.find((g) => g.id === action.gameId);
      if (!game || state.money < UPDATE_COST) return state;
      return {
        ...state,
        money: state.money - UPDATE_COST,
        releasedGames: state.releasedGames.map((g) =>
          g.id === action.gameId ? { ...g, bugs: Math.max(0, g.bugs - 10), hype: clamp(g.hype + 8, 0, 100) } : g
        ),
        notifications: pushNotification(state, `Hai pubblicato un aggiornamento per "${game.name}": meno bug, più hype.`, "success"),
      };
    }

    case "RELEASE_DLC": {
      const game = state.releasedGames.find((g) => g.id === action.gameId);
      if (!game || state.money < DLC_COST) return state;
      const revenue = dlcRevenue(game, DLC_PRICE);
      const ip = findIpForGame(state, action.gameId);
      const ips = ip ? updateIp(state, ip.id, (cur) => addFranchiseEntry(cur, "DLC", action.gameId, state.month)) : state.ips;
      return {
        ...state,
        money: state.money - DLC_COST + revenue,
        ips,
        releasedGames: state.releasedGames.map((g) =>
          g.id === action.gameId
            ? { ...g, dlcCount: g.dlcCount + 1, hype: clamp(g.hype + 10, 0, 100), totalRevenue: g.totalRevenue + revenue }
            : g
        ),
        notifications: pushNotification(state, `DLC pubblicato per "${game.name}": +${revenue}€.`, "success"),
      };
    }

    case "PORT_GAME": {
      const game = state.releasedGames.find((g) => g.id === action.gameId);
      if (!game || state.money < PORT_COST || game.platforms.includes(action.platform)) return state;
      const requiredTech = PLATFORM_TECH_REQUIREMENT[action.platform];
      if (requiredTech && !state.research.unlocked.includes(requiredTech)) return state;
      const units = portLaunchUnits(game, action.platform);
      const revenue = Math.round(units * game.price * 0.7);
      const ip = findIpForGame(state, action.gameId);
      const ips =
        ip && action.platform === "Mobile" ? updateIp(state, ip.id, (cur) => addFranchiseEntry(cur, "Mobile", action.gameId, state.month)) : state.ips;
      return {
        ...state,
        money: state.money - PORT_COST + revenue,
        ips,
        releasedGames: state.releasedGames.map((g) =>
          g.id === action.gameId
            ? {
                ...g,
                platforms: [...g.platforms, action.platform],
                portedPlatforms: [...g.portedPlatforms, action.platform],
                totalUnitsSold: g.totalUnitsSold + units,
                totalRevenue: g.totalRevenue + revenue,
              }
            : g
        ),
        notifications: pushNotification(state, `"${game.name}" è stato portato su ${action.platform}.`, "success"),
      };
    }

    case "MAKE_SEQUEL":
      return addFranchiseAction(state, action.gameId, "Sequel");

    case "MAKE_SPINOFF":
      return addFranchiseAction(state, action.gameId, "SpinOff");

    case "MAKE_REMASTER":
      return remasterOrRemake(state, action.gameId, "Remaster");

    case "MAKE_REMAKE":
      return remasterOrRemake(state, action.gameId, "Remake");

    case "PRODUCE_FILM":
      return produceFilm(state, action.ipId);

    case "ACQUIRE_COMPANY":
      return acquireCompany(state, action.companyId, action.mode, action.postChoice);

    case "GO_PUBLIC": {
      if (!canGoPublic(state.companyValue) || state.stockMarket.playerIsPublic) return state;
      const { sharePrice, sharesOutstanding } = goPublic(state.companyValue);
      return {
        ...state,
        stockMarket: { ...state.stockMarket, playerIsPublic: true, playerSharePrice: sharePrice, playerSharesOutstanding: sharesOutstanding },
        notifications: pushNotification(state, `${state.studioName} è ora quotata in borsa!`, "success"),
      };
    }

    case "BUY_SHARES": {
      const company = state.companies.find((c) => c.id === action.companyId);
      if (!company || !company.isPublic) return state;
      const cost = Math.round(company.sharePrice * action.shares);
      if (cost <= 0 || state.money < cost) return state;
      return {
        ...state,
        money: state.money - cost,
        stockMarket: buyShares(state.stockMarket, action.companyId, action.shares, company.sharePrice),
        notifications: pushNotification(state, `Hai acquistato ${action.shares} azioni di ${company.name}.`, "success"),
      };
    }

    case "SELL_SHARES": {
      const company = state.companies.find((c) => c.id === action.companyId);
      const { market, proceedsShares } = sellShares(state.stockMarket, action.companyId, action.shares);
      if (proceedsShares === 0) return state;
      const proceeds = Math.round((company?.sharePrice ?? 0) * proceedsShares);
      return {
        ...state,
        money: state.money + proceeds,
        stockMarket: market,
        notifications: pushNotification(state, `Hai venduto ${proceedsShares} azioni per ${proceeds}€.`, "info"),
      };
    }

    case "RESOLVE_AWARD_CEREMONY":
      return { ...state, pendingAwardCeremonyId: null };

    case "RESOLVE_EVENT":
      return resolveEvent(state, action.choiceIndex);

    case "DISMISS_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };

    case "LOAD_STATE":
      return action.state;

    case "NEW_GAME":
      return createNewGameState(action.studioName, { mode: action.mode, difficulty: action.difficulty, challengeId: action.challengeId });

    case "SET_ACTIVE_SLOT":
      return { ...state, activeSlot: action.slot };

    case "START_TUTORIAL":
      return { ...state, tutorialStep: 0 };

    case "ADVANCE_TUTORIAL":
      return { ...state, tutorialStep: state.tutorialStep != null ? state.tutorialStep + 1 : null };

    case "SKIP_TUTORIAL":
      return { ...state, tutorialStep: null };

    case "CLEAR_GAME":
      return createNewGameState(state.studioName, { mode: state.mode, difficulty: state.difficulty });

    default:
      return state;
  }
}
