import type { Genre, Theme } from "../types";
import { pick, type RandomFn, defaultRandom } from "./random";

const FIRST_NAMES = [
  "Mara",
  "Luca",
  "Sofia",
  "Dario",
  "Elena",
  "Marco",
  "Giulia",
  "Tommaso",
  "Alice",
  "Nico",
  "Vera",
  "Leo",
  "Ines",
  "Omar",
  "Yuki",
  "Kai",
  "Priya",
  "Noah",
  "Mika",
  "Zoe",
];

const LAST_NAMES = [
  "Ferretti",
  "Conti",
  "Marin",
  "Rossetti",
  "Bianchi",
  "Vargas",
  "Nielsen",
  "Okafor",
  "Suzuki",
  "Haddad",
  "Moreau",
  "Keller",
  "Ivanov",
  "Costa",
  "Lindqvist",
  "Tanaka",
  "Singh",
  "Park",
  "Alves",
  "Weber",
];

export function generatePersonName(rng: RandomFn = defaultRandom): string {
  return `${pick(FIRST_NAMES, rng)} ${pick(LAST_NAMES, rng)}`;
}

const TITLE_PREFIX: Record<Theme, string[]> = {
  Fantasy: ["Cronache di", "Il Regno di", "Leggende di", "L'Ultimo"],
  "Sci-Fi": ["Orbita", "Protocollo", "Oltre", "Sistema"],
  Horror: ["L'Ombra di", "Notte a", "Il Richiamo di", "Residuo"],
  Medieval: ["L'Assedio di", "Il Trono di", "Cavalieri di", "La Lama di"],
  Modern: ["Linea", "Distretto", "Codice", "Punto"],
  Futuristic: ["Neon", "Impulso", "Vertice", "Paradosso"],
  Mystery: ["Il Caso di", "Enigma", "Indizi da", "Il Segreto di"],
  Sports: ["Campioni di", "Lega", "Arena", "Finale"],
};

const TITLE_SUFFIX: Record<Genre, string[]> = {
  Action: ["Rottura", "Assalto", "Impatto", "Lama"],
  RPG: ["Destino", "Eredità", "Rinascita", "Le Origini"],
  Adventure: ["Orizzonte", "Il Viaggio", "Scoperta", "Confini"],
  Strategy: ["Dominio", "Scacchiera", "Impero", "Comando"],
  Simulation: ["Vita", "Colonia", "Progetto", "Sistema"],
  Horror: ["Oscurità", "Terrore", "Silenzio", "Incubo"],
  Racing: ["Velocità", "Asfalto", "Circuito", "Turbo"],
  Sports: ["Campionato", "Torneo", "Sfida", "Trofeo"],
  Puzzle: ["Enigmi", "Frammenti", "Specchi", "Equilibri"],
  Casual: ["Momenti", "Relax", "Giornate", "Attimi"],
};

export function generateGameTitle(genre: Genre, theme: Theme, rng: RandomFn = defaultRandom): string {
  const prefix = pick(TITLE_PREFIX[theme], rng);
  const suffix = pick(TITLE_SUFFIX[genre], rng);
  return `${prefix} ${suffix}`;
}

const REVIEWER_OUTLETS = [
  "PixelVerdict",
  "IndieWave",
  "ByteCompass",
  "LoopCritic",
  "StudioScope",
  "NightPatch",
  "ArcadeLens",
  "CoreSignal",
];

export function generateReviewerName(rng: RandomFn = defaultRandom): string {
  return pick(REVIEWER_OUTLETS, rng);
}
