# D.O.N.T. Ship — Progression & Incentives

_Drafted 2026-10-29. Companion to `docs/PLAN.md` (renderer/roadmap). This doc covers why a player keeps opening doors._

## Problem

Phase 1 session goals are flat: any one of 200 C.O.D., 5 deliveries, or surviving the Executive manifest (`DN-1909-J`) "wins" (`GOALS` in `js/state.js`). Nothing escalates, nothing carries over, and there is no reason to pick a harder door beyond curiosity. We need **pressure inside a run** and **growth across runs**.

## Terms

| Term | Meaning |
|------|---------|
| **Delivery** | One door attempt: bet → iso run → delivered or forfeit (`startRun`). One life. |
| **Career** | One roguelite run: hired at the dock → fired (missed quota) or retired (cleared Executive). |
| **Shift** | A block of N deliveries ending in a quota check by Wally. |
| **Act** | A group of shifts with a theme and quota scale: Dock → Sorting → Cold Storage → Executive. |

## Inspirations

| Game | What we take |
|------|--------------|
| Balatro | Escalating antes; modifier synergies; betting is already our core verb. |
| Luck Be a Landlord | Escalating rent → corporate quota. |
| Hades | Death advances the story; NPC (Wally) reacts; meta upgrades; Heat = opt-in difficulty. |
| Slay the Spire / FTL | Risky path choice each step; acts. |
| Mega Man / Metroid | Tool-gated progression. |
| Risk of Rain 2 | Difficulty scales alongside items, never erases them. |
| Death Stranding / Crazy Taxi | Delivery ratings, tips, recurring customers. |
| Hitman / Celeste | Per-level challenges and collectibles. |
| Spelunky | Daily seeded run + leaderboard. |

## Universe tiers and tools

Each tier introduces mechanics, and each world has a tool that helps with its signature mechanic. Tier 1 teaches the basics with no tools.

| Tier | World (`data/rooms.json` id) | Label | New mechanic | Tool |
|------|------------------------------|-------|--------------|------|
| 1 | `world_porch` | Suburban Porch-3 | timing | — |
| 1 | `world_neighborhood` | Quiet Block Ω | traffic (`sentient_traffic`) | — |
| 1 | `world_shipping` | Shipping Floor (Alt) | conveyors (`belts`) | — |
| 2 | `world_rooftops` | Storm Rooftops-9 | gaps (+ `acid_rain`) | **Grapple hook** |
| 2 | `world_frozen` | Frozen Outpost-7 | ice (`ice`) | **Ice cleats** |
| 2 | `world_neon` | Neon Alley X-12 | wind push (`portal_wind`) | **Portal anchor** |
| 3 | `world_jungle` | Crystal Ruin Canopy | patrolling creatures (`crystal_fauna`) | **Crystal tuner** |
| 3 | `world_underwater` | Sunken Post Route | currents (`pressure`) | **Rebreather** |
| 3 | `world_desert` | Desert Highway ∞ | vanishing tiles (`heat_shimmer`) | **Heat visor** |
| 4 | `world_space` | Deep Space Docklet | low gravity (`low_gravity`) | **Mag boots / jetpack** |
| 4 | `world_unmapped` | Unmapped Void | black holes (`black_hole_slot`) | **Mag boots / jetpack** |
| 4 | `world_impossible` | Impossible Geometry | glitches, Meeseeks chasers (`meeseeks`, `meta`) | **Reality stapler** |

**World-building rule:** every tier 2–4 world must be **possible but painful without its tool**. There is always a tool-free line (a longer route, a tight jump, a timing window), and the tool makes it comfortable or opens a shortcut. This directly constrains the iso port (PLAN step 2): author each map with the unequipped route first, then add tool affordances (grapple points, anchor sockets, mag-plate tiles).

### Tools and odds

- Unequipped worlds still appear on the manifest, stamped **"REQUIRES: GRAPPLE"** etc. They are attemptable but much harder, so J.E.V. posts a low displayed % and a high payout.
- Owning the tool raises the displayed % and lowers the payout. **J.E.V. prices your loadout**, not just the door.
- J.E.V.'s pricing is a model of an average courier with that loadout. When it underestimates your skill or gear (e.g. you are good at gap jumps without a grapple), the door is **mispriced** — the +EV hunt from the original brief. Since payout ≈ `1/p − 0.05`, a door is +EV exactly when your true p beats the displayed p by more than the house edge.

