import type { RaceSource } from '../game/actions';

export type Screen =
  | 'home' | 'garage' | 'race' | 'world' | 'more'
  | 'market' | 'packs' | 'collection' | 'achievements' | 'settings' | 'leaderboard';

/** Optional parameters carried along a navigation, e.g. "go straight into this boss race". */
export interface RaceLaunch {
  source: RaceSource;
  trackId: string;
  opponentTargetPR: number;
  bossId?: string;
}

export interface NavTarget {
  screen: Screen;
  raceLaunch?: RaceLaunch;
}

export const BOTTOM_NAV: { screen: Screen; label: string; icon: string }[] = [
  { screen: 'home', label: 'Home', icon: '⌂' },
  { screen: 'garage', label: 'Garage', icon: '◧' },
  { screen: 'race', label: 'Gara', icon: '◆' },
  { screen: 'world', label: 'World Tour', icon: '◍' },
  { screen: 'more', label: 'Altro', icon: '⋯' },
];
