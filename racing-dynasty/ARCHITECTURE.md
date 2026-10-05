# Architecture

## Stack

React 19 + TypeScript + Vite + Capacitor (Android) — unchanged from the
project's earlier iteration and from the other game projects in this
repository. The brief explicitly asked not to change a working framework
without reason (section 102); this stack is a good fit for a turn-paced
manager game and nothing about the Phase 1 redesign needed a different one.

## Folder layout

```
src/
  types/        Domain model: GameDate/CalendarEntry, CarDef/CarInstance,
                DriverDef/DriverContract, TeamDef, TrackDef/ChampionshipDef,
                the race engine's RaceParticipant/DecisionOption/RaceEvent/
                RaceResult, AuctionDef/AuctionState, and PlayerState (the
                single save-game shape).
  data/         Game CONTENT as JSON (manufacturers, cars, drivers, tracks,
                championships, AI teams, the 1970 calendar, auctions) +
                data/index.ts which loads and types it with id-lookup maps.
  services/     Pure logic, one concern per file: time (calendar helpers),
                finance (budget/ledger), contracts (hire/rent/release/tick),
                cars (instance creation/rental-due check), market (used-car
                + driver-offer generation), auctions (bid/rival-round/close),
                carRating (a car's at-a-glance pace number).
  sim/          rng (seeded PRNG), fieldGenerator (AI opponent rosters per
                race), raceEngine (the dynamic, decision-driven race sim —
                see below).
  game/         actions.ts (the GameAction union), reducer.ts (every state
                transition), initialState.ts (createNewCareer), GameContext
                + hooks (React wiring, autosave).
  save/         SaveManager (localStorage, versioned).
  components/   Shared, stateless UI pieces (CarArt procedural silhouette,
                Button, Card, Modal, ProgressBar, StatBar, RarityBadge,
                TopBar, BottomNav).
  screens/      One component per screen + navigation.ts (the Screen union
                and the EventScreen type for the Race/Auction overlays).
```

## Logic/content separation

Every car, driver, track, championship, AI team and auction lives in
`src/data/*.json`, typed against interfaces in `src/types`. Nothing in
`services/`, `sim/` or `game/` hardcodes a car name, a stat value or a
price — see [DATA_FORMAT.md](./DATA_FORMAT.md) for how to add content
without touching any logic file.

## Data flow

```
User taps a button in a screen
  → dispatch(GameAction)                (game/hooks.ts → GameDispatchContext)
  → gameReducer(state, action)          (game/reducer.ts)
      - validates the action (affordable? right calendar entry? free agent?)
      - calls into services/ for the actual computation
      - returns a new PlayerState
  → GameProvider re-renders            (game/GameContext.tsx)
      - a debounced effect persists the new state via SaveManager
  → screens re-render from useGameState()
```

`RaceScreen` is the one place a computation happens outside the reducer: the
race needs to be stepped lap-by-lap and paused at decision points for the
real player, so the screen owns a local `EngineState` and only dispatches
`APPLY_RACE_RESULT` once the race is actually finished. The engine itself
(`src/sim/raceEngine.ts`) is a pure, UI-independent state machine — the
exact same `advanceLap`/`getDecisionPoint` calls drive both the interactive
screen and `simulateRaceAuto` (used by tests and the "skip to result"
button), so there is only one simulation code path to get right.

## The race engine, briefly

Three pure functions are the whole public surface:

- `createEngineState(input: RaceInput): EngineState` — builds the initial
  per-runner state (distance, tyre wear, fuel) and picks which laps will
  have a player decision point (2 "racing" laps + 1 "pit strategy" lap,
  scaled to the track's lap count).
- `getDecisionPoint(state): LapDecisionPoint | null` — pure: given the
  current state, is the *upcoming* lap a decision lap? If so, computes each
  option's success chance from `BASE + driverSkillMod + carStatMod +
  trackMod - weatherPenalty + experienceMod`, clamped to [5, 95] — see
  GAME_DESIGN.md for the exact weights. This is never a coin flip dressed
  up as a decision: a stronger driver/car/track matchup visibly raises the
  number shown to the player.
- `advanceLap(state, decision | null): { state, events, finished }` —
  resolves exactly one lap for every runner (AI included), applying the
  player's chosen decision's pace/wear/fuel effect if one was supplied, then
  detects overtakes, mechanical failures, driver errors and (rarely) a
  safety car. The same function is called by the interactive screen one lap
  at a time and by `simulateRaceAuto` in a tight loop.

Why this shape: it keeps the interactive UI, the instant-skip button, and
the test suite all running literally the same simulation, instead of three
divergent implementations that could silently disagree.

## Anti-cheat posture

All budget mutation goes through `services/finance.ts`'s `applyTransaction`,
itself only ever called from inside `gameReducer` — never from a screen
component directly. Every purchase/rental/hire action re-checks
affordability in the reducer (not just via a disabled button in the UI),
so the single auditable place to intercept for a future server-side
validation pass is the reducer, not every screen.

## Extensibility toward later phases

- **New seasons**: `src/data/calendar_1970.json` is the only season-specific
  file; a 1971 season is a new `calendar_1971.json` plus whatever new cars/
  drivers that year introduces — `initialState.ts` and the reducer don't
  assume a single season, they just start the campaign at calendar index 0
  of whichever `PlayerState.calendar` was built for the current career.
- **AI team persistence** (full economy simulation, section 67-68): the
  `TeamDef`/`DriverDef`/`CarInstance` shapes already model ownership and
  contracts generically — the natural next step is giving each AI team in
  `data/teams.json` real persistent rosters and driving their buy/rent/hire
  decisions through the same `services/` functions the player uses, rather
  than the current per-race `fieldGenerator`.
- **Licensed real-world assets**: `CarDef`/`DriverDef`/`ManufacturerDef`
  already separate an internal id from a `displayName` — a future licensed
  content pack would add real photos/logos keyed by the same ids without
  touching any logic file, exactly as the brief's `AssetManager` concept
  (section 78-80) describes, just not built out yet since no licensed asset
  exists to manage.
