// Headless check for iso worlds: map parse, start→goal route, hazard plans for every tier × tag set,
// seed determinism, and a full scene build (props, decorate, hazards) ticked for a few seconds
// against a stub canvas. No browser or WebGL needed.
//   node tools/iso-check.mjs                 # all worlds
//   node tools/iso-check.mjs world_jungle    # one or more worlds
import { readFileSync } from "node:fs";
import { register } from "node:module";

const threeURL = new URL("../vendor/three.module.js", import.meta.url).href;
register(
  "data:text/javascript," +
    encodeURIComponent(`export async function resolve(s, c, n) { return s === "three" ? { url: ${JSON.stringify(threeURL)}, shortCircuit: true } : n(s, c); }`)
);

const ctx2d = () =>
  new Proxy(
    {},
    {
      get: (o, key) =>
        key in o ? o[key] : String(key).startsWith("create") ? () => ({ addColorStop() {} }) : key === "measureText" ? () => ({ width: 10 }) : () => {},
      set: (o, key, v) => ((o[key] = v), true),
    }
  );
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: ctx2d, style: {} }) };

const THREE = await import(threeURL);
const { createRng } = await import("../js/rng.js");
const { createKit, disposeTree } = await import("../js/iso/kit.js");
const { buildTiles, tileTop, walkable, STEP } = await import("../js/iso/map.js");
const { planHazards, TAG_TYPES } = await import("../js/iso/hazardplan.js");
const { spawnHazards } = await import("../js/iso/hazards.js");
const { ISO_WORLDS, buildProp } = await import("../js/iso/worlds.js");
const { buildGoal } = await import("../js/iso/props.js");

const rooms = JSON.parse(readFileSync(new URL("../data/rooms.json", import.meta.url)));
const manifests = JSON.parse(readFileSync(new URL("../data/manifests.json", import.meta.url)));
const only = process.argv.slice(2);
const TIERS = ["easy", "hard", "brutal"];
let errors = 0;
let warnings = 0;
const err = (w, m) => (errors++, console.log(`  ✗ ${w}: ${m}`));
const warn = (w, m) => (warnings++, console.log(`  ! ${w}: ${m}`));

function sceneCheck(def, map, plan, label) {
  const k = createKit();
  const group = new THREE.Group();
  const player = { pos: new THREE.Vector3(map.start.c, tileTop(map.start), map.start.r), state: "transit", grounded: true };
  const ctx = {
    k, group, def, tiles: map.tiles, tileAt: map.tileAt, tileUnder: map.tileUnder,
    groundAt: (x, z) => {
      const t = map.tileUnder(x, z);
      return t.void || t.gone ? -Infinity : tileTop(t);
    },
    canWalk: (x, z, y) => {
      const t = map.tileUnder(x, z);
      return walkable(t) && !t.gone && tileTop(t) - y <= STEP && y - tileTop(t) <= 0.95;
    },
    warp: () => {}, hazards: [], animators: [], player, rnd: createRng(7).next, hz: createRng(8).next, plan, route: plan.route, prob: 0.42,
  };
  for (const t of map.tiles.flat()) if (t.prop) buildProp(ctx, t);
  group.add(buildGoal(k, def.customer).root);
  const customer = def.decorate(ctx);
  if (!customer?.root?.isObject3D) throw new Error("decorate() must return { root: Object3D, ... }");
  spawnHazards(ctx, plan);
  let startHit = null;
  for (let i = 0; i < 300; i++) {
    const t = i / 30;
    for (const h of ctx.hazards) h.update(t, 1 / 30);
    for (const a of ctx.animators) a(t, 1 / 30);
    for (const h of ctx.hazards) {
      h.force?.(player.pos, player);
      const c = h.check?.(player.pos, player);
      if (c && i < 45) startHit = c;
    }
  }
  if (startHit) warn(def.id, `${label}: hazard reaches the start tile in the first 1.5 s (${startHit})`);
  let meshes = 0;
  group.traverse((o) => o.isMesh && meshes++);
  disposeTree(group);
  k.dispose();
  return meshes;
}

