# Data Format — adding/editing content

All game content lives in `src/data/*.json`, typed against interfaces in
`src/types/index.ts` and re-exported (with id-lookup maps) from
`src/data/index.ts`. None of it requires a logic change to take effect.

> After editing any file in `src/data/`, run `npx tsc -p tsconfig.app.json
> --noEmit` — TypeScript checks every JSON file against its `*Def`
> interface, so a missing/misspelled field is caught immediately.

## Adding a manufacturer (`manufacturers.json` → `ManufacturerDef[]`)

```json
{ "id": "mfr_newmark", "displayName": "Newmark Racing", "country": "Spain", "founded": 1962 }
```

Pick an original name — see README's "A note on names" for why this project
uses fully invented names rather than disguised real trademarks.

## Adding a car (`cars.json` → `CarDef[]`)

```json
{
  "id": "car_011",
  "displayName": "Newmark NR12",
  "manufacturerId": "mfr_newmark",
  "year": 1970,
  "category": "GT",
  "rarity": "Rare",
  "stats": { "power": 150, "weight": 1250, "topSpeed": 165, "handling": 130, "braking": 128, "reliability": 140, "aerodynamics": 105 },
  "baseValue": 180000,
  "rentPricePerEvent": 16000,
  "historicalImportance": 35,
  "colorPrimary": "#1c3a5e",
  "colorSecondary": "#f2f2f2",
  "silhouette": "coupe",
  "description": "Short, original flavor text."
}
```

- `category` is one of `Formula | SportsCar | GT | Touring | Prototype`.
- `rarity` is one of `Common | Uncommon | Rare | Epic | Legendary | Iconic`.
  **`Iconic` is reserved** for cars meant to arrive via a dedicated auction
  event (see "Adding an auction" below) — `services/market.ts` excludes
  `Iconic` cars from the normal random used-car market on purpose.
- `silhouette` picks the procedural SVG body shape `CarArt.tsx` renders:
  `coupe | roadster | hypercar | prototype | suv-coupe | classic`.
- There's no "PR" stored on the car — `carRating(stats)` derives it at
  render/simulation time (see GAME_DESIGN.md for the formula). Sanity-check
  a new car's intended tier by calling `carRating` on its stats if unsure.

## Adding a driver (`drivers.json` → `DriverDef[]`)

All ship with `"status": "free_agent"`, `"form": 0`, and a reasonable
`"morale"` (60-80) — the player (or a future AI team) hires them from there.
`skills` are 0-100; see GAME_DESIGN.md for which skill feeds which race
decision so a new driver's identity (an ace in the wet, a consistent
veteran, a reckless rookie) actually shows up during races, not just in a
stat sheet nobody reads.

## Adding a track (`tracks.json` → `TrackDef[]`)

`laps` × `lengthKm` sets race length (and therefore roughly how many laps
the engine has to place its 3 decision points across — very short tracks
get a minimum lap floor, see `createEngineState` in `raceEngine.ts`).
`overtakeDifficulty` (0-100) and `rainProbability` (0-1) both feed directly
into the decision-chance formula and the weather roll.

## Adding a championship (`championships.json` → `ChampionshipDef[]`)

`trackIds` is the season's ordered race calendar — but note the actual
*when* each race happens is driven by `calendar_1970.json`'s own entries,
not by this array's order alone; keep them consistent. `pointsForPosition`
is the points table (e.g. `[9, 6, 4, 3, 2, 1]`) — position `i+1` gets
`pointsForPosition[i]`, anyone finishing further back or DNFing gets 0.

## Building a season calendar (`calendar_1970.json` → `CalendarEntry[]`)

A new season (e.g. `calendar_1971.json`) is a new array of entries in
chronological order. Each entry:

```json
{
  "id": "cal_01",
  "type": "PRE_SEASON",
  "date": { "year": 1971, "month": 2, "day": 1 },
  "title": "...",
  "description": "...",
  "fictional": true,
  "completed": false
}
```

`type` is one of `PRE_SEASON | TEST | RACE | MARKET | AUCTION |
CHAMPIONSHIP_END | SEASON_END`. A `RACE` entry needs `championshipId` +
`trackId`; `ADVANCE_TIME` refuses to skip past a `RACE` entry — the player
must actually race it (go to Home → "Vai alla gara"). An `AUCTION` entry
needs `auctionId` referencing `auctions.json`. Wiring a new season into the
game currently means pointing `game/initialState.ts`'s `createNewCareer` at
the new calendar file — a small, explicit change rather than hidden
auto-detection, so it's obvious which season a new career starts on.

## Adding an auction (`auctions.json` → `AuctionDef[]`)

```json
{ "id": "auction_newmark_nr12_proto", "carDefId": "car_011", "startingPrice": 400000, "bidIncrement": 20000, "maxRounds": 6 }
```

Reference it from a calendar entry's `auctionId`. The car it points to
should normally be `Iconic` rarity (see above) so it isn't *also* reachable
through the ordinary used-car market.

## Adding an AI team (`teams.json` → `TeamDef[]`)

```json
{
  "id": "team_newname", "displayName": "...", "ownerName": "...", "founded": 1968,
  "isPlayer": false, "reputation": 60, "budget": 600000,
  "carInstanceIds": [], "driverIds": [],
  "aiProfile": { "riskTolerance": 50, "aggressiveness": 55, "budgetStrategy": "balanced" },
  "active": true
}
```

In the current Phase 1 build, `carInstanceIds`/`driverIds` stay empty — AI
opponent rosters are generated fresh per race by
`src/sim/fieldGenerator.ts` from the static car/driver pools (see
ARCHITECTURE.md's "Next phases" note on giving AI teams persistent
rosters). `aiProfile.budgetStrategy` and `riskTolerance` are read today only
by the auction bidding logic (`services/auctions.ts`); a future AI-team
economy would use them more broadly.
