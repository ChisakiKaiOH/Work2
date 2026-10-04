import { useState } from "react";
import { useGameDispatch, useGameState } from "../../hooks/useGame";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { canGoPublic, holdingValue } from "../../systems/stockMarket";
import { formatMoney } from "../../utils/format";

export default function StockMarketPanel() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [shareAmounts, setShareAmounts] = useState<Record<string, number>>({});
  const publicCompanies = state.companies.filter((c) => c.isPublic);

  function amountFor(companyId: string): number {
    return shareAmounts[companyId] ?? 10;
  }

  return (
    <div className="inner-screen">
      <Card title="Il tuo studio in borsa">
        {state.stockMarket.playerIsPublic ? (
          <>
            <div className="dashboard-list-row">
              <span>Prezzo per azione</span>
              <span>{formatMoney(state.stockMarket.playerSharePrice)}</span>
            </div>
            <div className="dashboard-list-row">
              <span>Azioni in circolazione</span>
              <span>{state.stockMarket.playerSharesOutstanding.toLocaleString("it-IT")}</span>
            </div>
          </>
        ) : canGoPublic(state.companyValue) ? (
          <>
            <p className="office-description">Il tuo studio è grande abbastanza per quotarsi in borsa.</p>
            <Button variant="primary" fullWidth onClick={() => dispatch({ type: "GO_PUBLIC" })}>
              Quota il tuo studio in Borsa
            </Button>
          </>
        ) : (
          <p className="office-description">
            Raggiungi un valore aziendale di almeno {formatMoney(20_000_000)} per poterti quotare in borsa.
          </p>
        )}
      </Card>

      {state.stockMarket.holdings.length > 0 && (
        <Card title="Il tuo portafoglio">
          {state.stockMarket.holdings.map((h) => {
            const company = state.companies.find((c) => c.id === h.companyId);
            return (
              <div key={h.companyId} className="dashboard-list-row">
                <span>{company?.name ?? "Azienda non più indipendente"}</span>
                <span>{h.shares} azioni · {formatMoney(holdingValue(h, state.companies))}</span>
              </div>
            );
          })}
        </Card>
      )}

      <h2 className="section-title">Società quotate</h2>
      {publicCompanies.length === 0 && <p className="panel-empty">Nessuna azienda rivale è ancora quotata in borsa.</p>}
      {publicCompanies.map((company) => {
        const holding = state.stockMarket.holdings.find((h) => h.companyId === company.id);
        return (
          <Card key={company.id}>
            <div className="card-row-header">
              <span className="card-row-title">{company.name}</span>
              <span className="tag">{formatMoney(company.sharePrice)}/azione</span>
            </div>
            {holding && <div className="card-row-sub">Possiedi {holding.shares} azioni</div>}
            <div className="stock-controls">
              <input
                type="number"
                min={1}
                className="text-input stock-amount-input"
                value={amountFor(company.id)}
                onChange={(e) => setShareAmounts((prev) => ({ ...prev, [company.id]: Math.max(1, Number(e.target.value)) }))}
              />
              <Button variant="primary" onClick={() => dispatch({ type: "BUY_SHARES", companyId: company.id, shares: amountFor(company.id) })}>
                Compra
              </Button>
              <Button
                variant="secondary"
                disabled={!holding}
                onClick={() => dispatch({ type: "SELL_SHARES", companyId: company.id, shares: amountFor(company.id) })}
              >
                Vendi
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
