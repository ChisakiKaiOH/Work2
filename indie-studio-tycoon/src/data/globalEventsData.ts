import type { GlobalEventId } from "../types";

export interface GlobalEventDefinition {
  id: GlobalEventId;
  weight: number;
  headline: string;
  description: string;
}

export const GLOBAL_EVENT_DEFINITIONS: GlobalEventDefinition[] = [
  {
    id: "pandemic",
    weight: 1,
    headline: "Una pandemia globale cambia le abitudini dei giocatori",
    description: "Le persone restano più tempo in casa: le vendite dei giochi aumentano in tutto il settore, ma anche i costi operativi.",
  },
  {
    id: "economicCrisis",
    weight: 2,
    headline: "Una crisi economica globale colpisce i mercati",
    description: "Il potere d'acquisto si riduce: le vendite di tutto il settore ne risentono nei prossimi mesi.",
  },
  {
    id: "techBoom",
    weight: 2,
    headline: "Un boom tecnologico accelera l'innovazione",
    description: "L'ondata di investimenti nel settore rende la ricerca tecnologica temporaneamente più economica.",
  },
  {
    id: "newConsoleLaunch",
    weight: 2,
    headline: "Una nuova console arriva sul mercato",
    description: "Un nuovo hardware entra in scena, allargando il pubblico raggiungibile su piattaforma Console.",
  },
  {
    id: "hardwareShortage",
    weight: 1,
    headline: "Una crisi dei componenti colpisce l'hardware",
    description: "La scarsità di semiconduttori aumenta temporaneamente i costi di sviluppo per Console e VR.",
  },
  {
    id: "industryScandal",
    weight: 1,
    headline: "Uno scandalo scuote l'industria videoludica",
    description: "Un grande studio è coinvolto in una controversia: la fiducia del pubblico nel settore oscilla.",
  },
  {
    id: "dataLeak",
    weight: 1,
    headline: "Un leak di un progetto non annunciato diventa virale",
    description: "Informazioni riservate di un progetto in sviluppo circolano online prima del previsto.",
  },
  {
    id: "cyberAttack",
    weight: 1,
    headline: "Un attacco informatico colpisce un'azienda del settore",
    description: "Un attacco hacker mette in difficoltà un'azienda videoludica, con ripercussioni sulla sua reputazione.",
  },
  {
    id: "viralSuccess",
    weight: 2,
    headline: "Un gioco diventa un fenomeno virale inatteso",
    description: "Un titolo recente conquista improvvisamente il pubblico globale, con un'ondata di vendite e visibilità.",
  },
  {
    id: "famousInfluencer",
    weight: 2,
    headline: "Un influencer da milioni di follower parla di videogiochi indipendenti",
    description: "L'attenzione mediatica sui piccoli studi aumenta: l'hype per i progetti indie cresce in tutto il mercato.",
  },
  {
    id: "revolutionaryTech",
    weight: 1,
    headline: "Una tecnologia rivoluzionaria cambia il settore",
    description: "Una scoperta tecnologica inattesa accelera la ricerca per tutti gli studi del mondo.",
  },
];