Illustrative (Storm Rooftops, hard):

| Loadout | Displayed p | Payout |
|---------|-------------|--------|
| No grapple (REQUIRES: GRAPPLE) | 0.10 | ×9.95 |
| Grapple | 0.35 | ×2.81 |

## Two purchase types

Bought at **Wally's desk** between deliveries, with C.O.D.

| Type | Lifetime | Role | Examples |
|------|----------|------|----------|
| **Tools** | Rest of the career | Open routes / make worlds comfortable (Mega Man model). Change J.E.V. pricing. | Grapple hook, Ice cleats, Portal anchor, Crystal tuner, Rebreather, Heat visor, Mag boots / jetpack, Reality stapler |
| **Perks** | One delivery (consumed) | Tactical bet shaping. | **Insurance** — refund 50% of stake on forfeit. **Padded crates** — fragile parcel survives one hard landing. **Express Stamp** — + payout on brutal doors. **Odds Leak** — reveal true odds on one door. |

Tools are the long-term investment; perks are the per-bet decision. Spending C.O.D. on either competes with hitting the quota, which is the point.

## Shift quotas

Wally sets a C.O.D. **quota due after N deliveries**. Miss it and you are fired; the career ends. Quotas escalate through four acts, forcing riskier doors later.

| Act | Shifts | Deliveries / shift | Quota character |
|-----|--------|--------------------|-----------------|
| Dock | 2 | 4 | Reachable on easy doors; teaches the loop. |
| Sorting | 2 | 4 | Needs some hard doors or a first tool. |
| Cold Storage | 2 | 5 | Needs tools and at least one mispriced door per shift. |
| Executive | 1 + finale | 5 | Ends with the Executive manifest (`DN-1909-J`) as a boss delivery. Clear it to retire. |

The current flat `GOALS` (200 C.O.D. / 5 deliveries / Executive) become, respectively, a Dock-act milestone, the first shift length, and the career finale.

Note: with displayed odds and payout ≈ `1/p − 0.05`, expected value is slightly negative at face value. Quotas therefore **require** beating J.E.V. (skill, tools, mispricing, perks) rather than grinding easy doors — that is intended.

## Counter-scaling (company policy)

The company notices when you get good.

| Lever | How it works |
|-------|--------------|
| **Repricing** | Easy doors pay less as your gear improves (rubber-band from the brief). |
| **Quota growth** | Quotas rise with act **and** with tools owned (seniority). |
| **Counter-hazards** | New problems that challenge a tool without nullifying it (table below). |
| **Overtime contracts** | Opt-in rules on a door for bonus payout: no hits, time limit, two parcels. Hades Heat, per delivery. |
| **Audits** | Occasional cheerful memo: "Per Policy 9-Ω your Insurance has been reclassified as a gift. Enjoy!" Revokes a perk or issues a fine. |

| Tool | Counter-hazard |
|------|----------------|
| Grapple hook | Birds cut grapple lines mid-swing. |
| Ice cleats | Black ice patches the cleats can't grip. |
| Portal anchor | Portal surges briefly yank the anchor loose. |
| Crystal tuner | Off-key crystals that ignore the tuner. |
| Rebreather | Pressure spikes drain air faster. |
| Heat visor | Glare flashes blind the visor for a beat. |
| Mag boots / jetpack | EMP zones disable boots briefly. |
| Reality stapler | Unstapling glitches; Meeseeks that pull staples. |

**Design rule (Risk of Rain 2 lesson):** scaling raises the floor and adds new problems but **never fully cancels a purchased tool**. A counter-hazard is local and temporary; owning the tool is always better than not owning it in that world.

## Calibration = J.E.V. trust (signature mechanic)

O.D.D.S. (Brier calibration) becomes **clearance with J.E.V.**

| Clearance | Gate (rolling Brier, min. sample) | Effect |
|-----------|-----------------------------------|--------|
| Reckless Courier | poor | Stamp on your file; worse prices (wider house edge). |
| Probationary | default | Standard pricing. |
| Cleared | good | Drift hints on doors (which way the true odds lean). |
| Trusted | very good | True odds revealed on mispriced doors. |
| J.E.V. Confidant | excellent | Access to stranger universes and off-manifest doors. |

