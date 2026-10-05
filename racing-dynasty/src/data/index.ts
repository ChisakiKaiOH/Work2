import type {
  ManufacturerDef, CarDef, DriverDef, TrackDef, ChampionshipDef, TeamDef, CalendarEntry, AuctionDef,
} from '../types';

import manufacturersJson from './manufacturers.json';
import carsJson from './cars.json';
import driversJson from './drivers.json';
import tracksJson from './tracks.json';
import championshipsJson from './championships.json';
import teamsJson from './teams.json';
import calendar1970Json from './calendar_1970.json';
import auctionsJson from './auctions.json';

export const MANUFACTURERS = manufacturersJson as ManufacturerDef[];
export const CARS = carsJson as CarDef[];
export const DRIVERS = driversJson as DriverDef[];
export const TRACKS = tracksJson as TrackDef[];
export const CHAMPIONSHIPS = championshipsJson as unknown as ChampionshipDef[];
export const AI_TEAMS = teamsJson as TeamDef[];
export const CALENDAR_1970 = calendar1970Json as unknown as CalendarEntry[];
export const AUCTIONS = auctionsJson as AuctionDef[];

export const MANUFACTURER_BY_ID: Record<string, ManufacturerDef> = Object.fromEntries(MANUFACTURERS.map(m => [m.id, m]));
export const CAR_BY_ID: Record<string, CarDef> = Object.fromEntries(CARS.map(c => [c.id, c]));
export const DRIVER_BY_ID: Record<string, DriverDef> = Object.fromEntries(DRIVERS.map(d => [d.id, d]));
export const TRACK_BY_ID: Record<string, TrackDef> = Object.fromEntries(TRACKS.map(t => [t.id, t]));
export const CHAMPIONSHIP_BY_ID: Record<string, ChampionshipDef> = Object.fromEntries(CHAMPIONSHIPS.map(c => [c.id, c]));
export const AUCTION_BY_ID: Record<string, AuctionDef> = Object.fromEntries(AUCTIONS.map(a => [a.id, a]));
