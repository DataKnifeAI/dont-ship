// Suburban Porch-3: butterfly-roof ranch, lawn, street with sentient traffic.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, buildCar } from "../props.js";

export default {
  id: "world_porch",
  label: "Suburban Porch-3",
  customer: "R. GLORBO",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: -1.0,
  edge: "solid",
  view: 7.2,
  floaty: { bob: 0.012, tilt: 0.03 },
  sign: { lines: ["PORCH-3", "POP. ∞ · EST. Ω"] },
  native: ["traffic", "sprinkler"],
  anchors: {
    traffic: [
      { axis: "x", at: 12.1, y: 0, from: -0.5, to: 17.5, dir: -1, speed: 3.4, color: PAL.ibm },
      { axis: "x", at: 12.9, y: 0, from: -0.5, to: 17.5, dir: 1, speed: 2.6, color: PAL.burnt },
    ],
    sprinkler: [{ x: 8, y: LV, z: 9, R: 3.1 }],
  },
  grid: [
    "HHHHHHHHHHHHHHHHHH",
    "HgBBBBBBBggGGGgggH",
    "HtBBBBBBBggGGGgTgH",
    "HgBBBBBBBgggddgggH",
    "HgBBBBBBBgggddgggH",
    "HgPPPcPPPgggCCgggH",
    "HgPPPOPPPgggCCgggH",
    "HggFpppFggggddgTgH",
    "HggFgwgFgggTddgggH",
    "HgggMwggggggddgggH",
    "HgtggwggggggddggZH",
    "ssssswssssssssssss",
    "aaaaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaaaa",
    "ssssssssssssss@Sss",
  ],
  legend: {
    H: { h: 1, top: 0x4d7a16, side: 0x7a4e2d, solid: true, prop: "hedge" },
    g: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, jitter: 0.06 },
    t: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, solid: true, prop: "lollipop" },
    T: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, solid: true, prop: "cypress" },
    Z: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, solid: true, prop: "sign" },
    B: { h: 2, top: 0xd8cfb8, side: 0xa5502a, solid: true },
    G: { h: 1, top: 0xd8cfb8, side: 0x7a4e2d, solid: true },
    d: { h: 1, top: 0xcfc5ad, side: 0x7a4e2d, jitter: 0.02 },
    C: { h: 1, top: 0xcfc5ad, side: 0x7a4e2d, solid: true },
    P: { h: 3, top: 0xb8743a, side: 0xa5502a, jitter: 0.05 },
    c: { h: 3, top: 0xb8743a, side: 0xa5502a, solid: true },
    O: { h: 3, top: 0xb8743a, side: 0xa5502a, goal: true },
    p: { h: 2, top: 0xe2d9c2, side: 0xa5502a },
    F: { h: 2, top: 0x5a3b22, side: 0xa5502a, prop: "flowers" },
    w: { h: 1, top: 0xe8c27a, side: 0x7a4e2d, jitter: 0.04 },
    M: { h: 1, top: 0x6f9a1c, side: 0x7a4e2d, solid: true, prop: "mailbox" },
    s: { h: 1, top: 0xe4dac3, side: 0xbfb49b, jitter: 0.02 },
    S: { h: 1, top: 0xe4dac3, side: 0xbfb49b, start: true },
    "@": { h: 1, top: 0xe4dac3, side: 0xbfb49b, solid: true, prop: "portal" },
    a: { h: 0, top: 0x4a4850, side: 0x3a383f, jitter: 0.02, cost: 4 },
  },
  lights: { sky: 0xfff3d6, ground: 0x6b5a3a, hemi: 1.5, sun: 0xfff1d0, sunI: 2.6 },
  decorate,
};

