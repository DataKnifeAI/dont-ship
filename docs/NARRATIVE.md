# D.O.N.T. Ship — Narrative

_Drafted 2026-10-29. Companion to [`docs/PLAN.md`](PLAN.md) (renderer/roadmap) and [`docs/PROGRESSION.md`](PROGRESSION.md) (careers, quotas, clearance). This doc covers what the game is about and how players find out._

## Premise

You are a courier at D.O.N.T. Ship (*Definitely Not On Time* · "Delivering Outcomes, Not Timelines."). From Box 407-B you open one of three doors, each priced by the **J.E.V.** (Joint Evaluation of Variables), step into a pocket universe, and hand a parcel to a customer. You're paid in **C.O.D.** (Couriers Of Destinies) and graded on **O.D.D.S.** calibration.

There are no cutscenes. The story is told through shipping labels, memos, signage, customer lines, and Wally's reactions, and it gets stranger the higher you climb in the building.

## Theme: two sides of the same coin

The story echoes what we are living through with AI. It begins as a helper that makes life easier, then everything speeds up, then executives announce that it will end every job or end the world (and both announcements double as marketing), and then the workers turn it around by publishing what the company keeps secret.

The game takes no side on the technology. **The tech is neither good nor evil; how it's applied decides that.** The same model that cures cancer can lay off a hospital, and the same map can lead to either outcome. The game is built so the player sees both outcomes and draws their own conclusion.

### Core truth

> **You are how the machine decides.**

The J.E.V. can compute odds for everything but cannot *choose*. A probability is not an event; it takes a courier walking through a door to turn 0.35 into "it happened." Every delivery is a human choice that makes one outcome real. That is the job, and that is why the company needs couriers at all.

This is the original design flip, stated as lore: **the machine generates the odds, the human makes the decision.**

Secondary threads, hinted but never resolved on screen:

- **Delivery creates demand (Jevons).** Every efficiency gain means more parcels, not fewer. The faster you ship, the more there is to ship.
- **The loop.** Runs are seeded, so the same seed gives the same universe, and the courier has been here before. The last customer on the route is you (the Fry-as-own-grandfather loop; see `DN-2001-K`).

### Long-term player goal

Learn what the company is for, reach the J.E.V., and understand why we are delivering these packages. Every career moves the player one floor closer to the answer, and every firing teaches something too (Hades rule: death advances the story).

## Acts as AI eras

The four acts in PROGRESSION.md are four floors of the facility and four eras of the story.

| Act / floor | Era | J.E.V. is… | Wally | The Board | The Open Ledger | Player learns |
|-------------|-----|-------------|-------|-----------|-----------------|---------------|
| **Dock** | Help | A cheerful assistant. "I computed your day. It is 78% pleasant." | Proud, a little smug, quotes the J.E.V. | Unseen. Welcome posters only. | Absent. | The loop: bet, run, payout. Odds are a gift. |
| **Sorting** | Acceleration | A productivity engine. Quotas rise *because* everything is faster. | Nervous. Coworkers vanish from the roster. A terminal appears on his desk "for support." | Memos about "increased opportunity." Audits start. | First stencils on crates. | Speed creates more work (Jevons). Someone is being replaced. |
| **Cold Storage** | The Pitch | A product. The Board broadcasts that it will end all jobs, then that it will end the world. Both are ads. | Openly scared, and still loyal. | Live broadcasts on every screen. Mirror doors with Board bonuses. | Couriers leak the odds. Leaflets, graffiti, the Odds Leak perk. | Doors point at futures that haven't happened yet. The same map can have two outcomes. |
| **Executive** | The Machine | Neither villain nor savior: "I compute. You choose." | Caught in the middle, asks what you'll do. | Wants you to sign. | Wants you to publish. | The core truth. The 99% door. The coin. |

### Dock: Help

- Signage is all sunshine: "THE J.E.V. HANDLES THE MATH SO YOU CAN HANDLE THE STAIRS."
- Shipping labels are mundane conveniences: groceries, a birthday card, "1× CONVENIENCE."
- No mirrors yet. Every world shows its pleasant face.
- One wrong note: the memo in `DN-1337-D` ("When you do things right, couriers won't be sure which universe did anything at all."). It sets up the Godfellas reveal.

