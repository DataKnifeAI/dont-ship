// Desert Highway ∞: two-lane causeways and sandstone mesas floating over an infinite canyon, a diner at the end.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, buildCar, voidTrims } from "../props.js";

const TURQ = 0x2a9d8f;
const TURQ_LT = 0x5fc8b8;
const CACTUS = 0x5f8f3a;
const ASPHALT = 0x4a4448;
const CONCRETE = 0x9a8a7a;
const UP = new THREE.Vector3(0, 1, 0);

export default {
  id: "world_desert",
  label: "Desert Highway ∞",
  customer: "MARGE, MILE ∞ FULL SERVICE",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: null,
  edge: "void",
  view: 7.9,
  bg: "linear-gradient(180deg, #ffe7a8 0%, #ffc56a 28%, #f08a4b 60%, #b8482f 84%, #6e2a22 100%)",
  floaty: { bob: 0.016, tilt: 0.04 },
  sign: { lines: ["DESERT HIGHWAY ∞", "NEXT EXIT: ALSO THIS ONE"], opts: { bg: PAL.cream, fg: PAL.burnt, border: TURQ } },
  voidCause: "LOST ON THE INFINITE HIGHWAY (MILE ∞ OF ∞)",
  native: ["shimmer"],
  anchors: {
    shimmer: [
      [6, 12], [8, 13], [9, 12],
      [12, 12], [14, 11], [15, 9],
      [14, 6],
      [15, 3], [17, 3], [16, 2],
    ],
  },
  grid: [
    "       bbbb zccccDDDDDcz ",
    "      bYbbbbcccccDDDDDcc ",
    "       bbbbbcccccPcQcPcc ",
    "        bbbbMeeccccOccccZ",
    "             AA          ",
    "              A          ",
    "              A          ",
    "             AA          ",
    "          bbbbbbbb       ",
    "          bbbbbbbbb      ",
    "          bbbbbbbbYb     ",
    " yssk     bbbbbbbbbb     ",
    "sssssaaaaabbbbbBBBBb     ",
    "sssssaaaaabbbbbBBzBb     ",
    "sssss  a  bbbbbBBBBb     ",
    "@Ssss  X  bbbbbbbbb      ",
    "sssy       bbbbbbb       ",
  ],
  legend: {
    " ": { void: true },
    s: { h: 1, top: 0xe8c07a, side: 0xc0703a, jitter: 0.05 },
    b: { h: 2, top: 0xdcae6a, side: 0xb8643a, jitter: 0.04 },
    B: { h: 3, top: 0xe2b878, side: 0xa8552f, jitter: 0.04 },
    c: { h: 3, top: 0xe6bb76, side: 0xb05a34, jitter: 0.04 },
    a: { h: 1, top: ASPHALT, side: CONCRETE, jitter: 0.02, cost: 1.5 },
    A: { h: 2, top: ASPHALT, side: CONCRETE, jitter: 0.02, cost: 1.5 },
    e: { h: 3, top: 0xd8a868, side: 0xb05a34, prop: "steps" },
    D: { h: 3, top: 0xd8cfb8, side: 0xb05a34, solid: true },
    Q: { h: 3, top: 0xd8cfb8, side: 0xb05a34, solid: true, prop: "counter" },
    P: { h: 3, top: 0xd8cfb8, side: 0xb05a34, solid: true, prop: "pump" },
    O: { h: 3, top: 0xf0d9a8, side: 0xb05a34, goal: true },
    y: { h: 1, top: 0xe8c07a, side: 0xc0703a, solid: true, prop: "saguaro" },
    Y: { h: 2, top: 0xdcae6a, side: 0xb8643a, solid: true, prop: "saguaro" },
    z: { h: 3, top: 0xe6bb76, side: 0xb05a34, solid: true, prop: "saguaro" },
    k: { h: 1, top: 0xe8c07a, side: 0xc0703a, solid: true, prop: "hitchhiker" },
    X: { h: 1, top: ASPHALT, side: CONCRETE, solid: true, prop: "wreck" },
    M: { h: 3, top: 0xe6bb76, side: 0xb05a34, solid: true, prop: "mobius" },
    Z: { h: 3, top: 0xe6bb76, side: 0xb05a34, solid: true, prop: "sign" },
    S: { h: 1, top: 0xeccb8a, side: 0xc0703a, start: true },
    "@": { h: 1, top: 0xeccb8a, side: 0xc0703a, solid: true, prop: "portal" },
  },
  lights: { sky: 0xffe6b8, ground: 0x8a4a2a, hemi: 1.5, sun: 0xfff0c8, sunI: 2.8 },
  props: {
    saguaro(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const h = 0.95 + rnd() * 0.45;
      k.cyl(0.13, 0.15, h, 8, CACTUS, { base: true, x, y, z, parent: G, ol: 0.018 });
      k.ico(0.13, 1, CACTUS, { x, y: y + h, z, parent: G, ol: 0.015 }).scale.set(1, 0.7, 1);
      for (const s of [-1, 1]) {
        const ay = y + 0.35 + rnd() * 0.3;
        const len = 0.28 + rnd() * 0.25;
        k.cyl(0.07, 0.07, 0.26, 6, CACTUS, { x: x + s * 0.2, y: ay, z, rz: Math.PI / 2, parent: G, ol: 0.012 });
        k.cyl(0.07, 0.075, len, 6, CACTUS, { base: true, x: x + s * 0.32, y: ay - 0.03, z, parent: G, ol: 0.012 });
        k.ico(0.07, 0, CACTUS, { x: x + s * 0.32, y: ay + len - 0.03, z, parent: G });
      }
      k.ico(0.045, 0, 0xe86a8a, { x: x + 0.04, y: y + h + 0.1, z: z + 0.04, parent: G });
    },
    steps(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      G.add(g);
      for (const dz of [0.15, 0.4]) k.box(0.94, 0.02, 0.05, 0xb05a34, { x, y: y + 0.01, z: z + dz, parent: g, cast: false });
      follow(ctx, t, g);
    },
    pump(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.8, 0.1, 0.8, PAL.cream, { base: true, x, y, z, parent: G, ol: 0.012 });
      k.box(0.36, 0.78, 0.3, PAL.burnt, { base: true, x, y: y + 0.1, z, parent: G, ol: 0.018 });
      k.box(0.4, 0.14, 0.34, TURQ, { base: true, x, y: y + 0.88, z, parent: G, ol: 0.015 });
      const face = k.signPlane(0.28, 0.2, ["$∞.99", "/GAL"], { bg: PAL.ink, fg: PAL.harvest, border: TURQ_LT, px: 320 });
      face.position.set(x, y + 0.68, z + 0.155);
      G.add(face);
      strut(k, G, new THREE.Vector3(x + 0.18, y + 0.55, z + 0.05), new THREE.Vector3(x + 0.32, y + 0.2, z + 0.25), 0.02, PAL.ink);
      k.box(0.06, 0.16, 0.06, PAL.ink, { x: x + 0.33, y: y + 0.28, z: z + 0.26, parent: G });
    },
    counter(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.95, 0.08, 0.95, PAL.cream, { base: true, x, y, z, parent: G, ol: 0.012 });
      k.box(0.3, 0.55, 0.25, TURQ, { base: true, x: x - 0.32, y: y + 0.08, z: z - 0.3, parent: G, ol: 0.015 });
      k.box(0.24, 0.12, 0.2, PAL.cream, { base: true, x: x - 0.32, y: y + 0.63, z: z - 0.3, parent: G, ol: 0.01 });
      k.box(0.08, 0.06, 0.02, PAL.harvest, { x: x - 0.32, y: y + 0.69, z: z - 0.19, parent: G, cast: false });
    },
    hitchhiker(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const bone = PAL.cream;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = 0.9;
      G.add(g);
      k.box(0.5, 0.3, 0.22, PAL.burnt, { base: true, parent: g, ol: 0.015 });
      k.box(0.14, 0.04, 0.04, PAL.ink, { y: 0.32, parent: g, cast: false });
      const sb = (a, b, r = 0.022) => strut(k, g, new THREE.Vector3(...a), new THREE.Vector3(...b), r, bone);
      sb([0, 0.32, -0.02], [0, 0.72, -0.04], 0.025);
      for (let i = 0; i < 3; i++) k.box(0.2 - i * 0.03, 0.022, 0.09, bone, { y: 0.5 + i * 0.07, z: 0.0, parent: g, cast: false });
      k.box(0.18, 0.05, 0.08, bone, { y: 0.32, parent: g, cast: false });
      for (const s of [-1, 1]) {
        sb([s * 0.07, 0.32, 0], [s * 0.08, 0.32, 0.28]);
        sb([s * 0.08, 0.32, 0.28], [s * 0.08, 0.02, 0.3]);
      }
      const skull = k.ico(0.1, 1, bone, { y: 0.85, parent: g, ol: 0.012 });
      skull.scale.set(1, 1.1, 1.05);
      for (const s of [-0.035, 0.035]) k.box(0.03, 0.03, 0.02, PAL.ink, { x: s, y: 0.87, z: 0.095, parent: g, cast: false });
      k.box(0.07, 0.03, 0.05, bone, { y: 0.77, z: 0.04, parent: g, cast: false });
      k.cyl(0.18, 0.18, 0.02, 10, 0xa07a48, { y: 0.94, parent: g, ol: 0.008 });
      k.cyl(0.09, 0.1, 0.1, 8, 0xa07a48, { base: true, y: 0.94, parent: g });
      // Thumb out, toward the road it has been watching since mile 1.
      sb([0.1, 0.7, 0], [0.32, 0.66, 0.12]);
      k.box(0.02, 0.07, 0.02, bone, { x: 0.33, y: 0.71, z: 0.12, parent: g, cast: false });
      sb([-0.1, 0.7, 0], [-0.16, 0.6, 0.22]);
      const card = new THREE.Group();
      card.position.set(-0.18, 0.72, 0.26);
      card.rotation.set(-0.15, 0, 0.06);
      g.add(card);
      k.box(0.56, 0.32, 0.02, 0xc8a26a, { parent: card, ol: 0.01 });
      const msg = k.signPlane(0.52, 0.28, ["NOT A", "RECIPIENT"], { bg: 0xc8a26a, fg: PAL.ink, border: PAL.burnt, px: 300 });
      msg.position.z = 0.012;
      card.add(msg);
    },
    wreck(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const car = buildCar(k, 0x6fb8a8, false);
      car.root.position.set(x, y + 0.08, z + 0.15);
      car.root.rotation.set(0.06, -Math.PI / 2 + 0.25, -0.24);
      G.add(car.root);
      const tag = k.signPlane(0.5, 0.24, ["AS-IS", "(IS NOT)"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ink, px: 300 });
      tag.position.set(0.05, 0.75, 0.42);
      car.root.add(tag);
      for (const dx of [-0.2, 0.15]) k.box(0.1, 0.012, 0.8, 0x2a2628, { x: x + dx, y: y + 0.006, z: z - 1.0, parent: G, cast: false });
    },
    mobius(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = Math.PI / 4;
      G.add(g);
      k.cyl(0.04, 0.05, 1.5, 6, 0xcfd3d6, { base: true, parent: g, ol: 0.012 });
      const plate = k.signPlane(1.0, 0.34, ["∞ MILES", "TO ANYWHERE"], { bg: 0x2f7a4a, fg: PAL.cream, border: PAL.cream });
      plate.position.set(0, 1.05, 0.05);
      g.add(plate);
      const ribbon = mobiusMesh(k, 0.34, 0.16, 64, PAL.harvest);
      ribbon.position.y = 1.72;
      ribbon.rotation.x = Math.PI / 2;
      g.add(ribbon);
      ctx.animators.push((time) => (ribbon.rotation.z = time * 0.6));
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

/** A Möbius ribbon of radius R and width w (one side, one edge, no exits). */
function mobiusGeometry(R, w, seg) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= seg; i++) {
    const u = (i / seg) * Math.PI * 2;
    for (const v of [-w / 2, w / 2]) {
      const rr = R + v * Math.cos(u / 2);
      pos.push(rr * Math.cos(u), v * Math.sin(u / 2), rr * Math.sin(u));
    }
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return geo;
}

