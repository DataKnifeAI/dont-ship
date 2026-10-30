// Quiet Block Ω: two streets of sentient traffic, a park hill, an A-frame and a flat-roof modern.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, buildCar } from "../props.js";

export default {
  id: "world_neighborhood",
  label: "Quiet Block Ω",
  customer: "OMEGA PRUITT (#4)",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: -1.0,
  edge: "solid",
  view: 7.6,
  bg: "radial-gradient(ellipse at 50% 35%, #fbf1df 0%, #f0dcc0 55%, #d8b98f 100%)",
  floaty: { bob: 0.012, tilt: 0.03 },
  sign: { lines: ["QUIET BLOCK Ω", "TRAFFIC IS LISTENING"] },
  native: ["traffic"],
  anchors: {
    traffic: [
      { axis: "x", at: 7.1, y: 0, from: -0.5, to: 21.5, dir: -1, speed: 3.2 },
      { axis: "x", at: 7.9, y: 0, from: -0.5, to: 21.5, dir: 1, speed: 2.6 },
      { axis: "x", at: 14.1, y: 0, from: -0.5, to: 21.5, dir: -1, speed: 3.5 },
      { axis: "x", at: 14.9, y: 0, from: -0.5, to: 21.5, dir: 1, speed: 2.8 },
    ],
  },
  grid: [
    "HHHHHHHHHHHHHHHHHHHHHH",
    "HtBBBBBgggTgBBBBBBgtgH",
    "HgBBBBBgggggBBBBBBgggH",
    "HgBBBBBgFgggBBBBBBgTgH",
    "HgFpOcFgggggggppgggggH",
    "HgggwgMgggTgggwwgggggH",
    "sssLsssssssyssssLsssss",
    "aaaaaaaxxaaaaaaaaaaaaa",
    "aaaaaaaxxaaaaaaaaaaaaa",
    "ssLsssssssssssLsssssss",
    "gtggkkkkkkkkkkkkgnggtg",
    "ggZgkkkkKfKKkkkkgggggg",
    "gTggkkkkkkkkkkkkggtggT",
    "sssssLssssssssssLsssss",
    "aaaaaaaaaaaaaaaxxaaaaa",
    "aaaaaaaaaaaaaaaxxaaaaa",
    "ssssssssssssbbss@Sssss",
  ],
  legend: {
    H: { h: 1, top: 0x4d7a16, side: 0x7a4e2d, solid: true, prop: "hedge" },
    g: { h: 1, top: 0x7a9e24, side: 0x7a4e2d, jitter: 0.06 },
    t: { h: 1, top: 0x7a9e24, side: 0x7a4e2d, solid: true, prop: "lollipop" },
    T: { h: 1, top: 0x7a9e24, side: 0x7a4e2d, solid: true, prop: "cypress" },
    F: { h: 1, top: 0x5a3b22, side: 0x7a4e2d, prop: "flowers" },
    M: { h: 1, top: 0x7a9e24, side: 0x7a4e2d, solid: true, prop: "mailbox" },
    B: { h: 2, top: 0xd8cfb8, side: 0xa5502a, solid: true },
    p: { h: 2, top: 0xc98b4e, side: 0xa5502a },
    O: { h: 2, top: 0xc98b4e, side: 0xa5502a, goal: true },
    c: { h: 2, top: 0xc98b4e, side: 0xa5502a, solid: true },
    w: { h: 1, top: 0xe8c27a, side: 0x7a4e2d, jitter: 0.04 },
    s: { h: 1, top: 0xe4dac3, side: 0xbfb49b, jitter: 0.02 },
    L: { h: 1, top: 0xe4dac3, side: 0xbfb49b, solid: true, prop: "lamp" },
    y: { h: 1, top: 0xe4dac3, side: 0xbfb49b, solid: true, prop: "hydrant" },
    b: { h: 1, top: 0xe4dac3, side: 0xbfb49b, solid: true },
    S: { h: 1, top: 0xe4dac3, side: 0xbfb49b, start: true },
    "@": { h: 1, top: 0xe4dac3, side: 0xbfb49b, solid: true, prop: "portal" },
    a: { h: 0, top: 0x4a4850, side: 0x3a383f, jitter: 0.02, cost: 4 },
    x: { h: 0, top: 0x4a4850, side: 0x3a383f, cost: 2 },
    k: { h: 2, top: 0x6f9a1c, side: 0x7a4e2d, jitter: 0.05 },
    K: { h: 3, top: 0x86b22c, side: 0x7a4e2d, jitter: 0.04 },
    f: { h: 3, top: 0xd8cfb8, side: 0x7a4e2d, solid: true, prop: "fountain" },
    n: { h: 1, top: 0x7a9e24, side: 0x7a4e2d, solid: true, prop: "bench" },
    Z: { h: 1, top: 0x7a9e24, side: 0x7a4e2d, solid: true, prop: "sign" },
  },
  lights: { sky: 0xfff0d6, ground: 0x5d6a3a, hemi: 1.45, sun: 0xffe9c4, sunI: 2.5 },
  props: {
    lamp(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.04, 0.06, 1.7, 6, PAL.ibm, { base: true, x, y, z, parent: G, ol: 0.012 });
      k.box(0.5, 0.05, 0.05, PAL.ibm, { x: x + 0.22, y: y + 1.7, z, parent: G });
      const globe = k.ico(0.13, 1, 0xfff1c0, { x: x + 0.45, y: y + 1.6, z, parent: G, ol: 0.012 });
      const pupil = k.ico(0.04, 0, PAL.ink, { x: x + 0.45, y: y + 1.58, z: z + 0.11, parent: G, cast: false });
      ctx.animators.push(() => {
        const dz = THREE.MathUtils.clamp(ctx.player.pos.z - z, -1, 1) * 0.04;
        const dx = THREE.MathUtils.clamp(ctx.player.pos.x - x, -1, 1) * 0.04;
        pupil.position.set(x + 0.45 + dx, y + 1.58, z + 0.1 + dz);
        globe.rotation.y += 0.002;
      });
    },
    hydrant(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.13, 0.15, 0.4, 8, PAL.burnt, { base: true, x, y, z, parent: G, ol: 0.015 });
      k.ico(0.14, 1, PAL.burnt, { x, y: y + 0.42, z, parent: G, ol: 0.015 });
      k.cyl(0.06, 0.06, 0.38, 6, PAL.harvest, { x, y: y + 0.26, z, rz: Math.PI / 2, parent: G });
    },
    bench(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.9, 0.06, 0.32, PAL.harvest, { x, y: y + 0.32, z, parent: G, ol: 0.012 });
      k.box(0.9, 0.3, 0.05, PAL.harvest, { x, y: y + 0.5, z: z - 0.15, parent: G, ol: 0.012 });
      for (const sx of [-0.38, 0.38]) k.box(0.05, 0.32, 0.3, PAL.ink, { base: true, x: x + sx, y, z, parent: G });
    },
    fountain(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.48, 0.52, 0.22, 10, PAL.cream, { base: true, x, y, z, parent: G, ol: 0.02 });
      k.cyl(0.42, 0.42, 0.03, 10, 0x6fb7d0, { base: true, x, y: y + 0.2, z, parent: G, cast: false });
      k.cyl(0.08, 0.12, 0.5, 6, PAL.cream, { base: true, x, y: y + 0.2, z, parent: G, ol: 0.012 });
      // Founder statue: a courier holding a parcel aloft, as all founders do.
      k.cyl(0.08, 0.1, 0.32, 6, 0xb8a98a, { base: true, x, y: y + 0.7, z, parent: G, ol: 0.012 });
      k.ico(0.08, 1, 0xb8a98a, { x, y: y + 1.1, z, parent: G, ol: 0.01 });
      k.box(0.18, 0.14, 0.14, 0xb8a98a, { x, y: y + 1.32, z, parent: G, ol: 0.012 });
      const spray = new THREE.MeshBasicMaterial({ color: 0x9ed3ea, transparent: true, opacity: 0.8 });
      const drops = [];
      for (let i = 0; i < 10; i++) {
        const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), spray);
        d.userData.a = (i / 10) * Math.PI * 2;
        G.add(d);
        drops.push(d);
      }
      ctx.animators.push((time) => {
        for (const d of drops) {
          const ph = (time * 0.8 + d.userData.a / 6.28) % 1;
          d.position.set(x + Math.cos(d.userData.a) * ph * 0.38, y + 0.7 + Math.sin(ph * Math.PI) * 0.3 - ph * 0.45, z + Math.sin(d.userData.a) * ph * 0.38);
        }
      });
    },
  },
  decorate,
};

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, signPlane } = k;
  const hy = 2 * LV;

  // Customer's A-frame (cols 2-6, rows 1-3).
  box(5, 0.9, 3, PAL.cream, { base: true, x: 4, y: hy, z: 2, parent: G, ol: 0.03 });
  for (const s of [-1, 1]) {
    const roof = box(3.1, 0.12, 3.3, PAL.ibm, { x: 4 + s * 1.15, y: hy + 1.55, z: 2, rz: s * -0.95, parent: G, ol: 0.03 });
    roof.castShadow = true;
  }
  const gable = new THREE.Shape([new THREE.Vector2(-2.3, 0), new THREE.Vector2(2.3, 0), new THREE.Vector2(0, 2.4)]);
  const gableMesh = k.mk(new THREE.ShapeGeometry(gable), PAL.harvest, { x: 4, y: hy + 0.9, z: 3.49, parent: G });
  gableMesh.material = gableMesh.material.clone();
  gableMesh.material.side = THREE.DoubleSide;
  box(1.6, 1.0, 0.06, 0x2c4a6b, { base: true, x: 4, y: hy + 1.0, z: 3.52, parent: G, ol: 0.015 });
  box(0.7, 0.85, 0.08, PAL.burnt, { base: true, x: 4, y: hy, z: 3.52, parent: G, ol: 0.02 });
  const plaque = signPlane(0.42, 0.26, ["No. 4"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink, px: 300 });
  plaque.position.set(4.6, hy + 0.6, 3.55);
  G.add(plaque);

  // Flat-roof modern with carport (cols 12-17, rows 1-3).
  box(4, 1.1, 3, PAL.cream, { base: true, x: 13.5, y: hy, z: 2, parent: G, ol: 0.03 });
  for (let i = 0; i < 4; i++) box(0.9, 0.9, 0.05, i % 2 ? PAL.harvest : PAL.burnt, { base: true, x: 12 + i, y: hy + 0.1, z: 3.52, parent: G, cast: false });
  box(6.4, 0.12, 3.6, PAL.avocado, { base: true, x: 14.5, y: hy + 1.1, z: 2, parent: G, ol: 0.03 });
  for (const px of [16.6, 17.4]) cyl(0.05, 0.05, 1.1, 6, PAL.ink, { base: true, x: px, y: hy, z: 3.4, parent: G });
  const parked = buildCar(k, PAL.harvest, false);
  parked.root.position.set(17, hy, 2.2);
  parked.root.rotation.y = Math.PI / 2;
  parked.root.scale.setScalar(0.85);
  G.add(parked.root);
  const notice = signPlane(1.1, 0.34, ["HOA NOTICE", "CARS MAY NOT BE SAD"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm });
  notice.position.set(13.5, hy + 1.45, 3.56);
  G.add(notice);

  // Road paint: dashed centre lines and zebra crosswalks.
  for (const zc of [7.5, 14.5]) for (let x = 0; x < 22; x++) box(0.5, 0.012, 0.07, PAL.harvest, { x: x + 0.25, y: 0.006, z: zc, parent: G, cast: false });
  for (const [x0, z0] of [[7.5, 6.6], [15.5, 13.6]])
    for (let i = 0; i < 5; i++) box(1.6, 0.014, 0.16, PAL.cream, { x: x0, y: 0.007, z: z0 + 0.2 + i * 0.4, parent: G, cast: false });

  // Bus stop shelter (cols 12-13, row 16).
  const sy = LV;
  box(1.9, 0.08, 0.9, PAL.burnt, { base: true, x: 12.5, y: sy + 1.3, z: 16, parent: G, ol: 0.02 });
  for (const px of [11.65, 13.35]) box(0.06, 1.3, 0.06, PAL.ink, { base: true, x: px, y: sy, z: 15.7, parent: G });
  box(1.7, 1.0, 0.04, 0xcfe6ee, { base: true, x: 12.5, y: sy + 0.2, z: 16.4, parent: G, ol: 0.012 });
  box(1.4, 0.06, 0.3, PAL.harvest, { base: true, x: 12.5, y: sy + 0.35, z: 16.15, parent: G });
  const stop = signPlane(1.4, 0.4, ["STOP Ω", "NEXT BUS: EVENTUALLY"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  stop.position.set(12.5, sy + 1.6, 15.56);
  G.add(stop);

  // A sentient crosswalk signal on each crossing.
  for (const [x, z, lines] of [[9.4, 6.2, ["WALK?", "NO."]], [17.2, 13.2, ["WALK?", "...FINE."]]]) {
    cyl(0.04, 0.04, 1.2, 6, PAL.ink, { base: true, x, y: LV, z, parent: G });
    box(0.36, 0.42, 0.18, PAL.harvest, { x, y: LV + 1.35, z, parent: G, ol: 0.015 });
    const face = signPlane(0.3, 0.34, lines, { bg: PAL.ink, fg: PAL.harvest, border: PAL.burnt, px: 320 });
    face.position.set(x, LV + 1.35, z + 0.095);
    G.add(face);
  }

  // Clouds.
  for (const [cx, cy, cz, s] of [[-3, 3.6, 4, 1], [6, 4.4, -4, 1.3], [18, 3.8, -3, 0.9]]) {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    for (let i = 0; i < 4; i++) k.ico(0.5 * s * (1 - i * 0.12), 0, 0xffffff, { x: i * 0.55 * s, y: (i % 2) * 0.15, z: -i * 0.2, parent: cg, cast: false });
    G.add(cg);
    const ph = rnd() * 6;
    ctx.animators.push((time) => (cg.position.x = cx + Math.sin(time * 0.2 + ph) * 0.4));
  }

  const customer = buildBlob(k, { body: 0xc77db0, robe: PAL.ibm });
  customer.root.position.set(5, 2 * LV, 4);
  customer.root.rotation.y = -0.3;
  G.add(customer.root);
  return customer;
}
