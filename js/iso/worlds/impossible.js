// Impossible Geometry: floating Escher plaza, stairs to a gallery that narrows to the executive desk.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const LAV = 0xb9a6d6;
const LAV_SIDE = 0x7a68a0;
const CREAM = 0xf3ecdf;
const portraitMats = new WeakMap();

export default {
  id: "world_impossible",
  label: "Impossible Geometry",
  customer: "V.P. OF VANISHING POINTS",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: null,
  edge: "void",
  view: 7.8,
  bg: "radial-gradient(ellipse at 50% 38%, #fffaf0 0%, #f1e8f4 40%, #d9cbe8 75%, #bfaedb 100%)",
  floaty: { bob: 0.014, tilt: 0.035 },
  sign: { lines: ["IMPOSSIBLE HALL", "PERSPECTIVE NOT INCLUDED"], opts: { bg: CREAM, fg: 0x5a4a8a, border: PAL.harvest } },
  voidCause: "FELL OUT OF PERSPECTIVE",
  native: ["chaser"],
  anchors: {
    chaser: [[5, 7]],
    glitch: [[5, 13], [9, 16], [6, 15], [7, 8], [9, 7], [10, 4], [12, 5], [13, 3]],
    shimmer: [[5, 13], [9, 16], [6, 15], [7, 8], [9, 7], [10, 4], [12, 5], [13, 3]],
  },
  grid: [
    "                      ",
    "                      ",
    "         WWWWWWWW EEE ",
    "         HHHHHHHH XcX ",
    "         HHdHHHHHHXOX ",
    "         HHHHH    XXX ",
    "   54LLLLL            ",
    "     LLLLL            ",
    "     LLLLL            ",
    "     LLLLL            ",
    "      222             ",
    "      111             ",
    "    mmmmmPP           ",
    "    mmmmmmm    mZmmmm ",
    "    Qmdmommbbbbmmmmmm ",
    "    QmmmmmmbbbbmmmmS@ ",
    "    mmmmmmm    mmmmmm ",
    "                      ",
  ],
  legend: {
    " ": { void: true },
    o: { void: true },
    m: { h: 0, top: CREAM, side: LAV_SIDE, checker: 0.5 },
    d: { h: 0, top: CREAM, side: LAV_SIDE, checker: 0.5, prop: "floorDoor" },
    b: { h: 0, top: 0xd9cdea, side: LAV_SIDE, catwalk: true },
    P: { h: 0, top: LAV, side: LAV_SIDE, solid: true, prop: "portrait" },
    Q: { h: 0, top: LAV, side: LAV_SIDE, solid: true, prop: "portrait" },
    1: { h: 1, top: 0xe6dcf0, side: LAV_SIDE },
    2: { h: 2, top: 0xd9cdea, side: LAV_SIDE },
    L: { h: 3, top: CREAM, side: LAV_SIDE, checker: 0.12 },
    4: { h: 4, top: 0xe6dcf0, side: LAV_SIDE },
    5: { h: 5, top: 0xd9cdea, side: LAV_SIDE },
    H: { h: 3, top: CREAM, side: LAV_SIDE, checker: 0.5, catwalk: true },
    W: { h: 3, top: LAV, side: LAV_SIDE, solid: true, prop: "portrait" },
    E: { h: 3, top: LAV, side: LAV_SIDE, solid: true },
    X: { h: 3, top: 0x8f7fb5, side: 0x5a4a8a, checker: 0.06 },
    c: { h: 3, top: 0x8f7fb5, side: 0x5a4a8a, solid: true },
    O: { h: 3, top: 0x8f7fb5, side: 0x5a4a8a, goal: true },
    Z: { h: 0, top: CREAM, side: LAV_SIDE, solid: true, prop: "sign" },
    S: { h: 0, top: 0xe6dcf0, side: LAV_SIDE, start: true },
    "@": { h: 0, top: 0xe6dcf0, side: LAV_SIDE, solid: true, prop: "portal" },
  },
  lights: { sky: 0xfff4ff, ground: 0x8a7aa8, hemi: 1.5, sun: 0xfff0e0, sunI: 2.3 },
  props: {
    portrait(ctx, t, x, y, z) {
      const { k, group: G, player } = ctx;
      const faceX = t.ch === "Q";
      const s = t.ch === "W" ? 1 - (t.c - 9) * 0.065 : 1;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      if (faceX) g.rotation.y = Math.PI / 2;
      G.add(g);
      const wallH = 0.5 + 1.25 * s;
      k.box(0.98, wallH, 0.16, LAV, { base: true, z: -0.3, parent: g, ol: 0.02 });
      k.box(1.02, 0.08, 0.22, CREAM, { base: true, y: wallH, z: -0.3, parent: g, ol: 0.012 });
      const py = 0.35 + wallH * 0.52;
      k.box(0.66 * s, 0.84 * s, 0.05, PAL.harvest, { y: py, z: -0.2, parent: g, ol: 0.012 });
      const variant = (t.c * 7 + t.r * 3) % 4;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.54 * s, 0.72 * s), portraitMat(k, variant));
      plane.position.set(0, py, -0.17);
      g.add(plane);
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.09 * s, 0.014 * s, 4, 12, Math.PI), k.inkMat);
      mouth.position.set(0, py - 0.02 * s, -0.165);
      mouth.rotation.z = Math.PI;
      g.add(mouth);
      ctx.animators.push(() => {
        const d = Math.hypot(player.pos.x - x, player.pos.z - z);
        const grin = 1 + THREE.MathUtils.clamp(1 - d / 4.5, 0, 1) * 0.9;
        mouth.scale.set(grin, 0.6 + grin * 0.4, 1);
      });
    },
    floorDoor(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.66, 0.03, 0.9, PAL.cream, { x, y: y + 0.015, z, parent: G, cast: false });
      k.box(0.56, 0.035, 0.8, 0x8a5a3a, { x, y: y + 0.02, z, parent: G, cast: false, ol: 0.008 });
      k.ico(0.04, 0, PAL.harvest, { x: x + 0.18, y: y + 0.05, z: z + 0.05, parent: G, cast: false });
      const s = k.signPlane(0.44, 0.14, ["THIS SIDE DOWN"], { bg: CREAM, fg: 0x5a4a8a, border: PAL.harvest, px: 300 });
      s.position.set(x, y + 0.045, z - 0.22);
      s.rotation.x = -Math.PI / 2;
      G.add(s);
    },
  },
  decorate,
};

