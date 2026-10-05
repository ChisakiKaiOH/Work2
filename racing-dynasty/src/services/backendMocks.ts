// Interfaces for the services a future online backend would provide
// (sections 28, 47, 48 of the brief). Today every implementation is local —
// no network call is ever made — but the shapes are designed so a real
// backend can be dropped in behind them without touching game/UI code.

import type { PlayerState } from '../types';

// ---------------------------------------------------------------- Auth ---
export interface AuthService {
  getUserId(): string;
  isSignedIn(): boolean;
  signIn(): Promise<{ userId: string }>;
}
export class LocalAuthService implements AuthService {
  private userId: string;
  constructor() {
    let id = localStorage.getItem('racing-dynasty-local-uid');
    if (!id) {
      id = `local_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('racing-dynasty-local-uid', id);
    }
    this.userId = id;
  }
  getUserId(): string { return this.userId; }
  isSignedIn(): boolean { return true; }
  async signIn(): Promise<{ userId: string }> { return { userId: this.userId }; }
}

// ------------------------------------------------------------ CloudSave --
export interface CloudSaveService {
  push(player: PlayerState): Promise<boolean>;
  pull(): Promise<PlayerState | null>;
}
export class LocalCloudSaveService implements CloudSaveService {
  async push(): Promise<boolean> { return true; } // no-op: local save is the source of truth today
  async pull(): Promise<PlayerState | null> { return null; }
}

// ---------------------------------------------------------- Leaderboard --
export type LeaderboardScope = 'Weekly' | 'Monthly' | 'AllTime';
export type LeaderboardMetric = 'points' | 'wins' | 'championships' | 'garagePR';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  value: number;
}
export interface LeaderboardService {
  getLeaderboard(scope: LeaderboardScope, metric: LeaderboardMetric): Promise<LeaderboardEntry[]>;
  submitScore(scope: LeaderboardScope, metric: LeaderboardMetric, value: number): Promise<void>;
}
const MOCK_RIVAL_NAMES = ['Vex Carter', 'Nyra Sol', 'Tomas Rive', 'Ines Draka', 'Kael Thorne', 'Mira Wessel', 'Dorian Kade', 'Yuki Mora'];
export class LocalLeaderboardService implements LeaderboardService {
  async getLeaderboard(_scope: LeaderboardScope, _metric: LeaderboardMetric): Promise<LeaderboardEntry[]> {
    return MOCK_RIVAL_NAMES.map((name, i) => ({
      rank: i + 1, userId: `rival_${i}`, displayName: name, value: Math.round(50000 / (i + 1)),
    }));
  }
  async submitScore(): Promise<void> { /* no-op until a backend exists */ }
}

// --------------------------------------------------------- RemoteConfig --
export interface RemoteConfig {
  energyRegenMs: number;
  dailyMarketSize: [number, number];
  adRewardMultiplier: number;
}
export interface RemoteConfigService {
  getConfig(): Promise<RemoteConfig>;
}
const DEFAULT_REMOTE_CONFIG: RemoteConfig = {
  energyRegenMs: 3 * 60 * 1000,
  dailyMarketSize: [5, 10],
  adRewardMultiplier: 2,
};
export class LocalRemoteConfigService implements RemoteConfigService {
  async getConfig(): Promise<RemoteConfig> { return DEFAULT_REMOTE_CONFIG; }
}

// ------------------------------------------------- EconomyValidationService
/** A future server would re-run the same pure EconomyService math and reject
 *  mismatches; locally we just echo the client-computed delta back. */
export interface EconomyValidationService {
  validateDelta(kind: 'credits' | 'tokens', delta: number, reason: string): Promise<{ approved: boolean; delta: number }>;
}
export class LocalEconomyValidationService implements EconomyValidationService {
  async validateDelta(_kind: 'credits' | 'tokens', delta: number, _reason: string) {
    return { approved: true, delta };
  }
}

export const authService: AuthService = new LocalAuthService();
export const cloudSaveService: CloudSaveService = new LocalCloudSaveService();
export const leaderboardService: LeaderboardService = new LocalLeaderboardService();
export const remoteConfigService: RemoteConfigService = new LocalRemoteConfigService();
export const economyValidationService: EconomyValidationService = new LocalEconomyValidationService();
