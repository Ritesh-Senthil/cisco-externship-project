# CaroSHIELD · Interface System

## Direction
**Who:** Fair operations director at 5:45am on opening day — one screen to answer "can we open?"
**Feel:** Broadcast-truck ops console. Calm, dense, instrument-grade. Not a marketing dashboard.
**Signature:** Horizontal **threshold meter** — readiness as a scored bar against 70/80/90 gate thresholds (fair safety-inspection metaphor).

## Depth
Borders-only elevation. One matte navy hue (`--console` → `--deck` → `--deck-raised`). No blur, no drop shadows, no gradients for decoration.

## Palette (60/30/10)
- **60%** `--console` / `--deck` neutrals
- **30%** `--ink` hierarchy (4 text levels)
- **10%** `--signal` accent + instrument status lights (`--nominal`, `--caution`, `--critical`)

## Typography
- **UI:** IBM Plex Sans — industrial, readable at small sizes
- **Telemetry:** IBM Plex Mono — tabular numbers, thresholds, timestamps
- **Scale (1.25 ratio):** 11 caption · 13 body · 16 h4 · 20 h3 · 26 h2 · 44 display
- **Hierarchy lever:** weight + opacity over size jumps

## Spacing
Base unit 4px. Component padding 12–16px. Section gaps 16px. Major areas 24px.

## Components
- **Panel** — matte card, optional left keyline on focal panel only
- **Well** — inset surface for inputs/stats (darker than parent)
- **Threshold meter** — horizontal bar, tick marks at 70/80/90
- **Response rail** — compact CI-style stepper, not 6 equal boxes
- **Btn** — 32px h, 6px radius, press scale 0.98

## Reject
Gradient text, glassmorphism, circular gradient gauges, Inter/Archivo, equal card grids, emoji icons, radial bg glows, uppercase everything.
