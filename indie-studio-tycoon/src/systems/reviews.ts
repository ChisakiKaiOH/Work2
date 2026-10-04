import type { Project, QualityAxis, Review, ReleasedGame } from "../types";
import { compositeQualityScore } from "./development";
import {
  STRONG_AXIS_PHRASES,
  WEAK_AXIS_PHRASES,
  BUG_PHRASES,
  GENERIC_OPENERS,
  PLAYER_COMMENTS,
} from "../data/reviewPhrases";
import { axisLabel } from "../data/genres";
import { generateReviewerName } from "../utils/nameGenerator";
import { pick, pickMany, randomFloat, type RandomFn, defaultRandom } from "../utils/random";
import { clamp, round1 } from "../utils/format";

const AXES: QualityAxis[] = ["gameplay", "technology", "graphics", "sound", "story"];

function sortedAxes(project: Pick<Project, "quality">): QualityAxis[] {
  return [...AXES].sort((a, b) => project.quality[b] - project.quality[a]);
}

function bugTier(bugs: number): keyof typeof BUG_PHRASES {
  if (bugs < 5) return "low";
  if (bugs < 15) return "medium";
  return "high";
}

export function computeCriticScore(project: Pick<Project, "quality" | "bugs" | "hype" | "genre">): number {
  const qualityScore = compositeQualityScore(project as Project);
  let score = qualityScore / 10;
  if (project.hype > qualityScore * 1.3 + 15) {
    score -= 1; // il gioco non ha rispettato le aspettative generate dal hype
  }
  return clamp(round1(score), 1, 10);
}

export function generateReviews(
  project: Pick<Project, "quality" | "bugs" | "hype" | "genre">,
  rng: RandomFn = defaultRandom
): { reviews: Review[]; pros: string[]; cons: string[]; criticScore: number } {
  const criticScore = computeCriticScore(project);
  const order = sortedAxes(project);
  const strongAxes = order.slice(0, 2);
  const weakAxes = order.slice(-2);
  const tier = bugTier(project.bugs);

  const reviews: Review[] = [];

  reviews.push({
    id: "r1",
    author: generateReviewerName(rng),
    score: clamp(round1(criticScore + randomFloat(-0.4, 0.4, rng)), 1, 10),
    text: `${pick(GENERIC_OPENERS, rng)} ${pick(STRONG_AXIS_PHRASES[strongAxes[0]], rng)} ${pick(BUG_PHRASES[tier], rng)}`,
  });

  reviews.push({
    id: "r2",
    author: generateReviewerName(rng),
    score: clamp(round1(criticScore + randomFloat(-0.6, 0.3, rng)), 1, 10),
    text: `${pick(WEAK_AXIS_PHRASES[weakAxes[0]], rng)} Detto questo, ${pick(STRONG_AXIS_PHRASES[strongAxes[1]], rng).toLowerCase()}`,
  });

  reviews.push({
    id: "r3",
    author: generateReviewerName(rng),
    score: clamp(round1(criticScore + randomFloat(-0.3, 0.5, rng)), 1, 10),
    text: `${pick(BUG_PHRASES[tier], rng)} ${pick(STRONG_AXIS_PHRASES[strongAxes[0]], rng)}`,
  });

  reviews.push({
    id: "r4",
    author: generateReviewerName(rng),
    score: clamp(round1(criticScore + randomFloat(-0.5, 0.5, rng)), 1, 10),
    text: `${pick(PLAYER_COMMENTS, rng)} ${pick(WEAK_AXIS_PHRASES[weakAxes[1]], rng)}`,
  });

  const pros = strongAxes.map((axis) => `Punto di forza: ${axisLabel(axis)}`);
  const cons = weakAxes.map((axis) => `Punto debole: ${axisLabel(axis)}`);
  if (project.bugs >= 15) cons.unshift("Diversi bug segnalati dalla critica");

  return { reviews, pros, cons, criticScore };
}

export function playerCommentsFor(game: Pick<ReleasedGame, "criticScore">, rng: RandomFn = defaultRandom): string[] {
  const count = game.criticScore >= 6 ? 3 : 2;
  return pickMany(PLAYER_COMMENTS, count, rng);
}
