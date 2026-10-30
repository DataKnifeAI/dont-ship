// Tile-map helpers with no rendering: grid → tiles, movement limits, and route finding.
// Shared by the run loop, the hazard planner, and tools/iso-check.mjs.
import { LV } from "./kit.js";

export const SPEED = 3.3;
export const STEP = LV * 1.05; // max walk-up without jumping

export const tileTop = (t) => t.h * LV;
export const walkable = (t) => !!t && !t.void && !t.solid;

/** Parse `def.grid` with `def.legend` into tile objects (fresh per run; planners may mutate them). */
export function buildTiles(def) {
  const rows = def.grid.length;
  const cols = Math.max(...def.grid.map((l) => l.length));
  const unknown = new Set();
  const tiles = def.grid.map((line, r) =>
    [...line.padEnd(cols, " ")].map((ch, c) => {
      const L = def.legend[ch];
      if (!L) unknown.add(ch);
      return { ...(L || { void: true }), ch, c, r };
    })
  );
  const OUTSIDE = def.edge === "void" ? { void: true, outside: true } : { solid: true, h: 99, outside: true };
  const tileAt = (c, r) => (r < 0 || r >= rows || c < 0 || c >= cols ? OUTSIDE : tiles[r][c]);
  const tileUnder = (x, z) => tileAt(Math.round(x), Math.round(z));
  let start = null;
  let goal = null;
  for (const t of tiles.flat()) {
    if (t.start) start = t;
    if (t.goal) goal = t;
  }
  return { rows, cols, tiles, tileAt, tileUnder, start, goal, unknown: [...unknown] };
}

/** Climb (levels) and gap (tiles) a courier can clear with this gravity / jump velocity. */
export function jumpLimits(gravity, jumpV) {
  const g = Math.abs(gravity);
  const apex = (jumpV * jumpV) / (2 * g);
  const air = (2 * jumpV) / g;
  return {
    maxUp: Math.max(1, Math.min(3, Math.floor((apex * 0.8 + STEP) / LV))),
    maxGap: Math.max(0, Math.min(2, Math.floor(SPEED * air - 0.35))),
    apex,
  };
}

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Cheapest start→goal path over 4-neighbours: walk (≤1 level up), jump (≤ maxUp levels up),
 * or gap-jump straight over ≤ maxGap void tiles. Legend `cost` (default 1) makes tiles such as
 * roads less attractive to route along. Returns [{ c, r, move }] or null.
 */
export function findRoute(map, { maxUp = 2, maxGap = 1 } = {}) {
  const { tiles, tileAt, start, goal, cols } = map;
  if (!start || !goal) return null;
  const key = (c, r) => r * cols + c;
  const dist = new Map([[key(start.c, start.r), 0]]);
  const prev = new Map();
  const open = [[0, start.c, start.r]];
  const relax = (from, to, cost, move) => {
    const k = key(to.c, to.r);
    if (cost < (dist.get(k) ?? Infinity)) {
      dist.set(k, cost);
      prev.set(k, { c: from.c, r: from.r, move });
      open.push([cost, to.c, to.r]);
    }
  };
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [d, c, r] = open.splice(bi, 1)[0];
    if (d > (dist.get(key(c, r)) ?? Infinity)) continue;
    if (c === goal.c && r === goal.r) break;
    const a = tiles[r][c];
    for (const [dc, dr] of DIRS) {
      const b = tileAt(c + dc, r + dr);
      if (walkable(b) && !b.outside) {
        const up = b.h - a.h;
        if (up <= maxUp) relax(a, b, d + (b.cost ?? 1) + (up > 1 ? 0.6 : 0), up > 1 ? "jump" : "walk");
        continue;
      }
      if (!b.void) continue;
      for (let g = 1; g <= maxGap; g++) {
        const land = tileAt(c + dc * (g + 1), r + dr * (g + 1));
        if (walkable(land) && !land.outside) {
          if (land.h - a.h <= Math.max(0, maxUp - 1)) relax(a, land, d + (land.cost ?? 1) + 1 + g, "gap");
          break;
        }
        if (!land.void) break;
      }
    }
  }
  const gk = key(goal.c, goal.r);
  if (!dist.has(gk)) return null;
  // `move` on each step describes how the courier gets *into* that tile.
  const path = [];
  let c = goal.c;
  let r = goal.r;
  for (;;) {
    const p = prev.get(key(c, r));
    path.push({ c, r, move: p ? p.move : "start" });
    if (!p) break;
    c = p.c;
    r = p.r;
  }
  return path.reverse();
}
