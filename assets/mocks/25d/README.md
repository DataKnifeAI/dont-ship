# 2.5D visual mocks (Phase 1.5 direction)

Static look/feel stills for Phase 1.5. **Shipped approach:** Canvas parallax in `js/platformer.js` + hub depth in `js/ui.js` (tile physics unchanged; not a Three.js rewrite).

## What is mocked

| File | Scene | Purpose |
|------|--------|---------|
| `hub-box-407b-25d.jpg` | Box 407-B doorway hall | Three literal doors with depth, stake stamps (EASY / MED / HARD), mid-century corporate palette, small Wally, optional Fen seal |
| `universe-porch-25d.jpg` | Suburban porch / neighborhood delivery | Same 2.5D language: foreground props, mid play plane (courier + package + OUT), soft background world |
| `universe-space-25d.jpg` | Deep-space docklet | Same layer grammar in a wilder biome so multiverse variety reads at a glance |

Palette locked to avocado / harvest gold / burnt orange / cream / IBM blue — comedic corporate dystopia, not purple “AI slop.”

## Approach

1. **Phase 1.5 — Canvas parallax (implemented).** Keep tile physics. Far / mid / FG layers scroll with the camera; door hub gets perspective hall + extruded frames. No new deps; controls and seeding unchanged.
2. **Later — Three.js (optional).** Only if depth, camera, or lighting needs outgrow layered Canvas. Would wrap or replace the draw layer; physics can remain 2D side-view.

## What does **not** change in Phase 1.5

- **Controls** — same ←/→ move, ↑/Space jump; door pick 1/2/3 (or click).
- **J.E.V.** — still upstairs / odds-and-outcomes fiction only; no live J.E.V. API.
- **Engine** — no Three.js; play plane remains 2D tile collision.

## Preview

Do **not** open `mocks/25d-preview.html` via `file://` — relative assets resolve correctly only when served from the repo root over HTTP (same constraint as the game’s ES modules / `fetch`).

```bash
cd /home/lee/Projects/dont-ship
python -m http.server 8080
```

Then open:

**http://127.0.0.1:8080/mocks/25d-preview.html**

(Images load from `/assets/mocks/25d/*.jpg` via `../assets/...` relative to that page.)
