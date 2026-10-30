# D.O.N.T. Ship — Design History

_Written 2026-10-30. Covers the design conversation from 2026-10-28 to 2026-10-30._

This is how the project got to where it is: the original plan, the choices made along the way, the directions that were tried and dropped, and why. The current rules are in [`GAMEPLAY.md`](GAMEPLAY.md), the renderer direction and roadmap in [`PLAN.md`](PLAN.md), progression in [`PROGRESSION.md`](PROGRESSION.md), and story in [`NARRATIVE.md`](NARRATIVE.md). This doc records what happened; those docs say what is true now.

Most of the work from Oct 28 and 29 landed in three commits late on Oct 29 (`0cd20b1`, `574c64c`, `84943b0`), so the early phases below come from the design conversation rather than from individual commits.

## Timeline

### 1. The original brief (Oct 28)

The game started as **D.O.N.T. Ship — Definitely Not On Time**, tagline "Delivering Outcomes, Not Timelines." The pitch was a 2D courier platformer with a probability-betting layer on top.

Inspirations:

- **Futurama**: the Farnsworth Parabox (boxes that hold universes), Anthology of Interest (what-if worlds), and Godfellas (a power that helps best when nobody can tell it did anything).
- **Fallout / Vault-Tec**: cheerful mid-century corporate copy over catastrophe.
- **Jev's System One decision model, flipped**: the machine generates the odds and the human makes the decision.

The core loop was: take a job → see three doors, each with a displayed probability and a payout of about `1/p − 0.05` (the house edge) → bet → play a short platforming run → get paid or forfeit the stake → update a ledger that tracks bankroll (**C.O.D.**) and Brier calibration (**O.D.D.S.**). Door odds would depend on player history, drift, the session economy, and the house edge. The facility had four zones (Dock, Sorting, Cold Storage, Executive), and the final door would be labelled 99% and resolve otherwise.

The build was planned in four phases:

1. Client-only vanilla JS and Canvas, ASCII room templates, seeded PRNG.
2. An odds-provider abstraction.
3. A real Jev behind a serverless endpoint.
4. Sabotage and corrupted manifests.

The repo was created at `~/Projects/dont-ship`, intended for the DataKnifeAI GitHub org.

### 2. Branding

The first mascot pass proposed **Wally the Warehouse Stork**, with Peg the Probability Pigeon and Crate the Chrono-Crane as alternates. The user asked for a wolf instead, which produced **Packett** (alternates Howlsworth and Jevvy). Wally was kept, but as the boss: he became the Dock Supervisor NPC, giving the in-fiction org chart courier → Wally → J.E.V.

A name search for the wolf (Parcelton, Codsworth, Drift, Brier, Boxley, Oddsley, Fen, Lumen, Sortie, Latewolf) settled on **Fen**. Fen was then narrowed to a cute, non-humanoid wolf **logo** only. The herographic went back to Wally as the hero, with a Fen seal in the bottom-left corner composited from an earlier Fen herographic, and the top-right seal removed. The earlier anthropomorphic Packett and Fen art was kept and marked deprecated. The rules and file list are in [`assets/brand/README.md`](../assets/brand/README.md).

### 3. Phase 1 playable: 2D side view

The first playable build was a 2D Canvas side-scroller with 12 manifests (`data/manifests.json`) and ASCII room templates (`data/rooms.json`). The first fixes were basic:

- The first room had no visible path; it was effectively a drop maze.
- The canvas was squished because the grid stretched to fit.
- After fixing that, the camera was too zoomed out and the overlay text was crushed.

### 4. First feedback round

The next round of feedback asked for better graphics, doors drawn on the canvas, an 8-bit courier holding a package, more variety between screens, and wording fixes. It also added:

- **Light goals** with local bests: reach 200 C.O.D., complete 5 deliveries, or survive the Executive manifest `DN-1909-J` (`GOALS` in `js/state.js`).
- **Door stake stamps** showing tier, hazard, and payout, plus the line "Low % = harder room. Clear it more often than the odds → +EV." This came from the user not being able to tell how the three doors differed.
- A camera fix for hard rooms, where the courier could end up off screen.
- Removal of a duplicate door panel at the side.

### 5. Fiction pivot: pocket universes