for (const [id, def] of Object.entries(ISO_WORLDS)) {
  if (only.length && !only.includes(id)) continue;
  console.log(`\n${id} — ${def.label}`);
  if (!rooms[id]) err(id, "not a data/rooms.json template id");
  else if (rooms[id].label !== def.label) err(id, `label "${def.label}" ≠ rooms.json "${rooms[id].label}"`);
  for (const key of ["customer", "gravity", "jumpV", "edge", "view", "floaty", "lights", "decorate", "native"])
    if (def[key] == null) err(id, `missing def.${key}`);
  const base = buildTiles(def);
  if (base.unknown.length) err(id, `unknown grid chars: ${JSON.stringify(base.unknown.join(""))}`);
  if (!base.start || !base.goal) {
    err(id, "needs exactly one start and one goal tile");
    continue;
  }
  const portalNearStart = base.tiles.flat().some((t) => t.prop === "portal" && Math.hypot(t.c - base.start.c, t.r - base.start.r) <= 1.5);
  if (!portalNearStart) warn(id, "no Box 407-B `portal` prop next to the start tile");
  const lines = def.grid.map((l) => l.length);
  if (new Set(lines).size > 1) warn(id, `ragged grid rows (${[...new Set(lines)].join("/")} cols)`);

  const doorTags = manifests.flatMap((m) => m.doors.filter((d) => d.roomTemplate === id).map((d) => ({ tags: d.hazardTags, tier: d.difficultyTier, mods: m.modifiers, src: `${m.manifestId}/${d.id}` })));
  const cases = [
    ...TIERS.map((tier) => ({ tags: ["none"], tier, mods: [], src: "native" })),
    ...doorTags,
    ...Object.keys(TAG_TYPES).flatMap((tag) => TIERS.map((tier) => ({ tags: [tag], tier, mods: [], src: `tag:${tag}` }))),
  ];
  const summary = [];
  for (const cs of cases) {
    const label = `${cs.src} [${cs.tier}] ${cs.tags.join("+")}`;
    try {
      const map = buildTiles(def);
      const plan = planHazards(def, map, { hz: createRng(1234).next, tier: cs.tier, hazardTags: cs.tags, modifiers: cs.mods });
      if (!plan.routeOk) {
        err(id, `${label}: no start→goal route`);
        continue;
      }
      const again = planHazards(def, buildTiles(def), { hz: createRng(1234).next, tier: cs.tier, hazardTags: cs.tags, modifiers: cs.mods });
      if (JSON.stringify(again.entries) !== JSON.stringify(plan.entries)) err(id, `${label}: plan not deterministic for a fixed seed`);
      for (const type of plan.types) {
        if (["lowg", "drift", "ice", "belts"].includes(type)) continue;
        const want = { glitch: "vanish", shimmer: "vanish" }[type] || type;
        if (!plan.entries.some((e) => e.type === want)) warn(id, `${label}: type "${type}" placed nothing`);
      }
      for (const e of plan.entries.filter((e) => e.type === "blackhole")) {
        const d = Math.min(...plan.route.map((s) => Math.hypot(s.c - e.x, s.r - e.z)));
        if (d < 1.5) warn(id, `${label}: black-hole core ${d.toFixed(2)} tiles from the route`);
      }
      if (cs.src === "native" || cs.src.startsWith("DN-")) {
        const meshes = sceneCheck(def, map, plan, label);
        summary.push(`${label} → route ${plan.route.length}, ${plan.entries.length} hazards [${[...new Set(plan.entries.map((e) => e.type))].join(",")}], ${meshes} meshes`);
      } else if (cs.tier === "hard") sceneCheck(def, map, plan, label);
    } catch (e) {
      err(id, `${label}: ${e.stack?.split("\n").slice(0, 3).join(" | ")}`);
    }
  }
  for (const s of summary) console.log(`  ✓ ${s}`);
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
