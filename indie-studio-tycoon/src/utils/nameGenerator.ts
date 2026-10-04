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
  Cyberpunk: ["Neon City:", "Circuito", "Downgrade", "Megastruttura"],
  Medieval: ["L'Assedio di", "Il Trono di", "Cavalieri di", "La Lama di"],
  Modern: ["Linea", "Distretto", "Codice", "Punto"],
  Futuristic: ["Neon", "Impulso", "Vertice", "Paradosso"],
  "Post-apocalyptic": ["Rovine di", "L'Ultimo Rifugio:", "Cenere e", "Dopo"],
  Mystery: ["Il Caso di", "Enigma", "Indizi da", "Il Segreto di"],
  Superhero: ["Guardiani di", "Il Potere di", "Leggenda", "Scudo di"],
  Historical: ["Cronache dell'", "L'Era di", "Memorie di", "Il Secolo di"],
  Space: ["Oltre le Stelle:", "Deep Space", "Costellazione", "Orbita di"],
  Military: ["Linea di Fuoco:", "Comando", "Operazione", "Fronte di"],
  Comedy: ["Caos a", "Follia a", "Che Disastro a", "Risata a"],
  Noir: ["Ombre su", "Pioggia su", "Il Caso Nero di", "Mezzanotte a"],
  Sports: ["Campioni di", "Lega", "Arena", "Finale"],
};

const TITLE_SUFFIX: Record<Genre, string[]> = {
  Action: ["Rottura", "Assalto", "Impatto", "Lama"],
  RPG: ["Destino", "Eredità", "Rinascita", "Le Origini"],
  JRPG: ["Cristallo del Fato", "Prisma Stellare", "Saga Infinita", "L'Eroe Dimenticato"],
  Adventure: ["Orizzonte", "Il Viaggio", "Scoperta", "Confini"],
  Horror: ["Oscurità", "Terrore", "Silenzio", "Incubo"],
  Survival: ["Sopravvivenza", "Ultimi Giorni", "Rifugio", "Istinto"],
  Strategy: ["Dominio", "Scacchiera", "Impero", "Comando"],
  Simulation: ["Vita", "Colonia", "Progetto", "Sistema"],
  Racing: ["Velocità", "Asfalto", "Circuito", "Turbo"],
  Sports: ["Campionato", "Torneo", "Sfida", "Trofeo"],
  Fighting: ["Scontro", "Arena di Sangue", "Duello", "Resa dei Conti"],
  Puzzle: ["Enigmi", "Frammenti", "Specchi", "Equilibri"],
  Platform: ["Salto Infinito", "Vertigine", "Rincorsa", "Labirinto"],
  Roguelike: ["Discesa Eterna", "Ciclo Infinito", "Rinascita Casuale", "L'Abisso che Cambia"],
  MMO: ["Mondo Condiviso", "Regno Senza Fine", "Convergenza", "Orizzonti Infiniti"],
  MOBA: ["Arena Suprema", "Scontro di Campioni", "Linea di Battaglia", "Faida"],
  FPS: ["Linea di Tiro", "Fuoco Incrociato", "Zona Rossa", "Bersaglio"],
  RTS: ["Comando Supremo", "Fronte di Guerra", "Strategia Totale", "Dominio Assoluto"],
  Tactical: ["Scacco Tattico", "Manovra", "Cellula Operativa", "Piano B"],
  Sandbox: ["Mondo Libero", "Costruzione Infinita", "Terra di Nessuno", "Playground"],
  VisualNovel: ["Pagine di", "Un'Altra Vita", "Scelte", "Il Diario di"],
  Casual: ["Momenti", "Relax", "Giornate", "Attimi"],
  Educational: ["Scoperta Guidata", "Prima Lezione", "Avventura nel Sapere", "Piccoli Passi"],
};

export function generateGameTitle(genre: Genre, theme: Theme, rng: RandomFn = defaultRandom): string {
  const prefix = pick(TITLE_PREFIX[theme], rng);
  const suffix = pick(TITLE_SUFFIX[genre], rng);
  return `${prefix} ${suffix}`;
}

// --- Nomi aziendali procedurali, umoristici ma originali ------------------
// Combina radici "tech/sci-fi" generiche con suffissi da software house,
// con una mutazione occasionale in stile "parodia" (x/z finale, doppia
// lettera, ecc.) — nello spirito di nomi come "Nintando" o "Sonex" citati
// come riferimento, ma costruiti da zero senza usare frammenti di marchi
// reali in nessuna delle liste.
const COMPANY_ROOTS = [
  "Nova",
  "Pixel",
  "Byte",
  "Nebula",
  "Quantum",
  "Hyper",
  "Giga",
  "Retro",
  "Cosmo",
  "Turbo",
  "Vortex",
  "Lumen",
  "Cryo",
  "Aether",
  "Volt",
  "Nimbus",
  "Orbit",
  "Spectra",
  "Chrono",
  "Draco",
  "Solace",
  "Umbra",
  "Zephyr",
  "Ignis",
  "Terra",
  "Astro",
  "Mythos",
  "Vertex",
  "Cascade",
  "Prism",
  "Fenix",
  "Glitch",
  "Nexo",
  "Krypto",
  "Polar",
];

const COMPANY_SUFFIXES = [
  "Soft",
  "Works",
  "Studios",
  "Interactive",
  "Games",
  "Digital",
  "Forge",
  "Labs",
  "Dynamics",
  "Entertainment",
  "Media",
  "Play",
  "Tech",
  "Systems",
  "Craft",
  "Net",
  "Core",
  "Wave",
  "Pulse",
  "Arts",
];

const COMPANY_MUTATIONS = ["x", "z", "ix", "ex", "oh", "y"];

export function generateCompanyName(rng: RandomFn = defaultRandom): string {
  const root = pick(COMPANY_ROOTS, rng);
  const suffix = pick(COMPANY_SUFFIXES, rng);
  const base = `${root}${suffix}`;
  if (rng() < 0.35) {
    // Taglia l'ultima vocale/lettera e applica una mutazione buffa, in stile
    // "parodia di un nome plausibile" (es. root+suffix -> root+suffixEx).
    const trimmed = base.replace(/[aeiouAEIOU]$/, "");
    return `${trimmed}${pick(COMPANY_MUTATIONS, rng)}`;
  }
  return base;
}

// --- Nomi di piattaforme hardware fittizie (console/VR) --------------------
const PLATFORM_ROOTS = ["Game", "Play", "Power", "Ultra", "Hyper", "Neo", "Quantum", "Star", "Nova", "Pulse", "Prime", "Vortex"];
const PLATFORM_SUFFIXES = ["Box", "Station", "Core", "Wave", "Sphere", "One", "Deck", "Cube", "Edge", "Link"];

export function generatePlatformName(rng: RandomFn = defaultRandom): string {
  return `${pick(PLATFORM_ROOTS, rng)}${pick(PLATFORM_SUFFIXES, rng)}`;
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
