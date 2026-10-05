# Racing Dynasty — Historical Motorsport Manager (1970–2026)

A mobile team-management game. You don't drive directly — you build a
racing team starting in 1970: hire or rent drivers, buy or rent cars,
negotiate contracts, bid at auctions for historically important cars, and
watch races unfold through a dynamic, decision-driven simulation where
*you* choose Attack / Defend / Wait / Push at key moments, each with a real
computed success chance.

Every team, driver, manufacturer and circuit is an original invention
evocative of real-world motorsport history, never a reproduction of a real
name, logo or likeness (see "A note on names" below).

## Quick start

```bash
npm install
npm run dev       # local dev server (Vite)
npm run build     # type-check + production web build
npm run test      # Vitest unit test suite
npm run lint      # oxlint
```

See [BUILD.md](./BUILD.md) for the Android build.

## Current scope: Phase 1 — Core 1970

This build implements exactly the brief's own Phase 1 roadmap: a genuinely
playable, tested core for the 1970 season, built to extend cleanly into
later eras rather than a mockup of the full 1970–2026 scope. Concretely:

- **Time & calendar** — a real `TimeManager`/calendar: pre-season, private
  tests, races, a market refresh, an auction, championship end, season end.
  You can't skip past a race — you have to go run it.
- **Garage** — buy or rent any of 10 original 1970 cars (Formula, Sports
  Car, GT, Touring, Prototype), each with a real stat profile; sell owned
  cars back for a discounted value.
- **Drivers** — 10 original drivers with skills (qualifying, overtaking,
  defending, wet-weather, tyre/fuel management, consistency, aggressiveness),
  rating/potential/experience/form. Hire on a multi-race contract (salary
  paid per event) or rent for a single race.
- **Dynamic race engine** — lap-by-lap, with 3 scripted player decision
  points per race (two "racing" decisions — Attack/Defend/Wait/Push — plus
  one pit-strategy decision — Undercut/Stay out/Wait), each option showing
  a real percentage computed from driver skill + car stat + track + weather
  + experience modifiers. A better car/driver wins more often — never
  guaranteed. Mechanical failures, driver errors, overtakes and a rare
  safety car are all logged events, not just a final number.
- **Auctions** — a historically important car (the Veltara 917K) goes to
  auction once a season; AI rivals bid based on their own budget and
  reputation.
- **Championship standings** — a real points table (9-6-4-3-2-1) tracking
  the player's wins/podiums/points across the season.
- **Save/load** — versioned, autosaved to `localStorage`.

## Known Phase 1 simplifications (honest, not hidden)

- **AI opponent rosters are generated per race**, not tracked as persistent
  AI-team ownership — so championship standings currently track the player
  only, not a full rival grid. Full AI-team economy simulation (teams
  buying/renting cars and drivers, failing, merging) is brief sections
  67-68, explicitly scoped for a later phase.
- **Weather is fixed for the whole race** (picked once, at race start, from
  the track's rain probability) rather than changing mid-race.
- **Monetization/ads scaffolding is not built yet.** The brief treats this
  as "predisporre" (prepare) rather than a Phase 1 requirement (sections
  93-96); it will come alongside the first in-app economy that actually
  needs it.
- **Only the 1970 season exists.** The later eras (1971-2026), the
  technology tree, regulation changes, the driver academy/scouting system,
  sponsors, and real/display name variants for licensed assets are
  documented in the brief but intentionally not built yet — see the
  "Next phases" note in [GAME_DESIGN.md](./GAME_DESIGN.md).

## A note on names

Every manufacturer, team, driver, circuit and championship name in this
build is an original invention (e.g. Ferrano, Veltara, Kronwerk, Scuderia
Lupo, Monteverde Circuit) rather than a lightly-disguised real trademark.
The brief's own section 12 suggested "real names, slightly modified"
(Ferrari → Ferrano-style); this build instead uses fully original names
throughout, for the same reason the data layer separates `displayName`
from any real-world reference: it keeps the game legally safe to publish
without needing a license, while still reading as clearly "vintage
motorsport" in flavor. See `ARCHITECTURE.md` for how the data layer is
built so a licensed asset pack could still be swapped in later without a
logic change.

## Documentation

| File | Covers |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Folder layout, data flow, the race engine's design |
| [GAME_DESIGN.md](./GAME_DESIGN.md) | Rules, formulas, the decision system, content, roadmap |
| [DATA_FORMAT.md](./DATA_FORMAT.md) | How to add cars, drivers, tracks, a new season |
| [BUILD.md](./BUILD.md) | Local dev, web build, Android build/release |
| [TESTING.md](./TESTING.md) | Test suite layout and how to run it |
