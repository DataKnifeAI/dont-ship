// Unmapped Void: fragments of other worlds stitched over unrendered blueprint space by wireframe bridges.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const BLUE = 0x1f4e79;
const BLUE_LT = 0x3d7ab8;
const BLUE_SIDE = 0x163a5c;
const PARCHMENT = 0xf0e2c0;
const BLUEPRINT = new Set(["b", "B", "O", "W", "Q", "w", "u", "?", "!"]);
const GLITCH = [[7, 15], [9, 13], [9, 9], [11, 7], [17, 7], [19, 8], [20, 5]];

export default {
  id: "world_unmapped",
  label: "Unmapped Void",
  customer: "TBD (ASSIGNED LATER)",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: null,
  edge: "void",
  view: 8.0,
  bg: "radial-gradient(ellipse at 50% 35%, #2f6ea8 0%, #1f4e79 42%, #12324f 75%, #0a1c30 100%)",
  floaty: { bob: 0.02, tilt: 0.06 },
  sign: { lines: ["HERE BE INVOICES", "CARTOGRAPHY DEPT · EST. ?"], opts: { bg: PARCHMENT, fg: PAL.ibm, border: PAL.burnt } },
  voidCause: "FELL OFF THE MAP (LITERALLY)",
  native: ["glitch", "blackhole"],
  anchors: {
    glitch: GLITCH,
    blackhole: [{ x: 14.5, y: 0.45, z: 10, R: 4.4 }],
    chaser: [[12, 4]],
  },
  grid: [
    "bWWWb             bBBBb ",
    "bWWWbb           bbBQBbb",
    "bbbbbb           bbBOBbb",
    " bbbbb  mAKKmm   bbbbbb ",
    "  bbbbwwmmKKmm      w   ",
    "        Zmmmm       !   ",
    "         mmmmm ssjsss   ",
    "         mm!mm rr?rrrr  ",
    "         w     rrrr?rr  ",
    "         !              ",
    "         w              ",
    "         NNNNNY         ",
    "         NNYNNN         ",
    " gtgg    ?nnnnn         ",
    "Hggggg   nnnXnn         ",
    "ggggggu?unnnnnX         ",
    "@SgggF   nXnnnn         ",
    "HHMgg    hhhhhh         ",
  ],
  legend: {
    " ": { void: true },
    b: { h: 2, top: BLUE, side: BLUE_SIDE, checker: 0.06 },
    B: { h: 3, top: 0x2a5c8f, side: BLUE_SIDE, checker: 0.06 },
    W: { h: 2, top: BLUE, side: BLUE_SIDE, checker: 0.06, solid: true },
    Q: { h: 3, top: 0x2a5c8f, side: BLUE_SIDE, solid: true },
    O: { h: 3, top: BLUE_LT, side: BLUE_SIDE, goal: true },
    w: { h: 2, top: BLUE_LT, side: BLUE_SIDE, catwalk: true },
    u: { h: 1, top: BLUE_LT, side: BLUE_SIDE, catwalk: true },
    "?": { h: 1, top: 0x4a8ac8, side: BLUE_SIDE, catwalk: true, glitch: true },
    "!": { h: 2, top: 0x4a8ac8, side: BLUE_SIDE, catwalk: true, glitch: true },
    g: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, jitter: 0.06 },
    t: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, solid: true, prop: "lollipop" },
    H: { h: 1, top: 0x4d7a16, side: 0x7a4e2d, solid: true, prop: "hedge" },
    M: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, solid: true, prop: "mailbox" },
    F: { h: 1, top: 0x5a3b22, side: 0x7a4e2d, prop: "flowers" },
    S: { h: 1, top: 0xe4dac3, side: 0xbfb49b, start: true },
    "@": { h: 1, top: 0xe4dac3, side: 0xbfb49b, solid: true, prop: "portal" },
    n: { h: 1, top: 0xb8b4a8, side: 0x6b6f78, checker: 0.04 },
    N: { h: 2, top: 0xc9c2ae, side: 0x6b6f78, checker: 0.04 },
    X: { h: 1, top: 0xb8b4a8, side: 0x6b6f78, solid: true, prop: "crate" },
    Y: { h: 2, top: 0xc9c2ae, side: 0x6b6f78, solid: true, prop: "crate" },
    h: { h: 1, top: PAL.harvest, side: 0x6b6f78, prop: "stripes" },
    m: { h: 2, top: 0xd8d2bf, side: 0x2d3650, checker: 0.05 },
    K: { h: 3, top: 0x2f6496, side: 0x1b2c48, checker: 0.06 },
    A: { h: 2, top: 0xd8d2bf, side: 0x2d3650, solid: true, prop: "antenna" },
    Z: { h: 2, top: 0xd8d2bf, side: 0x2d3650, solid: true, prop: "sign" },
    s: { h: 1, top: 0xe8c07a, side: 0xc0703a, jitter: 0.05 },
    r: { h: 1, top: 0x4a4448, side: 0x8a7a6a, jitter: 0.02 },
    j: { h: 1, top: 0xe8c07a, side: 0xc0703a, solid: true, prop: "wiresaguaro" },
  },
  lights: { sky: 0xdbe8ff, ground: 0x1a2a4a, hemi: 1.45, sun: 0xfff4e0, sunI: 2.4 },
  props: {
    stripes(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      G.add(g);
      for (const dx of [-0.3, 0, 0.3]) k.box(0.12, 0.012, 0.9, PAL.ink, { x: x + dx, y: y + 0.006, z, ry: Math.PI / 4, parent: g, cast: false });
      follow(ctx, t, g);
    },
    wiresaguaro(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.15, 0.16, 0.4, 6, 0x5f8f3a, { base: true, x, y, z, parent: G, ol: 0.015 });
      const line = lineMat(ctx);
      const parts = [
        [new THREE.CylinderGeometry(0.14, 0.15, 0.8, 6), x, y + 0.8, z],
        [new THREE.CylinderGeometry(0.07, 0.07, 0.45, 5), x + 0.3, y + 0.85, z],
        [new THREE.CylinderGeometry(0.07, 0.07, 0.35, 5), x - 0.3, y + 0.7, z],
      ];
      for (const [geo, px, py, pz] of parts) G.add(wire(geo, line, px, py, pz));
      G.add(wire(new THREE.BoxGeometry(0.2, 0.06, 0.06), line, x + 0.2, y + 0.65, z));
      G.add(wire(new THREE.BoxGeometry(0.2, 0.06, 0.06), line, x - 0.2, y + 0.55, z));
    },
  },
  decorate,
};

