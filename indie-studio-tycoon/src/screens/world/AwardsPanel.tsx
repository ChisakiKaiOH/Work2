import { useState } from "react";
import type { AwardCeremony } from "../../types";
import { useGameDispatch, useGameState } from "../../hooks/useGame";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { AWARD_CATEGORY_LABELS } from "../../data/awardCategories";

const MEDALS = ["🥇", "🥈", "🥉", "4°", "5°"];
const PRESENTERS = ["Vera Lumen", "Dario Prisma", "Nova Flint", "Kai Orbit"];

function CeremonyView({ ceremony, isPending }: { ceremony: AwardCeremony; isPending: boolean }) {
  const dispatch = useGameDispatch();
  const presenter = PRESENTERS[ceremony.year % PRESENTERS.length];

  return (
    <Card className="ceremony-card" title={`Global Game Awards ${ceremony.year}`} subtitle={`Presentato da ${presenter}`}>
      {ceremony.categories.map((category) => (
        <div key={category.categoryId} className="ceremony-category">
          <div className="ceremony-category-title">{AWARD_CATEGORY_LABELS[category.categoryId]}</div>
          {category.nominees.length === 0 && <p className="panel-empty">Nessun candidato quest'anno.</p>}
          {category.nominees.map((nominee, i) => (
            <div key={nominee.releasedGameId} className={i === 0 ? "ceremony-nominee ceremony-nominee-winner" : "ceremony-nominee"}>
              <span className="ceremony-medal">{MEDALS[i] ?? ""}</span>
              <span className="ceremony-nominee-name">{nominee.gameName}</span>
              <span className="ceremony-nominee-company">{nominee.isPlayer ? "Il tuo studio" : nominee.companyName}</span>
            </div>
          ))}
        </div>
      ))}
      {isPending && (
        <Button variant="primary" fullWidth onClick={() => dispatch({ type: "RESOLVE_AWARD_CEREMONY" })}>
          Chiudi la cerimonia
        </Button>
      )}
    </Card>
  );
}

export default function AwardsPanel() {
  const state = useGameState();
  const [showHistory, setShowHistory] = useState(false);
  const ceremonies = [...state.awardCeremonies].reverse();
  const pending = ceremonies.find((c) => c.id === state.pendingAwardCeremonyId);
  const past = ceremonies.filter((c) => c.id !== state.pendingAwardCeremonyId);

  return (
    <div className="inner-screen">
      {pending ? (
        <CeremonyView ceremony={pending} isPending />
      ) : (
        <p className="office-description">
          I Global Game Awards si tengono una volta all'anno: tutti i giochi pubblicati negli ultimi 12 mesi, tuoi e
          dei rivali, competono in 11 categorie.
        </p>
      )}
      {past.length > 0 && (
        <Button variant="ghost" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "Nascondi storico" : `Mostra storico (${past.length})`}
        </Button>
      )}
      {showHistory && past.map((c) => <CeremonyView key={c.id} ceremony={c} isPending={false} />)}
    </div>
  );
}