The user pushed back on the setting: the game should not be a sorting-floor treadmill. **Box 407-B became the door hub**, and each door opens a pocket universe with its own layout and challenges on the way to a customer. The shipping floor is just one universe among many. The tone moved toward Futurama and Rick & Morty randomness, with hazards that come from each world itself (traffic, weather, space, and so on). The rooms became 12 worlds with world-native hazard tags.

### 6. The J.E.V.'s role

The J.E.V. was defined as the odds layer, not the renderer. That was later broadened: the J.E.V. could be a **challenge composer** that picks the world, the hazard loadout, difficulty, parcel rules, customer flavour, drift and sabotage, rare mid-run nudges, how generous the house is, and the arc of a session. All of that would come through one interface, `resolveRunSetup(state)`, while physics and seeded layout stay deterministic. An OpenRouter placeholder was added in `.env.example`; it is not wired into the game.

### 7. The 2.5D detour

The user asked for 2.5D, citing Fez, LittleBigPlanet, Donkey Kong Country: Tropical Freeze, Rayman Legends, Cuphead, Oddworld, Crash Bandicoot, and Klonoa. The approach was mock-first: AI-generated painted stills of the hub, the porch, and space ([`assets/mocks/25d/`](../assets/mocks/25d/README.md)).

Two implementations followed, and neither matched:

- **Canvas parallax** (far, mid, and foreground layers scrolling with the camera, plus painted plates in `assets/game/`). The user's verdict: "it doesn't look like the mocks."
- **Lane-depth 2.5D**: three depth lanes (FAR, MID, NEAR) with ↑/↓ to change lanes and a painted courier sprite, aimed at "like Metal Gear." It still didn't match.

### 8. Plan reset: isometric Three.js

This was the key turning point. Two problems were identified:

- **Code-drawn art cannot match painted AI mocks.** The mocks were setting a target the code had no way to hit.
- **"Like Metal Gear" meant a different genre.** It pointed at a 3D overhead view, not a side-scroller with lanes.

The user chose an **isometric** camera (Hades / Into the Breach framing) with **low-poly toon shading in Three.js**. This time the mock was a real rendered Three.js scene rather than an image: a porch diorama and a deep-space diorama with a controllable courier (`mocks/iso-preview.html`). The user approved it: "that is what I am looking for." [`PLAN.md`](PLAN.md) was rewritten around this direction, and the painted mocks were marked as mood reference only.

### 9. Roadmap step 1: first iso worlds

`world_porch` and `world_space` were wired into the real loop (bet → run → payout and Brier) through `js/iso/` behind the same `startRun(template, seed, mods)` contract the 2D run used. The run keeps **one life**: the mock's respawn was dropped, matching the 2D rules. Hub and runs share a single WebGL renderer.

### 10. Progression design

The flat goals were the problem: any one of them "won," nothing escalated, and nothing carried over. Inspirations were Balatro, Luck Be a Landlord, Hades, Slay the Spire and FTL, Mega Man and Metroid, Risk of Rain 2, Death Stranding and Crazy Taxi, Hitman and Celeste, and Spelunky.

[`PROGRESSION.md`](PROGRESSION.md) set out:

- **Universe tiers with tools**, where each tier 2–4 world is possible but painful without its tool.
- **Tools change the odds**: the J.E.V. prices your loadout, not just the door.
- **Tools versus perks**: tools last a career, perks last one delivery.
- **Shift quotas** set by Wally, escalating across the four acts.
- **Counter-scaling** that adds new problems but never fully cancels a bought tool.
- **Calibration as J.E.V. trust**: O.D.D.S. becomes a clearance level.
- A **persistence model**: Commendations and licenses are permanent; C.O.D., tools bought with C.O.D., act, and clearance reset each career; perks reset each delivery.

One finding came out of this: O.D.D.S. currently scores the J.E.V.'s displayed odds, not the player. Calibration trust needs a player forecast per delivery before it can mean anything.

### 11. Roadmap step 2: all 12 worlds in iso

All 12 templates were ported to iso maps (`js/iso/worlds/*.js`). Each door's hazard tags and difficulty tier now drive the hazards on every world through `js/iso/hazardplan.js`, and the headless checker `tools/iso-check.mjs` validates every world, tag, and tier without a browser. This step was interrupted once by a usage limit and resumed afterwards.

### 12. Narrative

