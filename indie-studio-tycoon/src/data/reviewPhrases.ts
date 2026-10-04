import type { QualityAxis } from "../types";

// Banca di frasi originali usata da systems/reviews.ts per generare recensioni
// coerenti con i punti di forza/debolezza reali del gioco.
export const STRONG_AXIS_PHRASES: Record<QualityAxis, string[]> = {
  gameplay: [
    "Il sistema di gioco centrale è sorprendentemente solido e diverte dall'inizio alla fine.",
    "Il loop di gameplay è talmente ben calibrato che è difficile smettere di giocare.",
    "I comandi rispondono benissimo e ogni meccanica si incastra con le altre.",
  ],
  technology: [
    "Le prestazioni sono impeccabili anche nelle scene più caotiche.",
    "Il motore tecnico regge egregiamente ogni situazione, senza cali vistosi.",
    "La solidità tecnica del titolo è uno dei suoi punti più sorprendenti.",
  ],
  graphics: [
    "La direzione artistica è splendida e ogni ambientazione resta impressa.",
    "Visivamente il gioco è una gioia per gli occhi, con un stile coerente e riconoscibile.",
    "Il comparto grafico sorprende per cura dei dettagli e coerenza stilistica.",
  ],
  sound: [
    "La colonna sonora accompagna ogni momento con grande efficacia.",
    "Il design sonoro costruisce un'atmosfera avvolgente dall'inizio alla fine.",
    "Gli effetti audio aggiungono un livello di immersione raramente visto in produzioni simili.",
  ],
  story: [
    "La narrazione tiene incollati con personaggi scritti con cura.",
    "La trama riserva colpi di scena ben orchestrati e un finale memorabile.",
    "Il mondo narrativo è ricco e dà sempre motivo di continuare a giocare.",
  ],
};

export const WEAK_AXIS_PHRASES: Record<QualityAxis, string[]> = {
  gameplay: [
    "Il gameplay risulta ripetitivo dopo le prime ore.",
    "Alcune meccaniche sembrano abbozzate e poco rifinite.",
    "Manca varietà nelle situazioni di gioco proposte.",
  ],
  technology: [
    "Si notano cali di prestazioni nei momenti più concitati.",
    "La base tecnica avrebbe bisogno di qualche ulteriore passata di ottimizzazione.",
    "Alcuni elementi tecnici risultano datati rispetto alla concorrenza.",
  ],
  graphics: [
    "Il comparto grafico è nella media e non lascia il segno.",
    "Alcune texture e modelli risultano poco dettagliati.",
    "La direzione artistica manca di un'identità forte.",
  ],
  sound: [
    "La colonna sonora è dimenticabile e poco presente.",
    "Gli effetti sonori risultano piatti in diverse situazioni.",
    "Il comparto audio è il punto più debole della produzione.",
  ],
  story: [
    "La trama perde ritmo nella parte centrale.",
    "I personaggi non vengono approfonditi a sufficienza.",
    "La narrazione è presente solo come pretesto, senza reale spessore.",
  ],
};

export const BUG_PHRASES = {
  low: [
    "Il titolo è uscito in condizioni tecniche solide, senza problemi rilevanti.",
    "Non abbiamo riscontrato bug degni di nota durante la prova.",
  ],
  medium: [
    "Alcuni bug minori si fanno notare ma non rovinano l'esperienza.",
    "Ci sono piccoli problemi tecnici che una patch potrebbe risolvere facilmente.",
  ],
  high: [
    "I numerosi bug presenti compromettono più volte l'esperienza di gioco.",
    "Crash e glitch frequenti rendono la sessione di gioco frustrante.",
  ],
};

export const GENERIC_OPENERS = [
  "Dopo diverse ore di gioco, il nostro verdetto è chiaro.",
  "Un titolo che si fa notare nel panorama indipendente.",
  "Lo studio dimostra ancora una volta di avere del potenziale.",
  "Un'uscita che gli appassionati del genere non dovrebbero ignorare.",
];

export const PLAYER_COMMENTS = [
  "Ci ho giocato tutto il weekend, non riuscivo a staccarmi.",
  "Consigliato, ma aspettatevi qualche imperfezione.",
  "Uno dei titoli indipendenti più interessanti che ho provato ultimamente.",
  "Ha del potenziale ma serve ancora del lavoro.",
  "Esperienza altalenante: alcuni momenti fantastici, altri meno riusciti.",
  "Lo rigiocherei volentieri, l'atmosfera è davvero riuscita.",
];
