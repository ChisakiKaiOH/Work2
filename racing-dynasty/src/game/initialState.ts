import type { PlayerState, TeamDef, DriverDef, CalendarEntry, ChampionshipProgress } from '../types';
import { AI_TEAMS, DRIVERS, CALENDAR_1970, CHAMPIONSHIPS } from '../data';
import { generateUsedCarMarket, generateDriverOffers } from '../services/market';
import { hashSeed, mulberry32 } from '../sim/rng';

export const SAVE_VERSION = 1;
export const STARTING_BUDGET = 520_000;

export function createNewCareer(teamName: string, ownerName: string): PlayerState {
  const startDate = { year: 1970, month: 1, day: 1 };

  const playerTeam: TeamDef = {
    id: 'team_player',
    displayName: teamName || 'La mia scuderia',
    ownerName: ownerName || 'Team Owner',
    founded: 1970,
    isPlayer: true,
    reputation: 30,
    budget: STARTING_BUDGET,
    carInstanceIds: [],
    driverIds: [],
    active: true,
  };

  const teams: Record<string, TeamDef> = { [playerTeam.id]: playerTeam };
  for (const t of AI_TEAMS) teams[t.id] = { ...t };

  const drivers: Record<string, DriverDef> = Object.fromEntries(DRIVERS.map(d => [d.id, { ...d }]));

  const calendar: CalendarEntry[] = CALENDAR_1970.map(e => ({ ...e }));
  const firstEntryId = calendar[0]?.id ?? '';

  const rng = mulberry32(hashSeed(`career_${Date.now()}`));
  const usedCarMarket = generateUsedCarMarket(rng, firstEntryId);
  const driverOffers = generateDriverOffers(rng, Object.values(drivers), firstEntryId);

  const championshipProgress: Record<string, ChampionshipProgress> = {};
  for (const champ of CHAMPIONSHIPS) {
    championshipProgress[champ.id] = { championshipId: champ.id, racesCompleted: 0, driverStandings: {}, teamStandings: {} };
  }

  return {
    saveVersion: SAVE_VERSION,
    currentDate: startDate,
    playerTeamId: playerTeam.id,
    teams,
    cars: {},
    drivers,
    selectedCarInstanceId: null,
    selectedDriverId: null,
    calendar,
    currentEntryIndex: 0,
    championships: Object.fromEntries(CHAMPIONSHIPS.map(c => [c.id, c])),
    championshipProgress,
    usedCarMarket,
    driverOffers,
    marketGeneratedAtEntryId: firstEntryId,
    activeAuction: null,
    finance: { ledger: [{ date: startDate, label: 'Fondi iniziali', amount: STARTING_BUDGET }] },
    seasonHistory: [],
    achievementsUnlocked: [],
    notifications: [],
    settings: { musicOn: true, soundOn: true, notificationsOn: true, language: 'it' },
  };
}
