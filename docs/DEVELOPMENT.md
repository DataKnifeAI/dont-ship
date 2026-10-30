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

## Mobile and touch

Landscape first. `js/touch.js` handles touch; it is mounted from `boot()` in `js/main.js`.

- **Touch mode:** `body.touch` starts on for coarse-pointer devices, turns on at the first touch and off at the first real WASD / arrow / Space key or mouse press, so touch laptops follow whatever was used last. It swaps the keyboard hints (`.key-hint`) for touch hints (`.touch-hint`) on the title card, the hub help line and the run HUD, and hides `<kbd>` chips on buttons and tickets.
- **Hub:** tap a door in the hall or its ticket (both were already click targets).
- **Run:** a floating virtual joystick on the left half of the stage (the base jumps to where the thumb lands) and a jump zone on the right half (the **JUMP** button is just the visual). The iso run reads the analog stick through `touchStick()` in `inputDir()`, so partial deflection walks slower. The stick and jump also press WASD / Space as synthetic `KeyboardEvent`s, which is how the legacy 2D run gets touch for free. Everything is released when the screen leaves `run`, on blur and when the tab is hidden.
- **Portrait phones** (portrait, coarse pointer, ≤ 600 px wide) get a "Rotate your phone" screen. **Play in portrait anyway** dismisses it for the session (`sessionStorage.dontShip_portraitOk`).
- **Fullscreen:** a masthead button (touch mode only, where the Fullscreen API exists) goes fullscreen and tries `screen.orientation.lock("landscape")`. iPhone Safari has no element fullscreen; installing to the home screen is the way there.
- **Layout:** at `max-height: 560px` or `max-width: 720px` the chrome compacts (smaller masthead and ledger, no ticker on short screens), the iso stage fills the screen instead of letterboxing to 16:9 (the 2D fallback keeps 16:9), and the hub hall ends above the routing memo (`--memo-h`, measured by `touch.js`) so tickets stay tappable. Tickets drop the tier, payout and flavor text there (the door signs show them). `viewport-fit=cover` plus `env(safe-area-inset-*)` padding keeps notches clear. The stage has `touch-action: none` (no scroll / zoom / long-press callout); overlay cards keep `pan-y` so long results still scroll.
- **Render quality** (`js/quality.js`, picked once at load): **high** on desktop (DPR ≤ 2, 2048 soft shadows, ink outlines), **medium** on touch devices (DPR ≤ 1.5, 1024 soft shadows), **low** on weak devices (≤ 2 cores, ≤ 2 GB, or Save-Data: DPR 1, 1024 hard shadows, no outline hulls). Most of the savings are fill rate: DPR 1.5 on a phone draws about a quarter of the pixels of DPR 3, and DPR 1 under half of 1.5. Dropping outlines saves about 20% of the hub's draw calls; runs barely change, because tiles are instanced. Force one with `?quality=low|medium|high`; `__isoQuality()` reports the tier, pixel ratio and last frame's draw calls.

Test on a phone over the LAN with `python -m http.server 8080 --bind 0.0.0.0`. The service worker only registers on `https://` or `localhost`, so a LAN IP gets touch but not offline mode. In Chromium DevTools, device emulation with touch covers most of it.

## Installable app (PWA) and offline

- `manifest.webmanifest`: name, `display: fullscreen` (falls back to standalone), `orientation: landscape`, theme `#1f4e79`, and Fen logo icons in `assets/icons/` (192 / 512, plus maskable versions with a safe-zone margin). iOS uses the `apple-mobile-web-app-*` meta tags and `assets/icons/apple-touch-icon.png` (180 px). Install with Share → Add to Home Screen.
- Favicons: `favicon.ico` at the repo root (16 / 32 / 48, for browsers that request `/favicon.ico` directly) and `assets/icons/favicon-16.png` / `favicon-32.png`, a tighter crop of Fen's head so it reads at tab size. The mock pages in `mocks/` link the same files.
- `js/pwa.js` registers `sw.js?v=<version>` using its own `?v=` suffix from `index.html`, and shows an **Install** button in the masthead when the browser fires `beforeinstallprompt`. After the worker is ready, it posts every same-origin URL the page has loaded, so a first visit ends up fully cached (audio fetched later is cached as it goes through the worker).
- `sw.js` is **network first**: online players always get the deployed files, and the cache is only the fallback when the network fails, or when a page load stalls for 4 s and a cached copy exists. All navigations to the game page share one cached shell, whatever the query string. The cache is named `dont-ship-<version>`. A new version installs a new worker that precaches the shell, and older `dont-ship-*` caches are deleted on activate.
- `?sw=0` unregisters the worker and clears its caches (useful if a stale copy ever gets in the way during development). DevTools → Application → Service workers / Cache storage shows what is installed.

