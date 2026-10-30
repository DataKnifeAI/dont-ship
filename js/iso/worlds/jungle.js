// Crystal Ruin Canopy: a stepped temple on a canopy deck over a misty ravine, rope bridge + stepping stones, crystal fauna.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, buildHeldParcel, voidTrims } from "../props.js";

const LILAC = 0xb48cd8;
const TEAL = 0x5fc8b8;
const LEAF = [0x3f7a2a, 0x4f8f32, 0x5fa83a, 0x76b843];
const BARK = 0x6b4325;
const STONE = 0x8a9a78;
const ROPE = 0xc9a66b;
const CRYSTALS = [LILAC, TEAL, PAL.cream, 0x9a7ad0];
const UP = new THREE.Vector3(0, 1, 0);

export default {
  id: "world_jungle",
  label: "Crystal Ruin Canopy",
  customer: "MOSSWORTH, HIGH RECEIVER",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: null,
  edge: "void",
  view: 7.9,
  bg: "radial-gradient(ellipse at 50% 30%, #e4f6cf 0%, #a9d4a2 38%, #5f9e7e 72%, #2c5a4a 100%)",
  floaty: { bob: 0.014, tilt: 0.035 },
  sign: { lines: ["CANOPY CHECKPOINT", "FAUNA BITE 9–5 · M–F"], opts: { bg: PAL.cream, fg: 0x2f5f4a, border: LILAC } },
  voidCause: "LOST IN THE CANOPY (PARCEL ADOPTED BY MONKEYS)",
  native: ["fauna"],
  anchors: {
    fauna: [
      { path: [[6, 11], [6, 15]] },
      { path: [[15, 9], [20, 9]] },
      { path: [[16, 5], [21, 5]] },
    ],
  },
  grid: [
    " YgggCgY      YmmmmmmmmY",
    "gMMMMgggg     mMcTATTcMm",
    "gMMKMgggg     mMMTOTTMMm",
    "gMMMMgggg     mPMTTTTMPm",
    "ggggggggg o o mMMMuuMMMm",
    "gZgggggg      mMMMMMMMMm",
    "Ygggggg       mPMMMMMMPm",
    "gggpppgg      mmmeeeemmm",
    "ggpppggCg     mmmmmmmmCm",
    " gppggggg     gmmmmmmmmm",
    " ggggggg      mmmmmmmmmm",
    "Yggggggg      mmmFFmmmmm",
    "gggggggggrrrrrmmmmmmmmmm",
    "gggggIggg     gmmmmmmCmm",
    "ggggggggC     mmmmmmmmm ",
    "@Sggggggg      mmmmmmmC ",
    "ggggCgg          gmmg   ",
  ],
  legend: {
    " ": { void: true },
    g: { h: 1, top: 0x5f8f2a, side: 0x5a3d22, jitter: 0.07 },
    m: { h: 1, top: 0x7f9a6a, side: 0x5d6b58, checker: 0.05, jitter: 0.03 },
    M: { h: 2, top: 0x8aa476, side: 0x5d6b58, checker: 0.05, jitter: 0.03 },
    T: { h: 3, top: 0x9cb488, side: 0x66755e, checker: 0.05 },
    O: { h: 3, top: 0xc8c6a0, side: 0x66755e, goal: true },
    A: { h: 3, top: 0x9cb488, side: 0x66755e, solid: true, prop: "altar" },
    u: { h: 2, top: 0x6f8a52, side: 0x5d6b58, prop: "roots" },
    e: { h: 1, top: 0x6f8a52, side: 0x5d6b58, prop: "roots" },
    p: { h: 0, top: 0x3f5a2a, side: 0x4a3a22, jitter: 0.06 },
    r: { h: 1, top: 0xa07a48, side: 0x6b4a2a, catwalk: true },
    o: { h: 1, top: 0x9aa58a, side: 0x5d6b58, prop: "stone" },
    Y: { h: 1, top: 0x5f8f2a, side: 0x5a3d22, solid: true, prop: "canopy" },
    C: { h: 1, top: 0x5f8f2a, side: 0x5a3d22, solid: true, prop: "crystal", size: 1 },
    K: { h: 2, top: 0x8aa476, side: 0x5d6b58, solid: true, prop: "crystal", size: 1.25 },
    c: { h: 2, top: 0x8aa476, side: 0x5d6b58, solid: true, prop: "crystal", size: 0.75 },
    P: { h: 2, top: 0x8aa476, side: 0x5d6b58, solid: true, prop: "pillar" },
    F: { h: 1, top: 0x7f9a6a, side: 0x5d6b58, solid: true, prop: "column" },
    I: { h: 1, top: 0x5f8f2a, side: 0x5a3d22, solid: true, prop: "idol" },
    Z: { h: 1, top: 0x5f8f2a, side: 0x5a3d22, solid: true, prop: "sign" },
    S: { h: 1, top: 0x6f9a3a, side: 0x5a3d22, start: true },
    "@": { h: 1, top: 0x6f9a3a, side: 0x5a3d22, solid: true, prop: "portal" },
  },
  lights: { sky: 0xeaffd8, ground: 0x2f4a2a, hemi: 1.4, sun: 0xfff0c4, sunI: 2.5 },
  props: {
    canopy(ctx, t, x, y, z) {
      canopyTree(ctx, x, y, z);
    },
    crystal(ctx, t, x, y, z) {
      crystalCluster(ctx, x, y, z, t.size ?? 1);
    },
    pillar(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const h = 1.1 + rnd() * 0.5;
      k.cyl(0.27, 0.31, h, 8, STONE, { base: true, x, y, z, parent: G, ol: 0.02 });
      k.box(0.72, 0.16, 0.72, 0x9aa88a, { base: true, x, y: y + h, z, parent: G, ol: 0.02 });
      k.ico(0.2, 0, LEAF[1], { x: x + 0.1, y: y + h + 0.2, z: z - 0.05, parent: G, ol: 0.015 }).scale.set(1.4, 0.6, 1.2);
      const vines = [vine(k, G, x + 0.3, y + h, z + 0.25, 0.8 + rnd() * 0.3), vine(k, G, x - 0.2, y + h, z + 0.33, 0.55)];
      sway(ctx, vines, rnd() * 6);
    },
    column(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const seg = k.cyl(0.3, 0.3, 0.92, 8, STONE, { x, y: y + 0.3, z, rz: Math.PI / 2, parent: G, ol: 0.02 });
      seg.rotation.y = (rnd() - 0.5) * 0.3;
      k.cyl(0.33, 0.33, 0.08, 8, 0x9aa88a, { x: x + 0.42, y: y + 0.3, z, rz: Math.PI / 2, parent: G, cast: false });
      k.ico(0.18, 0, LEAF[0], { x: x - 0.1, y: y + 0.58, z, parent: G }).scale.set(1.6, 0.4, 1.2);
    },
    idol(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = Math.PI / 4;
      G.add(g);
      k.box(0.74, 0.22, 0.6, 0x7c8a6c, { base: true, parent: g, ol: 0.02 });
      k.box(0.56, 0.86, 0.46, STONE, { base: true, y: 0.22, parent: g, ol: 0.022 });
      k.box(0.64, 0.12, 0.52, 0x9aa88a, { base: true, y: 0.84, parent: g, ol: 0.015 });
      for (const sx of [-0.13, 0.13]) {
        k.box(0.14, 0.09, 0.04, PAL.ink, { x: sx, y: 0.74, z: 0.235, parent: g, cast: false });
        k.ico(0.035, 0, TEAL, { x: sx, y: 0.74, z: 0.26, parent: g, cast: false });
      }
      k.box(0.2, 0.12, 0.06, 0x7c8a6c, { y: 0.6, z: 0.25, parent: g, ol: 0.01 });
      // The mail slot is the mouth. It is always hungry.
      k.box(0.34, 0.1, 0.05, PAL.harvest, { y: 0.42, z: 0.24, parent: g, ol: 0.01 });
      k.box(0.28, 0.04, 0.06, PAL.ink, { y: 0.42, z: 0.25, parent: g, cast: false });
      for (let i = 0; i < 3; i++)
        k.cyl(0, 0.06, 0.26 + (i % 2) * 0.1, 5, CRYSTALS[i], { base: true, x: (i - 1) * 0.16, y: 0.96, rz: (i - 1) * -0.3, parent: g, ol: 0.01 });
      k.ico(0.16, 0, LEAF[2], { x: 0.18, y: 0.98, z: 0.08, parent: g }).scale.set(1.3, 0.45, 1.1);
      const tag = k.signPlane(0.6, 0.22, ["OUTGOING", "PLEASE DO NOT FEED"], { bg: PAL.cream, fg: 0x2f5f4a, border: LILAC, px: 300 });
      tag.position.set(0, 0.12, 0.305);
      g.add(tag);
    },
    altar(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.9, 0.12, 0.9, 0xb8b89a, { base: true, x, y, z, parent: G, ol: 0.015 });
      // A tall gate behind the altar keeps its sign above the goal stamp.
      const gate = new THREE.Group();
      gate.position.set(x - 0.42, y, z - 0.42);
      gate.rotation.y = Math.PI / 4;
      G.add(gate);
      for (const sx of [-0.62, 0.62]) k.box(0.2, 2.75, 0.2, STONE, { base: true, x: sx, parent: gate, ol: 0.02 });
      k.box(1.62, 0.18, 0.28, 0x9aa88a, { base: true, y: 2.75, parent: gate, ol: 0.018 });
      k.box(1.05, 0.7, 0.1, STONE, { base: true, y: 2.05, parent: gate, ol: 0.015 });
      k.cyl(0, 0.09, 0.36, 5, LILAC, { base: true, x: -0.55, y: 2.93, parent: gate, ol: 0.01 });
      k.cyl(0, 0.08, 0.3, 5, TEAL, { base: true, x: 0.55, y: 2.93, parent: gate, ol: 0.01 });
      const s = k.signPlane(1.0, 0.56, ["RECEIVING", "OFFERINGS & PARCELS", "NO SIGNATURE · JUST VIBES"], { bg: PAL.cream, fg: 0x2f5f4a, border: PAL.burnt });
      s.position.set(0, 2.4, 0.06);
      gate.add(s);
      const vines = [vine(k, gate, -0.45, 2.75, 0.15, 0.6), vine(k, gate, 0.35, 2.75, 0.15, 0.9)];
      sway(ctx, vines, 2);
      const flames = [];
      for (const [dx, dz] of [[0.36, -0.34], [-0.34, 0.36]]) {
        k.cyl(0.04, 0.045, 0.22, 6, PAL.cream, { base: true, x: x + dx, y: y + 0.12, z: z + dz, parent: G, ol: 0.008 });
        flames.push(k.ico(0.045, 0, PAL.harvest, { x: x + dx, y: y + 0.4, z: z + dz, parent: G, cast: false }));
      }
      ctx.animators.push((time) => {
        flames[0].scale.setScalar(1 + Math.sin(time * 13) * 0.25);
        flames[1].scale.setScalar(1 + Math.sin(time * 11 + 2) * 0.25);
      });
    },
    roots(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const g = new THREE.Group();
      G.add(g);
      k.box(0.96, 0.025, 0.06, 0x4f5a44, { x, y: y + 0.012, z: z + 0.44, parent: g, cast: false });
      for (let i = 0; i < 3; i++) {
        const r = k.cyl(0.025, 0.035, 0.7 + rnd() * 0.3, 4, 0x6b4a2a, { x: x + (rnd() - 0.5) * 0.5, y: y + 0.02, z: z + (rnd() - 0.5) * 0.6, rz: Math.PI / 2, parent: g, cast: false });
        r.rotation.y = (rnd() - 0.5) * 1.6;
      }
      follow(ctx, t, g);
    },
    stone(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      G.add(g);
      k.ico(0.2, 0, LEAF[1], { x: x - 0.18, y: y + 0.02, z: z - 0.12, parent: g, cast: false }).scale.set(1.3, 0.25, 1);
      k.cyl(0, 0.05, 0.2, 5, LILAC, { base: true, x: x + 0.3, y, z: z - 0.3, rz: 0.3, parent: g, ol: 0.008 });
      follow(ctx, t, g);
    },
  },
  decorate,
};

