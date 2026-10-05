import type { PlayerState, RaceResult, UpgradeCategory, TireType, Settings } from '../types';
import type { AdPlacement } from '../ads/AdService';
import type { ProductId } from '../monetization/MonetizationService';

export type RaceSource =
  | { kind: 'event'; eventId: string }
  | { kind: 'championship'; championshipId: string; raceIndex: number }
  | { kind: 'boss'; bossId: string }
  | { kind: 'free' };

export type GameAction =
  | { type: 'NEW_GAME'; name: string }
  | { type: 'CHOOSE_STARTER_CAR'; carDefId: string }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SELECT_CAR'; instanceId: string }
  | { type: 'SELECT_DRIVER'; driverId: string }
  | { type: 'UPGRADE_CAR'; instanceId: string; category: UpgradeCategory }
  | { type: 'EQUIP_TIRE'; instanceId: string; tire: TireType }
  | { type: 'TOGGLE_FAVORITE'; instanceId: string }
  | { type: 'APPLY_RACE_RESULT'; result: RaceResult; instanceId: string; source: RaceSource }
  | { type: 'BUY_MARKET_CAR'; listingId: string }
  | { type: 'REFRESH_MARKET' }
  | { type: 'OPEN_PACK'; packId: string }
  | { type: 'CLAIM_DAILY_REWARD' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'TICK_ENERGY' }
  | { type: 'WATCH_AD_REWARD'; placement: AdPlacement }
  | { type: 'GRANT_BONUS'; credits: number; tokens: number; xp: number }
  | { type: 'PURCHASE_PRODUCT'; productId: ProductId }
  | { type: 'LOAD_SAVE'; player: PlayerState }
  | { type: 'RESET_SAVE' };