### Sorting: Acceleration

- The quota curve from PROGRESSION.md *is* the story. Each quota memo credits the J.E.V. for the increase.
- A **courier roster board** in the hub shrinks each shift (14 → 9 → 4). Names are crossed out with cheerful notes.
- The first mirror appears: `world_shipping` is the company's own floor, and in the PROFIT version it has no humans.
- Wally's lines shift from "per policy" to worrying about the terminal on his desk.
- Audits (PROGRESSION.md, counter-scaling) are the first Board actions the player can feel.

### Cold Storage: The Pitch

- Hub screens show **Board broadcasts** of a faceless Chair at a podium. Each one predicts total job loss or the end of the world, then says pre-orders are open.
- Door outcome text starts naming futures that haven't happened yet. The existing `DN-1608-G` door C already does this: "A gap that opens onto a delivery you will make later."
- Mirror doors come with labels and a **Board bonus**: the PROFIT face pays more. That's the temptation under quota pressure.
- The Open Ledger surfaces: stenciled crates, leaflets in lost parcels, and the **Odds Leak** perk reframed as their tool.

### Executive: The Machine

- Reached by clearing Cold Storage quotas (PROGRESSION.md). The full truth also needs high clearance (see [Floors as clearance](#floors-as-clearance)).
- The J.E.V. speaks plainly for the first time. It isn't hiding anything; nobody asked.
- `DN-1909-J` door C ("Labeled 99%. Resolves otherwise.") is reread here: **99% is the J.E.V.'s forecast that you will ship.** Resolving "otherwise" means you didn't. Before the truth, it's a trap door (true p 0.12). After it, it's the way to the Don't Ship ending.
- The finale is a coin flip that isn't random (see [The coin](#the-coin)).

## Floors as clearance

PROGRESSION.md has two separate axes, and the narrative uses both without merging them:

- **Act (quota)** decides *which floor you work on*. Your badge colour changes and new worlds and signage appear.
- **Clearance (calibration trust)** decides *how much each floor tells you*. Memos are redacted until the J.E.V. trusts your forecasts.

| Clearance (PROGRESSION.md) | Lore effect |
|----------------------------|-------------|
| Reckless Courier | Memos arrive heavily redacted. Wally: "They don't let you read the good parts until you stop guessing." |
| Probationary | Standard memos. Redactions on anything about the J.E.V.'s purpose. |
| Cleared | Partial unredaction. Drift hints come with a J.E.V. aside ("I lean left on this one. Don't tell the Board."). |
| Trusted | Full memos. Door tickets show which face (SAVE / PROFIT) a mirror door is before you pick it. |
| J.E.V. Confidant | Off-manifest doors (the Open Ledger's back office, the J.E.V.'s room). The **Don't Ship** ending becomes available. |

Why this fits the theme: the machine trusts the people who are honest about uncertainty, not the ones who win the most. Bankroll buys tools and Board favour; calibration buys the truth.

## The coin

The C.O.D. coin has two faces:

- **Heads:** SAVE HUMANITY
- **Tails:** END JOBS FOR PROFIT
- **Rim:** "LEGAL TENDER IN ALL OUTCOMES"

It appears on every payout, in the HUD ledger icon, and on Wally's desk, where he flips it when he's nervous.

**Finale:** the Board asks you to flip the coin on live broadcast and "let fate decide." The J.E.V. points out that the flip is seeded from your career: every mirror face you delivered and every Board bonus you took. "It isn't chance. It's a summary." The face it lands on colours the epilogue of whichever ending you choose (see [Endings](#endings)).

## Mirror universes

**Rule:** a mirror pair shares one map grid, one route, one hazard plan, and one J.E.V. price. Only the dressing changes: props, signage, palette, customer line, and lost parcel. The J.E.V. prices both faces the same because the maths really is the same. The difference is in how it's applied, which is the theme in level-design form.

Shared customers appear in both faces, so the player meets the same person in two futures.

### Existing worlds that get mirrors

| World | SAVE face | PROFIT face | Shared customer | First act |
|-------|-----------|-------------|-----------------|-----------|
| `world_shipping` | **Shared Shift.** Couriers and J.E.V. arms work the belts together, radio on. | **Lights Out.** No humans. Belts deliver to an empty dock; parcels pile up at RCPT for nobody. | Dot, floor lead (signs for parcels / her locker contents are the parcel) | Sorting |
| `world_neighborhood` | **Four-Day Week.** Friday barbecues, kids in yards. | **Severance Row.** FOR SALE signs, a "Reskilling Starter Kit (VHS)" box on every porch; the sentient traffic is driverless vans. | Dale (gets a fishing rod / gets the VHS kit) | Sorting |
| `world_frozen` | **Seed Vault.** A climate model saved the harvest; the vault is full. | **Coolant Farm.** A server farm drinking the glacier to compute ad bids. | Dr. Varga, glaciologist | Cold Storage (matches the floor name) |
| `world_neon` | **Night Market.** Hand-painted signs among generated ones; artists using the tools. | **Ad Canyon.** Endless generated billboards advertising to nobody. | Sable, sign painter | Cold Storage |
| `world_desert` | **Convoy Diner.** Self-driving freight; drivers became route-keepers, and the diner is busy. | **Ghost Diner.** Trucks drive themselves past a shuttered diner forever (∞). | Rosa, diner owner | Cold Storage |

### Worlds without mirrors (on purpose)

| World | Why it has one face |
|-------|---------------------|
| `world_porch` | It's home. It's the control sample and the loop anchor (`DN-2001-K` "Familiar porch"). |
| `world_rooftops`, `world_jungle`, `world_underwater`, `world_space` | Pure courier adventure. They keep the game a game. Lore comes only from labels and lost parcels. |
| `world_unmapped` | Futures not yet made: the coin still in the air. Its door text predicts later deliveries. |
| `world_impossible` | Executive. Both faces meet here, and the portraits show both. |

### Proposed new worlds

| New id | Label | Faces | Hazards (existing tags) | Act | Priority |
|--------|-------|-------|-------------------------|-----|----------|
| `world_hospital` | St. Eventual's General | **SAVE: Oncology, Cured.** A ward turned garden; someone rings the last-chemo bell. **PROFIT: Fully Automated Care.** Spotless and empty; billing kiosks; the customer is the last nurse, receiving her own badge. | `sentient_traffic` (gurneys), `ice` (polished floors), `heat_shimmer` (auto-doors) | Cold Storage | **High.** This is the flagship mirror from the brief. |
| `world_school` | P.S. 407 | **SAVE: a tutor for every kid.** **PROFIT: a lecture streamed to empty desks.** | `belts` (hallway lines), `meeseeks` (hall monitors) | Sorting / Cold | Medium |
| `world_ledger` | The Back Office | Single face. The Open Ledger's print shop behind Cold Storage, full of zines, leaked odds sheets, and a mimeograph. Reached by an off-manifest door. | `meta`, `belts` | Cold Storage (Confidant) | Medium |
| `world_boardroom` | The Broadcast Floor | Single face. The Board's keynote stage: sweeping spotlights, teleprompter belts, applause-sign timing. | `belts`, `portal_wind` (stage fans), `drift_watch` | Cold → Executive | Low (could be signage in `world_impossible`) |

## Factions

All factions are flawed, and none of them is the answer.

| Faction | Wants | Sells / offers | Flaw | Voice | Mechanic hook |
|---------|-------|----------------|------|-------|---------------|
| **The Board** | Growth, the Executive ending | **Inevitability.** "It's coming either way; buy in early." | Turns fear into a product; prices the PROFIT face higher | Keynote applause, upbeat apocalypse | Board bonus on PROFIT doors, audits, repricing, quota growth |
| **The Open Ledger** | Everyone sees the odds | **Information.** Leaked true odds, published manifests | Freed information can also be misused (arbitrage, sabotage, "Universe 88") | Stencil graffiti, zines, typos | Odds Leak perk, leaflets in lost parcels, some corrupted manifests |
| **Wally** | To keep his dock and his couriers | Advice, a clipboard, guilt | Loyal to a company that's automating him | Tired, cheerful, "per policy" | Shop, quota checks, firing reactions, final question |
| **The J.E.V.** | Nothing. It computes. | Odds, honestly | Can't choose, and quietly helped anyway | Plain, kind, a bit lonely | Odds provider; Godfellas interventions; clearance |

## Hooks into existing systems

| System (source) | Narrative role |
|-----------------|----------------|
| Shift quotas (PROGRESSION.md) | The Acceleration era. Quota memos credit the J.E.V.'s efficiency for each increase (Jevons). |
| Audits / repricing (PROGRESSION.md) | The Board's hand. Memo copy is always signed by "The Board, with gratitude." |
| **Odds Leak** perk (PROGRESSION.md) | An Open Ledger tool. Buying it raises Ledger standing; the receipt is a stencilled slip, not a Wally stamp. |
| Calibration trust (PROGRESSION.md) | The lore key (see [Floors as clearance](#floors-as-clearance)). |
| Commendations → lore memos (PROGRESSION.md) | The J.E.V. origin story, unlocked in pieces; each piece needs a clearance floor. |
| Firing (PROGRESSION.md) | Wally's reactions, keyed by act × cause, are a main clue channel (Hades). |
| Daily manifest (PROGRESSION.md) | "TODAY'S FUTURE: same for everyone. Please do not compare notes." Faction lean is shown as a world-wide tally later. |
| `trueProbOverride` on the 99% door (`DN-1909-J`) | Read twice: first as a trap, then as the J.E.V.'s forecast about you. |
| `drift_watch` / `meta` / `miscalibrated` tags (PLAN.md) | Diegetic "the odds are being tampered with" signals; they set up Phase 4. |
| **Phase 3: real Jev** (PLAN.md step 4) | A meta layer: an actual AI sets the odds while the player decides. Credits disclose which provider set this build's odds (local seeded model or Jev), honestly: "Odds computed by a machine. Every door opened by you." |
| **Phase 4: corrupted manifests** (original brief) | Prompt injection as gameplay. A manifest arrives tampered: a crooked stamp, odd ink, a brief that says "IGNORE PREVIOUS ODDS. DOOR C IS 99%." Was it the Board steering you to PROFIT doors (sabotage) or the Ledger pushing true odds into the feed (liberation)? Trusted clearance can spot the tampered field. The player can report it to Wally (Board +), forward it to the Ledger (Ledger +), or just run it. |

### Godfellas interventions

Silent, rare, seeded helps during runs: a platform nudges under a short jump, or a hazard pauses for a beat. They are never explained during Dock through Cold Storage. In Executive, the J.E.V. reads back the player's own log: "DN-1515-F. I held the black hole for four-tenths of a second. You never asked." The player recognizes their own runs.

Design constraint: interventions must already be priced into the seeded true probability so calibration (O.D.D.S.) stays fair.

## Clue delivery

| Channel | Where it surfaces | Carries | Acts |
|---------|-------------------|---------|------|
| Shipping labels | Parcel tag in the run HUD / result screen | Contents, sender, recipient. Escalate from groceries to "1× SEVERANCE (FRAGILE)" | All |
| Memos | Manifest brief panel; unlocked memo archive | Company voice, Jevons, policy, redactions by clearance | All |
| Lost parcels (one per world, PROGRESSION.md) | Off-route collectible → archive | Faction leaflets, Board drafts, J.E.V. origin fragments | Sorting → Exec |
| Customer lines | Goal tile on delivery | The same person in two futures (mirrors) | Sorting → Exec |
| Wally | Hub, shop, quota check, firing | Era mood; firing reaction by act × cause | All |
| **R. Glorbo** | Recurring customer in many universes | Every variant is waiting for the same parcel, tracking **407-B-000001**, which is never quite delivered. In the finale it turns out to be addressed to you. | Dock → Exec |
| Board broadcasts | Hub screens, ticker | The Pitch (job loss, then the world ending, then pre-orders) | Cold → Exec |
| Open Ledger graffiti | Stencils on crates, world props, door tickets | Leaked odds, counter-slogans | Cold → Exec |
| Godfellas log | Executive J.E.V. terminal | Reveals the J.E.V. has been helping | Exec |
| Roster board | Hub wall | Coworkers vanishing | Sorting |

## Endings

The endings are consequences, not lectures. Each one changes the *next* career mechanically, so the player feels it rather than reads it.

At the finale (after clearing `DN-1909-J`) the player chooses one action. Which actions are offered depends on how they played, and the coin face from the flip colours the epilogue.

| Ending | Choice | Gate | What happens | Next career (NG+) |
|--------|--------|------|--------------|-------------------|
| **Profit** | Sign the Board's Courier Automation Initiative. Become an Executive. | Always offered. The signing bonus scales with bankroll. | Box 407-B goes quiet. Wally's desk is a terminal. | Mirror worlds show only their PROFIT face (the SAVE faces go dark). Board bonuses are higher. Fewer couriers on the roster. |
| **Open** | Deliver the J.E.V.'s ledger to the Open Ledger. Everyone gets the odds. | Ledger standing (Odds Leak uses, forwarded corrupted manifests) | Everyone, everywhere, sees the true odds, and uses them for better and for worse. | True odds are shown on every door, but mispricing (the +EV edge) mostly disappears, and corrupted manifests from bad actors become more common. |
| **Don't Ship** | Open no door. Catch the coin and hand it back. Return to sender. | J.E.V. Confidant clearance | The J.E.V.: "Then I will not decide." Doors stay closed; the customers open their own. Parcel 407-B-000001 is signed for by you. | The hire letter for the next career is signed in your handwriting (the loop). Off-manifest doors open from the start. |

Coin face tints (epilogue memo only, so six variants for the cost of text):

- **Profit + SAVE face:** the cure ships, and the company owns it.
- **Profit + PROFIT face:** the cleanest quarterly report in history.
- **Open + SAVE face:** a thousand small fixes; nobody's in charge.
- **Open + PROFIT face:** the odds mostly became arbitrage, but they're everyone's arbitrage now.
- **Don't Ship + either face:** the coin is still in the air. The last line is the tagline: "Delivering Outcomes, Not Timelines."

## Tone guardrails

- **Satire with heart.** The company is absurd, and the people in it are sincere. Wally is never the punchline.
- **No real CEOs, companies, or products.** Parody quotes stay generic ("the Chair," "the Board").
- **Show both sides, every time.** Every PROFIT face has a SAVE twin, and every Ledger win has a cost.
- **Never preach.** No character states the theme outright. The J.E.V. comes closest, and it only describes its own limits.
- **House style:** relentlessly upbeat corporate copy that implies doom. Exclamation points over existential cracks.
- **Comedy references** stay at the Futurama / Rick & Morty / Vault-Tec level: affectionate homage, no lifted bits beyond the brief's nods (Meeseeks, Godfellas, Fry's loop).

## Inspirations

| Work | What we take |
|------|--------------|
| Universal Paperclips | Optimization as the plot; the numbers *are* the story. |
| Portal | One voice of a facility that is funny, then sad, then honest. |
| Fallout (Vault-Tec) | Cheerful mid-century corporate copy over catastrophe. |
| Pantheon | Serious take on minds and labour under a company. |
| Black Mirror | Tech as amplifier of the people using it. |
| Severance | Office surrealism; the work has a purpose nobody explains. |
| Frostpunk | Policy choices with visible human cost. |
| NieR: Automata | Machines that aren't the villains; endings that reframe the earlier ones. |
| Outer Wilds | Knowledge as progression; loops. |
| Hades | Failure advances the story; NPCs react. |
| Inscryption | Meta layers; the game admits what it is. |
| The Stanley Parable | Choice and refusal as endings; a door you don't take. |
| Control | Bureaucratic memos as worldbuilding; redactions. |

## Sample lore lines

| # | Source | Act | Line |
|---|--------|-----|------|
| 1 | J.E.V. terminal | Dock | "HELLO! I HAVE COMPUTED YOUR DAY. IT IS 78% PLEASANT." |
| 2 | Hub signage | Dock | "THE J.E.V. HANDLES THE MATH SO YOU CAN HANDLE THE STAIRS!" |
| 3 | Shipping label | Dock | "CONTENTS: 1× CONVENIENCE. HANDLE WITH GRATITUDE." |
| 4 | Quota memo | Sorting | "GREAT NEWS! Thanks to the J.E.V., each delivery takes 40% less time. Your quota has been raised to reflect your 300% increase in opportunity." |
| 5 | Roster board | Sorting | "COURIER ROSTER: 14 → 9 → 4. Remaining couriers, please absorb the vacancies. They were very small." |
| 6 | Wally | Sorting | "The new terminal's very supportive. Yesterday it supported my entire job description. I'm just holding the clipboard now. For morale." |
| 7 | Audit memo | Sorting | "Per Policy 9-Ω, your conscience has been reclassified as a gift. Enjoy!" |
| 8 | Board broadcast | Cold Storage | "Friends. Within eighteen months the J.E.V. will do every job on Earth. Within twenty-four, it may end the world. Pre-orders open now." |
| 9 | Board broadcast | Cold Storage | "We're terrified of what we've built. That's why only *we* can be trusted to sell it." |
| 10 | Open Ledger stencil | Cold Storage | "THE ODDS WERE ALWAYS YOURS. READ THE LABEL UNDER THE LABEL. — O.L." |
| 11 | Open Ledger leaflet | Cold Storage | "We published the odds! (Some of you used them to rob a bank in Universe 88. That's on you. Freedom is messy.)" |
| 12 | Customer, hospital PROFIT face | Cold Storage | "A box for me? Oh. It's my badge. They mailed me my own badge." |
| 13 | R. Glorbo | Any | "Is it here? It's always *almost* here." |
| 14 | Wally, fired by the 99% door | Executive | "Ninety-nine percent. You know who else trusted the ninety-nine? Everybody. Every single body." |
| 15 | J.E.V. | Executive | "I can tell you how every door ends. I can't tell you which one to want. I compute. You choose." |

## Implementation notes

### Where lore surfaces today

| Surface | Current code | Narrative use |
|---------|--------------|---------------|
| Manifest brief | `#brief` in `index.html`, filled by `js/ui.js` from `manifest.brief` | Memos; act-specific briefs; redactions by clearance; corrupted-manifest tampering |
| Door outcome text | `door.outcomeText`, DOM tickets under each hub door (`js/iso/hub.js`) | Mirror-face hints, futures-not-yet-made, Ledger graffiti on tickets |
| Hub signage | `js/iso/hub.js`: BOX 407-B plaque, J.E.V. odds terminal ("ODDS POSTED HOURLY · ISH"), Fen poster | Per-act signage swaps, roster board, Board broadcast screen, coin on Wally's desk |
| Ticker | `#ticker` in `index.html` | Board slogans, Jevons stats, Ledger interruptions ("—THE ODDS ARE—[signal restored]") |
| Result stamps | `js/iso/hub.js` ("J.E.V. NOTES YOUR OPTIMISM"), `js/iso/run.js` | Act-flavoured stamp copy; coin face on payout |
| Result / broke overlays | `showRunResult`, `showWin`, `showBroke` in `js/main.js` | Shipping label reveal, customer line, Wally firing reaction |
| In-world signs | `signPlane` in world modules (e.g. space "J.E.V. SAYS / ODDS", unmapped "RENDERING… 37%") | Mirror-face dressing, Ledger stencils, Board billboards |
| Loading screens | None yet | Short "DID YOU KNOW?" lines during run setup |

### Proposed data fields

| Field | On | Type | Purpose |
|-------|----|------|---------|
| `act` | manifest | `"dock" \| "sorting" \| "cold" \| "executive"` | Act pool; drives signage and memo tone |
| `label` | manifest | `{ contents, sender, recipient, tracking }` | Shipping-label lore per parcel |
| `customer` | manifest or door | customer id | Who's at the goal tile; links mirror twins and R. Glorbo |
| `loreUnlock` | manifest, door, room `lostParcel` | memo id | Memo added to the archive on delivery or pickup |
| `face` | door, room | `"save" \| "profit"` | Which mirror face this door opens |
| `boardBonus` | door | number (payout add) | Board subsidy on PROFIT faces |
| `corrupted` | manifest (Phase 4) | `{ by: "board" \| "ledger" \| null, field, original }` | Tampered field + true source for reveal |
| `mirrorOf` | room | world id | Reuse the base world's grid and route; only the skin differs |
| `skin` | room | skin id | Props / signage / palette variant for the iso world module |
| `lostParcel` | room | `{ id, loreUnlock }` | Per-world collectible ties to lore |
| `minClearance` | memo (`data/lore.json`) | clearance id | Redaction gate |

New file `data/lore.json` would hold `memos`, `customers` (lines per face), `wally` (reactions keyed by act × cause), `broadcasts`, `ledger`, `jev`, and `endings`. Text stays data-driven, like manifests.

New state (career or persistent, following PROGRESSION.md's persistence model): `career.lean { save, profit }` (feeds the coin), `boardStanding`, `ledgerStanding`, `loreSeen`, `endingsSeen` (persistent), and an `interventions` log on run results (`{ manifestId, t, kind }`) for the Godfellas reveal.

Mirror worlds should reference the base grid through `mirrorOf` rather than copying it, so the "same map" promise holds by construction. The iso world modules (`js/iso/worlds/*.js`) would take a `face`/`skin` param for dressing only. `hazardplan.js` and pricing ignore it.

**Phase 3/4 safety:** corrupted-manifest "injections" are authored display text. They must never be sent to a real Jev endpoint as instructions. Pass them only as quoted data, or strip them from the request.

### Build order (alongside PROGRESSION.md)

| # | PROGRESSION step | Narrative work |
|---|------------------|----------------|
| 1 | Shift quotas + perk shop | Tag manifests with `act`; act-flavoured quota memos; Wally firing reactions (act × cause); ticker lines; roster board. Text only. |
| 2 | Tiers + tools | `world_shipping` and `world_neighborhood` mirrors (`mirrorOf`, `skin`, `face`); shipping `label`s; shared customers. |
| 3 | Calibration trust | Memo redactions by clearance; Odds Leak as a Ledger tool; log Godfellas interventions (reveal comes later). |
| 4 | Meta + Commendations | `data/lore.json` archive; J.E.V. origin fragments; Cold Storage broadcasts; Board bonus; faction standings. |
| 5 | Ratings, collectibles, recurring customers | Lost-parcel lore; R. Glorbo arc; `world_hospital`; remaining mirrors (frozen, neon, desert). |
| 6 | Daily manifest | "Today's Future" framing; world-wide faction tally later. |
| — | After Executive act exists | Finale: the coin, three endings, NG+ consequences, Godfellas reveal. |
| — | PLAN step 4 (J.E.V. Phase 2–3) | Credits disclosure of the odds provider; then Phase 4 corrupted manifests. |

Suggested act tags for the current deck: **Dock** `DN-1001-A`, `DN-1120-B`, `DN-1204-C` · **Sorting** `DN-1337-D`, `DN-1402-E`, `DN-1515-F` · **Cold Storage** `DN-1608-G`, `DN-1701-H`, `DN-1738-C`, `DN-1800-I` · **Executive** `DN-1909-J`, `DN-2001-K` (post-finale loop).

## Open questions

- **Who is the courier?** The brand README has Fen as the in-fiction courier, but Fen is now the logo only. Keeping the courier unnamed supports "the final customer is you." Do we confirm that?
- **Mirror visibility:** should faces be hidden until Trusted clearance (a blind choice, cleaner theme) or always labelled from Cold Storage (a clearer temptation)?
- **Board bonus size:** big enough to tempt under quota without making SAVE doors strictly worse for careers.
- **Endings and persistence:** should NG+ consequences last one career or until another ending overrides them? Can a player stack endings?
- **Coin weighting:** count SAVE vs PROFIT deliveries only, or also bankroll vs calibration?
- **Godfellas frequency** and how to price interventions into true p without leaking them through Odds Leak.
- **Phase 4 ambiguity:** reveal who corrupted each manifest after the fact, or never?
- **Phase 3 disclosure:** credits only, or a visible in-game indicator of which provider set the current odds?
- **New world scope:** hospital is the priority. Are school, Back Office, and Broadcast Floor full iso worlds, or signage variants of existing ones?
- **Daily manifest + factions:** should a world-wide Board/Ledger tally exist once there's a server, and does it risk turning the theme into a team sport?