/** Hide set dressing on a tile while a hazard has made it vanish. */
function follow(ctx, t, obj) {
  if (!t.dynamic) return;
  ctx.animators.push(() => (obj.visible = !t.gone));
}

function strut(k, parent, a, b, r, color) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = k.cyl(r, r, d.length(), 5, color, { parent, cast: false });
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
  return m;
}

function vine(k, parent, x, y, z, len) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  k.cyl(0.018, 0.012, len, 4, 0x3f6a22, { y: -len / 2, parent: g, cast: false });
  k.ico(0.055, 0, LEAF[2], { x: 0.03, y: -len * 0.45, parent: g, cast: false }).scale.set(1.4, 0.7, 0.5);
  k.ico(0.05, 0, LEAF[3], { x: -0.03, y: -len * 0.9, parent: g, cast: false }).scale.set(1.4, 0.7, 0.5);
  return g;
}

function sway(ctx, vines, ph) {
  ctx.animators.push((time) => {
    for (let i = 0; i < vines.length; i++) {
      vines[i].rotation.z = Math.sin(time * 1.3 + ph + i * 1.7) * 0.1;
      vines[i].rotation.x = Math.cos(time * 1.05 + ph + i) * 0.07;
    }
  });
}

function canopyTree(ctx, x, y, z, s = 1) {
  const { k, group: G, rnd } = ctx;
  k.cyl(0.2 * s, 0.32 * s, 2.0 * s, 7, BARK, { base: true, x, y, z, parent: G, ol: 0.02 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rnd();
    const root = k.cyl(0.04, 0.1, 0.55, 5, BARK, { x: x + Math.cos(a) * 0.3, y: y + 0.12, z: z + Math.sin(a) * 0.3, parent: G, cast: false });
    root.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
  }
  const layers = [
    [0, 2.05, 0, 0.9],
    [0.32, 2.5, 0.2, 0.68],
    [-0.28, 2.7, -0.18, 0.58],
    [0.08, 3.05, 0.02, 0.42],
  ];
  layers.forEach(([dx, dy, dz, r], i) => {
    const f = k.ico(r * s, 0, LEAF[i], { x: x + dx * s, y: y + dy * s, z: z + dz * s, parent: G, ol: 0.025 });
    f.rotation.set(rnd() * 3, rnd() * 3, 0);
  });
  const vines = [];
  for (let i = 0; i < 3; i++) {
    const a = rnd() * Math.PI * 2;
    vines.push(vine(k, G, x + Math.cos(a) * 0.7 * s, y + 1.85 * s, z + Math.sin(a) * 0.7 * s, 0.7 + rnd() * 0.6));
  }
  sway(ctx, vines, rnd() * 6);
}

function crystalCluster(ctx, x, y, z, s) {
  const { k, group: G, rnd } = ctx;
  const n = 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd();
    const d = i === 0 ? 0 : 0.18 + rnd() * 0.12;
    const h = (i === 0 ? 1.5 : 0.6 + rnd() * 0.6) * s;
    const c = k.cyl(0, (i === 0 ? 0.17 : 0.1) * s, h, 5, CRYSTALS[(i + Math.floor(x + z)) % CRYSTALS.length], {
      base: true, x: x + Math.cos(a) * d, y: y - 0.04, z: z + Math.sin(a) * d, parent: G, ol: 0.015,
    });
    if (i) c.rotation.set(Math.sin(a) * 0.45, rnd(), -Math.cos(a) * 0.45);
  }
  const spark = k.ico(0.06, 0, 0xffffff, { x: x + 0.05, y: y + 1.0 * s, z: z + 0.12, parent: G, cast: false });
  const ph = rnd() * 6;
  ctx.animators.push((time) => spark.scale.setScalar(Math.max(0.05, Math.sin(time * 2.2 + ph)) * 1.2));
}

