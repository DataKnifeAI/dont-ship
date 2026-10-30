// Sunken Post Route: a seabed diorama with deep trenches, a ruined post office and floaty physics.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const SAND = { top: 0xd9c79a, side: 0xa88f62 };
const STONE = 0xcfd6c8;
const KELP = 0x3f7a3a;
const CORAL = 0xf08a80;
const DEEP = 0x061826;

const sand = (h = 1, o = {}) => ({ h, top: h ? SAND.top : 0xc8b487, side: SAND.side, jitter: 0.05, ...o });
const rock = (h) => ({ h, top: h > 2 ? 0x8a989b : 0x76878d, side: 0x4a5a62, jitter: 0.05 });
const thing = (h, prop, o = {}) => ({ h, top: h > 1 ? 0x76878d : SAND.top, side: h > 1 ? 0x4a5a62 : SAND.side, solid: true, prop, ...o });
const po = (o = {}) => ({ h: 2, top: STONE, side: 0x8c9a94, checker: 0.06, ...o });

export default {
  id: "world_underwater",
  label: "Sunken Post Route",
  customer: "CLERK GILLIAN FATHOM",
  space: false,
  gravity: -14,
  jumpV: 4.8,
  baseY: -1.0,
  edge: "solid",
  view: 7.8,
  bg: "radial-gradient(ellipse at 50% 18%, #3a9fae 0%, #17607a 45%, #082538 100%)",
  floaty: { bob: 0.04, tilt: 0.08 },
  sign: { lines: ["SUNKEN POST ROUTE", "MIND THE TRENCH"], opts: { bg: PAL.cream, fg: PAL.ibm, border: 0x3f8f8a } },
  voidCause: "LOST TO THE TRENCH (POSTAGE DUE)",
  native: ["current"],
  anchors: {
    current: [
      { x: 14.5, y: LV, z: 12, dir: [0, 1], halfAlong: 1.3, halfAcross: 2.4 },
      { x: 10, y: 2 * LV, z: 5.5, dir: [1, 0], halfAlong: 1.3, halfAcross: 2.4 },
      { x: 11, y: LV, z: 9.5, dir: [1, 0], halfAlong: 1.2, halfAcross: 1.9 },
    ],
    fauna: [{ path: [[8, 12], [12, 12]] }, { path: [[2, 3], [2, 4], [8, 4]] }, { path: [[17, 10], [17, 14]] }],
  },
  grid: [
    "kWWWWWWWWWrRRc  acarRRrv",
    "kPfKKDKKfPrrqa  aaaarRra",
    "affffOffffrrra  kavaarac",
    "apfffffffprLra  aaaaaaaa",
    "afffffffffrrra  acakaama",
    "          G     aaaaacaa",
    "          G     rraarrak",
    "kaakaaa rrrrqa  aarrRRra",
    "abbbaka arraaa  aaarrraa",
    "kbTbaaa aaaama  acaaaaak",
    "abbbaaagaaaaac  aaaamaaa",
    "aakaava aaRraa  aaaaaaca",
    "kaaakaa aaaaaaggaaaaaaaZ",
    "aaaaaak amaaca  kaaaaaaa",
    "avakaaa aakaaa  aacaaaaa",
    "kaaaaka aaaaaa  aaaaaaS@",
  ],
  legend: {
    " ": { void: true },
    a: sand(1),
    b: sand(0),
    r: rock(2),
    R: rock(3),
    f: po(),
    O: po({ goal: true, checker: 0 }),
    g: { h: 1, top: 0x9aa6a4, side: 0x5d6b6b, deck: true, prop: "slabs" },
    G: { h: 2, top: 0x9aa6a4, side: 0x5d6b6b, deck: true, prop: "slabs" },
    W: po({ solid: true }),
    K: po({ solid: true }),
    D: po({ solid: true }),
    P: po({ solid: true, prop: "column" }),
    p: po({ solid: true, prop: "column" }),
    L: thing(2, "angler"),
    c: thing(1, "coral"),
    q: thing(2, "coral"),
    k: thing(1, "kelp"),
    m: thing(1, "sunkmail"),
    T: thing(0, "chest", { top: 0xc8b487 }),
    v: thing(1, "vent"),
    Z: thing(1, "sign"),
    S: { ...sand(1, { jitter: 0 }), start: true },
    "@": thing(1, "portal"),
  },
  lights: { sky: 0x9fe3ee, ground: 0x123a4a, hemi: 1.35, sun: 0xc8f4ff, sunI: 2.0 },
  props: {
    slabs(ctx, t, x, y, z) {
      const alongZ = ctx.tileAt(t.c - 1, t.r).void;
      for (let i = -1; i <= 1; i++) {
        const o = i * 0.31;
        ctx.k.box(alongZ ? 0.9 : 0.28, 0.035, alongZ ? 0.28 : 0.9, i ? 0x8e9a98 : 0xa7b2ae, {
          x: x + (alongZ ? 0 : o), y: y + 0.017, z: z + (alongZ ? o : 0), parent: ctx.group, cast: false,
        });
      }
    },
    column(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const broken = t.ch === "p";
      const h = broken ? 0.9 : 2.1;
      k.box(0.6, 0.12, 0.6, STONE, { base: true, x, y, z, parent: G, ol: 0.015 });
      const shaft = k.cyl(0.2, 0.23, h, 8, 0xe2e6da, { base: true, x, y: y + 0.12, z, parent: G, ol: 0.018 });
      if (broken) shaft.rotation.z = 0.08;
      else k.box(0.62, 0.14, 0.62, STONE, { base: true, x, y: y + 0.12 + h, z, parent: G, ol: 0.015 });
      if (broken) k.cyl(0.2, 0.2, 0.5, 8, 0xe2e6da, { x: x + 0.15, y: y + 0.2, z: z + 0.32, rx: Math.PI / 2, rz: 0.4, parent: G, ol: 0.015 });
      k.box(0.05, 0.6, 0.02, KELP, { base: true, x: x + 0.21, y: y + 0.4, z: z + 0.05, rz: 0.15, parent: G, cast: false });
    },
    angler(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.05, 0.07, 1.8, 6, 0x3a4a52, { base: true, x, y, z, parent: G, ol: 0.012 });
      k.box(0.5, 0.05, 0.05, 0x3a4a52, { x: x + 0.22, y: y + 1.8, z, parent: G });
      const fish = new THREE.Group();
      fish.position.set(x + 0.42, y + 1.45, z);
      fish.rotation.y = Math.PI / 4;
      G.add(fish);
      const body = k.ico(0.26, 1, 0x2f4a55, { parent: fish, ol: 0.016 });
      body.scale.set(1.3, 1, 0.9);
      k.cyl(0, 0.16, 0.24, 4, 0x2f4a55, { x: -0.38, rz: Math.PI / 2, parent: fish, ol: 0.012 });
      k.box(0.2, 0.05, 0.3, PAL.ink, { x: 0.28, y: -0.08, parent: fish, cast: false });
      for (const sz of [-0.09, 0, 0.09]) k.cyl(0, 0.02, 0.07, 3, PAL.cream, { x: 0.3, y: -0.03, z: sz, rz: Math.PI, parent: fish, cast: false });
      k.ico(0.05, 0, 0xffffff, { x: 0.18, y: 0.1, z: 0.18, parent: fish, cast: false });
      k.cyl(0.01, 0.01, 0.4, 3, 0x2f4a55, { x: 0.15, y: 0.38, rz: -0.6, parent: fish, cast: false });
      const lureMat = new THREE.MeshBasicMaterial({ color: 0xfff1a0 });
      const lure = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 1), lureMat);
      lure.position.set(0.32, 0.52, 0);
      fish.add(lure);
      const s = k.signPlane(0.9, 0.28, ["LAMP · DO NOT FEED"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt, px: 260 });
      s.position.set(x, y + 0.8, z + 0.09);
      G.add(s);
      ctx.animators.push((time) => {
        lure.scale.setScalar(1 + Math.sin(time * 3) * 0.15);
        fish.rotation.z = Math.sin(time * 0.8) * 0.08;
      });
    },
    coral(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const cols = [CORAL, PAL.burnt, PAL.harvest, 0xb48cd8];
      for (let i = 0; i < 3; i++) {
        const col = cols[Math.floor(rnd() * cols.length)];
        const px = x + (rnd() - 0.5) * 0.5;
        const pz = z + (rnd() - 0.5) * 0.5;
        if (i === 1) k.ico(0.16 + rnd() * 0.08, 0, col, { x: px, y: y + 0.14, z: pz, parent: G, ol: 0.012 });
        else k.cyl(0, 0.1 + rnd() * 0.06, 0.4 + rnd() * 0.4, 5, col, { base: true, x: px, y, z: pz, rz: (rnd() - 0.5) * 0.5, parent: G, ol: 0.012 });
      }
    },
    kelp(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      let parent = G;
      const segs = [];
      const ox = x + (rnd() - 0.5) * 0.3;
      const oz = z + (rnd() - 0.5) * 0.3;
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Group();
        if (i === 0) s.position.set(ox, y, oz);
        else s.position.y = 0.34;
        parent.add(s);
        k.box(0.09 - i * 0.008, 0.36, 0.03, i % 2 ? KELP : 0x4d8f3f, { base: true, parent: s, cast: i < 2 });
        segs.push(s);
        parent = s;
      }
      k.ico(0.07, 0, PAL.harvest, { y: 0.4, parent, cast: false });
      const ph = rnd() * 6;
      ctx.animators.push((time) => {
        for (let i = 0; i < segs.length; i++) {
          segs[i].rotation.z = Math.sin(time * 1.1 + ph + i * 0.7) * 0.14;
          segs[i].rotation.x = Math.cos(time * 0.8 + ph + i * 0.5) * 0.08;
        }
      });
    },
    sunkmail(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.set(0.12, 0.6, -0.18);
      G.add(g);
      k.box(0.42, 0.55, 0.38, PAL.ibm, { base: true, y: 0.02, parent: g, ol: 0.018 });
      k.cyl(0.21, 0.21, 0.38, 10, PAL.ibm, { y: 0.57, rx: Math.PI / 2, parent: g, ol: 0.016 });
      k.box(0.24, 0.04, 0.02, PAL.ink, { y: 0.48, z: 0.2, parent: g, cast: false });
      const lbl = k.signPlane(0.3, 0.12, ["US MAIL"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt, px: 300 });
      lbl.position.set(0, 0.28, 0.2);
      g.add(lbl);
      for (const [bx, by] of [[0.15, 0.1], [-0.12, 0.35], [0.18, 0.6]]) k.ico(0.04, 0, 0xd8d2bf, { x: bx, y: by, z: 0.19, parent: g, cast: false });
    },
    chest(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = 0.5;
      G.add(g);
      k.box(0.7, 0.36, 0.46, 0x7a4e2d, { base: true, parent: g, ol: 0.02 });
      for (const bx of [-0.3, 0.3]) k.box(0.05, 0.37, 0.47, PAL.harvest, { base: true, x: bx, parent: g, cast: false });
      const lid = new THREE.Group();
      lid.position.set(0, 0.36, -0.23);
      g.add(lid);
      k.box(0.7, 0.08, 0.46, 0x7a4e2d, { y: 0.04, z: 0.23, parent: lid, ol: 0.015 });
      for (const [px, pr] of [[-0.15, 0.2], [0.12, -0.3]]) k.box(0.22, 0.16, 0.2, 0xb07a45, { base: true, x: px, y: 0.3, ry: pr, parent: g, ol: 0.01 });
      const s = k.signPlane(0.85, 0.28, ["RETURNS", "UNOPENED · SINCE ∞"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm, px: 260 });
      s.position.set(0, 0.2, 0.24);
      g.add(s);
      ctx.animators.push((time) => (lid.rotation.x = -0.9 - Math.sin(time * 0.7) * 0.12));
    },
    vent(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const r = k.ico(0.3, 0, 0x3a4a52, { x, y: y + 0.08, z, parent: G, ol: 0.015 });
      r.scale.set(1.2, 0.6, 1.1);
      k.cyl(0.1, 0.16, 0.18, 6, 0x2a363c, { base: true, x, y: y + 0.12, z, parent: G, cast: false });
      const mat = ctx.ventBubbleMat || (ctx.ventBubbleMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.7, depthWrite: false }));
      const bubbles = [];
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035 + (i % 3) * 0.02, 0), mat);
        G.add(b);
        bubbles.push({ b, o: i / 6, w: rnd() * 6 });
      }
      ctx.animators.push((time) => {
        for (const { b, o, w } of bubbles) {
          const ph = (time * 0.4 + o) % 1;
          b.position.set(x + Math.sin(time * 2 + w) * 0.06, y + 0.3 + ph * 3.2, z + Math.cos(time * 1.7 + w) * 0.06);
        }
      });
    },
  },
  decorate,
};

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const rows = ctx.tiles.length;
  const cols = ctx.tiles[0].length;
  const py = 2 * LV;

  voidTrims(ctx, 0x8e9a98);

  // Trench floors: dark planes over every void tile so the trenches read deep.
  const voids = ctx.tiles.flat().filter((t) => t.void);
  if (voids.length) {
    const deep = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: DEEP }), voids.length);
    const m4 = new THREE.Matrix4();
    const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    voids.forEach((t, i) => deep.setMatrixAt(i, m4.makeTranslation(t.c, -0.97, t.r).multiply(rot)));
    G.add(deep);
  }

  // Post office ruin: facade along row 0 (cols 1-9), pediment, frieze sign, doorway, collapsed roof corner.
  box(9, 2.2, 1.9, 0xb9c9c0, { base: true, x: 5, y: py, z: -0.5, parent: G, ol: 0.03 });
  box(9.4, 0.22, 2.1, STONE, { base: true, x: 5, y: py + 2.2, z: -0.5, parent: G, ol: 0.025 });
  const ped = new THREE.Shape([new THREE.Vector2(-3.2, 0), new THREE.Vector2(3.2, 0), new THREE.Vector2(0, 1.0)]);
  const pedMesh = k.mk(new THREE.ShapeGeometry(ped), STONE, { x: 5, y: py + 2.42, z: 0.47, parent: G });
  pedMesh.material = pedMesh.material.clone();
  pedMesh.material.side = THREE.DoubleSide;
  const frieze = signPlane(5.2, 0.5, ["US MAIL · EST. BEFORE TIDES"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest, px: 200 });
  frieze.position.set(5, py + 1.85, 0.47);
  G.add(frieze);
  box(1.3, 1.5, 0.05, 0x14303d, { base: true, x: 5, y: py, z: 0.46, parent: G, cast: false });
  k.mk(k.flat(new THREE.CylinderGeometry(0.65, 0.65, 0.05, 12, 1, false, Math.PI / 2, Math.PI)), 0x14303d, { x: 5, y: py + 1.5, z: 0.46, rx: Math.PI / 2, parent: G, cast: false });
  for (const wx of [2.2, 7.8]) box(1.0, 0.8, 0.05, 0x2c5a6b, { base: true, x: wx, y: py + 0.6, z: 0.46, parent: G, ol: 0.012 });
  const slab = box(2.6, 0.2, 1.8, STONE, { x: 8.6, y: py + 2.1, z: -0.3, rz: -0.35, rx: 0.1, parent: G, ol: 0.02 });
  slab.castShadow = true;
  for (const [sx, sy] of [[1.4, 1.6], [3.1, 2.0], [6.6, 1.7], [8.9, 1.2]]) box(0.06, 0.8 + rnd() * 0.5, 0.02, KELP, { x: sx, y: py + sy, z: 0.48, rz: (rnd() - 0.5) * 0.3, parent: G, cast: false });

  // The counter: two halves either side of the clerk's window (cols 3-4, 6-7 on row 1).
  for (const cx of [3.5, 6.5]) {
    box(2, 0.6, 0.7, 0x7a4e2d, { base: true, x: cx, y: py, z: 1, parent: G, ol: 0.02 });
    box(2.1, 0.06, 0.8, PAL.harvest, { base: true, x: cx, y: py + 0.6, z: 1, parent: G, ol: 0.012 });
  }
  for (const gx of [4.5, 5.5]) box(0.06, 1.1, 0.06, PAL.harvest, { base: true, x: gx, y: py + 0.66, z: 1.2, parent: G });
  box(1.1, 0.06, 0.06, PAL.harvest, { x: 5, y: py + 1.76, z: 1.2, parent: G });
  const recv = signPlane(1.3, 0.36, ["RECEIVING", "HOLD BREATH"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt });
  recv.position.set(5, py + 2.0, 1.22);
  G.add(recv);
  const scale = signPlane(0.7, 0.24, ["TAKE A NUMBER: 7"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest, px: 260 });
  scale.position.set(3.2, py + 0.9, 1.36);
  G.add(scale);
  cyl(0.06, 0.08, 0.3, 6, PAL.burnt, { base: true, x: 3.2, y: py + 0.66, z: 1.0, parent: G });

  // Light shafts from the surface.
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xbff2ff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const rays = [];
  for (const [rx, rz, w] of [[3, 6, 1.6], [12, 3, 1.2], [19, 9, 1.8], [8, 13, 1.1]]) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(w, 12), rayMat);
    ray.position.set(rx, 5, rz);
    ray.rotation.set(0, Math.PI / 4, 0.25);
    ray.renderOrder = 2;
    G.add(ray);
    rays.push(ray);
  }
  ctx.animators.push((time) => (rayMat.opacity = 0.07 + Math.sin(time * 0.5) * 0.03));

  // Fish school circling behind the ruins (one InstancedMesh).
  const NFISH = 28;
  const fishGeo = new THREE.ConeGeometry(0.07, 0.28, 4);
  fishGeo.rotateZ(-Math.PI / 2);
  const school = new THREE.InstancedMesh(fishGeo, k.toon(PAL.harvest), NFISH);
  const fishCol = new THREE.Color();
  const fish = [];
  for (let i = 0; i < NFISH; i++) {
    fish.push({ a: rnd() * Math.PI * 2, r: 0.4 + rnd() * 1.2, h: (rnd() - 0.5) * 1.2, s: 0.9 + rnd() * 0.3 });
    school.setColorAt(i, fishCol.setHex([PAL.harvest, PAL.burnt, CORAL, PAL.cream][i % 4]));
  }
  school.frustumCulled = false;
  G.add(school);
  const fm = new THREE.Matrix4();
  const fq = new THREE.Quaternion();
  const fe = new THREE.Euler();
  const fp = new THREE.Vector3();
  const fs = new THREE.Vector3(1, 1, 1);
  ctx.animators.push((time) => {
    const cx = -3 + Math.sin(time * 0.13) * 3;
    const cz = 4 + Math.cos(time * 0.11) * 5;
    for (let i = 0; i < NFISH; i++) {
      const f = fish[i];
      const a = f.a + time * 0.9 * f.s;
      fp.set(cx + Math.cos(a) * (1.6 + f.r), 3.2 + f.h + Math.sin(a * 2) * 0.2, cz + Math.sin(a) * (1.6 + f.r));
      fe.set(0, -a - Math.PI / 2, Math.sin(time * 8 + i) * 0.1);
      school.setMatrixAt(i, fm.compose(fp, fq.setFromEuler(fe), fs));
    }
    school.instanceMatrix.needsUpdate = true;
  });

  // Background bubble columns + marine snow.
  const bubMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.55, depthWrite: false });
  const bub = [];
  for (const [bx, bz] of [[-2.5, 2], [-2, 11], [6, -2.5], [17, -2.2], [25, 4]])
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + (i % 3) * 0.03, 0), bubMat);
      G.add(b);
      bub.push({ b, bx, bz, o: i / 7, w: rnd() * 6 });
    }
  ctx.animators.push((time) => {
    for (const { b, bx, bz, o, w } of bub) {
      const ph = (time * 0.25 + o) % 1;
      b.position.set(bx + Math.sin(time * 1.5 + w) * 0.1, -0.8 + ph * 7, bz + Math.cos(time * 1.3 + w) * 0.1);
    }
  });
  const NS = 220;
  const snowPos = new Float32Array(NS * 3);
  const seeds = [];
  for (let i = 0; i < NS; i++) seeds.push({ x: -3 + rnd() * (cols + 6), z: -3 + rnd() * (rows + 6), o: rnd(), w: rnd() * 6 });
  const snowGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const marine = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xe8fbff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0.6 }));
  marine.frustumCulled = false;
  G.add(marine);
  ctx.animators.push((time) => {
    for (let i = 0; i < NS; i++) {
      const s = seeds[i];
      snowPos[i * 3] = s.x + Math.sin(time * 0.4 + s.w) * 0.4;
      snowPos[i * 3 + 1] = 6 - ((time * 0.25 + s.o * 7) % 7);
      snowPos[i * 3 + 2] = s.z + Math.cos(time * 0.3 + s.w) * 0.4;
    }
    snowGeo.attributes.position.needsUpdate = true;
  });

  // Distant ridge silhouettes beyond the solid edge.
  for (const [rx, rz, s] of [[-5, 3, 2.4], [-5.5, 12, 3], [4, -5, 2.6], [15, -5.5, 3.2], [24, -4.5, 2.2]]) {
    const ridge = ico(s, 0, 0x1d4a5c, { x: rx, y: -0.6, z: rz, parent: G, cast: false });
    ridge.scale.set(1, 0.7, 1);
  }

  const customer = buildBlob(k, { body: CORAL, robe: PAL.ibm, helmet: true, mug: false });
  customer.root.position.set(5, py, 1);
  G.add(customer.root);
  k.mk(k.flat(new THREE.TorusGeometry(0.17, 0.03, 4, 12)), PAL.harvest, { y: 0.62, z: 0.42, parent: customer.root, ol: 0.008 });
  const hoseBubbles = [];
  for (let i = 0; i < 3; i++) hoseBubbles.push(ico(0.04, 0, 0xdff4ff, { parent: G, cast: false }));
  ctx.animators.push((time) => {
    hoseBubbles.forEach((b, i) => {
      const ph = (time * 0.5 + i / 3) % 1;
      b.position.set(5 + 0.1 + Math.sin(time * 3 + i) * 0.05, py + 1.1 + ph * 1.6, 1 + 0.05);
    });
  });
  return customer;
}
