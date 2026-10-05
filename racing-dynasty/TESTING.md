# Testing

```bash
npm run test          # vitest run — the whole suite, once
npx vitest             # watch mode
npx vitest run <path>  # a single file
```

69 tests across 8 files, all in the pure logic/data layer (no UI component
tests — the UI was instead verified with a manual Playwright smoke pass
through every screen during development; see the "Known simplifications"
note in README.md for what that did and didn't cover).

## Suite layout

| File | Covers |
|---|---|
| `src/services/performanceRating.test.ts` | PR formula determinism & monotonicity, starter-car calibration (~PR 180), tier thresholds, upgrade cost curve, `isMaxLevel` edge, stat clamping at max upgrades |
| `src/simulation/raceSimulator.test.ts` | Standings integrity (one entry per participant, unique positions), determinism for a fixed seed, "better car wins more often — not guaranteed" (statistical, same field, weak vs. maxed-out car), lap count matches `track.laps`, DNF invariants (0 credits/bonus) |
| `src/services/packs.test.ts` | Every opening returns the right car count with valid rarities, pity resets at the guaranteed floor, pity never runs away past the threshold, a pack always produces *some* valid result at 0 pity, every pack's odds sum to a positive total |
| `src/services/economy.test.ts` | `canAfford` exact-match edge, `spend` throws `InsufficientFundsError` with **0 credits** and **0 energy**, `add` never goes negative, `clamp` bounds |
| `src/services/progression.test.ts` | XP curve monotonicity, single and cascading level-ups, **XP never exceeds `MAX_LEVEL`** even with an absurd grant, 0-XP no-op, energy regen math (including **0-energy no-op**, **already-at-max no-op**, partial-interval carry-over) |
| `src/services/achievements.test.ts` | No false-positive unlocks for a fresh player, unlocks once the threshold is met, never re-reports an already-unlocked id, the `maxUpgradesOnCar` "any category" vs. "every category on one car" distinction, 0-cars edge case |
| `src/save/SaveManager.test.ts` | Round-trip save/load, `hasSave()`/`clear()`, **no-save-yet returns null rather than throwing**, **corrupted JSON fails safe to null**, export/import round-trip, garbage-input import returns null |
| `src/game/reducer.test.ts` | Full integration through the public action API: `NEW_GAME`/`CHOOSE_STARTER_CAR` (and that it can only happen once), `UPGRADE_CAR` happy path + **0-credit refusal** + **max-level refusal**, `APPLY_RACE_RESULT` happy path + **0-energy refusal**, no win credited on DNF, championship completion on the final race with ≥3 wins, `OPEN_PACK` happy path + **invalid pack id** + **full-garage refusal**, `BUY_MARKET_CAR` **full-garage refusal**, `CLAIM_DAILY_REWARD` happy path + same-day double-claim refusal + missed-streak reset + 7→1 wrap, achievement auto-unlock via `postProcess`, and that a `null` player state ignores every action except `NEW_GAME`/`LOAD_SAVE`/`RESET_SAVE` |

## Required edge cases, and where they live

The brief calls out a specific list of edge cases to cover. All are present:

- **0 credits** → `economy.test.ts` ("spend throws... with 0 credits"),
  `reducer.test.ts` ("refuses to upgrade when credits are insufficient")
- **0 energy** → `economy.test.ts`, `progression.test.ts` (`tickEnergy`
  no-op), `reducer.test.ts` ("refuses to apply a race result when energy is 0")
- **Max upgrade level** → `performanceRating.test.ts` (`isMaxLevel`),
  `reducer.test.ts` ("refuses to upgrade past MAX_UPGRADE_LEVEL")
- **Invalid pack rewards** → `packs.test.ts` ("never returns a rarity below
  Common or above Mythic"), `reducer.test.ts` ("rejects an invalid pack id")
- **Full garage** → `reducer.test.ts` (`OPEN_PACK` and `BUY_MARKET_CAR` both
  refuse to overflow `garageSlots`; the same guard also protects boss car
  rewards and starter/premium purchase car grants in `game/reducer.ts`)

## Why the race-simulation tests are statistical, not single-run

`simulateRace` deliberately includes bounded randomness (driver
consistency noise, incident/failure rolls) so races aren't perfectly
predictable from PR alone — that's a design requirement, not a flaw. The
"better car wins more often" test therefore races the *same* car, unupgraded
vs. fully upgraded, against an *identical* opponent field across 25 different
seeds and checks the win **count**, not a single outcome. This is the correct
way to test "higher win probability, not guaranteed."

## Manual QA performed (not automated)

A full click-through of every screen was done with a headless Playwright
session against the production build (`npm run build && npm run preview`)
during development: new game → starter car pick → 6-step tutorial → Home →
Garage → car detail → upgrade → Race (free race, championship race, boss
race) → animated race → skip-to-result → rewards → pack opening (with reveal
modal) → World Tour (regions → championships → boss list) → More →
Market/Collection/Achievements/Leaderboard/Settings → daily reward claim.
Zero console/page errors were observed. This is recorded here rather than
committed as a script, since it isn't part of the automated `npm run test`
pipeline.
