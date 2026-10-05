# Game Design

## Core loop

**Garage → choose/upgrade a car → choose a strategy → race (simulated) →
collect rewards → progress (XP, currency, new cars) → repeat, with more
options unlocking (World Tour, packs, market, collections, achievements).**

## Performance Rating (PR)

PR is a deterministic, never-random formula over a car's *effective* stats
(base stats + upgrade bonuses), computed in
`src/services/performanceRating.ts`:

```
raw = power*0.20 + acceleration*0.15 + topSpeed*0.17 + braking*0.12
    + grip*0.14 + stability*0.08 + reliability*0.06 + traction*0.08

weightBonus = clamp((1500 - weight) / 10, -20, 40)

PR = round(raw * 1.9 + weightBonus + 15)
```

### Tiers

| Tier | PR range |
|---|---|
| Rookie | < 300 |
| Street | 300–399 |
| Sport | 400–499 |
| Super | 500–599 |
| Hyper | 600–699 |
| Legend | 700+ |

The three starter cars (Auron Swift, Veltara GT, Kron R) are calibrated to
land at PR ≈ 180 (Rookie), matching their intended starting-point role. Base
(un-upgraded) cars intentionally sit a tier or so below their category name —
upgrades are what closes the gap to the top of a tier and beyond. This is a
deliberate design choice, not a bug: it's what makes the 12-category, 10-level
upgrade system meaningful progression rather than a formality.

## Upgrades

12 categories, grouped for the UI:

| Group | Categories |
|---|---|
| Engine | Engine, Turbo, ECU, Exhaust |
| Transmission | Gearbox, Clutch, Differential |
| Chassis | Suspension, WeightReduction, Chassis |
| Brakes | BrakeSystem, BrakeCooling |

Each category has 10 levels. Cost to go from level *L* to *L+1* is
`round(baseCost[category] * (L+1)^1.55)` — an escalating curve so late levels
are a meaningful credit sink. If the player holds at least one "upgrade part"
(a rarer currency earned from races/packs), the next upgrade costs 25% less
and consumes one part.

## Race simulation

`simulateRace` (in `src/simulation/raceSimulator.ts`) runs lap by lap. Each
runner's per-lap "pace" is a function of:

- PR (from effective stats)
- tyre grip/braking for the current weather (see tables below)
- weather's acceleration/reliability multiplier
- the chosen strategy's pace multiplier
- driver skill/consistency (adds a bounded random noise term — this is where
  "not fully predictable" comes from, not from ignoring PR)
- accumulated tyre wear and fuel level (both increase with strategy
  aggressiveness)

Overtakes are detected by comparing cumulative-distance position order lap to
lap. Pit stops trigger automatically once tyre wear crosses 72% (skipped on
the final lap). Mechanical-failure risk scales with low reliability, harsh
weather and a risky strategy; a separate, smaller "incident" risk costs pace
for one lap without ending the race.

**A better car wins more often — never guaranteed.** This is verified in
`raceSimulator.test.ts` by racing the same car, unupgraded vs. fully
upgraded, against an identical opponent field across many seeds.

## Strategy

| Strategy | Pace | Tyre wear | Fuel wear | Overtake bonus | Defense bonus | Incident risk |
|---|---|---|---|---|---|---|
| Attack | +7% | +25% | +15% | +8% | -3% | +10% |
| Balanced | — | — | — | — | — | — |
| Defend | -5% | -22% | -10% | -4% | +9% | -20% |
| Risky | +4% | +35% | +10% | +14% | -6% | +60% |

## Weather × tyres

6 weather conditions (Dry, Rain, HeavyRain, Night, Heat, Cold) × 5 tyre types
(Street, Sport, Racing, Rain, WetRacing). Racing tyres are strongest in Dry
and weakest in Rain/HeavyRain; Rain and WetRacing tyres invert that
relationship. Full multiplier tables are in `src/services/conditions.ts`.

## Economy — exactly 3 currencies

- **Credits** — the main currency, earned from races, used for upgrades, the
  market and most packs.
- **Tokens** — the premium-feeling but still entirely virtual currency, used
  for the better packs; earned from level-ups, achievements, collections and
  occasional race drops.
- **Energy** — gates how many races can be played before waiting (or
  watching an ad) to continue; regenerates automatically over real time
  (1 point / 3 minutes by default, tunable via `RemoteConfigService`).

"Denaro" in this game always means Credits — there is no mechanism anywhere
that converts in-game currency back to real money.

## Gacha packs — visible odds + pity

Every pack's odds (`PackDef.odds`) are exactly the numbers shown in the UI —
nothing is secretly reweighted beyond the documented pity mechanic, which
itself is shown as a counter ("Pity: 4/15") in the Packs screen. Once a pack
has gone `pityThreshold` openings without reaching its `guaranteedRarityAt`
floor, the next opening's last roll is forced to that floor rarity and the
counter resets. See `src/services/packs.ts` and `packs.test.ts`.

## Progression

- Levels 1–100. XP needed for level *L → L+1* is `round(100 * L^1.35)`.
- Every level grants credits (+tokens every 5th level, +a pack every 10th).
- Max energy increases by 2 every 5 levels.

## Daily reward cycle

Day 1 Credits → Day 2 Energy → Day 3 Upgrade Parts → Day 4 Tokens → Day 5
Pack → Day 6 Credits → Day 7 Premium Pack, then loops. Missing more than one
full day resets the streak to day 1 rather than locking the player out or
losing banked progress otherwise — not excessively punishing, per the brief.

## Content quotas (current build)

| Content | Count |
|---|---|
| Cars | 50 |
| Tracks | 20 |
| Championships | 6 |
| Bosses | 18 (3 per region × 6 regions) |
| Achievements | 30 |
| Events | 10 |
| Packs | 8 |
| Daily reward days | 7 |
| Collections | 8 |
| Invented brands | 15 |

## Starter cars

| Car | PR | Identity |
|---|---|---|
| Auron Swift | ~180 | High acceleration |
| Veltara GT | ~180 | Balanced |
| Kron R | ~180 | High top speed |

Meaningfully different, not wildly unbalanced — exactly as specified.
