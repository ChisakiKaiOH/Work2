// AdService abstraction — section 23 of the brief. The rest of the app only
// ever talks to this interface, never to a concrete ad SDK, so swapping in a
// real mediation SDK later is a one-file change.

export type AdPlacement = 'double_reward' | 'free_pack' | 'restore_energy';

export interface AdResult {
  shown: boolean;
  rewarded: boolean;
}

export interface AdService {
  isReady(placement: AdPlacement): boolean;
  show(placement: AdPlacement): Promise<AdResult>;
}

/**
 * Local, offline implementation used whenever no real ad SDK is wired up
 * (this is always true in this build — see MONETIZATION.md). Simulates a
 * short "watching" delay and always rewards, so the reward loop can be
 * built and tested end-to-end before any SDK integration exists.
 */
export class MockAdService implements AdService {
  isReady(): boolean {
    return true;
  }
  async show(): Promise<AdResult> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { shown: true, rewarded: true };
  }
}

export const adService: AdService = new MockAdService();
