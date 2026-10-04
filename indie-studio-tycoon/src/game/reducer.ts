import type {
  ActiveEvent,
  Allocation,
  Employee,
  EventLogEntry,
  GameState,
  Notification,
  OfficeUpgrade,
  Project,
  ReleasedGame,
} from "../types";
import type { GameAction } from "./actions";
import { createNewGameState } from "./initialState";
import { createId } from "../utils/id";
import { clamp } from "../utils/format";
import { GENRES } from "../data/genres";
import {
  advanceDevelopment,
  compositeQualityScore,
  type OfficeMultipliers,
} from "../systems/development";
import { computeMonthlyLedger, BANKRUPTCY_GRACE_MONTHS } from "../systems/economy";
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

// --- TICK: avanza di un mese tutta la simulazione --------------------------

function runTick(state: GameState): GameState {
  if (state.gameOver) return state;

  const office = officeMultipliers(state);
  const techMult = techQualityMultipliers(state.research.unlocked);
  let notifications = state.notifications;

  // 1. Sviluppo progetti attivi
  const projects: Project[] = [];
  for (const project of state.projects) {
    const { project: advanced } = advanceDevelopment(project, state.employees, office, techMult);
    if (advanced.completed) {
      notifications = pushNotification(
        state,
        `"${advanced.name}" ha completato lo sviluppo: ora puoi pubblicarlo dalla scheda Libreria giochi.`,
        "success"
      );
      projects.push(advanced);
    } else {
      projects.push(advanced);
    }
  }

  // 2. Dipendenti: drift morale/esperienza, libera assegnazione se progetto pubblicato
  const activeProjectIds = new Set(projects.filter((p) => !p.completed).map((p) => p.id));
  const employees: Employee[] = state.employees.map((emp) => {
    const stillAssigned = emp.assignedProjectId && activeProjectIds.has(emp.assignedProjectId);
    const drifted = monthlyEmployeeDrift(emp, office.moraleRegen);
    return { ...drifted, assignedProjectId: stillAssigned ? emp.assignedProjectId : null };
  });

  // 3. Vendite dei giochi pubblicati
  let salesRevenue = 0;
  const releasedGames: ReleasedGame[] = state.releasedGames.map((game) => {
    if (game.status === "legacy" && state.month - game.releaseMonth > 1) return game;
    const marketingBoost = marketingBoostFor(state);
    const feeHike = 0;
    const step = monthlySalesStep(game, state.month, feeHike, marketingBoost);
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

  // 4. Ricerca
  const researchResult = advanceResearch(state.research);
  let research = researchResult.research;
  if (researchResult.completedTechId) {
    notifications = pushNotification(state, `Ricerca completata: nuova tecnologia disponibile.`, "success");
  }

  // 5. Economia
  const ledger = computeMonthlyLedger({
    employees,
    officeUpgrades: state.officeUpgrades,
    marketingSpend: state.marketingBudget,
    researchSpend: 0,
    salesRevenue,
  });
  let money = state.money + ledger.profit;

  // 6. Reputazione: deriva lentamente verso la media qualità/vendite recenti
  let reputation = state.reputation;
  if (releasedGames.length > 0) {
    const avgScore = releasedGames.reduce((s, g) => s + g.criticScore, 0) / releasedGames.length;
    reputation = clamp(reputation + (avgScore - 5.5) * 0.4, 0, 100);
  }

  // 7. Fallimento
  let negativeMonthsStreak = state.negativeMonthsStreak;
  let gameOver: boolean = state.gameOver;
  if (money <= 0) {
    negativeMonthsStreak += 1;
    if (negativeMonthsStreak === 1) {
      notifications = pushNotification(
        state,
        `Attenzione: il conto è a zero. Hai ${BANKRUPTCY_GRACE_MONTHS} mesi per recuperare prima della chiusura dello studio.`,
        "danger"
      );
    }
    if (negativeMonthsStreak > BANKRUPTCY_GRACE_MONTHS) {
      gameOver = true;
      notifications = pushNotification(state, `Lo studio ha chiuso i battenti per bancarotta.`, "danger");
    }
  } else {
    negativeMonthsStreak = 0;
  }

  const month = state.month + 1;

  // 8. Evento casuale: solo gli eventi con una scelta reale mettono in pausa
  // il gioco con un popup bloccante. Gli eventi puramente informativi (una
  // recensione virale, un trend di mercato, ...) si applicano subito e
  // compaiono come notifica, così da non interrompere il giocatore ogni
  // pochi mesi per un semplice "Ok".
  let activeEvent: ActiveEvent | null = state.activeEvent;
  let autoResolvedEvent: ActiveEvent | null = null;
  if (!activeEvent && Math.random() < EVENT_CHANCE_PER_MONTH) {
    const def = pickEventDefinition({ employees, releasedGames, genres: GENRES });
    if (def) {
      const built = buildActiveEvent(def, month, { employees, releasedGames, genres: GENRES });
      if (def.hasChoices) {
        activeEvent = built;
      } else {
        autoResolvedEvent = built;
      }
    }
  }

  const stats = {
    ...state.stats,
    totalRevenue: state.stats.totalRevenue + ledger.totalIncome,
    totalExpenses: state.stats.totalExpenses + ledger.totalExpenses,
    totalUnitsSold: releasedGames.reduce((s, g) => s + g.totalUnitsSold, 0),
  };

  const next: GameState = {
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
  };

  return autoResolvedEvent ? resolveEvent({ ...next, activeEvent: autoResolvedEvent }, null) : next;
}

// --- Azioni singole ----------------------------------------------------------

function startProject(state: GameState, choice: NewProjectChoice, allocation: Allocation, employeeIds: string[]): GameState {
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

  const bestSellingGameId = state.stats.bestSellingGameId;
  const stats = {
    ...state.stats,
    totalGamesReleased: state.stats.totalGamesReleased + 1,
    bestSellingGameId,
  };

  return {
    ...state,
    projects: state.projects.filter((p) => p.id !== projectId),
    releasedGames: [...state.releasedGames, released],
    employees,
    stats,
    notifications: pushNotification(state, `"${project.name}" è stato pubblicato! Voto della critica: ${criticScore}/10.`, "success"),
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
      if (!canStartResearch(action.techId, state.research, state.money)) return state;
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
      return {
        ...state,
        money: state.money - DLC_COST + revenue,
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
      const units = portLaunchUnits(game, action.platform);
      const revenue = Math.round(units * game.price * 0.7);
      return {
        ...state,
        money: state.money - PORT_COST + revenue,
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

    case "MAKE_SEQUEL": {
      const game = state.releasedGames.find((g) => g.id === action.gameId);
      if (!game) return state;
      const choice: NewProjectChoice = { genre: game.genre, platforms: game.platforms, size: game.size, theme: game.theme };
      const estimate = estimateProject(choice, {
        teamSize: 0,
        unlockedTechIds: state.research.unlocked,
        genrePopularity: state.genrePopularity[game.genre],
      });
      if (state.money < estimate.cost) {
        return { ...state, notifications: pushNotification(state, "Budget insufficiente per avviare il sequel.", "warning") };
      }
      const project = createProject(choice, { ...game.quality }, estimate, [], state.month);
      project.hype = sequelHypeSeed(game);
      project.name = `${game.name} II`;
      return {
        ...state,
        money: state.money - estimate.cost,
        projects: [...state.projects, project],
        releasedGames: state.releasedGames.map((g) => (g.id === action.gameId ? { ...g, hasSequel: true } : g)),
        notifications: pushNotification(state, `Hai avviato lo sviluppo di "${project.name}".`, "info"),
      };
    }

    case "RESOLVE_EVENT":
      return resolveEvent(state, action.choiceIndex);

    case "DISMISS_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };

    case "LOAD_STATE":
      return action.state;

    case "NEW_GAME":
      return createNewGameState(action.studioName);

    case "SET_ACTIVE_SLOT":
      return { ...state, activeSlot: action.slot };

    case "START_TUTORIAL":
      return { ...state, tutorialStep: 0 };

    case "ADVANCE_TUTORIAL":
      return { ...state, tutorialStep: state.tutorialStep != null ? state.tutorialStep + 1 : null };

    case "SKIP_TUTORIAL":
      return { ...state, tutorialStep: null };

    case "CLEAR_GAME":
      return createNewGameState(state.studioName);

    default:
      return state;
  }
}
