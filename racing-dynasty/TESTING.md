# Testing

```bash
npm run test          # vitest run — the whole suite, once
npx vitest             # watch mode
npx vitest run <path>  # a single file
```

61 tests across 11 files, all in the pure logic/data layer. The UI was
additionally verified end-to-end with a scripted Playwright session against
the production build during development (see "Manual QA" below) — not
checked into the repo as an automated test, since it drives a real browser
rather than fitting Vitest's unit-test model.

## Suite layout

| File | Covers |
|---|---|
| `src/services/carRating.test.ts` | Determinism, monotonicity (power/speed/handling up → rating up, lighter → higher), an Iconic car outrating a Common one |
| `src/services/time.test.ts` | Day-count math, `nextEntry`/`isSeasonOver` at and past the calendar's end |
| `src/services/finance.test.ts` | `canAfford` exact-match edge, transaction ledger bookkeeping, empty-ledger balance |
| `src/services/contracts.test.ts` | Hire/rent/release/renegotiate, contract auto-expiry on `tickDriverContract`, no-op on a driver with no contract |
| `src/services/cars.test.ts` | Instance creation (unique ids, full starting condition), rental-due detection |
| `src/services/market.test.ts` | Used-car listings never include an `Iconic` car, driver offers only ever include free agents (and zero when none exist) |
| `src/services/auctions.test.ts` | Opening state, minimum next bid, a poor rival never risking more than 60% of its budget, a wealthy/reputable rival outbidding a poor one more often across many rounds, the bidder→status mapping in `closeAuction` |
| `src/sim/raceEngine.test.ts` | Decision points appear only on the scripted laps with valid [5,95] probabilities, a skilled driver gets a higher Attack chance, deterministic for a fixed seed, points awarded match the championship's table, **a stronger car/driver wins more often across many seeds (statistical, not a single run)**, DNF entries score 0 points |
| `src/game/reducer.test.ts` | Full integration through the public action API — see below |
| `src/save/SaveManager.test.ts` | Round-trip save/load, no-save-yet → null, corrupted JSON fails safe to null, export/import round-trip, garbage import → null |

## `reducer.test.ts` in detail

Career setup, garage (buy/rent/sell, including an unaffordable-purchase
refusal), drivers (hire/release, refusing to hire an already-contracted
driver), time (refusing to skip a `RACE` entry), a full race round-trip
(hire → buy → select → race → apply result: salary paid, prize money
awarded, championship standings updated, calendar advanced), refusing to
apply a race result outside a `RACE` entry, auctions (bidding raises the
price, pass resolves it), and the null-state guard (every action except
`NEW_CAREER`/`LOAD_SAVE`/`RESET_SAVE` is ignored when there's no career
yet).

**Regression test**: closing an auction (via `AUCTION_PASS` or reaching
`maxRounds` on `AUCTION_BID`) must advance the calendar past the `AUCTION`
entry — an earlier version of the reducer cleared `activeAuction` without
advancing `currentEntryIndex`, which left the career stuck showing the same
resolved auction forever with no way to proceed. Found via the manual
Playwright QA pass described below, fixed, and locked in as a test.

## Why the race-engine and auction tests are statistical, not single-run

Both the race engine and auction rival behavior deliberately include
bounded randomness (driver consistency noise, incident rolls; a rival's
random interest roll) — that's the whole point of "a better car/richer
rival wins more often, never guaranteed." The corresponding tests therefore
run many seeds and assert a win-rate comparison, not a single outcome.

## Manual QA performed (not automated)

A full Playwright session against `npm run build && npm run preview`
walked: new career → hire a driver → buy a car → select car+driver → advance
through pre-season/test → race (skip-to-result) → result → continue →
advance to the auction → bid (or correctly see it disabled when
underfunded) → pass → back to Home → race through the remaining calendar →
season-end summary screen. A second pass specifically waited for (rather
than skipped past) a live decision point to confirm the computed
percentages actually render in the UI (e.g. "Attacca — 77%"), and a third
pass reloaded the page after a new career to confirm the autosave/load
round-trip works in the browser, not just in `SaveManager.test.ts`. Zero
console/page errors in any pass. This is recorded here rather than
committed as a script, since it drives a real browser rather than fitting
the `npm run test` pipeline.
