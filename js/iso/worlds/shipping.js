// Shipping Floor (Alt): a warehouse under the wrong sky — two belt lines, a sorting abyss, a mezzanine, chute wind.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const TEAL = 0x2f8f86;
const STEEL = 0x56616a;
const ABYSS = { c0: 18, c1: 20, r0: 6, r1: 9 };

export default {
  id: "world_shipping",
  label: "Shipping Floor (Alt)",
  customer: "SUPERVISOR VLONK, DOCK 9",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: -1.0,
  edge: "solid",
  view: 7.8,
  bg:
    "radial-gradient(circle at 20% 17%, #fff6cf 0 3%, rgba(255,186,92,0.55) 3.5%, transparent 9%)," +
    "radial-gradient(circle at 31% 9%, #eafff9 0 1.7%, rgba(120,232,214,0.5) 2.1%, transparent 6%)," +
    "radial-gradient(circle at 81% 14%, #d9c9f2 0 2.4%, transparent 2.6%)," +
    "radial-gradient(7.5% 1.5% at 81% 14.4%, transparent 0 55%, rgba(255,226,190,0.75) 58% 76%, transparent 80%)," +
    "linear-gradient(180deg, #17635f 0%, #2f9a8f 36%, #e9a15a 74%, #f6cf92 100%)",
  floaty: { bob: 0.012, tilt: 0.03 },
  sign: { lines: ["SORTING ABYSS", "BELT 2 ENDS HERE · BY DESIGN"], opts: { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink } },
  voidCause: "SORTED INTO THE ABYSS",
  native: ["belts", "wind"],
  anchors: {
    wind: [
      { x: 0, y: 2 * LV, z: 7.5, dir: [1, 0], len: 4.6, width: 1.0, back: 0.2 },
      { x: 3.5, y: 0, z: 9.7, dir: [0, 1], len: 4.4, width: 1.1 },
      { x: 23.3, y: 0, z: 7.5, dir: [-1, 0], len: 3.0, width: 1.2, back: 0.2 },
    ],
    blackhole: [{ x: 19, y: 0, z: 7.5 }],
    chaser: [[11, 4]],
  },
  grid: [
    "WWWWWWWWWWWWWWWWWWWWWWWW",
    "WBBcBBBkkkkkkmmmmmmmmPmm",
    "WDDODDDD.vv..mmmmmmmmmmm",
    "WDDDDDDD.vv..mmmmmmmmmmm",
    "WDDDDDDD.vv...22........",
    "W11......vv...11.....##.",
    "W,,.............A.___...",
    "W,,>>>>>>>>>>>>>>>___...",
    "W,,>>>>>>>>>>>>>>>___...",
    "W,,....##.....F...___...",
    "W,,.....#........Z......",
    "W>>>>>>>>>>>>>,,>>>>>>>>",
    "W>>>>>>>>>>>>>,,>>>>>>>>",
    "W..#.......#...........T",
    "W..##...........#.......",
    "W.........#..........S@.",
  ],
  legend: {
    W: { h: 2, top: 0x7d8a8c, side: STEEL, solid: true },
    ".": { h: 0, top: 0xc8c0aa, side: 0x8a7f68, jitter: 0.04 },
    ",": { h: 0, top: 0xe2c36a, side: 0x8a7f68, jitter: 0.03 },
    ">": { h: 1, top: 0x3a3f4a, side: TEAL, belt: [1, 0], beltSpeed: 1.6 },
    v: { h: 1, top: 0x3a3f4a, side: TEAL, belt: [0, 1], beltSpeed: 1.5 },
    _: { void: true },
    "#": { h: 0, top: 0xc8c0aa, side: 0x8a7f68, solid: true, prop: "crate" },
    D: { h: 2, top: 0xb9b2a0, side: 0x6b6458, checker: 0.04 },
    O: { h: 2, top: 0xb9b2a0, side: 0x6b6458, goal: true },
    B: { h: 2, top: 0x8a9496, side: STEEL, solid: true },
    c: { h: 2, top: 0x8a9496, side: STEEL, solid: true },
    k: { h: 3, top: 0x7f8b92, side: 0x3d4a52 },
    m: { h: 3, top: 0x9fb5ad, side: TEAL, checker: 0.05 },
    1: { h: 1, top: 0xd8b65a, side: 0x6b6458 },
    2: { h: 2, top: 0xd8b65a, side: 0x6b6458 },
    A: { h: 0, top: 0xc8c0aa, side: 0x8a7f68, solid: true, prop: "robotArm" },
    F: { h: 0, top: 0xc8c0aa, side: 0x8a7f68, solid: true, prop: "forklift" },
    P: { h: 3, top: 0x9fb5ad, side: TEAL, solid: true, prop: "tube" },
    T: { h: 0, top: 0xc8c0aa, side: 0x8a7f68, solid: true, prop: "punch" },
    Z: { h: 0, top: 0xc8c0aa, side: 0x8a7f68, solid: true, prop: "sign" },
    S: { h: 0, top: 0xe2c36a, side: 0x8a7f68, start: true },
    "@": { h: 0, top: 0xc8c0aa, side: 0x8a7f68, solid: true, prop: "portal" },
  },
  lights: { sky: 0xdff7f0, ground: 0x6a4a2a, hemi: 1.35, sun: 0xffd2a0, sunI: 2.45 },
  props: {
    robotArm(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.4, 0.46, 0.22, 10, 0x2f3a40, { base: true, x, y, z, parent: G, ol: 0.02 });
      const yaw = new THREE.Group();
      yaw.position.set(x, y + 0.22, z);
      G.add(yaw);
      k.cyl(0.26, 0.3, 0.22, 8, PAL.burnt, { base: true, parent: yaw, ol: 0.02 });
      const shoulder = new THREE.Group();
      shoulder.position.y = 0.34;
      yaw.add(shoulder);
      k.box(0.18, 1.2, 0.18, PAL.harvest, { y: 0.6, parent: shoulder, ol: 0.018 });
      const elbow = new THREE.Group();
      elbow.position.y = 1.2;
      shoulder.add(elbow);
      k.ico(0.13, 0, PAL.ink, { parent: elbow });
      k.box(0.14, 0.85, 0.14, PAL.harvest, { y: 0.42, parent: elbow, ol: 0.018 });
      const hand = new THREE.Group();
      hand.position.y = 0.85;
      elbow.add(hand);
      k.box(0.3, 0.08, 0.12, PAL.ink, { parent: hand });
      for (const sx of [-0.12, 0.12]) k.box(0.04, 0.2, 0.1, 0xcfd3d6, { x: sx, y: 0.1, parent: hand });
      const held = k.box(0.2, 0.16, 0.16, 0xb07a45, { y: 0.14, parent: hand, ol: 0.012 });
      const lens = k.ico(0.07, 0, 0x8ff5e4, { y: 0.2, z: 0.25, parent: yaw, cast: false });
      const sign = k.signPlane(0.9, 0.26, ["SORT-O-TRON", "OPINIONS: 3"], { bg: PAL.ink, fg: PAL.harvest, border: TEAL, px: 260 });
      sign.position.set(0, 0.11, 0.31);
      yaw.add(sign);
      ctx.animators.push((time) => {
        const s = Math.sin(time * 0.9);
        yaw.rotation.y = s * 0.85;
        shoulder.rotation.x = 0.35 + Math.sin(time * 1.8) * 0.1;
        elbow.rotation.x = Math.PI / 2 - shoulder.rotation.x;
        held.visible = s > -0.2;
        lens.scale.setScalar(1 + Math.max(0, Math.sin(time * 6)) * 0.4);
      });
    },
    forklift(ctx, t, x, y, z) {
      const { k } = ctx;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = 0.55;
      ctx.group.add(g);
      k.box(0.62, 0.34, 0.8, PAL.harvest, { y: 0.32, parent: g, ol: 0.02 });
      k.box(0.6, 0.3, 0.22, PAL.ink, { y: 0.36, z: -0.42, parent: g, ol: 0.015 });
      for (const sx of [-0.27, 0.27]) for (const sz of [-0.26, 0.26]) k.cyl(0.13, 0.13, 0.1, 8, 0x2a2a2a, { x: sx * 1.12, y: 0.13, z: sz, rz: Math.PI / 2, parent: g });
      for (const sx of [-0.26, 0.26]) for (const sz of [-0.3, 0.12]) k.box(0.04, 0.62, 0.04, PAL.ink, { base: true, x: sx, y: 0.49, z: sz, parent: g });
      k.box(0.62, 0.05, 0.56, PAL.burnt, { base: true, x: 0, y: 1.11, z: -0.09, parent: g, ol: 0.015 });
      k.box(0.3, 0.1, 0.26, 0x3f3a35, { base: true, y: 0.49, z: -0.12, parent: g });
      for (const sx of [-0.2, 0.2]) k.box(0.05, 1.25, 0.05, 0x3a3f4a, { base: true, x: sx, y: 0.15, z: 0.45, parent: g });
      const lift = new THREE.Group();
      g.add(lift);
      for (const sx of [-0.14, 0.14]) k.box(0.07, 0.03, 0.5, 0xcfd3d6, { base: true, x: sx, y: 0.5, z: 0.72, parent: lift });
      k.box(0.34, 0.26, 0.32, 0xb07a45, { base: true, y: 0.53, z: 0.72, parent: lift, ol: 0.012 });
      const s = k.signPlane(0.6, 0.2, ["AUTONOMOUS", "(ANXIOUS)"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ink, px: 280 });
      s.position.set(0, 1.3, -0.09);
      s.rotation.y = 0.2;
      g.add(s);
      ctx.animators.push((time) => {
        g.position.y = y + Math.abs(Math.sin(time * 7)) * 0.012;
        lift.position.y = Math.max(0, Math.sin(time * 0.6)) * 0.3;
      });
    },
    tube(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const H = 3.0;
      k.cyl(0.26, 0.3, 0.3, 10, PAL.ibm, { base: true, x, y, z, parent: G, ol: 0.02 });
      const glass = new THREE.MeshBasicMaterial({ color: 0x9fe8de, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
      k.mk(new THREE.CylinderGeometry(0.17, 0.17, H, 12, 1, true), glass, { x, y: y + 0.3 + H / 2, z, parent: G, cast: false, recv: false });
      const bend = k.mk(new THREE.TorusGeometry(0.4, 0.17, 8, 10, Math.PI / 2), glass, { x, y: y + 0.3 + H, z: z - 0.4, parent: G, cast: false, recv: false });
      bend.rotation.y = Math.PI / 2;
      k.mk(new THREE.CylinderGeometry(0.17, 0.17, 0.9, 12, 1, true), glass, { x, y: y + 0.7 + H, z: z - 0.85, rx: Math.PI / 2, parent: G, cast: false, recv: false });
      for (const h of [0.3, 1.5, 2.7]) k.cyl(0.2, 0.2, 0.06, 10, PAL.harvest, { base: true, x, y: y + h, z, parent: G });
      const pod = new THREE.Group();
      G.add(pod);
      k.cyl(0.12, 0.12, 0.3, 8, PAL.burnt, { parent: pod, ol: 0.012 });
      k.cyl(0.13, 0.13, 0.05, 8, PAL.cream, { y: 0.15, parent: pod });
      const s = k.signPlane(1.1, 0.34, ["TO ELSEWHERE", "RETURN SERVICE: NO"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
      s.position.set(x - 0.05, y + 1.1, z + 0.32);
      G.add(s);
      ctx.animators.push((time) => {
        const ph = (time * 0.45) % 1;
        pod.visible = ph < 0.8;
        pod.position.set(x, y + 0.5 + (ph / 0.8) * (H - 0.2), z);
        pod.rotation.y = time * 3;
      });
    },
    punch(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.1, 1.05, 0.1, PAL.ink, { base: true, x, y, z: z - 0.2, parent: G });
      k.box(0.52, 0.6, 0.34, PAL.cream, { base: true, x, y: y + 0.95, z: z - 0.15, parent: G, ol: 0.02 });
      const face = k.cyl(0.17, 0.17, 0.03, 12, 0xffffff, { x, y: y + 1.35, z: z + 0.03, rx: Math.PI / 2, parent: G, ol: 0.01 });
      const hand = k.box(0.02, 0.13, 0.015, PAL.ink, { x, y: y + 1.35, z: z + 0.05, parent: G, cast: false });
      k.box(0.3, 0.04, 0.1, PAL.ink, { x, y: y + 1.08, z: z + 0.04, parent: G, cast: false });
      for (let i = 0; i < 5; i++) k.box(0.07, 0.2, 0.01, i % 2 ? PAL.harvest : PAL.cream, { x: x - 0.4, y: y + 0.85 + (i % 2) * 0.04, z: z - 0.16 + i * 0.075, parent: G, ol: 0.006 });
      k.box(0.04, 0.4, 0.4, 0x6b4325, { x: x - 0.36, y: y + 0.95, z: z - 0.01, parent: G });
      const s = k.signPlane(0.9, 0.3, ["PUNCH IN", "TIME IS A SUGGESTION"], { bg: PAL.burnt, fg: PAL.cream, border: PAL.ink, px: 260 });
      s.position.set(x, y + 1.72, z - 0.1);
      G.add(s);
      ctx.animators.push((time) => {
        hand.position.set(x + Math.sin(time * 2.7) * 0.06, y + 1.35 + Math.cos(time * 2.7) * 0.06, z + 0.05);
        hand.rotation.z = -time * 2.7;
        face.rotation.y = Math.sin(time * 9) * 0.03;
      });
    },
  },
  decorate,
};

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const wy = 2 * LV;
  const top = 4.2;

  voidTrims(ctx, PAL.harvest);

  // Window walls on the two back edges (mullions instanced), glass you can see the wrong sky through.
  const posts = [];
  for (let i = 0; i <= 12; i++) posts.push([-0.5 + i * 2, -0.3]);
  for (let i = 1; i <= 8; i++) posts.push([-0.3, -0.5 + i * 2]);
  const postMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, top - wy, 0.14), k.toon(TEAL), posts.length);
  const m4 = new THREE.Matrix4();
  posts.forEach(([px, pz], i) => postMesh.setMatrixAt(i, m4.makeTranslation(px, wy + (top - wy) / 2, pz)));
  postMesh.castShadow = true;
  G.add(postMesh);
  for (const hy of [2.4, top]) {
    box(24.2, hy === top ? 0.2 : 0.08, 0.16, hy === top ? TEAL : STEEL, { x: 11.5, y: hy, z: -0.3, parent: G, ol: hy === top ? 0.02 : false });
    box(0.16, hy === top ? 0.2 : 0.08, 16, hy === top ? TEAL : STEEL, { x: -0.3, y: hy, z: 7.5, parent: G, ol: hy === top ? 0.02 : false });
  }
  const glass = new THREE.MeshBasicMaterial({ color: 0xbff5ec, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  k.mk(new THREE.PlaneGeometry(24, top - wy), glass, { x: 11.5, y: (top + wy) / 2, z: -0.32, parent: G, cast: false, recv: false });
  k.mk(new THREE.PlaneGeometry(16, top - wy), glass, { x: -0.32, y: (top + wy) / 2, z: 7.5, ry: Math.PI / 2, parent: G, cast: false, recv: false });

  // The wrong sky outside: two suns and a ringed moon.
  const glow = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
  for (const [sx, sy, sz, r, col, halo] of [[4, 4.6, -6, 1.1, 0xffd27a, 0xff9a4a], [10.5, 5.6, -7, 0.6, 0xeafff8, 0x7fe8d8]]) {
    k.mk(new THREE.SphereGeometry(r, 16, 10), new THREE.MeshBasicMaterial({ color: col }), { x: sx, y: sy, z: sz, parent: G, cast: false, recv: false });
    k.mk(new THREE.RingGeometry(r * 1.15, r * 1.7, 28), glow(halo, 0.35), { x: sx, y: sy, z: sz + 0.1, parent: G, cast: false, recv: false });
  }
  const moon = new THREE.Group();
  moon.position.set(-6, 4.2, 5);
  G.add(moon);
  ico(0.9, 1, 0xc8b6e8, { parent: moon, cast: false, recv: false });
  const ring = k.mk(new THREE.RingGeometry(1.2, 1.8, 32), glow(0xffe2be, 0.7), { parent: moon, cast: false, recv: false });
  ring.rotation.set(-1.2, 0.3, 0);
  ctx.animators.push((time) => (ring.rotation.z = time * 0.1));

  // Giant wall clock: TIME: APPROXIMATE.
  box(2.1, 2.3, 0.1, PAL.cream, { x: 13.5, y: 2.85, z: -0.38, parent: G, ol: 0.02 });
  cyl(0.82, 0.82, 0.08, 20, 0xffffff, { x: 13.5, y: 3.1, z: -0.3, rx: Math.PI / 2, parent: G, ol: 0.035 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    box(0.05, i % 3 ? 0.08 : 0.16, 0.02, PAL.ink, { x: 13.5 + Math.sin(a) * 0.68, y: 3.1 + Math.cos(a) * 0.68, z: -0.25, rz: -a, parent: G, cast: false });
  }
  const hands = [0.42, 0.62].map((len, i) => {
    const h = new THREE.Group();
    h.position.set(13.5, 3.1, -0.24);
    G.add(h);
    box(i ? 0.04 : 0.07, len, 0.02, i ? PAL.burnt : PAL.ink, { y: len / 2 - 0.06, parent: h, cast: false });
    return h;
  });
  const clockSign = signPlane(1.9, 0.42, ["TIME: APPROXIMATE", "LUNCH: SOMEWHEN"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  clockSign.position.set(13.5, 2.05, -0.32);
  G.add(clockSign);
  ctx.animators.push((time) => {
    hands[0].rotation.z = -time * 0.9;
    hands[1].rotation.z = time * 1.7 + Math.sin(time * 3) * 0.4;
  });

  // OUTBOUND / RCPT dock window (row 1, cols 1-6): booth walls, header, counter, bell.
  box(2, 1.55, 0.9, STEEL, { base: true, x: 1.5, y: wy, z: 1, parent: G, ol: 0.025 });
  box(3, 1.55, 0.9, STEEL, { base: true, x: 5, y: wy, z: 1, parent: G, ol: 0.025 });
  box(1.04, 0.32, 0.9, TEAL, { base: true, x: 3, y: wy + 1.23, z: 1, parent: G, ol: 0.02 });
  box(1.04, 0.36, 0.22, PAL.harvest, { base: true, x: 3, y: wy, z: 1.42, parent: G, ol: 0.015 });
  cyl(0.06, 0.08, 0.06, 8, PAL.harvest, { base: true, x: 3.32, y: wy + 0.36, z: 1.42, parent: G, ol: 0.01 });
  const rcpt = signPlane(2.8, 0.5, ["OUTBOUND / RCPT", "WINDOW 9 · NOW SERVING: YOU"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm });
  rcpt.position.set(3, wy + 1.85, 1.47);
  G.add(rcpt);
  const hours = signPlane(1.4, 0.4, ["HOURS", "WHENEVER · NEVER"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  hours.position.set(5, wy + 0.95, 1.47);
  G.add(hours);
  for (const bx of [4.5, 6.2]) box(0.3, 0.22, 0.12, PAL.ink, { base: true, x: bx, y: wy - 0.3, z: 4.54, parent: G, cast: false });

  // Mezzanine + catwalk railings (decor, along open edges).
  const rails = [];
  for (let c = 13; c <= 23; c++) if (c !== 14 && c !== 15) rails.push([c, 3.47, "x"]);
  for (let c = 8; c <= 12; c++) rails.push([c, 1.47, "x"]);
  for (const r of [2, 3]) rails.push([12.53, r, "z"]);
  const railMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), k.toon(PAL.harvest), rails.length * 2);
  let ri = 0;
  for (const [rx, rz, ax] of rails) {
    const along = ax === "x";
    railMesh.setMatrixAt(ri++, m4.makeScale(along ? 1 : 0.05, 0.05, along ? 0.05 : 1).setPosition(rx, 3 * LV + 0.38, rz));
    railMesh.setMatrixAt(ri++, m4.makeScale(0.05, 0.38, 0.05).setPosition(along ? rx - 0.5 : rx, 3 * LV + 0.19, along ? rz : rz - 0.5));
  }
  G.add(railMesh);
  const mezz = signPlane(1.6, 0.36, ["MEZZANINE", "HARD HATS: THEORETICAL"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink });
  mezz.position.set(18, 3 * LV + 0.75, 3.5);
  G.add(mezz);

  // Overhead package chutes feeding the portal-wind emitters.
  for (const a of ctx.def.anchors.wind) {
    const bx = a.x - a.dir[0] * 0.15;
    const bz = a.z - a.dir[1] * 0.15;
    const len = top - (a.y + 1.45);
    cyl(0.24, 0.24, len, 8, STEEL, { base: true, x: bx, y: a.y + 1.45, z: bz, parent: G, ol: 0.015 });
    cyl(0.36, 0.24, 0.24, 8, PAL.harvest, { base: true, x: bx, y: a.y + 1.3, z: bz, parent: G, ol: 0.015 });
  }

  // The sorting abyss: dark bottom, and parcels that ride belt 2 straight in.
  const { c0, c1, r0, r1 } = ABYSS;
  k.mk(new THREE.PlaneGeometry(c1 - c0 + 1, r1 - r0 + 1), new THREE.MeshBasicMaterial({ color: 0x07110f }), {
    x: (c0 + c1) / 2, y: -0.98, z: (r0 + r1) / 2, rx: -Math.PI / 2, parent: G, cast: false, recv: false,
  });
  const rev = ctx.plan?.entries.find((e) => e.type === "belts")?.reverse;
  const beltSign = (t) => {
    if (!rev) return 1;
    const c = (((t + rev.phase) % rev.period) + rev.period) % rev.period;
    if (c < rev.warn) return 0;
    return Math.floor((t + rev.phase) / rev.period) % 2 === 1 ? -1 : 1;
  };
  const parcels = [];
  for (let i = 0; i < 4; i++) {
    const p = box(0.32, 0.24, 0.28, i % 2 ? 0xb07a45 : 0xc89a62, { parent: G, ol: 0.012 });
    p.userData = { x: 3 + i * 3.6, y: LV + 0.12, z: 7 + (i % 2) + (rnd() - 0.5) * 0.3, vy: 0 };
    parcels.push(p);
  }
  ctx.animators.push((time, dt) => {
    const v = beltSign(time) * 1.6 * dt;
    for (const p of parcels) {
      const u = p.userData;
      if (u.x > c0 - 0.35) {
        u.vy -= 9 * dt;
        u.y += u.vy * dt;
        u.x += 0.6 * dt;
        p.rotation.z -= dt * 2;
        if (u.y < -1.2) Object.assign(u, { x: 3, y: LV + 0.12, vy: 0 }), (p.rotation.z = 0);
      } else u.x = Math.max(3, u.x + v);
      p.position.set(u.x, u.y, u.z);
    }
  });

  // Floor stencils.
  const cross = signPlane(1.8, 0.5, ["CROSSWALK", "BELTS YIELD (RARELY)"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink });
  cross.position.set(14.5, 0.012, 13.5);
  cross.rotation.x = -Math.PI / 2;
  G.add(cross);
  const aisle = signPlane(1.7, 0.45, ["WALK AISLE", "NO BELTS · NO PROMISES"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink });
  aisle.position.set(1.5, 0.012, 9.2);
  aisle.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  G.add(aisle);

  const customer = buildBlob(k, { body: 0x6fc3b2, robe: PAL.burnt });
  customer.root.position.set(3, wy, 1);
  G.add(customer.root);
  return customer;
}