function mobiusMesh(k, R, w, seg, color, o = {}) {
  const mat = k.toon(color).clone();
  mat.side = THREE.DoubleSide;
  if (o.offset) Object.assign(mat, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return k.mk(k.flat(mobiusGeometry(R, w, seg)), mat, { cast: false, recv: false });
}

function decorate(ctx) {
  const { k, group: G, rnd, tileAt } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const y3 = 3 * LV;

  voidTrims(ctx, 0xf0d6a0);

  // Lane paint, per tile so a shimmering tile takes its paint with it.
  const paint = (c, r, y, parts) => {
    const g = new THREE.Group();
    G.add(g);
    for (const [dx, dz, w, d, col] of parts) box(w, 0.012, d, col, { x: c + dx, y: y + 0.006, z: r + dz, parent: g, cast: false });
    follow(ctx, tileAt(c, r), g);
  };
  for (let c = 5; c <= 9; c++) {
    paint(c, 12, LV, [[0, 0.46, 0.45, 0.06, PAL.harvest], [0, -0.4, 0.96, 0.05, PAL.cream]]);
    paint(c, 13, LV, [[0, 0.4, 0.96, 0.05, PAL.cream]]);
  }
  for (let r = 4; r <= 7; r++) {
    paint(14, r, 2 * LV, [[-0.46, 0, 0.06, 0.45, PAL.harvest], [0.4, 0, 0.05, 0.96, PAL.cream]]);
    if (!tileAt(13, r).void) paint(13, r, 2 * LV, [[-0.4, 0, 0.05, 0.96, PAL.cream]]);
  }
  const mile = signPlane(0.36, 0.5, ["MILE", "∞"], { bg: TURQ, fg: PAL.cream, border: PAL.cream, px: 260 });
  cyl(0.025, 0.025, 0.5, 5, 0xcfd3d6, { base: true, x: 12.6, y: 2 * LV, z: 8.45, parent: G });
  mile.position.set(12.6, 2 * LV + 0.72, 8.47);
  G.add(mile);

  // Sandstone strata under each mesa and concrete pylons under the causeways, down into the canyon.
  // Footprints stay inside the mesas so no rock top shows through a void tile as false floor.
  const strata = [
    [2, 13.5, 2.8, 5.8, -0.15],
    [14, 12, 6.8, 8.8, 0.15],
    [9, 1.5, 2.8, 3.8, 0.15],
    [17.5, 1.5, 11.8, 3.8, 0.45],
  ];
  for (const [x, z, w, d, top] of strata) {
    box(w, 12, d, 0xa8552f, { x, y: top - 12, z, base: true, parent: G, cast: false });
    for (const [dy, col] of [[-1.1, 0xc8703f], [-2.6, 0x8a3f26], [-4.4, 0xd88a4a]]) box(w + 0.04, 0.3, d + 0.04, col, { x, y: top + dy, z, parent: G, cast: false });
  }
  for (const x of [6, 8.5]) box(0.35, 10, 1.4, CONCRETE, { x, y: -10.15, z: 12.5, base: true, parent: G, cast: false });
  for (const z of [4.5, 6.6]) box(0.35, 10, 0.35, CONCRETE, { x: 14, y: -9.85, z, base: true, parent: G, cast: false });

  // Roadside diner on the top mesa (cols 17-21, rows 0-1).
  box(4.8, 1.3, 1.9, PAL.cream, { base: true, x: 19, y: y3, z: 0.5, parent: G, ol: 0.03 });
  box(4.86, 0.18, 1.96, TURQ, { base: true, x: 19, y: y3 + 0.52, z: 0.5, parent: G });
  for (let i = 0; i < 4; i++) box(0.78, 0.5, 0.05, 0x2c4a6b, { base: true, x: 17.2 + i * 1.2, y: y3 + 0.72, z: 1.46, parent: G, ol: 0.012 });
  box(0.6, 0.95, 0.06, PAL.burnt, { base: true, x: 19, y: y3, z: 1.47, parent: G, ol: 0.015 });
  box(5.2, 0.12, 2.3, PAL.burnt, { base: true, x: 19, y: y3 + 1.3, z: 0.55, parent: G, ol: 0.025 });
  const awning = box(4.9, 0.06, 0.8, TURQ_LT, { x: 19, y: y3 + 1.5, z: 1.85, rx: 0.22, parent: G, ol: 0.015 });
  awning.castShadow = true;
  for (const ax of [16.7, 21.3]) cyl(0.03, 0.03, 1.48, 5, PAL.cream, { base: true, x: ax, y: y3, z: 2.2, parent: G });
  // Hung toward the screen-right end of the awning so the goal stamp never covers it.
  const rcpt = signPlane(1.3, 0.32, ["RCPT · FULL SERVICE", "NO SERVICE"], { bg: PAL.cream, fg: TURQ, border: PAL.burnt, px: 260 });
  rcpt.position.set(20.85, y3 + 1.26, 2.27);
  G.add(rcpt);
  for (const hx of [20.3, 21.4]) box(0.02, 0.14, 0.02, PAL.ink, { x: hx, y: y3 + 1.47, z: 2.27, parent: G, cast: false });
  const open = signPlane(0.5, 0.2, ["OPEN?"], { bg: PAL.ink, fg: 0xff6f91, border: 0xff6f91, px: 300 });
  open.position.set(20.8, y3 + 0.97, 1.5);
  G.add(open);
  for (const px of [17.6, 20.4]) box(0.08, 0.7, 0.08, PAL.ink, { base: true, x: px, y: y3 + 1.42, z: 0.4, parent: G });
  box(3.7, 0.9, 0.1, PAL.harvest, { base: true, x: 19, y: y3 + 2.0, z: 0.4, parent: G, ol: 0.02 });
  const roofSign = signPlane(3.6, 0.8, ["LAST STOP", "BEFORE THE NEXT LAST STOP", "PIE: THEORETICAL"], { bg: PAL.cream, fg: PAL.burnt, border: TURQ, px: 200 });
  roofSign.position.set(19, y3 + 2.45, 0.46);
  G.add(roofSign);
  // The pie is theoretical, so it is only drawn in outline.
  const pie = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.42, 0.36, 0.2, 10, 1, false, 0, Math.PI * 1.65)), new THREE.LineBasicMaterial({ color: PAL.harvest }));
  pie.position.set(21.1, y3 + 1.55, 1.0);
  G.add(pie);
  ctx.animators.push((time) => (pie.rotation.y = time * 0.5));

  // Tumbleweeds blowing across mesas and the highway (cosmetic: they are not on the clock).
  const weedMat = new THREE.MeshBasicMaterial({ color: 0xa07a48, wireframe: true });
  const tracks = [
    [new THREE.Vector3(9.8, 2 * LV, 9.25), new THREE.Vector3(18.4, 2 * LV, 9.25), 1.5, 0],
    [new THREE.Vector3(23.4, y3, 2.6), new THREE.Vector3(15.4, y3, 2.6), 1.3, 2.5],
    [new THREE.Vector3(0.2, LV, 13.55), new THREE.Vector3(9.4, LV, 13.55), 1.7, 5],
  ];
  for (const [a, b, speed, ph] of tracks) {
    const weed = new THREE.Group();
    G.add(weed);
    k.mk(new THREE.IcosahedronGeometry(0.22, 1), weedMat, { parent: weed, cast: false });
    ico(0.12, 0, 0x7a5a30, { parent: weed, cast: false });
    const len = a.distanceTo(b);
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const pause = 2.5;
    ctx.animators.push((time) => {
      const u = (time * speed + ph * speed) % (len + pause * speed);
      const on = u < len;
      weed.visible = on;
      if (!on) return;
      const hop = Math.abs(Math.sin(u * 3.2)) * 0.18;
      weed.position.copy(a).addScaledVector(dir, u);
      weed.position.y += 0.22 + hop;
      weed.scale.setScalar(Math.max(0.01, Math.min(1, u * 2, (len - u) * 2)));
      weed.rotation.set(dir.z * u * 3, 0, -dir.x * u * 3);
    });
  }

  // Backdrop: a huge sun, heat haze, a Möbius interstate, far mesas, and patient vultures.
  const sunPos = new THREE.Vector3(-8, -9, -16);
  const look = new THREE.Vector3(1, 1, 1);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(5.2, 40), new THREE.MeshBasicMaterial({ color: 0xffd25a }));
  sun.position.copy(sunPos);
  sun.lookAt(sunPos.clone().add(look));
  G.add(sun);
  const halo = new THREE.Mesh(new THREE.RingGeometry(5.4, 7.4, 40), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.35, depthWrite: false }));
  halo.position.copy(sunPos).addScaledVector(look, -0.2);
  halo.lookAt(halo.position.clone().add(look));
  G.add(halo);
  const hazeMat = new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.16, depthWrite: false });
  const haze = [];
  for (let i = 0; i < 5; i++) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(46, 0.5 + i * 0.12), hazeMat);
    h.position.copy(sunPos).addScaledVector(look, 2 + i * 0.4);
    h.lookAt(h.position.clone().add(look));
    G.add(h);
    haze.push([h, h.position.y, i]);
  }
  ctx.animators.push((time) => {
    for (const [h, y0, i] of haze) {
      h.position.y = y0 - 3.5 + i * 1.3 + Math.sin(time * 1.6 + i * 1.3) * 0.18;
      h.scale.x = 1 + Math.sin(time * 2.3 + i) * 0.04;
    }
  });
  const loop = new THREE.Group();
  loop.position.set(-5, -6, -6);
  loop.rotation.set(0.5, 0.4, 0.15);
  G.add(loop);
  loop.add(mobiusMesh(k, 4.2, 1.0, 120, ASPHALT));
  loop.add(mobiusMesh(k, 4.2, 0.06, 120, PAL.harvest, { offset: true }));
  ctx.animators.push((time) => (loop.rotation.y = 0.4 + time * 0.05));
  for (const [x, y, z, w, h] of [[-6, -14, 10, 3, 9], [4, -15, -8, 4, 9.5], [26, -15, -4, 3.5, 9], [-10, -16, 0, 5, 10.5]]) {
    box(w, h, w * 0.8, 0x8a3f26, { base: true, x, y, z, parent: G, cast: false, recv: false });
    box(w + 0.6, 0.3, w * 0.8 + 0.6, 0xc8703f, { base: true, x, y: y + h, z, parent: G, cast: false, recv: false });
  }
  for (let i = 0; i < 2; i++) {
    const bird = new THREE.Group();
    G.add(bird);
    for (const s of [-1, 1]) box(0.45, 0.03, 0.12, PAL.ink, { x: s * 0.2, rz: s * 0.35, parent: bird, cast: false });
    const ph = rnd() * 6;
    const [cx, cz, rad] = i ? [6, 6, 3.5] : [17, 6, 2.8];
    ctx.animators.push((time) => {
      const a = time * 0.35 + ph;
      bird.position.set(cx + Math.cos(a) * rad, 4.2 + i * 0.6 + Math.sin(time * 1.1 + ph) * 0.15, cz + Math.sin(a) * rad);
      bird.rotation.y = -a;
    });
  }

  // Customer: a sun-hatted blob working the full-service (no-service) counter.
  const customer = buildBlob(k, { body: 0xd9825b, robe: TURQ, mug: true });
  cyl(0.36, 0.36, 0.03, 12, 0xe8c27a, { y: 0.86, parent: customer.root, ol: 0.01 });
  cyl(0.17, 0.2, 0.16, 10, 0xe8c27a, { base: true, y: 0.87, parent: customer.root, ol: 0.01 });
  cyl(0.205, 0.205, 0.04, 10, PAL.burnt, { base: true, y: 0.87, parent: customer.root });
  customer.root.position.set(19, y3 + 0.08, 2);
  customer.root.rotation.y = 0.3;
  G.add(customer.root);
  return customer;
}
