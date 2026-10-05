import type { PlayerState, RaceResult } from '../types';

export type GameAction =
  | { type: 'NEW_CAREER'; teamName: string; ownerName: string }
  | { type: 'ADVANCE_TIME' }
  | { type: 'BUY_CAR'; listingId: string }
  | { type: 'RENT_CAR'; defId: string; durationEvents: 1 | 3 }
  | { type: 'SELL_CAR'; instanceId: string }
  | { type: 'HIRE_DRIVER'; driverId: string; durationEvents: number; salaryPerEvent: number }
  | { type: 'RENT_DRIVER'; driverId: string }
  | { type: 'RELEASE_DRIVER'; driverId: string }
  | { type: 'SELECT_RACE_CAR'; instanceId: string }
  | { type: 'SELECT_RACE_DRIVER'; driverId: string }
  | { type: 'AUCTION_BID' }
  | { type: 'AUCTION_PASS' }
  | { type: 'APPLY_RACE_RESULT'; result: RaceResult }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<PlayerState['settings']> }
  | { type: 'LOAD_SAVE'; player: PlayerState }
  | { type: 'RESET_SAVE' };
