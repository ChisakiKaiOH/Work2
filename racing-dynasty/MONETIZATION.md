# Monetization

**Not built in Phase 1 — deferred on purpose.** The brief (sections 93-96)
asks to "predisporre" (prepare for) rewarded ads, a remove-ads purchase, a
premium currency, a starter pack and a future season pass, behind a clean
abstraction, with two hard rules that will carry over whenever this is
built:

1. **No real money is ever redeemable.** Whatever in-game currency exists
   is strictly virtual — there is no mechanism anywhere that converts it
   back to real money.
2. **The game must never require payment to play, progress, or win.** Any
   purchase or ad can only save time or add flavor, never unlock something
   a free player can't eventually reach.

An earlier iteration of this project (before the Phase 1 redesign to the
historical-manager format) had a working `AdService`/`MonetizationService`
pair behind exactly this kind of interface — that code was removed rather
than left in as dead, unused scaffolding wired to a currency model (packs,
tokens) that no longer matches this game's actual economy (team budget,
driver salaries, car purchases/rentals, auction bids). When monetization is
actually built for this design, it should:

- Live behind an `AdService` interface (`isReady`/`show`) and a
  `MonetizationService` interface (`getProducts`/`purchase`), each with a
  local `Mock*` implementation so the full reward loop is buildable and
  testable before any real SDK is integrated — this pattern is already
  proven elsewhere in this repository's other game projects.
- Tie rewarded-ad placements to genuine, already-existing friction points
  once they exist in this design (e.g., a future "restore energy" or
  "double this race's prize money" moment) rather than being added for
  their own sake.
- Only be built once there's a real economy value worth attaching it to —
  building the abstraction first and the economy around it second would
  risk exactly the kind of disconnected, unused system this project avoids.