/** Portrait that smiles without eyes (canvas texture, one material per variant per kit). */
function portraitMat(k, variant) {
  if (!portraitMats.has(k)) portraitMats.set(k, []);
  const list = portraitMats.get(k);
  if (!list[variant]) {
    const bgs = ["#8f7fb5", "#568203", "#1f4e79", "#cc5500"];
    const skins = ["#f0c08c", "#c8e6a0", "#e8d0f0", "#f5ecd7"];
    const tex = k.canvasTex(108, 144, (c, W, H) => {
      c.fillStyle = bgs[variant];
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#2a2338";
      c.beginPath();
      c.ellipse(W / 2, H * 0.98, W * 0.42, H * 0.3, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = skins[variant];
      c.beginPath();
      c.ellipse(W / 2, H * 0.44, W * 0.27, H * 0.24, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2a2338";
      c.fillRect(W * 0.26, H * 0.17, W * 0.48, H * 0.06 + variant * 2);
    });
    list[variant] = new THREE.MeshBasicMaterial({ map: tex });
  }
  return list[variant];
}

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const hy = 3 * LV;

  voidTrims(ctx, PAL.harvest);

  // Impossible triangle: three beams along x, y, z whose ends meet only along the iso view axis (1,1,1).
  const tri = new THREE.Group();
  tri.position.set(1.6, 3.2, 1.6);
  G.add(tri);
  const L = 3;
  const tb = 0.42;
  box(L + tb, tb, tb, 0x9b7fd0, { x: L / 2, parent: tri, cast: false });
  box(tb, L + tb, tb, 0x9b7fd0, { x: L, y: L / 2, parent: tri, cast: false });
  box(tb, tb, L + tb, 0x9b7fd0, { x: L, y: L, z: L / 2, parent: tri, cast: false });
  ctx.animators.push((time) => (tri.position.y = 3.2 + Math.sin(time * 0.6) * 0.12));

  // Upside-down staircase hanging over the back void.
  const up = new THREE.Group();
  up.position.set(15, 5.4, -0.6);
  up.rotation.z = Math.PI;
  G.add(up);
  for (let i = 0; i < 6; i++) box(0.55, 0.3 * (i + 1), 1.1, i % 2 ? 0xd9cdea : 0xe6dcf0, { base: true, x: i * 0.55, parent: up, ol: 0.015 });
  const upSign = signPlane(1.3, 0.34, ["STAIRS (INVERTED)", "USE OTHER GRAVITY"], { bg: CREAM, fg: 0x5a4a8a, border: PAL.harvest });
  upSign.position.set(13.8, 4.6, -0.3);
  upSign.rotation.y = Math.PI / 4;
  G.add(upSign);

  // Stairs to nowhere off the landing.
  const nowhere = signPlane(1.1, 0.32, ["STAIRS", "UP ONLY · NO TOP"], { bg: CREAM, fg: PAL.burnt, border: 0x5a4a8a });
  nowhere.position.set(3.4, 5 * LV + 1.15, 6.4);
  nowhere.rotation.y = Math.PI / 4;
  G.add(nowhere);

  // Floating pillars under the islands, trailing into the void.
  for (const [px, pz, top] of [[5, 9, hy], [9, 9, hy], [18, 5, hy], [20, 5, hy], [15, 16, 0], [20, 13, 0], [4, 16, 0], [10, 12, 0]]) {
    cyl(0.16, 0.06, 2.6, 6, LAV, { x: px, y: top - 0.45 - 1.3, z: pz, parent: G, ol: 0.012 });
    cyl(0.22, 0.22, 0.1, 6, CREAM, { x: px, y: top - 0.5, z: pz, parent: G });
  }

  // An open door set into the floor: frame + leaf around the plaza hole.
  const [oc, or] = [8, 14];
  for (const [fx, fz, w, d] of [[0, -0.47, 1, 0.06], [0, 0.47, 1, 0.06], [-0.47, 0, 0.06, 1], [0.47, 0, 0.06, 1]]) box(w, 0.08, d, 0x8a5a3a, { x: oc + fx, y: 0.04, z: or + fz, parent: G, ol: 0.008 });
  const leaf = new THREE.Group();
  leaf.position.set(oc - 0.47, 0.04, or);
  G.add(leaf);
  box(0.9, 0.04, 0.86, 0x8a5a3a, { x: 0.45, parent: leaf, ol: 0.01 });
  ico(0.04, 0, PAL.harvest, { x: 0.8, y: 0.04, z: 0.1, parent: leaf });
  ctx.animators.push((time) => (leaf.rotation.z = 1.9 + Math.sin(time * 0.9) * 0.08));
  const hole = signPlane(1.0, 0.3, ["DOOR (DOWN)", "EXIT: EVENTUALLY"], { bg: CREAM, fg: PAL.burnt, border: 0x5a4a8a });
  hole.position.set(oc + 0.2, 1.15, or - 0.2);
  hole.rotation.y = Math.PI / 4;
  G.add(hole);

  // Executive receiving: back wall + sign, desk, banker's lamp, on-hold music.
  box(3, 1.9, 0.2, LAV, { base: true, x: 19, y: hy, z: 2.3, parent: G, ol: 0.02 });
  box(3.1, 0.1, 0.28, CREAM, { base: true, x: 19, y: hy + 1.9, z: 2.3, parent: G, ol: 0.012 });
  const exec = signPlane(2.7, 0.62, ["EXECUTIVE RECEIVING", "PLEASE HOLD FOREVER"], { bg: CREAM, fg: 0x5a4a8a, border: PAL.harvest });
  exec.position.set(19, hy + 1.45, 2.42);
  G.add(exec);
  box(1.5, 0.5, 0.52, 0x5a3a2a, { base: true, x: 19, y: hy, z: 3.6, parent: G, ol: 0.02 });
  box(1.56, 0.05, 0.58, 0x7a5236, { base: true, x: 19, y: hy + 0.5, z: 3.6, parent: G, ol: 0.012 });
  const plate = signPlane(0.6, 0.14, ["V.P. · V.P."], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink, px: 300 });
  plate.position.set(19, hy + 0.36, 3.87);
  G.add(plate);
  cyl(0.08, 0.1, 0.04, 8, PAL.harvest, { base: true, x: 18.5, y: hy + 0.55, z: 3.55, parent: G, ol: 0.008 });
  cyl(0.015, 0.015, 0.3, 4, PAL.harvest, { base: true, x: 18.5, y: hy + 0.59, z: 3.55, parent: G });
  const shade = k.mk(new THREE.CylinderGeometry(0.1, 0.1, 0.36, 10, 1, false, 0, Math.PI), PAL.avocado, { x: 18.5, y: hy + 0.92, z: 3.55, rz: Math.PI / 2, parent: G, ol: 0.01 });
  shade.material = shade.material.clone();
  shade.material.side = THREE.DoubleSide;
  const bulb = k.mk(new THREE.PlaneGeometry(0.34, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.25, depthWrite: false }), { x: 18.5, y: hy + 0.65, z: 3.55, rx: -Math.PI / 2, parent: G, cast: false, recv: false });
  const notes = [0, 1].map((i) => {
    const n = signPlane(0.2, 0.2, ["♪"], { bg: CREAM, fg: 0x5a4a8a, border: CREAM, px: 300 });
    G.add(n);
    return n;
  });
  ctx.animators.push((time) => {
    bulb.material.opacity = 0.2 + Math.sin(time * 2.2) * 0.05;
    notes.forEach((n, i) => {
      const ph = (time * 0.35 + i * 0.5) % 1;
      n.position.set(19.5 + Math.sin(ph * 6 + i) * 0.2, hy + 1.1 + ph * 1.2, 3.1);
      n.rotation.y = Math.PI / 4;
      n.visible = ph < 0.85;
    });
  });

  // Distant floating fragments below, for depth.
  for (let i = 0; i < 7; i++) {
    const f = box(0.5 + rnd() * 0.8, 0.12, 0.5 + rnd() * 0.8, i % 2 ? CREAM : LAV, { x: rnd() * 22 - 2, y: -2.2 - rnd() * 2.2, z: rnd() * 18, parent: G, cast: false, ol: 0.012 });
    const sp = 0.2 + rnd() * 0.3;
    const y0 = f.position.y;
    ctx.animators.push((time) => {
      f.position.y = y0 + Math.sin(time * sp + i) * 0.15;
      f.rotation.y = time * sp * 0.5;
    });
  }

  const customer = buildBlob(k, { body: 0xe8d27a, robe: PAL.ibm });
  k.box(0.07, 0.22, 0.03, PAL.burnt, { y: 0.27, z: 0.31, parent: customer.root });
  customer.root.position.set(19, hy, 3);
  G.add(customer.root);
  return customer;
}