function decorate(ctx) {
  const { k, group: G } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const hy = 2 * LV;

  // House (tiles cols 2-8, rows 1-4): butterfly roof ranch.
  box(7, 1.45, 4, PAL.cream, { base: true, x: 5, y: hy, z: 2.5, parent: G, ol: 0.03 });
  box(2.0, 1.47, 4.04, PAL.harvest, { base: true, x: 7.5, y: hy, z: 2.5, parent: G });
  for (let i = 0; i < 7; i++) box(0.04, 1.4, 0.02, 0xb8891a, { base: true, x: 6.65 + i * 0.28, y: hy, z: 4.53, parent: G, cast: false });
  for (const wx of [3.0, 7.4]) {
    box(1.5, 0.75, 0.06, 0x2c4a6b, { base: true, x: wx, y: hy + 0.42, z: 4.52, parent: G, ol: 0.02 });
    box(0.05, 0.75, 0.08, PAL.cream, { base: true, x: wx, y: hy + 0.42, z: 4.53, parent: G, cast: false });
  }
  box(0.06, 0.7, 1.6, 0x2c4a6b, { base: true, x: 8.52, y: hy + 0.45, z: 2.6, parent: G, ol: 0.02 });
  box(0.7, 1.12, 0.08, PAL.burnt, { base: true, x: 5, y: hy, z: 4.52, parent: G, ol: 0.02 });
  cyl(0.13, 0.13, 0.04, 10, 0x2c4a6b, { x: 5, y: hy + 0.82, z: 4.58, rx: Math.PI / 2, parent: G });
  ico(0.035, 0, PAL.harvest, { x: 5.25, y: hy + 0.5, z: 4.6, parent: G });
  const plaque = signPlane(0.42, 0.26, ["No. 3"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink, px: 300 });
  plaque.position.set(5.65, hy + 0.95, 4.55);
  G.add(plaque);
  const roofY = hy + 1.62;
  box(4.0, 0.12, 4.9, PAL.burnt, { x: 3.15, y: roofY, z: 2.6, rz: -0.16, parent: G, ol: 0.03 });
  box(4.0, 0.12, 4.9, PAL.burnt, { x: 6.85, y: roofY, z: 2.6, rz: 0.16, parent: G, ol: 0.03 });
  box(0.7, 1.1, 0.7, 0xc9bfa8, { base: true, x: 2.4, y: roofY - 0.2, z: 1.6, parent: G, ol: 0.025 });
  box(0.8, 0.08, 0.8, PAL.harvest, { base: true, x: 2.4, y: roofY + 0.9, z: 1.6, parent: G, ol: 0.015 });

  // Porch rails + slim posts.
  const py = 3 * LV;
  for (const rx of [1.55, 8.45]) {
    box(0.06, 0.06, 2.0, PAL.cream, { x: rx, y: py + 0.42, z: 5.5, parent: G, ol: 0.012 });
    for (const rz of [4.6, 5.5, 6.4]) box(0.05, 0.42, 0.05, PAL.cream, { base: true, x: rx, y: py, z: rz, parent: G });
  }
  for (const [a, b] of [[1.55, 3.4], [6.6, 8.45]]) {
    box(b - a, 0.06, 0.06, PAL.cream, { x: (a + b) / 2, y: py + 0.42, z: 6.45, parent: G, ol: 0.012 });
    for (let rx = a; rx <= b + 0.01; rx += (b - a) / 2) box(0.05, 0.42, 0.05, PAL.cream, { base: true, x: rx, y: py, z: 6.45, parent: G });
  }

  // Garage (cols 11-13, rows 1-2).
  box(3, 1.25, 2, PAL.cream, { base: true, x: 12, y: LV, z: 1.5, parent: G, ol: 0.03 });
  box(2.1, 0.95, 0.06, PAL.harvest, { base: true, x: 12, y: LV, z: 2.52, parent: G, ol: 0.02 });
  for (let i = 1; i < 5; i++) box(2.1, 0.025, 0.02, 0xb8891a, { base: true, x: 12, y: LV + i * 0.19, z: 2.56, parent: G, cast: false });
  box(3.3, 0.1, 2.3, PAL.ibm, { x: 12, y: LV + 1.32, z: 1.55, rx: 0.05, parent: G, ol: 0.025 });

  // Parked car on driveway.
  const parked = buildCar(k, 0x3f8f8a, false);
  parked.root.position.set(12.5, LV, 5.5);
  parked.root.rotation.y = -Math.PI / 2;
  G.add(parked.root);

  // Road markings.
  for (let x = 0; x < 18; x += 1) box(0.5, 0.012, 0.07, PAL.harvest, { x: x + 0.25, y: 0.006, z: 12.5, parent: G, cast: false });
  for (let i = 0; i < 5; i++) box(0.75, 0.012, 0.16, PAL.cream, { x: 15, y: 0.006, z: 11.7 + i * 0.4, parent: G, cast: false });

  // Clouds (back corner).
  for (const [cx, cy, cz, s] of [[-3, 3.2, 3, 1], [4, 4.2, -4, 1.3], [14, 3.6, -3.5, 0.9]]) {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    for (let i = 0; i < 4; i++) ico(0.5 * s * (1 - i * 0.12), 0, 0xffffff, { x: i * 0.55 * s, y: (i % 2) * 0.15, z: -i * 0.2, parent: cg, cast: false });
    G.add(cg);
    ctx.animators.push((time) => (cg.position.x = cx + Math.sin(time * 0.2 + cx) * 0.4));
  }

  const customer = buildBlob(k);
  customer.root.position.set(5, 3 * LV, 5);
  customer.root.rotation.y = 0.35;
  G.add(customer.root);
  return customer;
}
