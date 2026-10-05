import type { Strategy } from '../types';

export interface StrategyProfile {
  paceMult: number;
  tireWearMult: number;
  fuelWearMult: number;
  overtakeBonus: number;
  defenseBonus: number;
  incidentRisk: number;
}

export const STRATEGY_PROFILES: Record<Strategy, StrategyProfile> = {
  Attack:   { paceMult: 1.07, tireWearMult: 1.25, fuelWearMult: 1.15, overtakeBonus: 0.08, defenseBonus: -0.03, incidentRisk: 1.1 },
  Balanced: { paceMult: 1.00, tireWearMult: 1.00, fuelWearMult: 1.00, overtakeBonus: 0.00, defenseBonus: 0.00, incidentRisk: 1.0 },
  Defend:   { paceMult: 0.95, tireWearMult: 0.78, fuelWearMult: 0.90, overtakeBonus: -0.04, defenseBonus: 0.09, incidentRisk: 0.8 },
  Risky:    { paceMult: 1.04, tireWearMult: 1.35, fuelWearMult: 1.10, overtakeBonus: 0.14, defenseBonus: -0.06, incidentRisk: 1.6 },
};

export const STRATEGY_LABEL_IT: Record<Strategy, string> = {
  Attack: 'Attacco', Balanced: 'Bilanciata', Defend: 'Difesa', Risky: 'Rischiosa',
};
export const STRATEGY_DESCRIPTION_IT: Record<Strategy, string> = {
  Attack: 'Più velocità e sorpassi, a costo di maggiore usura.',
  Balanced: 'Statistiche equilibrate, nessun compromesso estremo.',
  Defend: 'Conserva le gomme e difende la posizione, ma è più lenta.',
  Risky: 'Grande possibilità di sorpasso e vittoria, ma rischio e usura elevati.',
};
