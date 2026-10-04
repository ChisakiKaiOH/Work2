import type { RivalCompany } from "../types";

// "partial" è gestita dal sistema borsistico (acquisto di azioni di una
// società quotata): qui restano le modalità che comportano una trattativa
// diretta con il management del target.
export type AcquisitionMode = "full" | "hostile" | "partnership" | "investment";

export type PostAcquisitionChoice = "keepManagement" | "replaceManagement" | "integrate" | "independent" | "close";

export interface DueDiligence {
  companyValue: number;
  revenueEstimate: number;
  debtEstimate: number;
  employeeCount: number;
  ipCount: number;
  reputation: number;
  marketShare: number;
}

export interface AcquisitionOffer {
  mode: AcquisitionMode;
  price: number;
  dueDiligence: DueDiligence;
  absorbsCompany: boolean; // true se il target smette di esistere come rivale indipendente
}

export function assessCompany(target: RivalCompany): DueDiligence {
  const debtEstimate = Math.max(0, -target.capital);
  const revenueEstimate = Math.max(0, target.capital * 0.3 + target.companyValue * 0.05);
  return {
    companyValue: target.companyValue,
    revenueEstimate: Math.round(revenueEstimate),
    debtEstimate: Math.round(debtEstimate),
    employeeCount: target.employeeCount,
    ipCount: target.ipIds.length,
    reputation: target.reputation,
    marketShare: target.marketShare,
  };
}

const MODE_MULTIPLIER: Record<AcquisitionMode, number> = {
  full: 1.15,
  hostile: 1.45, // premio necessario per superare la resistenza del management
  partnership: 0.12,
  investment: 0.22,
};

export function makeOffer(target: RivalCompany, mode: AcquisitionMode): AcquisitionOffer {
  const dueDiligence = assessCompany(target);
  const strugglingDiscount = target.capital < 0 ? 0.75 : 1;
  const reputationFactor = 0.7 + target.reputation / 150;
  const price = Math.round(target.companyValue * MODE_MULTIPLIER[mode] * reputationFactor * strugglingDiscount);
  return { mode, price, dueDiligence, absorbsCompany: mode === "full" || mode === "hostile" };
}

export interface AcquisitionOutcome {
  companyValueGain: number; // da aggiungere al companyValue del giocatore
  reputationDelta: number;
  employeesGained: number; // numero indicativo di posizioni che si liberano nel pool candidati
  ipsTransferred: string[]; // id delle IP che passano al giocatore (solo absorb)
  relationshipDelta: number;
  moraleShock: number; // applicato ai dipendenti esistenti del giocatore (sostituzione management = rischio)
}

export function resolveAcquisition(
  offer: AcquisitionOffer,
  target: RivalCompany,
  postChoice: PostAcquisitionChoice | null
): AcquisitionOutcome {
  if (!offer.absorbsCompany) {
    // Partnership/investimento: nessun assorbimento, solo relazione e un piccolo
    // ritorno di reputazione per essersi legati a un nome noto del settore.
    return {
      companyValueGain: Math.round(offer.price * 0.1),
      reputationDelta: offer.mode === "partnership" ? 2 : 1,
      employeesGained: 0,
      ipsTransferred: [],
      relationshipDelta: offer.mode === "partnership" ? 25 : 10,
      moraleShock: 0,
    };
  }

  const integrationFactor = postChoice === "integrate" ? 1 : postChoice === "close" ? 0.4 : 0.7;
  const moraleShock = postChoice === "replaceManagement" ? -8 : postChoice === "keepManagement" ? 4 : 0;

  return {
    companyValueGain: Math.round(target.companyValue * integrationFactor),
    reputationDelta: offer.mode === "hostile" ? 3 : 6,
    employeesGained: postChoice === "close" ? 0 : Math.round(target.employeeCount * 0.4),
    ipsTransferred: postChoice === "close" ? [] : [...target.ipIds],
    relationshipDelta: offer.mode === "hostile" ? -40 : -5,
    moraleShock,
  };
}