/** Hide set dressing on a tile while a hazard has made it vanish. */
function follow(ctx, t, obj) {
  if (!t.dynamic) return;
  ctx.animators.push(() => (obj.visible = !t.gone));
}

const lineMats = new WeakMap();
function lineMat(ctx) {
  if (!lineMats.has(ctx)) lineMats.set(ctx, new THREE.LineBasicMaterial({ color: PAL.cream, transparent: true, opacity: 0.9 }));
  return lineMats.get(ctx);
}

function wire(geo, mat, x = 0, y = 0, z = 0) {
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  geo.dispose();
  l.position.set(x, y, z);
  return l;
}

function gridTexture(k, mark) {
  return k.canvasTex(64, 64, (c, W) => {
    c.clearRect(0, 0, W, W);
    c.strokeStyle = "rgba(245,236,215,0.8)";
    c.lineWidth = 3;
    c.strokeRect(1.5, 1.5, W - 3, W - 3);
    c.strokeStyle = "rgba(245,236,215,0.3)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(W / 2, 0);
    c.lineTo(W / 2, W);
    c.moveTo(0, W / 2);
    c.lineTo(W, W / 2);
    c.stroke();
    if (mark) {
      c.fillStyle = "rgba(245,236,215,0.95)";
      c.font = 'bold 44px "Courier New", monospace';
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("?", W / 2, W / 2 + 2);
    }
  });
}

