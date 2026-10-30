// Door hazard tags + difficulty tier → a seeded hazard plan (plain data, no rendering).
// planHazards runs before the map meshes are built because it may retag tiles (ice, belts,
// vanishing floors, black-hole slots); spawnHazards in hazards.js turns `entries` into entities.
import { findRoute, jumpLimits, tileTop, walkable } from "./map.js";

/** Door / manifest tag → hazard type. Tags not listed here (none, fragile, executive) spawn nothing. */
export const TAG_TYPES = {
  sentient_traffic: "traffic",
  acid_rain: "acid",
  storm: "acid",
  fans: "wind",
  portal_wind: "wind",
  ice: "ice",
  low_gravity: "lowg",
  black_hole_slot: "blackhole",
  crystal_fauna: "fauna",
  vines: "fauna",
  pressure: "current",
  heat_shimmer: "shimmer",
  meeseeks: "chaser",
  belts: "belts",
  meta: "glitch",
  miscalibrated: "glitch",
  drift_watch: "drift",
};

/** HUD stamp per hazard type; key order is also the (seed-stable) planning order. */
export const TYPE_LABELS = {
  traffic: "SENTIENT TRAFFIC",
  sprinkler: "LAWN SPRINKLER",
  acid: "ACID RAIN",
  ice: "ICE",
  lowg: "LOW GRAVITY",
  wind: "PORTAL WIND",
  blackhole: "BLACK-HOLE SLOT",
  fauna: "CRYSTAL FAUNA",
  current: "PRESSURE CURRENTS",
  shimmer: "HEAT SHIMMER",
  chaser: "MEESEEKS",
  belts: "BELTS",
  glitch: "META GLITCH",
  drift: "DRIFT WATCH",
};
const ORDER = Object.keys(TYPE_LABELS);

/**
 * Tier knobs. Per-type counts are [easy, hard, brutal] arrays below; these scale speed (`spd`),
 * push strength (`push`), telegraph time before a zone turns lethal (`warn`), lethal share of a
 * cycle (`duty`), and the hazard-free radius around the start door (`keepOut`, tiles).
 */
export const TIERS = {
  easy: { name: "easy", i: 0, spd: 1.0, push: 0.75, warn: 1.1, duty: 0.3, keepOut: 3.5 },
  hard: { name: "hard", i: 1, spd: 1.15, push: 1.0, warn: 0.85, duty: 0.4, keepOut: 3 },
  brutal: { name: "brutal", i: 2, spd: 1.3, push: 1.2, warn: 0.65, duty: 0.48, keepOut: 2.5 },
};

export const VANISH_CAUSE = {
  shimmer: "HEAT SHIMMER (FLOOR WAS A MIRAGE)",
  glitch: "META GLITCH (TILE WAS NEVER THERE)",
};

export function resolveHazardTypes(def, hazardTags = [], modifiers = []) {
  const want = new Set();
  for (const raw of hazardTags || []) {
    const t = TAG_TYPES[String(raw).toLowerCase()];
    if (t) want.add(t);
  }
  if (!want.size) for (const t of def.native || []) want.add(t);
  for (const raw of modifiers || []) if (TAG_TYPES[String(raw).toLowerCase()] === "drift") want.add("drift");
  if (def.space) want.add("lowg");
  return ORDER.filter((t) => want.has(t));
}

/**
 * @param def iso world definition
 * @param map result of buildTiles(def) — tiles are mutated in place
 * @param {{ hz: () => number, tier?: string, hazardTags?: string[], modifiers?: string[] }} opts
 */
