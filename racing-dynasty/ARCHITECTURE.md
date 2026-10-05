# Architecture

## Stack

React 19 + TypeScript + Vite + Capacitor (Android), the same proven stack
already used by `indie-studio-tycoon` and `ifc-viewer` elsewhere in this
repository. State is a single `PlayerState` managed with `useReducer` +
Context — no external state library. This was a deliberate choice: the brief
asked to analyze the existing project first and not change a working
framework without reason, and this stack is also a good fit for a
manager/simulation game that doesn't need real-time 3D rendering.

## Folder layout

```
src/
  types/        Domain model (PlayerState, CarDef, RaceResult, ...) — the
                single source of truth every other layer imports from.
  data/         Game CONTENT as JSON (cars, tracks, championships, bosses,
                packs, events, achievements, daily rewards, collections,
                brands) + data/index.ts which loads and types it.
  services/     Pure game-logic modules: performanceRating, conditions
                (tyre/weather), strategy, progression (XP/energy), economy,
                achievements, packs (gacha+pity), market (used-car listings),
                backendMocks (Auth/CloudSave/Leaderboard/RemoteConfig/
                EconomyValidation interfaces).
  simulation/   RaceSimulator (pure, UI-independent) + bots (opponent
                generation) + rng (seeded PRNG).
  game/         actions.ts (the GameAction union), reducer.ts (all state
                transitions), initialState.ts, GameContext.tsx (Provider +
                autosave + energy tick), hooks.ts.
  save/         SaveManager (localStorage, versioned).
  ads/          AdService interface + MockAdService.
  monetization/ MonetizationService interface + MockMonetizationService +
                STORE_PRODUCTS catalogue.
  audio/        AudioManager — fully procedural (Web Audio API oscillators,
                zero external audio assets or licensing risk).
  components/   Shared, stateless UI pieces (CarArt, Card, Button, StatBar,
                TopBar, BottomNav, Modal, badges, CarCard).
  screens/      One component per screen + navigation.ts (the Screen union
                and RaceLaunch nav-param type).
```

## The core principle: logic is never mixed with content

Every car, track, championship, boss, pack, event, achievement, daily reward
and collection lives in `src/data/*.json`, typed against interfaces in
`src/types`. Nothing in `services/`, `simulation/` or `game/` hardcodes a car
name, a PR number, a cost or an odds table — it all reads from `data/`. Adding
a new car, track or pack is purely a data change; see
[DATA_FORMAT.md](./DATA_FORMAT.md).

## Data flow

```
User taps a button in a screen
  → dispatch(GameAction)                (game/hooks.ts → GameDispatchContext)
  → gameReducer(state, action)          (game/reducer.ts)
      - validates the action (can the player afford it? is there room? ...)
      - calls into services/ and simulation/ for the actual computation
      - returns a new PlayerState
  → GameProvider re-renders            (game/GameContext.tsx)
      - a debounced effect persists the new state via SaveManager
      - an interval dispatches TICK_ENERGY periodically so energy regen is
        reflected even if the player leaves a screen open
  → screens re-render from useGameState()
```

`RaceScreen` is the one place where a computation (`simulateRace`) happens
outside the reducer, because the result needs to be *animated* lap by lap
before it's committed to state. The actual `RaceResult` object, though, comes
straight from `simulation/raceSimulator.ts` — a pure function with a documented
input/output contract (`RaceInput` → `RaceResult`) that doesn't know React or
the UI exists, and is unit-tested in isolation (see
`src/simulation/raceSimulator.test.ts`).

## Anti-cheat posture

All currency/energy mutation goes through `services/economy.ts`
(`canAfford`/`spend`/`add`/`clamp`), itself only ever called from inside
`gameReducer` — never from a screen component directly. This keeps every
economic change in one auditable place. `services/backendMocks.ts` already
defines an `EconomyValidationService` interface for a future server to
re-validate the same deltas; today it's a local pass-through
(`LocalEconomyValidationService`), but nothing about the call sites would need
to change to wire in a real one.

## Future-backend readiness

`src/services/backendMocks.ts` defines real interfaces for `AuthService`,
`CloudSaveService`, `LeaderboardService`, `RemoteConfigService` and
`EconomyValidationService`. Every one of them is backed by a `Local*`
implementation today (no network call is ever made), but because the rest of
the app only imports the interface + the exported singleton, swapping in a
real backend implementation later is a one-file change per service.

## Extensibility

- New content (cars, tracks, championships, regions, packs, events, bosses)
  is additive JSON — no code change needed for the data itself.
- `GameAction` is a discriminated union; adding a new player action means one
  new variant + one new `case` in the reducer, nothing else needs to change.
- Screens are added to `screens/navigation.ts`'s `Screen` union and wired in
  `App.tsx`'s screen switch — the bottom nav stays flat by design (5 tabs,
  with a "More" hub for secondary screens) so new screens don't deepen the
  navigation.
- Multiplayer / clans / marketplace / seasons / battle pass / tournaments are
  not implemented, but nothing in the architecture assumes a single-player
  world: `PlayerState` is already a self-contained save blob, `LeaderboardService`
  and `CloudSaveService` already model a multi-user boundary, and `RemoteConfigService`
  is the intended seam for server-tunable economy values (prices, odds, event
  windows) without an app update.
