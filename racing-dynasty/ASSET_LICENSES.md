# Asset Licenses

Per the brief's section 109: no asset in this build was downloaded from the
internet, scraped, or incorporated without a verifiable license. Every
visual and audio asset currently in the game is procedurally generated
original work created for this project.

| Asset | Source | License | Permission | Attribution | Notes |
|---|---|---|---|---|---|
| Car silhouettes (`CarArt.tsx`) | Hand-written inline SVG paths, generated in this session | Original work, project-owned | N/A (created for this project) | None required | 6 body-shape variants (`coupe/roadster/hypercar/prototype/suv-coupe/classic`), colored per-car from `CarDef.colorPrimary/colorSecondary` |
| App icon / splash screen (`resources/icon.png`, `resources/splash.png`) | Generated with Python/Pillow in this session (a "speed chevron + checkered flag" mark) | Original work, project-owned | N/A | None required | Source images in `resources/`; Android resource set generated via `@capacitor/assets` — see BUILD.md |
| Manufacturer, driver, team, track and championship names | Invented for this project | Original work, project-owned | N/A | None required | Deliberately NOT disguised real trademarks — see README's "A note on names" |

## No real-world photos, logos, or audio are used anywhere in this build.

If a future phase adds real car photography, manufacturer/team logos,
driver portraits, or licensed audio, add a row here **before** committing
the asset, with:

- **Asset** — filename/id
- **Source** — where it came from
- **License** — the specific license it's under
- **Permission** — how/where the right to use it was obtained (a signed
  license, a royalty-free stock license, explicit written permission, etc.)
- **Attribution** — the exact credit line required, if any
- **Notes** — anything else relevant (usage restrictions, expiry, etc.)

Never add a real-world asset without first confirming it can legally be
used — this file exists so that confirmation is a recorded, auditable step,
not an assumption.
