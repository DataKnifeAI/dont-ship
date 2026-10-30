// Deep Space Docklet: floating decks and catwalks over the void, black-hole slot, vent wind.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

export default {
  id: "world_space",
  label: "Deep Space Docklet",
  customer: "ZORP-7, ACCTS PAYABLE",
  space: true,
  gravity: -8.5,
  jumpV: 4.4,
  baseY: null,
  edge: "void",
  view: 7.6,
  floaty: { bob: 0.05, tilt: 0.12 },
  sign: { lines: ["LOW-G ZONE", "HOLD PARCEL FIRMLY"], opts: { bg: PAL.cream, fg: PAL.ibm, border: PAL.harvest } },
  native: ["blackhole", "wind"],
  anchors: {
    blackhole: [{ x: 8, y: 0.2, z: 6.5, R: 4.4 }],
    wind: [{ x: 3, y: LV, z: 9, dir: [0, 1], len: 1.4, back: 1.4, width: 1.4, emitter: "none" }],
  },
  voidCause: "FELL INTO THE VOID",
  grid: [
    "                  ",
    " MMMMM     mmmm   ",
    " MLcMM     mAYm   ",
    " MMOMMkkkkkmmmm   ",
    " mmmmm     mmmm   ",
    "   k        k     ",
    "   k        k     ",
    "   k        k     ",
    " mmmmmm    MMMMZ  ",
    " mXmvmmkkkkMMYM   ",
    " mmmmmm    MMMM   ",
    "    k       k     ",
    "    k       k     ",
    "    mmmmkkkmmmm   ",
    "    mXmm   m@Sm   ",
  ],
  legend: {
    " ": { void: true },
    m: { h: 1, top: 0xd8d2bf, side: 0x2d3650, checker: 0.05 },
    M: { h: 2, top: 0x2f6496, side: 0x1b2c48, checker: 0.06 },
    k: { h: 1, top: 0x8a8f99, side: 0x3a3f4a, catwalk: true },
    X: { h: 1, top: 0xd8d2bf, side: 0x2d3650, solid: true, prop: "crate" },
    Y: { h: 2, top: 0x2f6496, side: 0x1b2c48, solid: true, prop: "crate" },
    A: { h: 1, top: 0xd8d2bf, side: 0x2d3650, solid: true, prop: "antenna" },
    L: { h: 2, top: 0x2f6496, side: 0x1b2c48, solid: true, prop: "airlock" },
    c: { h: 2, top: 0x2f6496, side: 0x1b2c48, solid: true },
    O: { h: 2, top: 0x2f6496, side: 0x1b2c48, goal: true },
    S: { h: 1, top: 0xd8d2bf, side: 0x2d3650, start: true },
    v: { h: 1, top: 0x3a3f4a, side: 0x2d3650, prop: "vent" },
    Z: { h: 2, top: 0x2f6496, side: 0x1b2c48, solid: true, prop: "sign" },
    "@": { h: 1, top: 0xd8d2bf, side: 0x2d3650, solid: true, prop: "portal" },
  },
  lights: { sky: 0xb8c8ff, ground: 0x2a1840, hemi: 1.3, sun: 0xffe2b0, sunI: 2.8 },
  decorate,
};

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, ico, signPlane } = k;

  voidTrims(ctx);

  // Stars.
  const starPos = [];
  for (let s = 0; s < 900; s++) starPos.push(-40 + rnd() * 100, -45 + rnd() * 38, -40 + rnd() * 100);
  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3)),
    new THREE.PointsMaterial({ color: 0xf5ecd7, size: 2, sizeAttenuation: false })
  );
  G.add(stars);

  // Ringed planet + moon.
  const planet = new THREE.Group();
  planet.position.set(-6, -9, -9);
  G.add(planet);
  ico(5, 2, PAL.burnt, { parent: planet, cast: false, recv: false });
  ico(5.02, 2, 0xe07a2c, { parent: planet, cast: false, recv: false }).scale.set(1, 0.25, 1);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(6.4, 8.8, 48),
    new THREE.MeshBasicMaterial({ color: PAL.cream, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  ring.rotation.set(-Math.PI / 2 + 0.35, 0.3, 0);
  planet.add(ring);
  ico(1.1, 1, PAL.cream, { x: 5, y: -6, z: -11, parent: G, cast: false, recv: false });

  // Drifting rocks.
  for (let r = 0; r < 9; r++) {
    const rock = ico(0.2 + rnd() * 0.35, 0, 0x6b6f8a, { x: rnd() * 20 - 1, y: -1.5 - rnd() * 2.5, z: rnd() * 16 - 1, parent: G, ol: 0.02 });
    const sp = 0.2 + rnd() * 0.5;
    ctx.animators.push((time) => {
      rock.rotation.set(time * sp, time * sp * 0.7, 0);
    });
  }

  // Billboard on the top-right deck.
  const bb = new THREE.Group();
  bb.position.set(14.3, LV, 1.2);
  bb.rotation.y = Math.PI / 4;
  G.add(bb);
  cyl(0.04, 0.04, 1.6, 6, 0xcfd3d6, { base: true, parent: bb });
  box(1.7, 0.7, 0.06, PAL.harvest, { y: 1.75, parent: bb, ol: 0.02 });
  const odds = ctx.prob != null ? ctx.prob.toFixed(2) : "0.12";
  const bbs = signPlane(1.6, 0.62, ["J.E.V. SAYS", `ODDS ${odds}  :)`], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm });
  bbs.position.set(0, 1.75, 0.035);
  bb.add(bbs);

  const customer = buildBlob(k, { body: 0x8db03a, robe: PAL.cream, helmet: true, mug: false });
  customer.root.position.set(3, 2 * LV, 2);
  customer.root.rotation.y = 0.5;
  G.add(customer.root);
  return customer;
}