export function planHazards(def, map, { hz, tier = "easy", hazardTags = [], modifiers = [] } = {}) {
  const P = { ...(TIERS[String(tier).toLowerCase()] || TIERS.easy) };
  if ((modifiers || []).includes("executive")) P.spd *= 1.1;
  const ti = P.i;
  const types = resolveHazardTypes(def, hazardTags, modifiers);

  const physics = { gravityMul: 1, jumpMul: 1, drift: null };
  if (types.includes("lowg") && !def.space) {
    physics.gravityMul = 0.42;
    physics.jumpMul = 0.78;
  }
  const limits = jumpLimits(def.gravity * physics.gravityMul, def.jumpV * physics.jumpMul);
  const found = findRoute(map, limits);
  const route = found || [map.start, map.goal].map((t) => ({ c: t.c, r: t.r, move: "walk" }));
  const { tileAt, start, goal } = map;
  const T = (s) => tileAt(s.c, s.r);

  const spawned = types.filter((t) => t !== "lowg" && t !== "drift").length;
  const crowd = spawned >= 3 ? 0.75 : 1;
  const count = (arr) => Math.max(1, Math.round(arr[ti] * crowd));
  const vary = () => 0.9 + hz() * 0.2;
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(hz() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Hazard-eligible slice of the route: clear of the start door and the goal tile.
  let lo = route.findIndex((s) => Math.hypot(s.c - start.c, s.r - start.r) >= P.keepOut);
  if (lo < 0) lo = route.length - 1;
  const hi = route.length - 2;
  const used = new Map(); // route index → reserved radius

  const free = (i, gap) => {
    for (const [u, rad] of used) if (Math.abs(u - i) <= Math.max(gap, rad)) return false;
    return true;
  };
  /** n route indices spread over [from, to] of the eligible slice, at least `gap` apart from earlier picks. */
  function spots(n, { from = 0, to = 1, gap = 1, reserve = 0, ok = () => true } = {}) {
    const out = [];
    if (hi < lo) return out;
    const a = lo + (hi - lo) * from;
    const b = lo + (hi - lo) * to;
    const seg = (b - a + 1) / n;
    for (let k = 0; k < n; k++) {
      const want = Math.floor(a + seg * k + hz() * seg);
      for (let off = 0; off <= hi - lo; off++) {
        const cand = [want + off, want - off].find((i) => i >= lo && i <= hi && free(i, gap) && ok(i));
        if (cand != null) {
          out.push(cand);
          used.set(cand, reserve);
          break;
        }
      }
    }
    return out;
  }
  const dirAt = (i) => {
    const a = route[Math.max(0, i === route.length - 1 ? i - 1 : i)];
    const b = route[Math.min(route.length - 1, i === route.length - 1 ? i : i + 1)];
    return [Math.sign(b.c - a.c), Math.sign(b.r - a.r)];
  };
  const perp = (d) => [Math.abs(d[1]), Math.abs(d[0])];
  /** +1 / -1 toward the nearer void along `p` from tile s (0 if none within 3 tiles). */
  const voidSide = (s, p) => {
    for (let k = 1; k <= 3; k++) {
      const plus = tileAt(s.c + p[0] * k, s.r + p[1] * k).void;
      const minus = tileAt(s.c - p[0] * k, s.r - p[1] * k).void;
      if (plus !== minus) return plus ? 1 : -1;
    }
    return 0;
  };
  const isEnd = (t) => t === start || t === goal || t.start || t.goal;
  const onRoute = new Set(route.map((s) => `${s.c},${s.r}`));
  const routeTileOk = (i) => {
    const t = T(route[i]);
    return walkable(t) && !isEnd(t) && !t.dynamic && !t.belt;
  };
  /** Walkable off-route neighbour of route[i] (for boxes / side doors), else null. */
  const sideTile = (i) => {
    const s = route[i];
    for (const [dc, dr] of shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]])) {
      const t = tileAt(s.c + dc, s.r + dr);
      if (walkable(t) && !t.outside && !isEnd(t) && !onRoute.has(`${t.c},${t.r}`) && Math.abs(t.h - T(s).h) <= 1) return t;
    }
    return null;
  };
  const anchorsFor = (type) => shuffle(def.anchors?.[type] || []);

  const entries = [];
  /** Turn tile t into a vanishing floor (heat shimmer cycle or hashed meta-glitch slots). */
  const vanish = (t, mode) => {
    if (!walkable(t) || isEnd(t) || t.dynamic) return;
    t.dynamic = mode;
    t.goneCause = VANISH_CAUSE[mode];
    const period = 4.2 * vary();
    entries.push({
      type: "vanish", mode, c: t.c, r: t.r, y: tileTop(t), period, phase: hz() * period, warn: P.warn,
      gone: [0.9, 1.2, 1.5][ti], slot: 0.9, duty: [0.25, 0.33, 0.42][ti], salt: Math.floor(hz() * 1e9),
    });
  };
  for (const type of types) {
    switch (type) {
      case "traffic": {
        const lanes = def.anchors?.traffic || [];
        if (lanes.length) {
          const perLane = [1, 1, 2][ti];
          for (const a of lanes)
            for (let k = 0; k < perLane; k++)
              entries.push({
                type, axis: a.axis, at: a.at, y: a.y ?? 0, from: a.from, to: a.to, dir: a.dir,
                speed: (a.speed ?? 3) * P.spd * vary(), phase: hz(), slot: k / perLane, color: a.color ?? null, hover: !!a.hover,
              });
        } else {
          for (const i of spots(count([1, 2, 3]), { gap: 2, ok: routeTileOk })) {
            const s = route[i];
            const d = dirAt(i);
            const axis = d[0] !== 0 ? "z" : "x";
            const along = axis === "z" ? s.r : s.c;
            entries.push({
              type, axis, at: axis === "z" ? s.c : s.r, y: tileTop(T(s)), from: along - 4.5, to: along + 4.5,
              dir: hz() < 0.5 ? 1 : -1, speed: 2.6 * P.spd * vary(), phase: hz(), slot: 0, color: null, hover: true,
            });
          }
        }
        break;
      }
      case "sprinkler":
        for (const a of def.anchors?.sprinkler || [])
          entries.push({ type, x: a.x, y: a.y, z: a.z, R: a.R ?? 3, spin: 1.25 * P.spd * vary(), angle0: hz() * Math.PI * 2 });
        break;
      case "acid": {
        const n = count([2, 4, 6]);
        const zones = anchorsFor("acid").slice(0, n).map((z) => z.map(([c, r]) => tileAt(c, r)));
        for (const i of spots(n - zones.length, { gap: 2, ok: routeTileOk })) {
          const s = T(route[i]);
          const p = perp(dirAt(i));
          const band = [s];
          for (const k of [-1, 1]) {
            const t = tileAt(s.c + p[0] * k, s.r + p[1] * k);
            if (walkable(t) && !t.outside && !isEnd(t) && Math.abs(t.h - s.h) <= 1) band.push(t);
          }
          zones.push(band);
        }
        for (const z of zones) {
          const period = 3.6 * vary();
          entries.push({
            type, tiles: z.filter(walkable).map((t) => ({ c: t.c, r: t.r, y: tileTop(t) })),
            period, on: P.duty * period, warn: P.warn, phase: hz() * period,
          });
        }
        break;
      }
      case "ice": {
        const len = [3, 4, 5][ti];
        for (const i of spots(count([1, 2, 3]), { gap: 2, ok: routeTileOk })) {
          for (let j = 0; j < len && i + j <= hi; j++) {
            const s = T(route[i + j]);
            if (!routeTileOk(i + j)) continue;
            s.ice = true;
            for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const t = tileAt(s.c + dc, s.r + dr);
              if (walkable(t) && !t.outside && !isEnd(t) && hz() < 0.5) t.ice = true;
            }
          }
        }
        break;
      }
      case "wind": {
        const n = count([1, 2, 3]);
        const strength = 4.2 * P.push;
        const mk = (a) => {
          const period = 3.6 * vary();
          return {
            type, emitter: "portal", len: 4.4, width: 0.95, back: 0.3, ...a,
            strength: (a.strength ?? 1) * strength, period, on: 1.1 + P.duty * 1.4, warn: 0.7, phase: hz() * period,
          };
        };
        const anchors = anchorsFor("wind").slice(0, n);
        for (const a of anchors) entries.push(mk(a));
        for (const i of spots(n - anchors.length, { gap: 2, ok: routeTileOk })) {
          const s = T(route[i]);
          const p = perp(dirAt(i));
          const side = voidSide(s, p) || (hz() < 0.5 ? 1 : -1);
          const dir = [p[0] * side, p[1] * side];
          entries.push(mk({ x: s.c - dir[0] * 2.2, y: tileTop(s), z: s.r - dir[1] * 2.2, dir }));
        }
        break;
      }
      case "blackhole": {
        const R = [3.6, 4.2, 4.6][ti];
        const pull = [2.0, 2.6, 3.1][ti];
        const a = def.anchors?.blackhole?.[0];
        if (a) {
          entries.push({ type, x: a.x, y: a.y, z: a.z, R: a.R ?? R, pull });
          break;
        }
        const minD = [2.4, 2.0, 1.7][ti];
        let best = null;
        for (let r = -1; r <= map.rows; r++)
          for (let c = -1; c <= map.cols; c++) {
            const t = tileAt(c, r);
            if (t.solid || t.goal || t.start || onRoute.has(`${c},${r}`)) continue;
            if (Math.hypot(c - start.c, r - start.r) < 4.5 || Math.hypot(c - goal.c, r - goal.r) < 3) continue;
            let dRoute = Infinity;
            let near = route[0];
            for (const s of route) {
              const d = Math.hypot(s.c - c, s.r - r);
              if (d < dRoute) [dRoute, near] = [d, s];
            }
            if (dRoute < minD) continue;
            const score = dRoute + hz() * 0.35;
            if (!best || score < best.score) best = { score, c, r, near };
          }
        if (best) {
          const t = tileAt(best.c, best.r);
          if (!t.outside && !t.void) Object.assign(t, { void: true, slotted: true });
          entries.push({ type, x: best.c, y: tileTop(T(best.near)) + 0.2, z: best.r, R, pull });
        }
        break;
      }
      case "fauna": {
        const n = count([1, 2, 3]);
        const speed = 1.25 * P.spd;
        const anchors = anchorsFor("fauna").slice(0, n);
        const toPath = (pts) => pts.map(([c, r]) => [c, tileTop(tileAt(c, r)), r]);
        for (const a of anchors) entries.push({ type, path: toPath(a.path), speed: speed * vary(), phase: hz() });
        for (const i of spots(n - anchors.length, { gap: 3, reserve: 2, ok: routeTileOk })) {
          const pts = [];
          for (let j = Math.max(lo, i - 2); j <= Math.min(hi, i + 2); j++) pts.push([route[j].c, route[j].r]);
          entries.push({ type, path: toPath(pts), speed: speed * vary(), phase: hz() });
        }
        break;
      }
      case "current": {
        const n = count([1, 2, 3]);
        const strength = 2.4 * P.push;
        const mk = (a) => ({ type, halfAlong: 1.2, halfAcross: 3.2, ...a, strength, period: 4.5 * vary(), phase: hz() * Math.PI * 2 });
        const anchors = anchorsFor("current").slice(0, n);
        for (const a of anchors) entries.push(mk(a));
        for (const i of spots(n - anchors.length, { gap: 3, ok: routeTileOk })) {
          const s = T(route[i]);
          entries.push(mk({ x: s.c, y: tileTop(s), z: s.r, dir: perp(dirAt(i)) }));
        }
        break;
      }
      case "shimmer":
      case "glitch": {
        const n = count([3, 5, 7]);
        const picked = [];
        for (const [c, r] of anchorsFor(type).slice(0, n)) picked.push(tileAt(c, r));
        for (const i of spots(n - picked.length, { gap: 1, ok: routeTileOk })) picked.push(T(route[i]));
        for (const t of picked) vanish(t, type);
        if (type === "glitch") {
          const [i] = spots(1, { from: 0.35, to: 0.75, gap: 0 });
          const t = i != null ? sideTile(i) : null;
          if (t) {
            let back = Math.max(0, i - [4, 6, 8][ti]);
            while (back > 0 && T(route[back]).dynamic) back--;
            entries.push({ type: "dejavu", c: t.c, r: t.r, y: tileTop(t), to: { c: route[back].c, r: route[back].r } });
          }
        }
        break;
      }
      case "chaser": {
        const a = def.anchors?.chaser?.[0];
        let box = a ? tileAt(a[0], a[1]) : null;
        if (!box) {
          const [i] = spots(1, { from: 0.3, to: 0.6, gap: 1 });
          if (i != null) box = sideTile(i) || T(route[i]);
        }
        if (box)
          entries.push({
            type, x: box.c, y: tileTop(box), z: box.r, n: count([1, 2, 3]), speed: 1.45 * P.spd,
            ramp: 0.05, cap: [2.5, 2.75, 2.95][ti], delay: [3.0, 2.4, 1.8][ti], life: 14,
          });
        break;
      }
      case "belts": {
        const speed = 1.7 * P.spd;
        spots(count([1, 2, 3]), { gap: 2, ok: routeTileOk }).forEach((i, k) => {
          const d = dirAt(i);
          let dir = [-d[0], -d[1]];
          if (ti > 0 && k % 2 === 1) {
            const p = perp(d);
            const side = voidSide(T(route[i]), p) || 1;
            dir = [p[0] * side, p[1] * side];
          }
          for (let j = i; j < i + 4 && j <= hi && routeTileOk(j); j++) {
            if (j > i && dirAt(j).join() !== d.join()) break;
            Object.assign(T(route[j]), { belt: dir, beltSpeed: speed });
          }
        });
        break;
      }
      case "drift":
        physics.drift = { strength: [0.55, 0.8, 1.05][ti], period: 11, phase: hz() * Math.PI * 2 };
        break;
    }
  }

  // Terrain-level effects (legend ice / belts / glitch tiles) always run; belts reverse only when `belts` is active.
  const all = map.tiles.flat();
  for (const t of all) if (t.glitch) vanish(t, "glitch");
  const iceTiles = all.filter((t) => t.ice && walkable(t));
  if (iceTiles.length) entries.push({ type: "ice", tiles: iceTiles.map((t) => ({ c: t.c, r: t.r, y: tileTop(t) })) });
  const beltTiles = all.filter((t) => t.belt && walkable(t));
  if (beltTiles.length) {
    const reverse = types.includes("belts") && ti > 0 ? { period: 6.5, warn: 1.0, phase: hz() * 6.5 } : null;
    entries.push({ type: "belts", tiles: beltTiles.map((t) => ({ c: t.c, r: t.r, y: tileTop(t), dir: t.belt, speed: t.beltSpeed ?? 1.6 })), reverse });
  }

  const active = new Set(types);
  if (iceTiles.length) active.add("ice");
  if (beltTiles.length) active.add("belts");
  if (all.some((t) => t.dynamic === "glitch")) active.add("glitch");
  const labels = ORDER.filter((t) => active.has(t)).map((t) => TYPE_LABELS[t]);

  return { types, labels, tier: P, physics, limits, route, routeOk: !!found, entries };
}
