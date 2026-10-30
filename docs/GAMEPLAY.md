# D.O.N.T. Ship — Gameplay

_How the current build plays. Design direction lives in [`PLAN.md`](PLAN.md), future progression in [`PROGRESSION.md`](PROGRESSION.md), story in [`NARRATIVE.md`](NARRATIVE.md)._

## Premise

**Definitely Not On Time** — Delivering Outcomes, Not Timelines.

A tiny multiverse courier game about betting on doorways. Wally (Dock Supervisor, **Box 407-B**) dispenses a parcel and three doors. Each door opens into a **pocket universe** with its own layout and world-native hazards. You take the stake, run a short isometric 3D courier level, and **deliver to the customer** (OUT / recipient) — or forfeit. Your **O.D.D.S.** score tracks how well your picks match reality (Brier-style calibration).

Tone: cheerful corporate dystopia over cosmic nonsense (Futurama / What-If energy). A shipping-floor universe is one valid biome among many — not the whole identity.

Cast: Fen (cute wolf) is the logo mark. Wally is the stork boss. The J.E.V. stamps outcomes upstairs. Art rules for both are in [`assets/brand/README.md`](../assets/brand/README.md).

## How to play

1. **Clock in** (button or **Enter**) — bankroll starts at **100 C.O.D.**; stake is **10** per doorway.
2. Read the **routing memo** and parcel stamps (e.g. fragile) in the dispatch bar along the bottom of the hall.
3. Pick a door by **clicking** it (or its ticket) or with keys **1 / 2 / 3**. Each door's sign shows the displayed % and payout. The door face shows the tier stamp; the ticket below lists hazard stamps and the outcome blurb.
4. **Run** that universe and reach the gold **OUT / RCPT** stamp (customer delivery).
5. Survive → stake × payout returned to bankroll. One hazard hit, a fall, or a fragile hard landing (jumping down 3+ levels) → stake gone (no respawn). Forecast logged either way.
6. Watch **C.O.D.** and **O.D.D.S.** in the masthead.

### Controls

| Where | Input |
|-------|-------|
| Title / result cards | **Enter** for the primary button |
| Door hall | Click a door or its ticket, or **1 / 2 / 3** |
| Iso run | **WASD / arrows** move in 8 directions, **Space** jumps (up to 2 levels, or across a 1-tile gap), mouse wheel zooms |
| Legacy 2D run (`?renderer=2d`) | **← / →** move, **↑ / ↓** change depth lane, **Space** jump |

## Odds, payout, and O.D.D.S.

- Payout ≈ `(1 / displayedProb) − 0.05` (the house edge). At face value every door is slightly −EV; a door is +EV only when your true chance beats the displayed % by more than the edge.
- Each delivery logs a forecast (currently the door's displayed probability) and the outcome. **O.D.D.S.** is the Brier score over those pairs: lower is better calibrated.
- Helpers: `js/odds.js` (payout, Brier), `js/state.js` (bankroll, forecasts, stamps).

## Goals

Phase 1 session goals — any one clears the shift (`GOALS` in `js/state.js`):

- Reach **200 C.O.D.**
- Complete **5 deliveries**
- Survive the Executive manifest **`DN-1909-J`**

After **SHIFT CLEARED** you can keep shipping or start a new shift at 100. If the bankroll can't cover the stake, Wally stamps your badge **INSUFFICIENT C.O.D.** and the bankroll resets to 100. Best bankroll and best O.D.D.S. are kept in `localStorage` as local bests (no online leaderboard yet).

These flat goals are placeholders; [`PROGRESSION.md`](PROGRESSION.md) replaces them with shifts, quotas, and acts.

## Seeding

Identical manifest + door → identical seeded run (hazard placement, speeds, and timings).

## World roster (all iso)

Twelve templates in `data/rooms.json`, one iso map each in `js/iso/worlds/`. Hazards come from the chosen door's tags and tier; when a door's tags are `none`, the world's native hazards run instead.

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

## Hazards and difficulty

Every door carries hazard tags (e.g. `sentient_traffic`, `ice`, `black_hole_slot`) and a tier (**easy / hard / brutal**). Tags pick hazard types; the tier scales their count, speed, push strength, telegraph time, and lethal window. Every lethal hazard is timed, moving, or off-route, so the route is never permanently blocked.

The full tag → behaviour table and the tier scaling numbers are in [`PLAN.md` § Hazard tags](PLAN.md#hazard-tags-step-2).
