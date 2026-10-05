# Monetization

## The one rule everything else follows

**The game must never require real money to play, progress, or win.** Every
system below is designed so a free player can reach every part of the game —
packs, upgrades, championships, the full World Tour — through normal play.
Nothing is locked behind a purchase; purchases only save time or add cosmetic
variety on top of a progression that already works without them.

## Currencies — all virtual, always

There are exactly three currencies: **Credits**, **Tokens**, **Energy**. None
of them can be converted back into real money, transferred between accounts,
or cashed out in any way. "Denaro" in the game's own text always means
Credits — a purely virtual number in `PlayerState`, nothing more.

## Current state: nothing is real

No payment SDK is integrated in this build. `MockMonetizationService`
(`src/monetization/MonetizationService.ts`) simulates a short delay and then
grants the product's virtual contents — it never contacts a store, never
charges anything, and is safe to call from a test or a CI run. Similarly,
`MockAdService` (`src/ads/AdService.ts`) simulates watching a rewarded ad
(short delay, always rewards) with no real ad SDK wired in.

This is intentional, not a placeholder waiting to be "finished into" a
dark-pattern system — see the next section.

## The store catalogue (`STORE_PRODUCTS`)

| Product | Contents | Notes |
|---|---|---|
| Remove Ads | Clears `monetization.adsRemoved` | Purely a convenience flag; nothing in the game currently *shows* a blocking ad, so this removes the optional rewarded-ad prompts only |
| Token Pack S/M/L | 100 / 550 / 650 Tokens | Larger packs include a stated bonus percentage, never a hidden one |
| Starter Pack | 2000 Credits, 200 Tokens, 1 guaranteed Rare car | |
| Premium Pack | 4000 Credits, 500 Tokens, 1 guaranteed Rare car | |

None of these unlock a feature, track, championship or car that a free
player can't eventually reach through normal play (races, levels,
achievements, the daily market, pack pity).

## Ads are optional and reward-only

The only ad placements that exist (`AdPlacement`) are: double a race's reward,
get a free pack, or instantly restore energy. All three are opt-in buttons the
player can simply not tap — there is no interstitial, no forced ad, and no ad
gating progression (energy also regenerates for free over time).

## Pack odds are never hidden or manipulated beyond the documented pity

See [GAME_DESIGN.md](./GAME_DESIGN.md#gacha-packs--visible-odds--pity). The
odds shown in the Packs screen are read directly from the same `PackDef.odds`
the opening logic uses — there is no second, more pessimistic number used
internally.

## Wiring in a real backend later

When a real payment/ad SDK is integrated, only `src/monetization/
MonetizationService.ts` and `src/ads/AdService.ts` need new implementations
of their existing interfaces (`MonetizationService`, `AdService`) — every
call site already goes through `monetizationService`/`adService`, never a
concrete class, so no screen code changes. The same is true for
`EconomyValidationService` (`src/services/backendMocks.ts`), which is the
intended seam for a future server to re-validate purchases/rewards
server-side rather than trusting the client.
