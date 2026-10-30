# D.O.N.T. Ship — Plan (iso direction)

_Updated 2026-10-29. Supersedes the 2.5D side-scroller / painted-plate direction._
_Progression, quotas, and why players keep opening doors: [`docs/PROGRESSION.md`](PROGRESSION.md). Story and theme: [`docs/NARRATIVE.md`](NARRATIVE.md). Current gameplay: [`docs/GAMEPLAY.md`](GAMEPLAY.md)._
_How the project got here, and why the 2.5D direction was dropped: [`docs/HISTORY.md`](HISTORY.md)._

## Locked decisions

- **Camera / genre:** isometric action-navigation (Hades / Into the Breach framing). The courier moves freely in 8 directions across an iso map of each pocket universe to reach the customer.
- **Art:** low-poly 3D in **Three.js**, orthographic camera at a true-iso angle, toon/flat shading, soft shadows. Mid-century identity comes from palette, signage, silhouettes, and type — not painted textures.
- **Palette:** avocado `#568203`, harvest gold `#daa520`, burnt orange `#cc5500`, cream `#f5ecd7`, IBM blue `#1f4e79` (+ ink `#1a1f16` for outlines).
- **Superseded:** `assets/mocks/25d/`, `assets/game/*-plate.jpg`, and `mocks/25d-preview.html` were AI-painted targets that code could not match. Keep them as mood reference only; nothing new should try to reproduce them.

## What stays

- Hub loop: Box 407-B → manifest memo → pick 1 of 3 doors (displayed prob, payout multiplier, tier, hazard stamps) → run → payout or forfeit.
- Economy & scoring: C.O.D. bankroll, stake 10, payout ≈ `1/p − 0.05`, O.D.D.S. Brier calibration, local goals/bests (`js/odds.js`, `js/state.js`, `js/rng.js`, `js/main.js`, `js/ui.js`).
- Data: `data/manifests.json` deck and hazard tags; the 12 world templates in `data/rooms.json` (ids/labels/biomes kept, grids re-authored).
- Seeding: identical manifest + door → identical room/hazard phases.
- Cast: Fen (logo only), Wally the stork (Dock Supervisor NPC), J.E.V. as the stamping authority upstairs.
- **J.E.V. roadmap unchanged:** Phase 2 = `getOdds(state, options)` provider abstraction (local seeded impl default, config flag to swap). Phase 3 = serverless Jev endpoint for door odds, then widen to `resolveRunSetup(state) → { doors, worldId, hazards, parcelMods, seedMaterial }` so Jev can also pick worlds/hazards. The iso renderer only consumes those parameters.

## What changes

