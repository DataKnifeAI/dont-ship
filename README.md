# D.O.N.T. Ship

**Definitely Not On Time** — Delivering Outcomes, Not Timelines.

A tiny multiverse courier game about betting on doorways. Wally (Dock Supervisor, **Box 407-B**) dispenses a parcel and three doors. Each door opens into a **pocket universe** with its own layout and world-native hazards. You take the stake, run a short isometric 3D courier level, and **deliver to the customer** (OUT / recipient) — or forfeit. Your **O.D.D.S.** score tracks how well your picks match reality (Brier-style calibration).

Tone: cheerful corporate dystopia over cosmic nonsense (Futurama / What-If energy). A shipping-floor universe is one valid biome among many — not the whole identity.

Fen (cute wolf) is the logo mark. Wally is the stork boss. The J.E.V. stamps outcomes upstairs.

## Play online

[https://ds.dataknife.ai](https://ds.dataknife.ai) (GitHub Pages from `main`).

## Play locally

ES modules and `fetch` need a static HTTP server (opening `index.html` as a file will fail).

```bash
cd /home/lee/Projects/dont-ship
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

**The Box 407-B door hall and all 12 worlds run in the isometric Three.js renderer** (one shared WebGL context). Hazards come from the chosen door's tags and tier (see the table in [`docs/PLAN.md`](docs/PLAN.md#hazard-tags-step-2)). `?renderer=2d` forces the legacy 2D hall and side-scroller, which are also the automatic fallback when WebGL is unavailable. Reference screenshots of the current UI live in `mocks/shots/`. Look reference: [http://127.0.0.1:8080/mocks/iso-preview.html](http://127.0.0.1:8080/mocks/iso-preview.html) · plan in [`docs/PLAN.md`](docs/PLAN.md) · progression in [`docs/PROGRESSION.md`](docs/PROGRESSION.md).

**Dev shortcuts**

- `?world=world_jungle&tier=brutal&tags=crystal_fauna,ice` overrides every door pick (any template id, tier, comma-separated tags).
- In the console at the door hub: `__dontShip.play("world_desert", { tier: "hard", tags: ["heat_shimmer"], fragile: true })`.
- The 3D hall is `__isoHub` (also `__dontShip.hub`): `hoverDoor(i)`, `doorRect(i)` (screen rect inside the stage), `snapshot()`.
- During a run, `__isoRun` exposes `plan`, `route`, `teleport(c, r)`, `autopilot(true, { ghost })` (walks the planned route; `ghost` ignores hazards), `advance(seconds)`, `snapshot({ overview })` and `abort()`.
- `node tools/iso-check.mjs [world_id…]` validates maps headlessly: routes, every tag × tier plan, determinism, and a full scene build.

Alternate:

```bash
npx --yes serve -p 8080
```

## How to play

1. **Clock in** (button or **Enter**) — bankroll starts at **100 C.O.D.**; stake is **10** per doorway.
2. Read the **routing memo** and parcel stamps (e.g. fragile) in the dispatch bar along the bottom of the hall.
3. Pick a door by **clicking** it (or its ticket) or with keys **1 / 2 / 3**. Each door's sign shows the displayed % and payout; payout ≈ `(1 / displayedProb) − 0.05` house edge. The door face shows the tier stamp; the ticket below lists hazard stamps and the outcome blurb.
4. **Run** that universe and reach the gold **OUT / RCPT** stamp (customer delivery).
   - **WASD / arrows** move in 8 directions, **Space** jumps (up to 2 levels, or across a 1-tile gap). Mouse wheel zooms.
   - Legacy 2D (`?renderer=2d`): **←/→** move, **↑/↓** change depth lane, **Space** jump.
5. Survive → stake × payout returned to bankroll. One hazard hit, a fall, or a fragile hard landing (jumping down 3+ levels) → stake gone (no respawn). Forecast logged either way.
6. Watch **C.O.D.** and **O.D.D.S.** in the masthead.

Identical manifest + door → identical seeded run (hazard placement, speeds, and timings).

## World roster (all iso)

| Template | Vibe | Native hazards (tags `none`) |
|----------|------|------------------------------|
| `world_porch` | Butterfly-roof ranch, lawn, street | traffic, sprinkler |
| `world_neighborhood` | Two streets, park hill, A-frame + flat-roof modern | traffic |
| `world_shipping` | Warehouse under a wrong sky, belt lines, sorting abyss | belts, portal wind |
| `world_rooftops` | Roofs at levels 2–6, plank/steel bridges, storm | acid rain |
| `world_jungle` | Temple ruins on a canopy deck, rope bridge, crystals | crystal fauna |
| `world_neon` | Night alley, opinionated walkways, undercity trench | portal wind, belts |
| `world_frozen` | Ice floes + outpost over arctic water, penguins | ice |
| `world_space` | Floating decks and catwalks, low-G | black hole, vent wind |
| `world_underwater` | Seabed post office, trenches, floaty jumps | pressure currents |
| `world_desert` | Highway causeways over an infinite canyon, diner | heat shimmer |
| `world_unmapped` | Blueprint void stitched from other worlds' fragments | meta glitch, black hole |
| `world_impossible` | Escher gallery islands to the executive desk | Meeseeks |

## Config

Copy `.env.example` → `.env` and fill in keys when wiring OpenRouter (not used by the game yet).

## Phase 1 scope

Vanilla JS + Canvas, plus vendored Three.js for iso runs. No frameworks, no build step, no backend, no J.E.V. API. Deck: `data/manifests.json` (~12 jobs). Rooms: ASCII templates in `data/rooms.json`.

**Phase 1.5 — Canvas parallax (legacy 2D fallback only):** `js/platformer.js` and the 2D door hall in `js/ui.js` remain for `?renderer=2d` / no-WebGL. Painted direction stills (mood and composition reference only): [http://127.0.0.1:8080/mocks/25d-preview.html](http://127.0.0.1:8080/mocks/25d-preview.html) (not `file://`) and `assets/mocks/25d/`.

## Layout

| Path | Role |
|------|------|
| `index.html` | Shell UI: masthead + ledger, stage (dispatch bar, overlays), J.E.V. wire ticker |
| `css/style.css` | One card/stamp system for chrome, hub tickets, run HUD and overlays |
| `js/main.js` | Title / intake / bet / result flow, wires the 3D hub |
| `js/iso/` | Three.js iso renderer: `shared` (the one WebGL renderer + layer), `hub` (Box 407-B door hall: doors, Wally, J.E.V., raycast picking, DOM tickets), `run` (`startRun` → `{ delivered, cause }`: loop/physics/HUD), `kit` (materials/helpers), `props`, `map` (tiles + route finding), `hazardplan` (tags + tier → seeded plan), `hazards` (entities), `worlds.js` (registry + shared props) |
| `js/iso/worlds/` | One file per world: grid + legend, native hazards / anchors, world props, decoration |
| `tools/iso-check.mjs` | Headless map / hazard-plan / scene validator (`node tools/iso-check.mjs`) |
| `js/platformer.js` | Legacy 2D run (`?renderer=2d` / no-WebGL fallback only; ready to retire) |
| `vendor/` | Three.js r186 (import map, no build step) |
| `js/rng.js` | Seeded PRNG |
| `js/odds.js` | Payout + Brier helpers |
| `js/state.js` | Bankroll / calibration / stake stamps |
| `js/ui.js` | DOM (ledger, memo, overlays, door view-models for the hub) + legacy 2D door hall |
| `data/manifests.json` | Multiverse job deck |
| `data/rooms.json` | World templates |
| `assets/brand/` | Fen / Wally art (see that folder’s README) |
| `assets/mocks/25d/` | 2.5D direction stills + README |
| `mocks/25d-preview.html` | Static gallery for those stills |

## License

Licensed under the [Apache License 2.0](LICENSE). Copyright 2026 DataKnifeAI; see [NOTICE](NOTICE).

Bundled third-party software: Three.js in `vendor/` is MIT-licensed ([vendor/three.LICENSE](vendor/three.LICENSE)).
