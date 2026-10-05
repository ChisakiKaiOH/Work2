import { useState } from 'react';
import type { PlayerState } from '../types';
import { useGameDispatch } from '../game/hooks';
import { CAR_BY_ID, STARTER_CAR_IDS } from '../data';
import { carInstancePR, emptyUpgrades } from '../services/performanceRating';
import CarCard from '../components/CarCard';
import Button from '../components/Button';
import Card from '../components/Card';

const TUTORIAL_STEPS = [
  { title: '1. Scegli l’auto', text: 'Ogni auto ha un Performance Rating (PR): più alto è, più forte è la vettura in gara.' },
  { title: '2. Potenzia', text: 'Usa i crediti in Garage per migliorare motore, trasmissione, telaio e freni: ogni upgrade alza il PR.' },
  { title: '3. Scegli la strategia', text: 'Prima di ogni gara scegli Attacco, Bilanciata, Difesa o Rischiosa: cambia il modo in cui la tua auto corre.' },
  { title: '4. Corri', text: 'La gara si simula da sola: guardala in diretta a velocità 1x/2x/4x o salta subito al risultato.' },
  { title: '5. Incassa la ricompensa', text: 'Ogni gara frutta crediti, XP e a volte token o parti di potenziamento.' },
  { title: '6. Apri un pacchetto', text: 'Usa crediti o token per aprire pacchetti e ottenere nuove auto, con probabilità sempre visibili.' },
];

function dummyInstancePR(defId: string): number {
  const def = CAR_BY_ID[defId];
  return carInstancePR(def, { instanceId: '', defId, acquiredAt: 0, upgrades: emptyUpgrades(), equippedTire: 'Sport', xp: 0, racesCompleted: 0, wins: 0, favorite: false });
}

export default function OnboardingScreen({ player }: { player: PlayerState }) {
  const dispatch = useGameDispatch();
  const [tutorialStep, setTutorialStep] = useState(0);

  if (!player.firstCarChosen) {
    return (
      <div className="screen onboarding-screen">
        <h1>Scegli la tua prima auto</h1>
        <p className="muted">Tre punti di partenza diversi, tutti bilanciati: scegli lo stile che preferisci.</p>
        <div className="starter-car-grid">
          {STARTER_CAR_IDS.map(id => {
            const car = CAR_BY_ID[id];
            return (
              <CarCard
                key={id}
                car={car}
                pr={dummyInstancePR(id)}
                onClick={() => dispatch({ type: 'CHOOSE_STARTER_CAR', carDefId: id })}
                footer={<p className="car-card-desc">{car.description}</p>}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const step = TUTORIAL_STEPS[tutorialStep];
  const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;
  return (
    <div className="screen onboarding-screen">
      <h1>Come si gioca</h1>
      <Card className="tutorial-card">
        <h2>{step.title}</h2>
        <p>{step.text}</p>
        <div className="tutorial-dots">
          {TUTORIAL_STEPS.map((_, i) => (
            <span key={i} className={['dot', i === tutorialStep ? 'active' : ''].filter(Boolean).join(' ')} />
          ))}
        </div>
      </Card>
      <Button
        fullWidth
        onClick={() => {
          if (isLast) dispatch({ type: 'COMPLETE_TUTORIAL' });
          else setTutorialStep(s => s + 1);
        }}
      >
        {isLast ? 'Vai in pista!' : 'Avanti'}
      </Button>
    </div>
  );
}
