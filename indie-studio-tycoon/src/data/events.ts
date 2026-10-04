import type { GameEventId } from "../types";

export interface EventDefinition {
  id: GameEventId;
  weight: number; // peso relativo nella selezione casuale
  title: string;
  description: string;
  hasChoices: boolean;
  requiresEmployees?: boolean;
  requiresReleasedGame?: boolean;
}

export const EVENT_DEFINITIONS: EventDefinition[] = [
  {
    id: "talentApplies",
    weight: 3,
    title: "Un talento si candida",
    description:
      "Un professionista esperto ha saputo del tuo studio e si offre di lavorare con te a condizioni vantaggiose.",
    hasChoices: true,
  },
  {
    id: "criticalBug",
    weight: 2,
    title: "Bug critico scoperto",
    description:
      "Il team ha scoperto un bug critico in un progetto attivo. Puoi correggerlo subito a tue spese o rimandare la correzione.",
    hasChoices: true,
  },
  {
    id: "viralPositiveReview",
    weight: 2,
    title: "Recensione virale positiva",
    description:
      "Un influente sito di settore ha pubblicato una recensione entusiasta di uno dei tuoi giochi, generando un'ondata di interesse.",
    hasChoices: false,
    requiresReleasedGame: true,
  },
  {
    id: "negativeReview",
    weight: 2,
    title: "Recensione negativa",
    description: "Una recensione molto critica ha colpito la reputazione di uno dei tuoi giochi pubblicati.",
    hasChoices: false,
    requiresReleasedGame: true,
  },
  {
    id: "competitorRelease",
    weight: 2,
    title: "Un concorrente pubblica un titolo simile",
    description: "Uno studio rivale ha pubblicato un gioco con tematiche simili ai tuoi progetti in corso.",
    hasChoices: false,
  },
  {
    id: "platformFeeHike",
    weight: 1,
    title: "Una piattaforma aumenta le commissioni",
    description: "Una delle piattaforme su cui distribuisci i tuoi giochi ha aumentato la percentuale trattenuta.",
    hasChoices: false,
  },
  {
    id: "suddenTrend",
    weight: 2,
    title: "Tendenza improvvisa di mercato",
    description: "Un genere ha avuto un'improvvisa ondata di popolarità presso il pubblico.",
    hasChoices: false,
  },
  {
    id: "streamerPlay",
    weight: 2,
    title: "Uno streamer famoso prova il tuo gioco",
    description: "Un noto streamer ha trasmesso in diretta uno dei tuoi giochi, portando grande visibilità.",
    hasChoices: false,
    requiresReleasedGame: true,
  },
  {
    id: "raiseRequest",
    weight: 2,
    title: "Richiesta di aumento",
    description: "Un membro del team chiede un aumento di stipendio, convinto di meritarlo.",
    hasChoices: true,
    requiresEmployees: true,
  },
  {
    id: "investmentOpportunity",
    weight: 1,
    title: "Opportunità di investimento",
    description: "Un investitore propone di finanziare lo studio in cambio di un ritorno garantito nei prossimi mesi.",
    hasChoices: true,
  },
];
