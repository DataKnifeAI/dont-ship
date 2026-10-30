# D.O.N.T. Ship — Development

_Running, debugging, and deploying the game. Gameplay rules: [`GAMEPLAY.md`](GAMEPLAY.md). Renderer direction and roadmap: [`PLAN.md`](PLAN.md)._

## Run locally

ES modules and `fetch` need a static HTTP server (opening `index.html` as a file will fail).

```bash
cd /path/to/dont-ship
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

Alternate:

```bash
npx --yes serve -p 8080
```

## Renderers

**The Box 407-B door hall and all 12 worlds run in the isometric Three.js renderer** (one shared WebGL context). Hazards come from the chosen door's tags and tier (see the table in [`PLAN.md`](PLAN.md#hazard-tags-step-2)).

`?renderer=2d` forces the legacy 2D hall and side-scroller, which are also the automatic fallback when WebGL is unavailable.

## Reference material

- Screenshots of the current UI: `mocks/shots/` (title, hub, hover, run, results, broke, at 1024/1280/1920 widths, plus the 2D fallback hub).
- Iso look reference: [http://127.0.0.1:8080/mocks/iso-preview.html](http://127.0.0.1:8080/mocks/iso-preview.html) (the step-0 porch + deep-space mock).
- Painted 2.5D direction stills (mood and composition reference only, superseded): [http://127.0.0.1:8080/mocks/25d-preview.html](http://127.0.0.1:8080/mocks/25d-preview.html) (not `file://`) and [`assets/mocks/25d/`](../assets/mocks/25d/README.md).

## Dev shortcuts

- `?world=world_jungle&tier=brutal&tags=crystal_fauna,ice` overrides every door pick (any template id, tier, comma-separated tags).
- In the console at the door hub: `__dontShip.play("world_desert", { tier: "hard", tags: ["heat_shimmer"], fragile: true })`.
- The 3D hall is `__isoHub` (also `__dontShip.hub`): `hoverDoor(i)`, `doorRect(i)` (screen rect inside the stage), `snapshot()`.
- During a run, `__isoRun` exposes `plan`, `route`, `teleport(c, r)`, `autopilot(true, { ghost })` (walks the planned route; `ghost` ignores hazards), `advance(seconds)`, `snapshot({ overview })` and `abort()`.

## Headless checks

```bash
node tools/iso-check.mjs              # all worlds
node tools/iso-check.mjs world_jungle # one or more worlds
```

Validates maps without a browser or WebGL: start → goal routes, every tag × tier hazard plan, seed determinism, and a full scene build ticked for a few seconds.

## Scope and stack

**Phase 1:** vanilla JS + Canvas, plus vendored Three.js for iso runs. No frameworks, no build step, no backend, no J.E.V. API. Deck: `data/manifests.json` (~12 jobs). Rooms: ASCII templates in `data/rooms.json`.

**Phase 1.5 — Canvas parallax (legacy 2D fallback only):** `js/platformer.js` and the 2D door hall in `js/ui.js` remain for `?renderer=2d` / no-WebGL. See [`PLAN.md`](PLAN.md) roadmap step 2 for when `platformer.js` can be retired.

Three.js r186 is vendored in `vendor/` and resolved through the import map in `index.html` (`"three": "./vendor/three.module.js"`), so it works offline.

## Layout

| Path | Role |
|------|------|
| `index.html` | Shell UI: masthead + ledger, stage (dispatch bar, overlays), J.E.V. wire ticker |
| `css/style.css` | One card/stamp system for chrome, hub tickets, run HUD and overlays |
| `js/main.js` | Title / intake / bet / result flow, wires the 3D hub |
| `js/iso/` | Three.js iso renderer (modules below) |
| `js/iso/worlds/` | One file per world: grid + legend, native hazards / anchors, world props, decoration |
| `tools/iso-check.mjs` | Headless map / hazard-plan / scene validator |
| `js/platformer.js` | Legacy 2D run (`?renderer=2d` / no-WebGL fallback only; ready to retire) |
| `vendor/` | Three.js r186 (import map, no build step) |
| `js/rng.js` | Seeded PRNG |
| `js/odds.js` | Payout + Brier helpers |
| `js/state.js` | Bankroll / calibration / stake stamps |
| `js/ui.js` | DOM (ledger, memo, overlays, door view-models for the hub) + legacy 2D door hall |
| `data/manifests.json` | Multiverse job deck |
| `data/rooms.json` | World templates |
| `assets/brand/` | Fen / Wally art (see [that folder's README](../assets/brand/README.md)) |
| `assets/mocks/25d/` | 2.5D direction stills + [README](../assets/mocks/25d/README.md) |
| `mocks/25d-preview.html` | Static gallery for those stills |
| `mocks/iso-preview.html` | Iso look-and-feel mock (roadmap step 0) |
| `mocks/shots/` | Reference screenshots of the current UI |

### `js/iso/` modules

| Module | Role |
|--------|------|
| `shared` | The one WebGL renderer + layer, shared by hub and runs |
| `hub` | Box 407-B door hall: doors, Wally, J.E.V., raycast picking, DOM tickets |
| `run` | `startRun` → `{ delivered, cause }`: loop / physics / HUD |
| `kit` | Materials / helpers |
| `props` | Shared prop builders |
| `map` | Tiles + route finding |
| `hazardplan` | Tags + tier → seeded hazard plan |
| `hazards` | Hazard entities |
| `worlds.js` | World registry + shared props |

## Cache busting

`index.html` loads `css/style.css?v=iso-3` and `js/main.js?v=iso-3`. Bump that suffix (both places) when shipping CSS or JS changes so browsers and the Pages CDN fetch fresh copies.

## Deploy (GitHub Pages)

- Pages builds from `main`, repo root (legacy build, no workflow). `.nojekyll` serves files as-is.
- `CNAME` sets the custom domain **`ds.dataknife.ai`**. Until its DNS record exists the site won't resolve, and `https://dataknifeai.github.io/dont-ship/` redirects to the custom domain, so it is not a fallback.
- Once DNS resolves and GitHub issues the certificate, enable **Enforce HTTPS** in the repo's Pages settings.
- Pushing to `main` deploys; remember the cache-bust suffix above.

## Config

Copy `.env.example` → `.env` and fill in keys when wiring OpenRouter (not used by the game yet). `.env` is git-ignored; never commit real keys.

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | API key |
| `OPENROUTER_BASE_URL` | Defaults to `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | Optional model pin for later odds/provider work |
