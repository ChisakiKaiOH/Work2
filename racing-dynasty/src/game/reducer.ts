import type { PlayerState, CalendarEntry, SeasonRecord, DriverDef } from '../types';
import type { GameAction } from './actions';
import { createNewCareer } from './initialState';
import { canAfford, applyTransaction } from '../services/finance';
import { hireDriver, rentDriverForOneEvent, releaseDriver, tickDriverContract } from '../services/contracts';
import { createCarInstance } from '../services/cars';
import { generateUsedCarMarket, generateDriverOffers } from '../services/market';
import { startAuction, placePlayerBid, resolveRivalRound, closeAuction, minimumNextBid } from '../services/auctions';
import { CAR_BY_ID, AUCTION_BY_ID } from '../data';
import { hashSeed, mulberry32 } from '../sim/rng';

function currentEntry(state: PlayerState): CalendarEntry | null {
  return state.calendar[state.currentEntryIndex] ?? null;
}

/** Runs the auto side-effects for whichever entry just became "current" (market refresh, auction start). */
function initializeEnteredEntry(state: PlayerState): PlayerState {
  const entry = currentEntry(state);
  if (!entry) return state;
  let next = state;

  if (entry.type === 'MARKET' && state.marketGeneratedAtEntryId !== entry.id) {
    const rng = mulberry32(hashSeed(`market_${entry.id}`));
    next = {
      ...next,
      usedCarMarket: generateUsedCarMarket(rng, entry.id),
      driverOffers: generateDriverOffers(rng, Object.values(next.drivers), entry.id),
      marketGeneratedAtEntryId: entry.id,
    };
  }

  if (entry.type === 'AUCTION' && entry.auctionId && !next.activeAuction) {
    const def = AUCTION_BY_ID[entry.auctionId];
    if (def) next = { ...next, activeAuction: startAuction(def) };
  }

  return { ...next, currentDate: entry.date };
}

function completeCurrentAndAdvance(state: PlayerState): PlayerState {
  const entry = currentEntry(state);
  if (!entry) return state;
  const calendar = state.calendar.map(e => (e.id === entry.id ? { ...e, completed: true } : e));
  const advanced = { ...state, calendar, currentEntryIndex: state.currentEntryIndex + 1 };
  return initializeEnteredEntry(advanced);
}

function returnExpiredRentals(state: PlayerState, completedEntryId: string): PlayerState {
  const team = state.teams[state.playerTeamId];
  const stillHeld: string[] = [];
  const cars = { ...state.cars };
  for (const instanceId of team.carInstanceIds) {
    const instance = cars[instanceId];
    if (instance && instance.ownership === 'rented' && instance.rentalReturnsAtEntryId === completedEntryId) {
      delete cars[instanceId];
    } else {
      stillHeld.push(instanceId);
    }
  }
  const selectedCarInstanceId = stillHeld.includes(state.selectedCarInstanceId ?? '') ? state.selectedCarInstanceId : null;
  return {
    ...state,
    cars,
    teams: { ...state.teams, [team.id]: { ...team, carInstanceIds: stillHeld } },
    selectedCarInstanceId,
  };
}