- **Run renderer:** `js/platformer.js` (2D canvas side-scroller) → new `js/iso/` module (Three.js scene, camera, input, collision). Same contract to `main.js`: `startRun(roomTemplate, seed, mods) → Promise<{ delivered, cause }>`.
- **Rooms → iso tile maps:** each template becomes a grid of tiles with a **height level** (0–3, 0.3 units/level as in the approved mock), a tile type (walkable / blocked / void / hazard / goal), and a prop list. Legend lives with the map so worlds stay data-driven.
- **Movement:** camera-relative 8-direction, walk steps up 1 level, **jump** (Space) for 2 levels or gaps; per-world gravity (low-G in space). Axis-separated collision against blocked/too-high tiles; void = fall = forfeit.
- **Win/lose (single life, same as the 2D run):** reaching OUT / RCPT pays stake × payout; the first hazard hit, a void fall, or a hard landing with a fragile parcel forfeits the stake. No respawn — the mock's respawn was preview-only. A 0.6 s spawn grace covers the start tile.
- **Hazards:** placed entities on the map with simple behaviors (patrol path, rotating sweep, pull radius, timed zone) mapped from manifest `hazardTags` (e.g. `sentient_traffic` → patrol, `black_hole_slot` → pull + kill core, `ice` → low friction, `low_gravity` → gravity scale, `portal_wind` → push zone). See [Hazard tags](#hazard-tags-step-2) for the shipped mapping.
- **Goal:** customer + OUT / RCPT stamp marker on a goal tile; reaching it ends the run as delivered.

## Art pipeline

1. **Code-built primitives first:** boxes, cylinders, cones, icosahedrons, extrudes composed into props (house, mailbox, crates, belts, consoles). Flat-shaded `MeshToonMaterial` with a 3-step gradient map; inverted-hull ink outlines on characters/props.
2. **Signage via CanvasTexture:** stamps, house numbers, corporate placards — this is where most of the mid-century charm comes from.
3. **Later:** simple glTF (Blender, < 2k tris each) for the courier, Wally, and hero props, using the same toon materials. No painted textures.
4. Vendored Three.js (`vendor/three.module.js` + `vendor/three.core.js`, r186) via import map — no build step, works offline.

## Roadmap

| Step | Outcome |
|------|---------|
| **0. Mock** (done) | `mocks/iso-preview.html`: porch + deep-space dioramas, controllable courier, hazards, HUD. Validate look & feel. |
| **1. Playable iso run, 1 world** (done) | `js/iso/` (`kit`, `props`, `hazards`, `worlds`, `run`) behind `startRun(template, seed, mods) → Promise<{ delivered, cause }>`. `world_porch` **and** `world_space` wired into the real hub loop (bet → run → payout/Brier); other 10 worlds fall back to `platformer.js`, and `?renderer=2d` forces 2D everywhere. One shared WebGL renderer is reused; each run disposes its scene, listeners, and shadow map. Seed drives cosmetics and hazard phases (car speed/offset, sprinkler angle, vent timing). Door `hazardTags` are shown as HUD stamps but do not yet change hazards. |
| **2. Port remaining worlds** (done) | All 12 `rooms.json` templates are iso maps (`js/iso/worlds/*.js`, registry in `js/iso/worlds.js`) and `main.js` routes every world to iso. Hazards are driven by the chosen door's `hazardTags` + `difficultyTier` (+ manifest `drift_watch` / `executive`) through `js/iso/hazardplan.js` → `js/iso/hazards.js`, on every world including porch and space; worlds fall back to their `native` hazards when tags are `none`. Seeded: same manifest + door → same placements and timings. `node tools/iso-check.mjs` validates every world × tag × tier headlessly. **`js/platformer.js` is ready to retire**: it is only reached via `?renderer=2d` or when WebGL is unavailable; delete it (and the 2D draw loop in `main.js`) once a no-WebGL message replaces that fallback. |
| **3. Hub in 3D** (done) | `js/iso/hub.js`: Box 407-B as a low-poly iso room (composition from `assets/mocks/25d/hub-box-407b-25d.jpg`, built with the run kit) drawn by the **same** shared renderer as the runs (`js/iso/shared.js`; one GL context). Three hinged doors with canvas-texture header signs (letter, displayed %, payout ×) and rubber-stamp tier on the door face; Wally at a DOCK SUPERVISOR podium (parcel label shows manifest parcel stamps), framed Fen poster, BOX 407-B plaque, J.E.V. odds terminal, idle courier. Doors are raycast-clickable (hover peeks the door open, frame turns harvest, Wally and the courier look over); keys 1–3 still work; picking swings the door open and walks the courier in before the run starts. DOM tickets under each door carry tier, odds, readable hazard/parcel stamps and outcome text; a bottom dispatch bar holds the routing memo, +EV help line and shift goal. Title screen is the same hall with a title card (Fen logo, Clock in, controls, local bests). After a run the hall returns behind the result card with a DELIVERED / FORFEIT stamp on the used door. `?renderer=2d` and no-WebGL keep the old 2D canvas hall. Not done: walking up to a door to bet (pick is click/key). |
| **4. J.E.V. Phase 2–3** | Odds provider abstraction, then Jev endpoint for odds and world/hazard selection. |
| **Progression** | Careers, shifts, quotas and acts layered on the delivery loop — see [`docs/PROGRESSION.md`](PROGRESSION.md). |

## Hazard tags (step 2)

`planHazards(def, map, { tier, hazardTags, modifiers })` finds the start→goal route (walk / jump / gap-jump rules), then places each hazard type along it (or at the world's `anchors`), never within a few tiles of the start door or on the goal. Every lethal hazard is timed, moving, or off-route, so a corridor is never permanently blocked.

| Tag(s) | Type | Behaviour |
|--------|------|-----------|
| `sentient_traffic` | traffic | Cars loop along lanes crossing the route (world road anchors, or hover-car lanes elsewhere). Contact = forfeit. |
| `acid_rain`, `storm` | acid | Timed drip bands across the route: cloud + flashing outline telegraph, then lethal puddles. |
| `ice` | ice | Low-friction tiles (glazed); momentum carries, slightly faster slide. Frozen's legend ice is always on. |
| `low_gravity` | lowg | Gravity ×0.42, jump ×0.78 (higher, floatier jumps; softer landings). Always on in space. |
| `portal_wind`, `fans` | wind | Portal emitters blow across the route on a cycle (telegraphed), toward void where possible. |
| `black_hole_slot` | blackhole | Pull radius + kill core, placed ≥1.7–2.4 tiles off the route (eats that floor tile). |
| `crystal_fauna`, `vines` | fauna | Crystal critters ping-pong along route segments; low enough to jump over. |
| `pressure` | current | Oscillating cross-route push bands with bubble/arrow tells. |
| `heat_shimmer` | shimmer | Route tiles periodically vanish (telegraphed wobble); one gap at a time, always jumpable. |
| `meeseeks` | chaser | Meeseeks box spawns chasers slower than the courier that ramp up, poof, and respawn. |
| `belts` | belts | Extra conveyor runs (against travel or toward void); on hard+ all belts stop then reverse on a cycle. Legend belts always run. |
| `meta`, `miscalibrated` | glitch | Hash-timed flickering tiles (flash before vanishing) plus a "BOX 407-B?" déjà-vu door that warps you back down the route. |
| `drift_watch` (door or manifest) | drift | A slow rotating nudge while walking (standing still is safe); arrow under the courier. |
| `fragile`, `fragile_parcel_required` | — | Fragile parcel: a landing faster than 8.2 u/s (≈ jumping down 3+ levels at normal gravity) forfeits. |
| `executive` (manifest) | — | Hazard speeds ×1.1. |
| `none` | — | World `native` hazards (porch: traffic + sprinkler; space: black hole + vent wind; etc.). |

**Tier scaling** (`TIERS` in `hazardplan.js`): counts per type are `[easy, hard, brutal]` (e.g. acid zones 2/4/6, vanishing tiles 3/5/7, wind/fauna/chasers/currents 1/2/3, cars per road lane 1/1/2); speed ×1.0/1.15/1.3; push strength ×0.75/1.0/1.2 (easy wind is weaker than walking speed); telegraph time 1.1/0.85/0.65 s; lethal share of a cycle 30/40/48%; start safe radius 3.5/3/2.5 tiles. With three or more spawned types, counts are scaled by 0.75.
