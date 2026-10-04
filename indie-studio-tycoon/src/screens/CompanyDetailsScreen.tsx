import { useMemo, useState } from "react";
import { useGameDispatch, useGameState } from "../hooks/useGame";
import Card from "../components/Card";
import Button from "../components/Button";
import CompanyLogo from "../components/CompanyLogo";
import { makeOffer, type AcquisitionMode, type PostAcquisitionChoice } from "../systems/acquisitions";
import { companyStageFor, strategyLabel } from "../systems/companies";
import { formatMoney, formatMonth } from "../utils/format";

const MODES: { id: AcquisitionMode; label: string; description: string }[] = [
  { id: "full", label: "Acquisizione completa", description: "Rilevi l'intera azienda con il consenso del management." },
  { id: "hostile", label: "Acquisizione ostile", description: "Rilevi l'azienda forzando la mano, a un prezzo più alto." },
  { id: "partnership", label: "Partnership", description: "Stringi un accordo commerciale: resta indipendente." },
  { id: "investment", label: "Investimento", description: "Investi capitale in cambio di una relazione più forte." },
];

const POST_CHOICES: { id: PostAcquisitionChoice; label: string; description: string }[] = [
  { id: "keepManagement", label: "Mantieni il management", description: "Il team originale resta al suo posto." },
  { id: "replaceManagement", label: "Sostituisci il management", description: "Rischio di morale più basso per il tuo team esistente." },
  { id: "integrate", label: "Integra lo studio", description: "Massimizzi il valore acquisito, inclusa la IP." },
  { id: "close", label: "Chiudi lo studio", description: "Incassi solo il valore residuo, nessun dipendente o IP." },
];

export default function CompanyDetailsScreen({ companyId, onBack }: { companyId: string; onBack: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [mode, setMode] = useState<AcquisitionMode>("full");
  const [postChoice, setPostChoice] = useState<PostAcquisitionChoice>("integrate");

  const company = state.companies.find((c) => c.id === companyId);

  const offer = useMemo(() => (company ? makeOffer(company, mode) : null), [company, mode]);

  if (!company || !offer) {
    return (
      <div className="screen">
        <p className="panel-empty">Questa azienda non esiste più (forse è stata acquisita o ha fallito).</p>
        <Button variant="ghost" onClick={onBack}>
          Indietro
        </Button>
      </div>
    );
  }

  const canAfford = state.money >= offer.price;

  return (
    <div className="screen company-details-screen">
      <Button variant="ghost" onClick={onBack}>
        ← Indietro
      </Button>
      <div className="company-header">
        <CompanyLogo seed={company.logoSeed} name={company.name} size={64} />
        <div>
          <h1>{company.name}</h1>
          <p className="screen-subtitle">
            Fondata da {company.founder} nel {formatMonth(company.foundedMonth)}
          </p>
        </div>
      </div>

      <Card title="Profilo">
        <div className="dashboard-list-row">
          <span>Stadio</span>
          <span>{companyStageFor(company.companyValue)}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Strategia</span>
          <span>{strategyLabel(company.strategy)}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Dipendenti</span>
          <span>{company.employeeCount.toLocaleString("it-IT")}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Reputazione</span>
          <span>{Math.round(company.reputation)}/100</span>
        </div>
        <div className="dashboard-list-row">
          <span>Giochi pubblicati</span>
          <span>{company.games.length}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Relazione con il tuo studio</span>
          <span>{company.relationshipWithPlayer}</span>
        </div>
      </Card>

      <Card title="Due diligence">
        <div className="dashboard-list-row">
          <span>Valore aziendale</span>
          <span>{formatMoney(offer.dueDiligence.companyValue)}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Ricavi stimati</span>
          <span>{formatMoney(offer.dueDiligence.revenueEstimate)}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Debiti stimati</span>
          <span>{formatMoney(offer.dueDiligence.debtEstimate)}</span>
        </div>
        <div className="dashboard-list-row">
          <span>Quota di mercato</span>
          <span>{company.marketShare.toFixed(1)}%</span>
        </div>
      </Card>

      <Card title="Operazione">
        <div className="chip-grid">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={mode === m.id ? "chip chip-active" : "chip"} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="field-hint">{MODES.find((m) => m.id === mode)?.description}</p>

        {offer.absorbsCompany && (
          <>
            <div className="field-label">Dopo l'acquisizione</div>
            <div className="chip-grid">
              {POST_CHOICES.map((p) => (
                <button key={p.id} type="button" className={postChoice === p.id ? "chip chip-active" : "chip"} onClick={() => setPostChoice(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            <p className="field-hint">{POST_CHOICES.find((p) => p.id === postChoice)?.description}</p>
          </>
        )}

        <div className="estimate-card">
          <span className="estimate-label">Prezzo dell'operazione</span>
          <span className={canAfford ? "estimate-value" : "estimate-value estimate-warning"}>{formatMoney(offer.price)}</span>
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={!canAfford}
          onClick={() => {
            dispatch({ type: "ACQUIRE_COMPANY", companyId: company.id, mode, postChoice: offer.absorbsCompany ? postChoice : null });
            onBack();
          }}
        >
          Conferma operazione
        </Button>
      </Card>
    </div>
  );
}
