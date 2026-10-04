import type { Allocation, Genre, QualityAxis } from "../types";

// Peso ideale per asse di qualità, per genere (0-4: assente, basso, medio, alto, molto alto).
// Usato per calcolare quanto l'allocazione scelta dal giocatore sia adatta al genere.
const WEIGHTS: Record<Genre, Record<QualityAxis, number>> = {
  RPG: { gameplay: 3, technology: 2, graphics: 2, sound: 3, story: 4 },
  Puzzle: { gameplay: 4, technology: 2, graphics: 2, sound: 2, story: 1 },
  Horror: { gameplay: 3, technology: 2, graphics: 3, sound: 4, story: 3 },
  Action: { gameplay: 4, technology: 3, graphics: 3, sound: 2, story: 1 },
  Adventure: { gameplay: 2, technology: 1, graphics: 3, sound: 2, story: 4 },
  Strategy: { gameplay: 4, technology: 3, graphics: 1, sound: 1, story: 2 },
  Simulation: { gameplay: 3, technology: 4, graphics: 2, sound: 1, story: 1 },
  Racing: { gameplay: 3, technology: 4, graphics: 3, sound: 2, story: 0 },
  Sports: { gameplay: 4, technology: 3, graphics: 2, sound: 1, story: 0 },
  Casual: { gameplay: 3, technology: 1, graphics: 2, sound: 2, story: 1 },
};

export const GENRES: Genre[] = [
  "Action",
  "RPG",
  "Adventure",
  "Strategy",
  "Simulation",
  "Horror",
  "Racing",
  "Sports",
  "Puzzle",
  "Casual",
];

export function idealAllocationFor(genre: Genre): Allocation {
  const w = WEIGHTS[genre];
  const total = w.gameplay + w.technology + w.graphics + w.sound + w.story;
  return {
    gameplay: (w.gameplay / total) * 100,
    technology: (w.technology / total) * 100,
    graphics: (w.graphics / total) * 100,
    sound: (w.sound / total) * 100,
    story: (w.story / total) * 100,
  };
}

export function axisWeight(genre: Genre, axis: QualityAxis): number {
  return WEIGHTS[genre][axis];
}

const AXIS_LABEL: Record<QualityAxis, string> = {
  gameplay: "Gameplay",
  technology: "Tecnologia",
  graphics: "Grafica",
  sound: "Audio",
  story: "Narrativa",
};

export function axisLabel(axis: QualityAxis): string {
  return AXIS_LABEL[axis];
}

// Descrizione testuale dei pesi di un genere, per la schermata di creazione progetto.
export function genreWeightSummary(genre: Genre): string {
  const w = WEIGHTS[genre];
  const tierLabel = (v: number) => ["assente", "basso", "medio", "alto", "molto alto"][v];
  return (Object.keys(w) as QualityAxis[])
    .map((axis) => `${axisLabel(axis)}: ${tierLabel(w[axis])}`)
    .join(" · ");
}
