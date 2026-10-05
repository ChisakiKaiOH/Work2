# Data Format — adding/editing content

All game content lives in `src/data/*.json`, typed against interfaces in
`src/types/index.ts` and re-exported (with ID-lookup maps) from
`src/data/index.ts`. **None of it requires a code change in `services/`,
`simulation/` or `game/` to take effect** — that's the whole point of keeping
logic and data separate.

> After editing any file in `src/data/`, run `npx tsc -p tsconfig.app.json
> --noEmit` — TypeScript will catch a missing/misspelled field immediately
> because every JSON file is cast against its `*Def` interface.

## Adding a car (`cars.json` → `CarDef[]`)

```json
{
  "id": "car_051",
  "name": "Veltara Spectre",
  "brand": "Veltara",
  "category": "Super",
  "rarity": "Epic",
  "stats": { "power": 190, "acceleration": 170, "topSpeed": 195, "braking": 150, "grip": 160, "stability": 140, "reliability": 120, "weight": 1280, "traction": 150 },
  "engineType": "Turbo Hybrid",
  "fuel": "Hybrid",
  "baseValue": 185000,
  "stars": 4,
  "colorPrimary": "#2fd2ff",
  "colorSecondary": "#101418",
  "silhouette": "coupe",
  "description": "Short, original flavor text."
}
```

- `brand` must be one of (or a new addition to) `brands.json` — never a real
  manufacturer.
- `silhouette` picks which procedural SVG body shape `CarArt.tsx` renders:
  `coupe | roadster | hypercar | prototype | suv-coupe | classic`.
- PR is *derived*, never stored — it's computed from `stats` by
  `performanceRating()` at render/simulation time. Pick `stats` so the
  resulting PR lands in the category you intend (see GAME_DESIGN.md's
  formula) — there's no validation step enforcing this, so sanity-check with
  a quick `performanceRating(stats)` call if you're unsure.

## Adding a track (`tracks.json` → `TrackDef[]`)

Needs a `region` (one of the 6 `Region` values), `laps`, `lengthKm`,
`difficulty` (1–5), `surface`, `type`, and `preferredConditions` (a `Weather[]`
the simulator and the UI's weather-pick logic lean toward for that track).

## Adding a championship (`championships.json` → `ChampionshipDef[]`)

`trackIds` should list exactly 5 track ids from `tracks.json`. `requiredPR`
is advisory (shown in the UI, not enforced by the reducer) — it's meant to
guide the player toward the right tier of car, not hard-gate them.

## Adding a boss (`bosses.json` → `BossDef[]`)

`carDefId` must reference a real car in `cars.json` — the boss races in that
exact car (see `RaceScreen`'s boss-launch logic, which pulls the car and
builds a dedicated `RaceParticipant` for it rather than a generic bot).
`rewardCarId` is optional; if set, defeating the boss for the first time adds
that car to the garage (subject to garage-slot capacity).

## Adding a pack (`packs.json` → `PackDef[]`)

`odds` must be the *exact* numbers you want shown to the player — there's no
hidden multiplier applied to them outside of the pity mechanic, which is
itself documented and surfaced in the UI. Keep `RARITY_ORDER`'s six keys all
present (`Common..Mythic`), even if some are `0`. `categoryPool` is optional;
if set, the pack only draws from cars in those categories.

## Adding an event (`events.json` → `EventDef[]`)

`trackId` + `weather` are fixed for the event (unlike free races, where
weather is picked at race-setup time). `requiredCategory`/`requiredBrand` are
currently informational — enforcing them as a hard gate would be a small
addition to `RaceScreen`'s launch logic if needed later.

## Adding an achievement (`achievements.json` → `AchievementDef[]`)

`condition` is a discriminated union — see `AchievementCondition` in
`src/types/index.ts` for the full list of condition `type`s
(`racesCompleted`, `racesWon`, `creditsEarned`, `carsOwned`,
`championshipsWon`, `bossesDefeated`, `legendaryCarsOwned`, `playerLevel`,
`collectionsCompleted`, `maxUpgradesOnCar`). `conditionValue()` in
`src/services/achievements.ts` is where a brand-new condition `type` would
need a new `case`.

## Adding a collection (`collections.json` → `CollectionCategoryDef[]`)

A list of `carDefIds` the player must own simultaneously to complete it.
Completion is checked automatically after every action that can change the
garage (`updateCollectionProgress` in `game/reducer.ts`).

## Adding a daily reward day (`dailyRewards.json` → `DailyRewardDay[]`)

`kind` is one of `credits | energy | upgradeParts | tokens | pack |
premiumPack`. `pack` grants `pack_basic`, `premiumPack` grants `pack_epic` —
see the `CLAIM_DAILY_REWARD` case in `game/reducer.ts` if you want to change
which pack ids those map to.

## Brands (`brands.json` → `string[]`)

A flat list of invented brand names. Add new ones here first, then reference
them from `cars.json`'s `brand` field.
