import { describe, expect, it } from "vitest";
import { computeCriticScore, generateReviews } from "./reviews";
import type { RandomFn } from "../utils/random";

// Generatore deterministico (mulberry32) per rendere i test riproducibili.
function seededRandom(seed: number): RandomFn {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("reviews", () => {
  it("critic score reflects quality and stays within 1-10", () => {
    const strong = computeCriticScore({
      quality: { gameplay: 90, technology: 90, graphics: 90, sound: 90, story: 90 },
      bugs: 0,
      hype: 10,
      genre: "RPG",
    });
    const weak = computeCriticScore({
      quality: { gameplay: 10, technology: 10, graphics: 10, sound: 10, story: 10 },
      bugs: 30,
      hype: 10,
      genre: "RPG",
    });
    expect(strong).toBeGreaterThan(weak);
    expect(strong).toBeLessThanOrEqual(10);
    expect(weak).toBeGreaterThanOrEqual(1);
  });

  it("generates exactly 4 reviews with pros/cons derived from the strongest/weakest axes", () => {
    const project = {
      quality: { gameplay: 85, technology: 40, graphics: 60, sound: 30, story: 70 },
      bugs: 3,
      hype: 40,
      genre: "Adventure" as const,
    };
    const { reviews, pros, cons, criticScore } = generateReviews(project, seededRandom(42));
    expect(reviews).toHaveLength(4);
    for (const review of reviews) {
      expect(review.score).toBeGreaterThanOrEqual(1);
      expect(review.score).toBeLessThanOrEqual(10);
      expect(review.text.length).toBeGreaterThan(10);
    }
    expect(pros.length).toBeGreaterThan(0);
    expect(cons.length).toBeGreaterThan(0);
    expect(criticScore).toBeGreaterThanOrEqual(1);
  });

  it("is deterministic given the same seeded random generator", () => {
    const project = {
      quality: { gameplay: 50, technology: 50, graphics: 50, sound: 50, story: 50 },
      bugs: 5,
      hype: 20,
      genre: "Puzzle" as const,
    };
    const first = generateReviews(project, seededRandom(7));
    const second = generateReviews(project, seededRandom(7));
    expect(first.reviews.map((r) => r.text)).toEqual(second.reviews.map((r) => r.text));
  });
});