export function gameReducer(state: PlayerState | null, action: GameAction): PlayerState | null {
  switch (action.type) {
    case 'NEW_CAREER':
      return initializeEnteredEntry(createNewCareer(action.teamName, action.ownerName));
    case 'LOAD_SAVE':
      return action.player;
    case 'RESET_SAVE':
      return null;
    default:
      break;
  }

  if (!state) return state;

  switch (action.type) {
    case 'ADVANCE_TIME': {
      const entry = currentEntry(state);
      if (!entry || entry.type === 'RACE') return state;

      let next = state;
      const team = next.teams[next.playerTeamId];

      if (entry.type === 'TEST' && next.selectedDriverId) {
        const driver = next.drivers[next.selectedDriverId];
        if (driver) {
          const grown: DriverDef = {
            ...driver,
            experience: Math.min(100, driver.experience + 2),
            rating: Math.min(driver.potential, driver.rating + 1),
          };
          const testCost = 8000;
          const canPay = canAfford(team.budget, testCost);
          const { team: billedTeam, ledger } = canPay
            ? applyTransaction(team, next.finance.ledger, next.currentDate, 'Sessione di test privata', -testCost)
            : { team, ledger: next.finance.ledger };
          next = {
            ...next,
            drivers: { ...next.drivers, [driver.id]: grown },
            teams: { ...next.teams, [team.id]: billedTeam },
            finance: { ledger },
          };
        }
      }

      if (entry.type === 'SEASON_END') {
        const progressValues = Object.values(next.championshipProgress);
        const playerDriverStanding = progressValues[0]?.driverStandings[next.selectedDriverId ?? ''] ?? null;
        const record: SeasonRecord = {
          year: entry.date.year,
          championshipId: progressValues[0]?.championshipId ?? '',
          teamStanding: 1,
          driverStanding: 1,
          wins: playerDriverStanding?.wins ?? 0,
          podiums: playerDriverStanding?.podiums ?? 0,
          moneyEarned: next.finance.ledger.filter(l => l.date.year === entry.date.year && l.amount > 0).reduce((s, l) => s + l.amount, 0),
        };
        next = { ...next, seasonHistory: [...next.seasonHistory, record] };
      }

      return completeCurrentAndAdvance(next);
    }

    case 'BUY_CAR': {
      const listing = state.usedCarMarket.find(l => l.id === action.listingId);
      const team = state.teams[state.playerTeamId];
      if (!listing || !canAfford(team.budget, listing.price)) return state;
      const def = CAR_BY_ID[listing.defId];
      if (!def) return state;
      const instance = createCarInstance(listing.defId, state.currentDate, 'owned');
      instance.condition = listing.condition;
      const { team: billedTeam, ledger } = applyTransaction(team, state.finance.ledger, state.currentDate, `Acquisto ${def.displayName}`, -listing.price);
      return {
        ...state,
        cars: { ...state.cars, [instance.instanceId]: instance },
        teams: { ...state.teams, [team.id]: { ...billedTeam, carInstanceIds: [...billedTeam.carInstanceIds, instance.instanceId] } },
        usedCarMarket: state.usedCarMarket.filter(l => l.id !== action.listingId),
        finance: { ledger },
      };
    }

    case 'RENT_CAR': {
      const def = CAR_BY_ID[action.defId];
      const team = state.teams[state.playerTeamId];
      if (!def) return state;
      const price = action.durationEvents === 3 ? Math.round(def.rentPricePerEvent * 3 * 0.9) : def.rentPricePerEvent;
      if (!canAfford(team.budget, price)) return state;

      const raceEntries = state.calendar.slice(state.currentEntryIndex).filter(e => e.type === 'RACE');
      const returnEntry = raceEntries[action.durationEvents - 1] ?? state.calendar[state.calendar.length - 1];
      const instance = createCarInstance(action.defId, state.currentDate, 'rented', returnEntry?.id);

      const { team: billedTeam, ledger } = applyTransaction(team, state.finance.ledger, state.currentDate, `Noleggio ${def.displayName}`, -price);
      return {
        ...state,
        cars: { ...state.cars, [instance.instanceId]: instance },
        teams: { ...state.teams, [team.id]: { ...billedTeam, carInstanceIds: [...billedTeam.carInstanceIds, instance.instanceId] } },
        finance: { ledger },
      };
    }

    case 'SELL_CAR': {
      const instance = state.cars[action.instanceId];
      const team = state.teams[state.playerTeamId];
      if (!instance || instance.ownership !== 'owned' || !team.carInstanceIds.includes(action.instanceId)) return state;
      const def = CAR_BY_ID[instance.defId];
      if (!def) return state;
      const saleValue = Math.round(def.baseValue * (instance.condition / 100) * 0.7);
      const { team: billedTeam, ledger } = applyTransaction(team, state.finance.ledger, state.currentDate, `Vendita ${def.displayName}`, saleValue);
      const cars = { ...state.cars };
      delete cars[action.instanceId];
      return {
        ...state,
        cars,
        teams: { ...state.teams, [team.id]: { ...billedTeam, carInstanceIds: billedTeam.carInstanceIds.filter(id => id !== action.instanceId) } },
        selectedCarInstanceId: state.selectedCarInstanceId === action.instanceId ? null : state.selectedCarInstanceId,
        finance: { ledger },
      };
    }

    case 'HIRE_DRIVER': {
      const driver = state.drivers[action.driverId];
      if (!driver || driver.status !== 'free_agent') return state;
      const hired = hireDriver(driver, state.playerTeamId, state.currentDate, action.durationEvents, action.salaryPerEvent);
      const team = state.teams[state.playerTeamId];
      return {
        ...state,
        drivers: { ...state.drivers, [driver.id]: hired },
        teams: { ...state.teams, [team.id]: { ...team, driverIds: [...team.driverIds, driver.id] } },
      };
    }

    case 'RENT_DRIVER': {
      const driver = state.drivers[action.driverId];
      const team = state.teams[state.playerTeamId];
      if (!driver || driver.status !== 'free_agent' || !canAfford(team.budget, driver.rentPricePerEvent)) return state;
      const rented = rentDriverForOneEvent(driver, state.playerTeamId, state.currentDate);
      const { team: billedTeam, ledger } = applyTransaction(team, state.finance.ledger, state.currentDate, `Noleggio pilota ${driver.displayName}`, -driver.rentPricePerEvent);
      return {
        ...state,
        drivers: { ...state.drivers, [driver.id]: rented },
        teams: { ...state.teams, [team.id]: { ...billedTeam, driverIds: [...billedTeam.driverIds, driver.id] } },
        finance: { ledger },
      };
    }

    case 'RELEASE_DRIVER': {
      const driver = state.drivers[action.driverId];
      const team = state.teams[state.playerTeamId];
      if (!driver || driver.teamId !== state.playerTeamId) return state;
      const released = releaseDriver(driver);
      return {
        ...state,
        drivers: { ...state.drivers, [driver.id]: released },
        teams: { ...state.teams, [team.id]: { ...team, driverIds: team.driverIds.filter(id => id !== action.driverId) } },
        selectedDriverId: state.selectedDriverId === action.driverId ? null : state.selectedDriverId,
      };
    }

    case 'SELECT_RACE_CAR': {
      const team = state.teams[state.playerTeamId];
      if (!team.carInstanceIds.includes(action.instanceId)) return state;
      return { ...state, selectedCarInstanceId: action.instanceId };
    }

    case 'SELECT_RACE_DRIVER': {
      const team = state.teams[state.playerTeamId];
      if (!team.driverIds.includes(action.driverId)) return state;
      return { ...state, selectedDriverId: action.driverId };
    }

    case 'AUCTION_BID': {
      const auction = state.activeAuction;
      const team = state.teams[state.playerTeamId];
      if (!auction || auction.status !== 'open') return state;
      const amount = minimumNextBid(auction);
      if (!canAfford(team.budget, amount)) return state;

      let updated = placePlayerBid(auction, amount);
      const rivals = Object.values(state.teams).filter(t => !t.isPlayer && t.active);
      const rng = mulberry32(hashSeed(`auction_${auction.id}_${updated.rounds}`));
      updated = resolveRivalRound(updated, rivals, rng);

      if (updated.rounds >= updated.maxRounds) {
        return resolveAuctionClose(state, closeAuction(updated));
      }
      return { ...state, activeAuction: updated };
    }

    case 'AUCTION_PASS': {
      const auction = state.activeAuction;
      if (!auction) return state;
      return resolveAuctionClose(state, closeAuction(auction));
    }

    case 'APPLY_RACE_RESULT': {
      const { result } = action;
      const entry = currentEntry(state);
      if (!entry || entry.type !== 'RACE' || !state.selectedDriverId) return state;

      let team = state.teams[state.playerTeamId];
      let ledger = state.finance.ledger;
      let drivers = { ...state.drivers };

      for (const driverId of team.driverIds) {
        const driver = drivers[driverId];
        if (driver.status === 'contracted' && driver.contract) {
          const billed = applyTransaction(team, ledger, state.currentDate, `Stipendio ${driver.displayName}`, -driver.contract.salaryPerEvent);
          team = billed.team;
          ledger = billed.ledger;
          drivers[driverId] = tickDriverContract(driver);
        }
      }

      const prizeResult = applyTransaction(team, ledger, state.currentDate, `Montepremi — ${entry.title}`, result.prizeMoney);
      team = prizeResult.team;
      ledger = prizeResult.ledger;
      team = { ...team, reputation: Math.max(0, Math.min(100, team.reputation + result.reputationGained)) };

      const racer = drivers[state.selectedDriverId];
      if (racer) {
        const podium = !result.playerDnf && result.playerPosition <= 3;
        drivers[racer.id] = {
          ...racer,
          experience: Math.min(100, racer.experience + result.driverExperienceGained),
          rating: Math.min(racer.potential, racer.rating + (podium ? 1 : 0)),
          form: Math.max(-20, Math.min(20, racer.form + (result.playerDnf ? -6 : podium ? 5 : result.playerPosition <= 6 ? 1 : -2))),
        };
      }

      let championshipProgress = state.championshipProgress;
      if (result.championshipId) {
        const progress = championshipProgress[result.championshipId];
        if (progress) {
          const driverEntry = progress.driverStandings[state.selectedDriverId] ?? { entrantId: state.selectedDriverId, points: 0, wins: 0, podiums: 0 };
          const teamEntry = progress.teamStandings[state.playerTeamId] ?? { entrantId: state.playerTeamId, points: 0, wins: 0, podiums: 0 };
          const won = !result.playerDnf && result.playerPosition === 1;
          const podium = !result.playerDnf && result.playerPosition <= 3;
          const standings = result.standings.find(s => s.isPlayer);
          const points = standings?.points ?? 0;
          championshipProgress = {
            ...championshipProgress,
            [result.championshipId]: {
              ...progress,
              racesCompleted: progress.racesCompleted + 1,
              driverStandings: { ...progress.driverStandings, [state.selectedDriverId]: { ...driverEntry, points: driverEntry.points + points, wins: driverEntry.wins + (won ? 1 : 0), podiums: driverEntry.podiums + (podium ? 1 : 0) } },
              teamStandings: { ...progress.teamStandings, [state.playerTeamId]: { ...teamEntry, points: teamEntry.points + points, wins: teamEntry.wins + (won ? 1 : 0), podiums: teamEntry.podiums + (podium ? 1 : 0) } },
            },
          };
        }
      }

      const notification = {
        id: `notif_${entry.id}`,
        date: state.currentDate,
        title: result.playerDnf ? 'Ritiro in gara' : `Arrivo in ${result.playerPosition}ª posizione`,
        body: `${entry.title}: ${result.playerDnf ? 'ritiro per guasto meccanico' : `posizione ${result.playerPosition}`}, montepremi ${result.prizeMoney.toLocaleString('it-IT')} crediti.`,
        read: false,
      };

      let next: PlayerState = {
        ...state,
        teams: { ...state.teams, [team.id]: team },
        drivers,
        finance: { ledger },
        championshipProgress,
        notifications: [...state.notifications, notification],
      };

      next = completeCurrentAndAdvance(next);
      next = returnExpiredRentals(next, entry.id);
      return next;
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };

    default:
      return state;
  }
}

function resolveAuctionClose(state: PlayerState, auction: ReturnType<typeof closeAuction>): PlayerState {
  if (auction.status !== 'won_by_player') {
    return completeCurrentAndAdvance({ ...state, activeAuction: null });
  }
  const team = state.teams[state.playerTeamId];
  const instance = createCarInstance(auction.carDefId, state.currentDate, 'owned');
  const def = CAR_BY_ID[auction.carDefId];
  const { team: billedTeam, ledger } = applyTransaction(team, state.finance.ledger, state.currentDate, `Asta vinta — ${def?.displayName ?? auction.carDefId}`, -auction.currentBid.amount);
  const next: PlayerState = {
    ...state,
    activeAuction: null,
    cars: { ...state.cars, [instance.instanceId]: instance },
    teams: { ...state.teams, [team.id]: { ...billedTeam, carInstanceIds: [...billedTeam.carInstanceIds, instance.instanceId] } },
    finance: { ledger },
  };
  return completeCurrentAndAdvance(next);
}