**Prerequisite:** today the logged forecast is the door's displayed probability (`js/state.js`), so Brier measures J.E.V., not the player. This mechanic needs a **player forecast** per delivery (e.g. a "your odds" stamp/slider before entering, defaulting to displayed). Clearance then rewards honest, accurate self-assessment rather than lucky streaks.

## Meta progression

Every career earns **Commendations** (separate from C.O.D.), for things like deliveries made, acts reached, stars, collectibles, and good calibration. Spent at the Personnel Office on:

- **Universe unlocks** — later-tier worlds enter the manifest pool.
- **Tool licenses** — see persistence model.
- **Starting perks** — begin a career with a perk in hand.
- **Courier cosmetics.**
- **Lore memos** — including the J.E.V. origin story, unlocked in pieces.

Getting fired advances the story: **Wally reacts to how you were fired** (missed quota in Dock vs. vaporized by a black-hole slot in Executive), Hades-style.

### Persistence model

| Persists forever | Resets each career | Resets each delivery |
|------------------|--------------------|----------------------|
| Commendations; universe unlocks; tool **licenses**; starting-perk unlocks; cosmetics; lore; stars, collectibles, customer storylines; lifetime O.D.D.S. record | C.O.D. bankroll; tools bought with C.O.D.; quota/act; clearance level | Perks |

Tools bought with C.O.D. last only for the career. A **license** (bought with Commendations) makes a tool permanent in a limited way: licensed tools are cheaper at Wally's desk, and at hire you pick **one** licensed tool as starting kit.

**Why:** the core decision is "attempt this world unequipped at a high payout, or buy the tool and accept worse odds-pricing." If C.O.D. tools persisted forever, a few careers would leave every door fully equipped, collapsing tool-aware pricing, the tier ladder, and quota tension. Career-scoped tools keep that climb fresh each run; licenses give Hades-style permanent growth that shortens the climb without skipping it.

## Per-world mastery

- **1–3 star delivery ratings:** speed, parcel condition, no hits.
- **Lost parcel collectible:** one per world, off the main route (often behind the tool-free hard line).
- **Recurring customers:** e.g. R. Glorbo, with small storylines that continue across universes and careers. Recurring customers may tip.

## Daily manifest

The same seeded career for everyone each day (Spelunky). No meta carry-in (no licenses or starting perks) so runs are comparable. Local leaderboard first; online once the Phase 3 server exists.

## Implementation order

| # | Feature | Why this order |
|---|---------|----------------|
| 1 | Shift quotas + perk shop | Most tension for the least content; works with existing worlds. |
| 2 | Tiers + tools + tool-aware odds | Depends on iso worlds being authored "possible but painful" (PLAN step 2). |
| 3 | Calibration trust | Needs player forecast input; builds on tool-aware pricing for mispricing hints. |
| 4 | Meta unlocks + Commendations | Needs things worth unlocking (tiers, tools, perks). |
| 5 | Ratings, collectibles, recurring customers | Content layer on stable worlds. |
| 6 | Daily manifest + leaderboard | Local first; online after Phase 3 server. |

## Open questions

- **Quota curve:** exact C.O.D. targets per shift and how strongly they scale with tools owned. Fixed stake of 10, or let players raise the stake to chase quotas?
- **Tool prices** in C.O.D., license prices in Commendations, and the license discount.
- **Who picks counter-hazards and repricing:** local rules, or J.E.V. via `resolveRunSetup(state)` (pass loadout + clearance in `state`, get `hazards` / `parcelMods` back)?
- **How J.E.V. prices loadout:** fixed per-tool delta per world, or a learned model once Jev exists (risk: a learning Jev could close mispricings too fast).
- **Player forecast UX:** slider vs. a few stamp buckets; is it required or optional?
- **Clearance thresholds** and minimum sample size so early luck can't jump tiers.
- **Overtime contracts:** per door or per shift; how they stack with Express Stamp.
- **Audit frequency** and whether audits can be insured against.
- **Mag boots vs. jetpack:** one tool covering space and unmapped, or two.