## Audio

All music and SFX are synthesized in-repo by [`tools/music/compose.py`](../tools/music/README.md) into `assets/audio/` (`.ogg` Vorbis masters with sample-exact loops, plus `.mp3` fallbacks). Listen to every cue at [http://127.0.0.1:8080/mocks/music-preview.html](http://127.0.0.1:8080/mocks/music-preview.html).

`js/audio.js` plays them with Web Audio:

- **Unlock:** the `AudioContext` is created and resumed on the first user gesture (any click or key, Clock in included). Nothing is fetched or played before that. The core cues (hub bed, both jingles, both stingers) are preloaded then, and the run loops and coin motif are fetched right after.
- **Format:** OGG when `canPlayType('audio/ogg; codecs="vorbis"')` says so, otherwise MP3 (Safari). A failed decode also falls back to MP3. MP3 loops skip leading encoder padding and are clamped to the nominal loop length, so they may not be perfectly gapless.
- **Buses:** track → duck → music bus, stinger → SFX bus, both → master. Loops use `AudioBufferSourceNode.loop` over the full buffer. Music crossfades in 0.8 s; jingles start immediately while the old bed fades. Stingers duck music to 30% for their length.
- **One stinger at a time:** a sting (`sting-delivered`, `sting-forfeit`) or the coin motif is the foreground stinger. Repeating the sting that is still sounding is a no-op, and a different sting cuts it. The coin motif waits for the run bed to fade out (0.3 s) before it starts. Hub cues (jingle or hub bed) requested while a stinger sounds are queued until it ends, and only the latest one is kept. Starting a run drops the queue.
- **Mute:** **M** or the masthead speaker button; **▾** opens music / SFX sliders. Saved in `localStorage` (`dontShip_audioMuted`, `dontShip_musicVolume`, `dontShip_sfxVolume`).
- **Visibility:** the context suspends while the tab is hidden and resumes when it is visible again.

Cue map (wired in `js/main.js`):

| Moment | Cue |
|--------|-----|
| Hub visit in a new act (first is Clock in) | Company jingle for the act (below), then `hub-ambience-loop`. Queued behind a sounding stinger; if a run starts first, the jingle plays on the next hub visit instead |
| Hub visit, same act | `hub-ambience-loop` (no jingle) |
| Run in `world_space`, `world_unmapped`, `world_impossible` | `run-space-loop` |
| Run in any other world | `run-porch-loop` (`RUN_CUE_BY_WORLD` in `js/audio.js` maps worlds to beds) |
| Delivered card | `sting-delivered` over the returning hub bed |
| Forfeit card | `sting-forfeit` over the returning hub bed |
| Shift cleared | `coin-motif` only (no `sting-delivered`), then `hub-ambience-loop`. Keep shipping / New shift during the motif queue the next hub cue (or new act jingle) until it ends |
| Broke (insufficient C.O.D.) | `sting-forfeit` (continues the forfeit card's sting if it is still sounding), music fades to silence. Resetting starts a new shift, so the jingle plays again |

The act comes from each manifest's `act` field in `data/manifests.json` (`dock` / `sorting` / `cold` / `executive`). The jingle detunes as the acts progress (`JINGLE_BY_ACT`):

| Act | Jingle |
|-----|--------|
| Dock | `jingle-dock` as recorded |
| Sorting | `jingle-dock` slowed like tape, −20 cents (`playbackRate` ≈ 0.989), ±4 cent wobble at 0.45 Hz |
| Cold Storage | `jingle-dock` slowed, −45 cents (`playbackRate` ≈ 0.974), ±10 cent wobble |
| Executive | `jingle-executive` |

Debug: `__dontShip.audio()` returns the context state, mute flag, requested, playing and queued music cue, the sounding stinger, playback rate, last sting, loaded cues, duck level, live sources (`{ cue, bus, start, gain }` against `time`), and recent cue events.

Regenerate the audio with `python3 tools/music/compose.py` (or name individual cues). Requirements and per-cue notes are in [`tools/music/README.md`](../tools/music/README.md).

## Scope and stack

**Phase 1:** vanilla JS + Canvas, plus vendored Three.js for iso runs. No frameworks, no build step, no backend, no J.E.V. API. Deck: `data/manifests.json` (~12 jobs). Rooms: ASCII templates in `data/rooms.json`.

**Phase 1.5 — Canvas parallax (legacy 2D fallback only):** `js/platformer.js` and the 2D door hall in `js/ui.js` remain for `?renderer=2d` / no-WebGL. See [`PLAN.md`](PLAN.md) roadmap step 2 for when `platformer.js` can be retired.

Three.js r186 is vendored in `vendor/` and resolved through the import map in `index.html` (`"three": "./vendor/three.module.js"`), so it works offline.

## Layout

| Path | Role |
|------|------|
| `index.html` | Shell UI: masthead + ledger, stage (dispatch bar, overlays), J.E.V. wire ticker. The ticker holds the Source / dataknife.ai links, which `main.js` copies onto the title card and (icon-only, short screens) the masthead; they are hidden during runs |
| `css/style.css` | One card/stamp system for chrome, hub tickets, run HUD and overlays |
| `js/main.js` | Title / intake / bet / result flow, wires the 3D hub |
| `js/touch.js` | Touch mode, virtual joystick + jump, rotate prompt, fullscreen ([Mobile](#mobile-and-touch)) |
| `js/quality.js` | Render quality tier: DPR cap, shadow map, outlines |
| `js/pwa.js` | Service worker registration + Install button |
| `sw.js` | Network-first offline cache, one per cache-bust version ([PWA](#installable-app-pwa-and-offline)) |
| `manifest.webmanifest` | Web app manifest; icons in `assets/icons/` |
| `js/iso/` | Three.js iso renderer (modules below) |
| `js/iso/worlds/` | One file per world: grid + legend, native hazards / anchors, world props, decoration |
| `tools/iso-check.mjs` | Headless map / hazard-plan / scene validator |
| `js/platformer.js` | Legacy 2D run (`?renderer=2d` / no-WebGL fallback only; ready to retire) |
| `vendor/` | Three.js r186 (import map, no build step) |
| `js/rng.js` | Seeded PRNG |
| `js/odds.js` | Payout + Brier helpers |
| `js/state.js` | Bankroll / calibration / stake stamps |
| `js/ui.js` | DOM (ledger, memo, overlays, door view-models for the hub) + legacy 2D door hall |
| `js/audio.js` | Web Audio cues, buses, crossfades, mute ([Audio](#audio)) |
| `data/manifests.json` | Multiverse job deck (each manifest has an `act` for the jingle) |
| `assets/audio/` | Synthesized music and SFX (`.ogg` + `.mp3`) |
| `tools/music/` | `compose.py` music generator + [README](../tools/music/README.md) |
| `mocks/music-preview.html` | Listen to every cue |
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

`index.html` loads `css/style.css?v=iso-8`, `js/pwa.js?v=iso-8` and `js/main.js?v=iso-8`. Bump that suffix in all three places when shipping CSS or JS changes so browsers and the Pages CDN fetch fresh copies. The `js/pwa.js` suffix also names the service worker and its offline cache (`sw.js?v=iso-8` → `dont-ship-iso-8`), so a bump replaces the installed worker and drops the old cache. Modules imported by `main.js` have no suffix of their own; the network-first worker still serves them fresh whenever the network is up.

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
