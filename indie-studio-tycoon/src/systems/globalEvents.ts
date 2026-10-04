import type { Genre, GlobalEventId, GlobalEventRecord } from "../types";
import { GLOBAL_EVENT_DEFINITIONS } from "../data/globalEventsData";
import { weightedPick, type RandomFn, defaultRandom } from "../utils/random";
import { createId } from "../utils/id";

export const GLOBAL_EVENT_CHANCE_PER_MONTH = 0.06;

export interface GlobalEventEffect {
  record: GlobalEventRecord;
  salesMultiplierAllReleased?: number; // moltiplicatore una tantum sulle vendite del mese per i giochi pubblicati
  reputationDelta?: number;
  genrePopularityDelta?: Partial<Record<Genre, number>>;
  researchDiscountNextMonths?: number; // sconto percentuale 0-1 sul costo della ricerca attiva
  spawnPlatform?: boolean;
  consoleDevCostMultiplier?: number; // applicato al costo dei prossimi progetti Console/VR
}

export function rollGlobalEvent(month: number, rng: RandomFn = defaultRandom): GlobalEventEffect | null {
  const def = weightedPick(GLOBAL_EVENT_DEFINITIONS, rng);
  if (!def) return null;

  const record: GlobalEventRecord = {
    id: createId("gevent"),
    type: def.id,
    month,
    headline: def.headline,
    description: def.description,
  };

  const effects: Record<GlobalEventId, Omit<GlobalEventEffect, "record">> = {
    pandemic: { salesMultiplierAllReleased: 1.25 },
    economicCrisis: { salesMultiplierAllReleased: 0.75, reputationDelta: -1 },
    techBoom: { researchDiscountNextMonths: 0.3 },
    newConsoleLaunch: { spawnPlatform: true },
    hardwareShortage: { consoleDevCostMultiplier: 1.25 },
    industryScandal: { reputationDelta: -2 },
    dataLeak: { reputationDelta: -1 },
    cyberAttack: { reputationDelta: -1 },
    viralSuccess: { salesMultiplierAllReleased: 1.4 },
    famousInfluencer: { salesMultiplierAllReleased: 1.15, reputationDelta: 1 },
    revolutionaryTech: { researchDiscountNextMonths: 0.5 },
    competitorBankruptcy: {},
    historicAcquisition: {},
  };

  return { record, ...effects[def.id] };
}
