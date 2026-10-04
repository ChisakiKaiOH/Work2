import { useGameState } from "../../hooks/useGame";
import Card from "../../components/Card";
import CompanyLogo from "../../components/CompanyLogo";
import { companyStageFor, strategyLabel } from "../../systems/companies";
import { formatMoney } from "../../utils/format";

export default function CompetitorsPanel({ onOpenCompany }: { onOpenCompany: (companyId: string) => void }) {
  const state = useGameState();
  const sorted = [...state.companies].sort((a, b) => b.companyValue - a.companyValue);

  return (
    <div className="inner-screen">
      <p className="office-description">
        {sorted.length} aziende concorrenti agiscono autonomamente nel mondo di gioco: pubblicano giochi, crescono,
        falliscono o si acquisiscono a vicenda, anche quando non le osservi.
      </p>
      {sorted.map((company, index) => (
        <Card key={company.id} onClick={() => onOpenCompany(company.id)}>
          <div className="company-row">
            <CompanyLogo seed={company.logoSeed} name={company.name} size={44} />
            <div className="company-row-info">
              <div className="card-row-title">
                #{index + 1} {company.name}
              </div>
              <div className="card-row-sub">
                {companyStageFor(company.companyValue)} · {strategyLabel(company.strategy)}
              </div>
            </div>
            <div className="company-row-value">{formatMoney(company.companyValue)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
