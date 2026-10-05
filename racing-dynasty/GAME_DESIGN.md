# Game Design

## Core loop

**Time advances to the next calendar entry → handle it (test, market,
auction, or race) → if it's a race, choose a car + driver, pick strategy at
key moments, see the result → collect prize money, reputation and driver
experience → repeat, with the championship standings and your garage/roster
growing along the way.**

## Car rating

A deterministic, never-random number computed from a car's stats
(`src/services/carRating.ts`):

```
raw = power*0.26 + topSpeed*0.20 + handling*0.18 + braking*0.12
    + aerodynamics*0.14 + reliability*0.10

weightBonus = clamp((1100 - weight) / 8, -15, 30)

rating = round(raw + weightBonus)
```

This is one input among several to the race engine's lap pace (see below)
— it is explicitly NOT "rating > opponent's rating = win". It's shown in
the UI as a quick way to compare cars, nothing more.

## Drivers

Each driver has an overall `rating`/`potential`/`experience`/`form`/`morale`
plus 8 specific skills (qualifying, overtaking, defending, wet-weather,
tyre management, fuel management, consistency, aggressiveness). Skills feed
directly into the race-decision probability formula below — a driver isn't
just a second rating number stapled onto the car, their specific strengths
matter for specific decisions.

## Contracts

A hire is a real contract: `teamId`, `startDate`, `durationEvents`,
`eventsServed`, `salaryPerEvent`. Salary is paid once per *race* entry that
passes (not per calendar day), and the contract auto-expires (driver
returns to the free-agent pool) once `eventsServed` reaches
`durationEvents`. A rental is exactly the same mechanism with
`durationEvents = 1` at the (higher) rental rate — one code path, not two
parallel systems. See `src/services/contracts.ts`.

## The race engine — dynamic, not "better car always wins"

`src/sim/raceEngine.ts` simulates lap by lap. Every runner's pace each lap
comes from: car rating, driver rating+form, a weather multiplier (modulated
by the driver's wet-weather skill), accumulated tyre wear and fuel level,
and a random noise term scaled inversely by the driver's consistency. On
top of that baseline, the **player** faces exactly 3 scripted decision
points per race:

- Two "racing" decisions (at roughly 35% and 80% race distance): choose
  **Attack**, **Defend**, **Wait**, or **Push Hard**.
- One "pit strategy" decision (at roughly 55% race distance): choose
  **Undercut (pit now)**, **Stay out**, or **Wait**.

Each option's success chance is computed live, with every modifier visible
in principle (section 47 of the brief's formula shape):

```
chance = BASE
        + (driverSkill - 50) * driverWeight
        + ((carStat - 140) / 2) * carWeight
        + trackFactor(track)
        - wetWeatherPenalty           // 0 in the Dry
        + (driverExperience - 50) * 0.12
clamped to [5, 95]
```

Example weights (full table in `raceEngine.ts`): **Attack** uses the
driver's `overtaking` skill (weight 0.45) and the car's `handling` stat
(weight 0.18), with a track's `overtakeDifficulty` working *against* you
and a base of 58%. **Defend** uses `defending` skill and the same track
factor working *for* you, base 72%. **Wait** uses `consistency`, base 90%
— it's the safe, low-reward option. **Push Hard** uses `aggressiveness` and
the car's raw `power`, base 55%, high risk.

A successful decision gives a pace multiplier bonus (e.g. a successful
Attack is ×1.22 pace that lap) and the normal lap-by-lap overtake detection
does the rest — positions change because the underlying distance changed,
never by manually swapping entries. A failed high-risk decision can also
trigger a logged incident (a lockup after a failed Late Braking, a driver
error after a failed Push Hard).

Every lap, independent of decisions, there's also a background mechanical-
failure risk (scaled by low reliability and harsh weather) and a small
driver-error risk (scaled by aggressiveness, dampened by consistency) for
every runner, plus a rare safety car that can bunch the field together once
per race. These are genuine simulated events with a log entry, not
decoration.

**Verified, not just claimed**: `src/sim/raceEngine.test.ts` races the same
car/driver, unupgraded vs. a maxed-out version, against an identical AI
field across many seeds and checks the *win count*, not a single outcome —
confirming "better car wins more often, never guaranteed."

## Weather

Three states: Dry, Light Rain, Heavy Rain — picked once per race from the
track's `rainProbability`. Rain reduces pace for every driver, but a high
`wetWeather` skill blunts the penalty substantially; this is also folded
into every decision's success-chance formula above, not just the base pace.

## Auctions

Once a season, a historically important car (1970: the Veltara 917K, an
`Iconic`-rarity car that never appears in the normal used-car market) goes
to auction. Each round, every active AI team independently decides whether
to outbid based on its own budget headroom and reputation plus a random
roll — see `src/services/auctions.ts`. The player can keep bidding or pass
at any point; passing while in the lead wins the car.

## Finance

A single ledger (`FinanceLedgerEntry[]`) logs every transaction with a
signed amount, backing the Team screen's recent-activity list; the team's
`budget` field is the authoritative live number. There's no artificial
floor — going into debt is allowed in Phase 1 rather than ending the
career, matching the brief's "il sistema deve essere permissivo all'inizio"
(section 63); bankruptcy consequences are a later-phase addition.

## Content (current build — 1970, Phase 1)

| Content | Count |
|---|---|
| Cars | 10 (Formula ×4, Prototype ×3, GT ×2, Touring ×1) |
| Drivers | 10 |
| Manufacturers | 10 (all original) |
| Tracks | 3 |
| Championships | 1 (International Grand Touring Championship 1970) |
| AI teams | 4 |
| Calendar entries | 9 (pre-season, test, 3 races, market, auction, championship end, season end) |
| Auctions | 1 (the Veltara 917K) |

## Next phases (not yet built — see README's "Known Phase 1 simplifications")

Following the brief's own phased roadmap (section 99) rather than building
all 57 years at once:

- **Phase 2 (1971-1975)**: more cars/drivers/tracks, a second championship,
  the first multi-year technology/regulation changes.
- **Persistent AI teams**: give each AI team in `data/teams.json` a real
  roster (bought/rented cars, hired drivers) instead of per-race generation,
  so championship standings can track every entrant, not just the player.
- **Driver academy / scouting**, **sponsors**, **staff** (chief engineer,
  race engineer, mechanics), **technology tree**, **regulation changes**,
  **real/display name variants for licensed assets**, **monetization/ads
  scaffolding** — all specified in the brief, all explicitly deferred past
  Phase 1's core.