function decorate(ctx) {
  const { k, group: G, rnd, tiles } = ctx;
  const { box, cyl, signPlane } = k;
  const line = lineMat(ctx);

  voidTrims(ctx, PAL.cream);

  // Cream blueprint grid over every unrendered tile; vanishing tiles carry their own copy.
  const gridMat = new THREE.MeshBasicMaterial({ map: gridTexture(k, false), transparent: true, depthWrite: false });
  const markMat = new THREE.MeshBasicMaterial({ map: gridTexture(k, true), transparent: true, depthWrite: false });
  const cell = new THREE.PlaneGeometry(0.97, 0.97).rotateX(-Math.PI / 2);
  const blueprint = tiles.flat().filter((t) => BLUEPRINT.has(t.ch));
  const fixed = blueprint.filter((t) => !t.dynamic && !t.glitch);
  const overlay = new THREE.InstancedMesh(cell, gridMat, fixed.length);
  const m4 = new THREE.Matrix4();
  fixed.forEach((t, i) => overlay.setMatrixAt(i, m4.makeTranslation(t.c, t.h * LV + 0.004, t.r)));
  overlay.receiveShadow = true;
  G.add(overlay);
  for (const t of blueprint.filter((t) => t.dynamic || t.glitch)) {
    const m = new THREE.Mesh(cell, t.glitch ? markMat : gridMat);
    m.position.set(t.c, t.h * LV + 0.004, t.r);
    G.add(m);
    follow(ctx, t, m);
  }
  // Bridges are wireframe all the way down.
  for (const t of tiles.flat().filter((t) => t.catwalk)) {
    const w = wire(new THREE.BoxGeometry(0.98, 0.45, 0.98), line, t.c, t.h * LV - 0.225, t.r);
    G.add(w);
    follow(ctx, t, w);
  }

  // Half-rendered house on the far fragment (cols 1-3, rows 0-1).
  const hy = 2 * LV;
  box(2.9, 0.55, 1.9, PAL.cream, { base: true, x: 2, y: hy, z: 0.5, parent: G, ol: 0.025 });
  box(0.6, 0.55, 0.06, PAL.burnt, { base: true, x: 2.6, y: hy, z: 1.46, parent: G, ol: 0.012 });
  G.add(wire(new THREE.BoxGeometry(2.9, 0.7, 1.9), line, 2, hy + 0.9, 0.5));
  const gable = new THREE.Shape([new THREE.Vector2(-1.55, 0), new THREE.Vector2(1.55, 0), new THREE.Vector2(0, 1.0)]);
  const roof = wire(new THREE.ExtrudeGeometry(gable, { depth: 2.1, bevelEnabled: false }), line, 2, hy + 1.25, -0.55);
  G.add(roof);
  G.add(wire(new THREE.BoxGeometry(0.9, 0.5, 0.05), line, 1.4, hy + 0.95, 1.47));
  const loading = signPlane(1.5, 0.36, ["RENDERING… 37%", "ETA: PENDING ETA"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  loading.position.set(2, hy + 0.3, 1.5);
  G.add(loading);
  const verts = [];
  for (let i = 0; i < 6; i++) verts.push(box(0.08, 0.08, 0.08, PAL.cream, { x: 0.6 + rnd() * 2.8, y: hy + 1.4 + rnd() * 0.8, z: -0.3 + rnd() * 1.6, parent: G, cast: false }));
  ctx.animators.push((time) => {
    for (let i = 0; i < verts.length; i++) verts[i].position.y += Math.sin(time * 1.5 + i) * 0.002;
    roof.position.y = hy + 1.25 + Math.max(0, Math.sin(time * 0.9)) * 0.12;
  });

  // UNDER CONSTRUCTION SINCE ∞ tape around the house fragment.
  const posts = [[0.55, 2.4], [4.45, 2.4], [4.45, -0.35]];
  for (const [px, pz] of posts) cyl(0.035, 0.035, 0.75, 6, PAL.harvest, { base: true, x: px, y: hy, z: pz, parent: G, ol: 0.01 });
  const tape = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const s = signPlane(len, 0.15, ["UNDER CONSTRUCTION SINCE ∞ · UNDER CONSTRUCTION SINCE ∞"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink, px: 200 });
    s.position.set((a[0] + b[0]) / 2, hy + 0.58, (a[1] + b[1]) / 2);
    s.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    G.add(s);
  };
  tape(posts[0], posts[1]);
  tape(posts[1], posts[2]);

  // Floating question-mark blocks, out over the void.
  const qTex = k.canvasTex(64, 64, (c, W) => {
    c.fillStyle = "#daa520";
    c.fillRect(0, 0, W, W);
    c.strokeStyle = "#1a1f16";
    c.lineWidth = 4;
    c.strokeRect(3, 3, W - 6, W - 6);
    c.fillStyle = "#f5ecd7";
    c.font = 'bold 46px "Courier New", monospace';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("?", W / 2, W / 2 + 2);
  });
  const qMat = new THREE.MeshToonMaterial({ map: qTex, gradientMap: k.toon(PAL.harvest).gradientMap });
  for (const [x, y, z] of [[3.5, 1.8, 8.5], [6.8, 2.4, 11.5], [15.5, 2.6, 2.2], [22.5, 1.6, 9.5], [19.5, 2.2, 14]]) {
    const q = k.mk(new THREE.BoxGeometry(0.5, 0.5, 0.5), qMat, { x, y, z, parent: G, ol: 0.02 });
    const ph = rnd() * 6;
    ctx.animators.push((time) => {
      q.position.y = y + Math.sin(time * 1.4 + ph) * 0.15;
      q.rotation.y = time * 0.6 + ph;
    });
  }

  // Desert road scrap: lane paint (per tile, so glitching tiles take their paint with them).
  for (let c = 15; c <= 21; c++) {
    const g = new THREE.Group();
    G.add(g);
    box(0.45, 0.012, 0.06, PAL.harvest, { x: c, y: LV + 0.006, z: 7.46, parent: g, cast: false });
    follow(ctx, ctx.tileAt(c, 7), g);
  }

  // "Here be" annotations: a compass rose and an infinite blueprint grid below everything.
  const deep = gridTexture(k, false);
  deep.wrapS = deep.wrapT = THREE.RepeatWrapping;
  deep.repeat.set(60, 60);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ map: deep, transparent: true, opacity: 0.35, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(11.5, -5, 8.5);
  G.add(floor);
  const rose = k.canvasTex(256, 256, (c, W) => {
    c.clearRect(0, 0, W, W);
    c.strokeStyle = "rgba(245,236,215,0.8)";
    c.fillStyle = "rgba(245,236,215,0.8)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(W / 2, W / 2, W * 0.42, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 ? W * 0.22 : W * 0.4;
      c.beginPath();
      c.moveTo(W / 2 + Math.cos(a - 0.2) * 14, W / 2 + Math.sin(a - 0.2) * 14);
      c.lineTo(W / 2 + Math.cos(a) * r, W / 2 + Math.sin(a) * r);
      c.lineTo(W / 2 + Math.cos(a + 0.2) * 14, W / 2 + Math.sin(a + 0.2) * 14);
      c.fill();
    }
    c.font = 'bold 26px "Courier New", monospace';
    c.textAlign = "center";
    c.fillText("N?", W / 2, 20);
  });
  const compass = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: rose, transparent: true, depthWrite: false }));
  compass.rotation.x = -Math.PI / 2;
  compass.position.set(4, -4.9, 9);
  G.add(compass);
  ctx.animators.push((time) => (compass.rotation.z = Math.sin(time * 0.2) * 0.3));
  const drift = [];
  for (let i = 0; i < 9; i++) {
    const s = 0.6 + rnd() * 1.4;
    const a = rnd() * Math.PI * 2;
    const w = wire(new THREE.BoxGeometry(s, s * (0.3 + rnd()), s), line, 11.5 + Math.cos(a) * (15 + rnd() * 6), -2 - rnd() * 3, 8.5 + Math.sin(a) * (13 + rnd() * 5));
    G.add(w);
    drift.push([w, 0.1 + rnd() * 0.3]);
  }
  ctx.animators.push((time) => {
    for (const [w, sp] of drift) w.rotation.set(time * sp, time * sp * 0.7, 0);
  });
  const dust = [];
  for (let i = 0; i < 260; i++) dust.push(-12 + rnd() * 48, -6 + rnd() * 10, -10 + rnd() * 38);
  G.add(new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(dust, 3)),
    new THREE.PointsMaterial({ color: PAL.cream, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.7 })
  ));

  // Customer: a blob that has not been fully assigned yet.
  const customer = buildBlob(k, { body: 0x8ec5ff, robe: PAL.ibm, mug: false });
  const shell = wire(new THREE.IcosahedronGeometry(0.36, 1), line, 0, 0.48, 0);
  shell.scale.set(1, 1.3, 1);
  customer.root.add(shell);
  customer.root.add(wire(new THREE.CylinderGeometry(0.31, 0.37, 0.4, 8), line, 0, 0.2, 0));
  ctx.animators.push((time) => (shell.rotation.y = time * 0.7));
  const tbd = signPlane(0.5, 0.2, ["TBD"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.harvest, px: 300 });
  tbd.position.set(0, 0.22, 0.36);
  customer.root.add(tbd);
  const pending = signPlane(1.3, 0.36, ["RECIPIENT: TBD", "ASSIGNED LATER (MAYBE)"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  // Tall placeholder billboard: its sign clears the goal stamp floating over the RCPT tile.
  pending.position.set(20, 3 * LV + 2.7, 0.6);
  pending.rotation.y = Math.PI / 4;
  G.add(pending);
  for (const d of [-0.45, 0.45]) cyl(0.03, 0.03, 2.55, 5, PAL.cream, { base: true, x: 20 + d * 0.707, y: 3 * LV, z: 0.6 - d * 0.707, parent: G });
  customer.root.position.set(20, 3 * LV, 1);
  customer.root.rotation.y = 0.3;
  G.add(customer.root);
  return customer;
}