The long-term player goal became: learn what the company is for, reach the J.E.V., and understand why we deliver. The user's theme was the arc of AI: from making life easier, to rapid acceleration of work, to CEOs saying it will end all jobs or the world, to users open-sourcing what companies do. These are two sides of the same coin. The technology is neither good nor evil; it depends on how it's used (curing cancer versus ending jobs for profit).

The chosen core truth is **"You are how the machine decides."** From that came acts as AI eras, the C.O.D. coin with two faces, mirror universes that share a map but differ in dressing, three factions plus Wally, and three endings: Profit, Open, and Don't Ship. All of it is in [`NARRATIVE.md`](NARRATIVE.md).

### 13. Roadmap step 3: the hub in 3D

Box 407-B became a 3D iso room (`js/iso/hub.js`) with clickable doors, Wally at a podium, a Fen poster, and a J.E.V. odds terminal. A title screen was added in the same hall, the UI was unified into one card-and-stamp system, and the manifest side panel was removed.

### 14. Shipping (Oct 29)

- The work so far was committed (`0cd20b1`, `574c64c`, `84943b0`).
- The repo went from private to public under **Apache 2.0**, with a `NOTICE` crediting Three.js (MIT) (`b6819bf`).
- GitHub Pages was set up with the custom domain **ds.dataknife.ai** via a Cloudflare CNAME set to DNS-only (`aca47b3`). The site looked broken for a while, but the cause was a local UniFi gateway caching an NXDOMAIN answer, not the DNS record.
- The Pages source was later switched from an Actions workflow that didn't exist to branch builds from `main`.
- The README was simplified and the details moved into `docs/` (`708a2c7`).
- The project was added to dataknife.ai.

### 15. Audio (Oct 30)

No music-generation model was available, so the music is synthesized in code: [`tools/music/compose.py`](../tools/music/README.md) uses numpy and ffmpeg to build 8 cues (`036a2ec`). Options noted for later were ElevenLabs Music and SFX, Google Lyria 2 and Lyria RealTime, Suno, Udio, Stable Audio Open, and MusicGen (whose weights carry a non-commercial licence caveat).

The cues were wired in with Web Audio, with an act-based detune of the company jingle and a mute control (`8b2a336`). Fixes since then:

- **Shift-clear overlap**: the run bed played under the coin motif, jingles stacked, and the forfeit sting could play twice. The coin motif now plays alone (`9d1cb79`).
- **"Keep shipping" not resetting shift progress**: being fixed at the time of writing.
- **Mobile-friendly layout and PWA**: in progress at the time of writing.

## Decision log

| Decision | Alternatives considered | Why | Status |
|----------|-------------------------|-----|--------|
| Machine sets odds, human decides | — | Flips the System One model; later became the story's core truth | Locked |
| Payout ≈ `1/p − 0.05` | — | The house edge means +EV comes from beating the J.E.V., not grinding | Locked |
| Wally (stork) as hero and boss | Peg the pigeon, Crate the crane | User kept Wally after asking for a wolf | Locked |
| Fen as the wolf's name | Packett, Howlsworth, Jevvy, and others | Picked from the name search | Locked |
| Fen is a non-humanoid logo only | Fen as a bipedal courier hero | Wally reads better as the poster hero; Fen works as a seal | Locked |
| Doors open pocket universes | A sorting-floor treadmill | User wanted variety; hazards come from each world | Locked |
| Door stake stamps (tier · hazard · payout) | Odds and payout only | Players couldn't tell the doors apart | Shipped |
| J.E.V. composes runs via `resolveRunSetup(state)` | J.E.V. sets odds only | Lets an AI shape worlds and hazards while physics stays deterministic | Planned (Phase 2–3) |
| Isometric low-poly Three.js | Canvas parallax, lane-depth 2.5D | Earlier attempts couldn't match the mocks; "like Metal Gear" meant overhead 3D | Locked |
| Mock with the real tech | AI-painted stills | A rendered scene shows what the code can actually do | Adopted as practice |
| One life per run | Respawn (as in the iso mock) | Keeps the bet meaningful | Shipped |
| One shared WebGL renderer | — | Hub and runs draw through one GL context; each run disposes its scene | Shipped |
| Hazards from door tags + tier | Tags as HUD stamps only (step 1) | Makes the door choice change the run | Shipped |
| Career-scoped tools, permanent licenses | Tools that persist forever | Permanent tools would collapse tool-aware pricing and quota tension | Designed |
| Player forecast for O.D.D.S. | Scoring the displayed odds | The current score grades the J.E.V., not the player | Open |
| Endings: Profit, Open, Don't Ship | — | Two coin faces plus refusal; each changes the next career mechanically | Designed |
| Apache 2.0, public repo | Stay private | Open project; Three.js credited in `NOTICE` | Shipped |
| Pages branch builds from `main` | Actions workflow | The configured workflow didn't exist | Shipped |
| Music synthesized in code | Music models (ElevenLabs, Lyria, Suno, Udio, Stable Audio Open, MusicGen) | No model available; deterministic and license-clean | Shipped |

