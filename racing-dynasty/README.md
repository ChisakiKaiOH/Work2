# Racing Dynasty

A mobile racing-manager / car-collector game built with React 19, TypeScript and
Capacitor. You don't drive directly: you build a collection of original cars,
upgrade them, choose a race strategy, and watch the simulated race unfold —
then spend the rewards on more cars, upgrades and packs.

Every car brand, driver, circuit and boss in the game is original and invented
for this project (e.g. Auron, Veltara, Kronwerk, Ferrano, Rosso Motors). No
real manufacturer, athlete, team or circuit is referenced anywhere.

## Quick start

```bash
npm install
npm run dev       # local dev server (Vite)
npm run build     # type-check + production web build
npm run test      # Vitest unit test suite
npm run lint      # oxlint
```

See [BUILD.md](./BUILD.md) for the full build/release workflow, including how
to produce an Android APK.

## What's implemented

- **Garage & cars** — 50 original cars across 6 categories (Street → Legend)
  and 6 rarities (Common → Mythic), each with a full 9-stat profile and a
  deterministic Performance Rating (PR).
- **Upgrades** — 12 categories (grouped into Engine / Transmission / Chassis /
  Brakes), 10 levels each, escalating cost curve.
- **Race simulation** — a pure, UI-independent lap-by-lap simulator
  (`RaceSimulator`) driven by PR, tyre/weather matchups, strategy choice and
  driver archetype. Better cars win more often, never automatically.
- **World Tour** — 6 regions, 6 championships, 18 named bosses with their own
  personality, car and dialogue.
- **Packs & economy** — 8 packs with *visible* odds and a pity system, a daily
  procedural used-car market, 3 currencies (Credits / Tokens / Energy),
  achievements, collections, a 7-day daily-reward cycle, and a leveling system
  (1–100).
- **Mock-first services** — ads, store purchases, auth, cloud save,
  leaderboards and remote config are all implemented locally behind real
  interfaces so a backend can be added later without touching call sites. See
  [MONETIZATION.md](./MONETIZATION.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Documentation

| File | Covers |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Folder layout, data flow, how logic/data/UI are separated |
| [GAME_DESIGN.md](./GAME_DESIGN.md) | Rules, formulas, balancing, content quotas |
| [DATA_FORMAT.md](./DATA_FORMAT.md) | How to add/edit cars, tracks, championships, packs, etc. |
| [BUILD.md](./BUILD.md) | Local dev, web build, Android build/release |
| [MONETIZATION.md](./MONETIZATION.md) | What's virtual, what's mocked, the P2P-never guarantee |
| [TESTING.md](./TESTING.md) | Test suite layout and how to run it |

## Known simplifications (honest, not hidden)

- Events (`src/data/events.json`) are a fixed catalogue rather than a
  time-rotating scheduler; launching one plays a normal race on its track and
  weather. A real rotation (section "9+ rotating event types") would need a
  scheduled RemoteConfig-driven activation window — the data model already
  supports it (`EventDef`), only the rotation clock is not wired up yet.
- Leaderboards show fixed mock rival names (`LocalLeaderboardService`); there
  is no real multiplayer backend.
- Boss races pit the player against the named boss plus 5 generated filler
  opponents, not an exclusive 1-on-1.