function decorate(ctx) {
  const { k, group: G, rnd, tileAt } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const hy = LV;

  voidTrims(ctx, 0x8a6a3a);

  // Rope bridge across the ravine (cols 9-13, row 12): slats per tile, posts, sagging hand ropes.
  for (let c = 9; c <= 13; c++) {
    const g = new THREE.Group();
    G.add(g);
    for (let i = 0; i < 4; i++) box(0.17, 0.035, 0.94, 0xb8905a, { base: true, x: c - 0.36 + i * 0.24, y: hy, z: 12, parent: g, cast: false });
    follow(ctx, tileAt(c, 12), g);
  }
  for (const px of [8.5, 13.5]) for (const pz of [11.55, 12.45]) cyl(0.06, 0.08, 0.95, 6, BARK, { base: true, x: px, y: hy, z: pz, parent: G, ol: 0.012 });
  for (const pz of [11.55, 12.45]) {
    let prev = new THREE.Vector3(8.5, hy + 0.9, pz);
    for (let i = 1; i <= 5; i++) {
      const p = new THREE.Vector3(8.5 + i, hy + 0.9 - Math.sin((i / 5) * Math.PI) * 0.28, pz);
      strut(k, G, prev, p, 0.022, ROPE);
      prev = p;
    }
  }
  box(0.08, 0.08, 1.0, BARK, { x: 8.5, y: hy + 1.0, z: 12, parent: G, ol: 0.01 });
  const bridgeSign = signPlane(0.9, 0.3, ["ROPE BRIDGE", "LOAD LIMIT: 1 OPTIMIST"], { bg: PAL.cream, fg: 0x2f5f4a, border: PAL.burnt, px: 260 });
  bridgeSign.position.set(8.56, hy + 1.22, 12);
  bridgeSign.rotation.y = Math.PI / 2;
  G.add(bridgeSign);
  const under = [];
  for (const c of [9.6, 11.2, 12.7]) under.push(vine(k, G, c, hy - 0.45, 12 + (rnd() - 0.5) * 0.5, 0.9 + rnd() * 0.6));
  sway(ctx, under, 1.3);

  // Stepping-stones notice on the left landing.
  cyl(0.03, 0.03, 0.7, 5, BARK, { base: true, x: 8.3, y: hy, z: 3.62, parent: G });
  const stones = signPlane(0.8, 0.3, ["STEPPING STONES", "WARRANTY VOID OVER VOID"], { bg: PAL.cream, fg: 0x2f5f4a, border: TEAL, px: 260 });
  stones.position.set(8.3, hy + 0.78, 3.62);
  stones.rotation.y = Math.PI / 4;
  G.add(stones);

  // Fauna schedule posted on the front-left temple pillar.
  const sched = signPlane(0.56, 0.42, ["FAUNA BITES", "9:00 · 9:01 · 9:02", "9:03 · ETC."], { bg: PAL.cream, fg: PAL.burnt, border: 0x2f5f4a, px: 300 });
  sched.position.set(15, 2 * LV + 0.75, 6.33);
  G.add(sched);

  // Moss drapes hanging off the temple's front tier.
  const drapes = [];
  for (const dx of [16.2, 17.6, 19.3, 20.8]) drapes.push(vine(k, G, dx, 2 * LV, 6.52, 0.25 + rnd() * 0.2));
  for (const dx of [17.4, 19.6]) drapes.push(vine(k, G, dx, 3 * LV, 3.52, 0.22 + rnd() * 0.15));
  sway(ctx, drapes, 0.4);

  // Giant trunks holding the canopy deck up out of the ravine.
  for (const [x, z, r] of [[4, 7.5, 0.8], [18.5, 5.5, 1.0], [19, 13, 0.75]]) {
    cyl(r * 0.85, r * 1.2, 14, 8, BARK, { x, y: -0.45 - 7, z, parent: G, cast: false });
    strut(k, G, new THREE.Vector3(x, -2.4, z), new THREE.Vector3(x + 2.4, -0.5, z + 1.2), r * 0.28, BARK);
  }

  // Background rainforest giants and a misty ravine floor.
  for (const [x, z, s] of [[-4, 4, 1], [-3.5, 13, 0.8], [5, -4, 1.1], [14.5, -4, 0.9], [25.5, -3, 1]]) {
    cyl(0.9 * s, 1.3 * s, 22, 8, 0x5a3a20, { x, y: -11 + 6 * s, z, parent: G, cast: false, recv: false });
    for (let i = 0; i < 3; i++)
      ico((2.6 - i * 0.5) * s, 0, LEAF[i], { x: x + (i - 1) * 1.2, y: 6 * s + 0.5 + i * 0.9, z: z + (i % 2) * 0.8, parent: G, cast: false, recv: false });
  }
  for (const [x, y, z, h] of [[11, -5.5, 2.5, 3.6], [10.4, -6, 8, 4.2], [11.8, -5.2, 15, 3.2]])
    cyl(0, 0.6, h, 5, LILAC, { base: true, x, y, z, parent: G, cast: false, ol: 0.03 });
  for (const [y, op] of [[-2.4, 0.2], [-4.6, 0.32]]) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: 0xeaf6e0, transparent: true, opacity: op, depthWrite: false }));
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(11.5, y, 8);
    G.add(mist);
  }
  const pollen = [];
  for (let i = 0; i < 90; i++) pollen.push(-2 + rnd() * 28, 0.6 + rnd() * 3.4, -2 + rnd() * 20);
  const motes = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pollen, 3)),
    new THREE.PointsMaterial({ color: 0xfff2a0, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.8 })
  );
  G.add(motes);
  ctx.animators.push((time) => {
    motes.position.y = Math.sin(time * 0.6) * 0.25;
    motes.position.x = Math.sin(time * 0.23) * 0.4;
  });

  // A monkey on the back canopy, holding someone's parcel. Possibly yours, later.
  const monkey = new THREE.Group();
  monkey.position.set(7.2, LV + 3.35, -0.1);
  monkey.rotation.y = 0.6;
  G.add(monkey);
  ico(0.16, 1, 0x7a4a2a, { y: 0.15, parent: monkey, ol: 0.015 }).scale.set(1, 1.15, 0.9);
  const head = ico(0.12, 1, 0x7a4a2a, { y: 0.42, parent: monkey, ol: 0.012 });
  ico(0.08, 1, 0xd8b088, { y: 0.4, z: 0.07, parent: monkey }).scale.set(1, 0.85, 0.6);
  for (const sx of [-0.04, 0.04]) ico(0.02, 0, PAL.ink, { x: sx, y: 0.44, z: 0.12, parent: monkey, cast: false });
  strut(k, monkey, new THREE.Vector3(-0.1, 0.05, -0.1), new THREE.Vector3(-0.35, 0.3, -0.3), 0.025, 0x7a4a2a);
  const loot = buildHeldParcel(k);
  loot.scale.setScalar(0.7);
  loot.position.set(0, 0.2, 0.2);
  monkey.add(loot);
  ctx.animators.push((time) => {
    head.rotation.y = Math.sin(time * 0.9) * 0.6;
    monkey.position.y = LV + 3.35 + Math.abs(Math.sin(time * 1.4)) * 0.04;
  });

  // Customer: a moss-covered blob receiving at the altar.
  const customer = buildBlob(k, { body: 0x7fae4a, robe: LILAC, mug: false });
  [[0.1, 0.82, 0.05, 0.1], [-0.12, 0.78, -0.05, 0.09], [0.02, 0.86, -0.12, 0.08], [0.2, 0.62, -0.1, 0.07]].forEach(([mx, my, mz, r], i) =>
    ico(r, 0, LEAF[i], { x: mx, y: my, z: mz, parent: customer.root }).scale.set(1.3, 0.55, 1.2)
  );
  ico(0.045, 0, PAL.harvest, { x: -0.1, y: 0.92, z: 0.05, parent: customer.root });
  customer.root.position.set(18, 3 * LV + 0.12, 1);
  customer.root.rotation.y = 0.35;
  G.add(customer.root);
  return customer;
}