## What was superseded and where it lives

- **Painted 2.5D mocks**: [`assets/mocks/25d/`](../assets/mocks/25d/README.md) and the gallery `mocks/25d-preview.html`. These are mood and composition reference only. The 3D hub still borrows its layout from `hub-box-407b-25d.jpg`, but nothing new should try to reproduce the painted look.
- **Painted runtime plates**: [`assets/game/`](../assets/game/README.md) (`*-plate.jpg`, `courier-side.jpg`), used by `js/art.js` for the 2D parallax attempt.
- **2D side-scroller with depth lanes**: `js/platformer.js`, plus the 2D door hall in `js/ui.js`. It now runs only with `?renderer=2d` or when WebGL is unavailable. The FAR / MID / NEAR lanes and ↑/↓ lane switching live here. PLAN step 2 marks it as ready to retire once a no-WebGL message replaces the fallback.
- **Deprecated brand art**: in [`assets/brand/`](../assets/brand/README.md), `packett-wolf-portrait.jpg` and `dont-ship-repo-herographic-wolf.jpg` (Packett), and `fen-wolf-portrait.jpg` and `dont-ship-repo-herographic-fen.jpg` (anthropomorphic Fen). Kept for history only.
- **Flat session goals**: still live in `GOALS` in `js/state.js`, to be replaced by shifts, quotas, and acts from [`PROGRESSION.md`](PROGRESSION.md).
- **The iso mock**: `mocks/iso-preview.html` is kept as the approved look-and-feel reference, but its respawn behaviour was not carried into the game.

## Lessons learned

- **Mock with the real tech.** Painted AI stills looked great and set a target the code-drawn renderer could never reach. The Three.js mock was approved the first time because it was the real thing.
- **Pin down genre words early.** "2.5D" covered everything from parallax to lanes to full 3D, and "like Metal Gear" meant an overhead 3D camera, not a side-scroller with depth lanes. Asking for a reference screenshot or a named camera up front would have saved two implementations.
- **Commit often.** Two days of work went in as three commits on the night of Oct 29, and a usage-limit interruption landed in the middle of the world port. Small, frequent commits make interruptions cheap to resume from and keep the history readable.
- **Automated checks can't judge feel or sound.** `tools/iso-check.mjs` proves routes exist and hazard plans are seeded, and audio debug hooks show which cues are playing, but the shift-clear overlap and how the runs feel were only caught by playing.
- **Check local DNS caches before blaming the record.** The custom domain looked broken because the local UniFi gateway had cached NXDOMAIN, while the Cloudflare record was fine.

## Open threads

- **Renderer roadmap** ([`PLAN.md`](PLAN.md)): walk up to a door to bet instead of clicking; retire `js/platformer.js`; J.E.V. Phase 2 (`getOdds` provider abstraction) and Phase 3 (Jev endpoint, then `resolveRunSetup`).
- **Progression** ([`PROGRESSION.md`](PROGRESSION.md)): shift quotas and the perk shop come first, then tiers, tools, and tool-aware odds, then calibration trust (which needs the player forecast). Quota curve, prices, and clearance thresholds are still open questions.
- **Narrative** ([`NARRATIVE.md`](NARRATIVE.md)): act tags and text-only lore first, then mirror worlds, `data/lore.json`, the finale, and Phase 4 corrupted manifests. Whether the courier stays unnamed is still open.
- **In flight at the time of writing**: the "Keep shipping" shift-progress reset, and mobile-friendly layout with PWA support.
