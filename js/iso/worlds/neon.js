// Neon Alley X-12: wet night alley, opinionated moving walkways, a fire escape over the undercity trench.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const MAGENTA = 0xff3df0;
const CYAN = 0x3df5ff;
const BRICK = 0x2a2440;
const BRICK_SIDE = 0x3b3352;
const TRENCH = { c0: 3, c1: 13, r0: 8, r1: 9 };

export default {
  id: "world_neon",
  label: "Neon Alley X-12",
  customer: "CLERK ∞, CUSTOMER DESK",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: -1.0,
  edge: "solid",
  view: 7.8,
  bg:
    "radial-gradient(circle at 79% 15%, #ff8fe0 0 2.4%, rgba(255,80,210,0.4) 3%, transparent 9%)," +
    "radial-gradient(ellipse at 50% 112%, rgba(255,61,240,0.28) 0%, transparent 55%)," +
    "radial-gradient(ellipse at 50% 0%, #4b2a7a 0%, #22124a 38%, #0b0820 72%, #030208 100%)",
  floaty: { bob: 0.012, tilt: 0.03 },
  sign: { lines: ["THIS WALKWAY", "HAS FEELINGS"], opts: { bg: PAL.ink, fg: MAGENTA, border: CYAN } },
  voidCause: "FELL INTO THE UNDERCITY",
  native: ["wind", "belts"],
  anchors: {
    wind: [
      { x: 21.3, y: 0, z: 8.5, dir: [-1, 0], len: 8.8, width: 1.0, back: 0.2 },
      { x: 21.3, y: 0, z: 11.5, dir: [-1, 0], len: 12.6, width: 1.0, back: 0.2 },
      { x: 16, y: 0, z: 1.3, dir: [0, 1], len: 5.6, width: 1.0, back: 0.2 },
    ],
    blackhole: [{ x: 9.5, y: 0, z: 8.5 }],
    chaser: [[6, 10]],
  },
  grid: [
    "HHHHHHHHHHHHHHHHHHHHHH",
    "HHHaaKKcKKaaaaaaaaRRRR",
    "HH1aaaaOaaaaaavvaaRRRR",
    "HH2aaaaaaaaaaavvaaRRRR",
    "HHfaaaaaVaaDaavvaaRRRR",
    "HHfaaaaaaaaaaavvaDRRRR",
    "HHfaaaaaaaaaaavvaaRRRR",
    "HHfaaaaaaaaaaavvaaRRRR",
    "HHf___________aaaaaaaa",
    "HHf___________aaaaaaaa",
    "HHfaaaaaaaaaaaaaaaRRRR",
    "HHfaaaaaaoaaaaaaaaaaaa",
    "HHfaaaaDaaaaaaaaaaaaaa",
    "HH2<<<<<<<<<<<<<<<RRRR",
    "HH1>>>>>>>>>>>>>>>RRRR",
    "HHaZaDaaaaVaaaaaaaRRRR",
    "HHaaaaaaaaaaaaaaaaRRRR",
    "HHaaaaaaaaaaaaaaDS@RRR",
  ],
  legend: {
    H: { h: 6, top: BRICK, side: BRICK_SIDE, solid: true },
    R: { h: 3, top: 0x352c4a, side: 0x4a3f63, solid: true, jitter: 0.04 },
    a: { h: 0, top: 0x2b2d3a, side: 0x1d1e28, jitter: 0.05 },
    "<": { h: 0, top: 0x4a3a5a, side: 0x1d1e28, belt: [-1, 0], beltSpeed: 1.5 },
    ">": { h: 0, top: 0x4a3a5a, side: 0x1d1e28, belt: [1, 0], beltSpeed: 1.5 },
    v: { h: 0, top: 0x4a3a5a, side: 0x1d1e28, belt: [0, 1], beltSpeed: 1.7 },
    _: { void: true },
    o: { void: true },
    f: { h: 3, top: 0x5a6070, side: 0x2b2f3a, catwalk: true },
    1: { h: 1, top: 0x6a7080, side: 0x2b2f3a },
    2: { h: 2, top: 0x6a7080, side: 0x2b2f3a },
    D: { h: 0, top: 0x2b2d3a, side: 0x1d1e28, solid: true, prop: "dumpster" },
    V: { h: 0, top: 0x3a3d4a, side: 0x1d1e28, prop: "steam" },
    K: { h: 1, top: 0x8a3a2a, side: 0x5a2418, solid: true },
    c: { h: 1, top: 0x8a3a2a, side: 0x5a2418, solid: true },
    O: { h: 0, top: 0x3a3048, side: 0x1d1e28, goal: true },
    Z: { h: 0, top: 0x2b2d3a, side: 0x1d1e28, solid: true, prop: "sign" },
    S: { h: 0, top: 0x3a3048, side: 0x1d1e28, start: true },
    "@": { h: 0, top: 0x2b2d3a, side: 0x1d1e28, solid: true, prop: "portal" },
  },
  lights: { sky: 0x9a8cff, ground: 0x1a1030, hemi: 1.25, sun: 0xff9ae0, sunI: 1.9 },
  props: {
    dumpster(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.rotation.y = (rnd() - 0.5) * 0.3;
      G.add(g);
      const col = rnd() < 0.5 ? 0x2f5a4a : 0x2a4a6a;
      k.box(0.86, 0.6, 0.66, col, { base: true, y: 0.08, parent: g, ol: 0.02 });
      const lid = k.box(0.9, 0.05, 0.7, 0x1e3a30, { x: 0, y: 0.7, z: -0.06, parent: g, ol: 0.012 });
      lid.rotation.x = -0.25 - rnd() * 0.25;
      for (const sx of [-0.33, 0.33]) for (const sz of [-0.24, 0.24]) k.cyl(0.06, 0.06, 0.05, 6, PAL.ink, { x: sx, y: 0.05, z: sz, rz: Math.PI / 2, parent: g, cast: false });
      const s = k.signPlane(0.4, 0.16, ["DO NOT FEED"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink, px: 300 });
      s.position.set(0, 0.42, 0.335);
      g.add(s);
    },
    steam(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      for (let i = -2; i <= 2; i++) k.box(0.7, 0.03, 0.06, 0x5a6070, { x, y: y + 0.015, z: z + i * 0.14, parent: G, cast: false });
      const mat = new THREE.MeshBasicMaterial({ color: 0xd8d0ff, transparent: true, opacity: 0.35, depthWrite: false });
      const puffs = [];
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + i * 0.03, 0), mat);
        m.userData.o = i / 5;
        G.add(m);
        puffs.push(m);
      }
      ctx.animators.push((time) => {
        for (const m of puffs) {
          const ph = (time * 0.35 + m.userData.o) % 1;
          m.position.set(x + Math.sin(ph * 5 + m.userData.o * 9) * 0.15, y + 0.1 + ph * 1.8, z + Math.cos(ph * 4) * 0.1);
          m.scale.setScalar(0.6 + ph * 1.4);
        }
        mat.opacity = 0.32;
      });
    },
  },
  decorate,
};

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, signPlane } = k;
  const hy = 6 * LV;
  const roof = 5.6;
  const neonMat = new Map();
  const neon = (col) => {
    if (!neonMat.has(col)) neonMat.set(col, new THREE.MeshBasicMaterial({ color: col }));
    return neonMat.get(col);
  };
  /** Rectangle of neon tube on a wall facing +x ("x") or +z ("z"). */
  const tubeRect = (cx, cy, cz, w, h, col, face) => {
    const mat = neon(col);
    const t = 0.05;
    for (const [dx, dy, sw, sh] of [[0, h / 2, w, t], [0, -h / 2, w, t], [-w / 2, 0, t, h], [w / 2, 0, t, h]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(face === "x" ? t : sw, sh, face === "x" ? sw : t), mat);
      m.position.set(cx + (face === "x" ? 0 : dx), cy + dy, cz + (face === "x" ? -dx : 0));
      G.add(m);
    }
  };
  const wallSign = (lines, x, y, z, w, h, fg, border, face) => {
    const s = signPlane(w, h, lines, { bg: 0x120a24, fg, border, px: 240 });
    s.position.set(x, y, z);
    if (face === "x") s.rotation.y = Math.PI / 2;
    G.add(s);
    tubeRect(x + (face === "x" ? 0.03 : 0), y, z + (face === "x" ? 0 : 0.03), w + 0.14, h + 0.14, border, face);
    return s;
  };

  voidTrims(ctx, MAGENTA);

  // Upper floors of the two back buildings, with lit windows (one instanced mesh).
  box(2, roof - hy, 18, BRICK, { base: true, x: 0.5, y: hy, z: 8.5, parent: G });
  box(22, roof - hy, 1, BRICK, { base: true, x: 10.5, y: hy, z: 0, parent: G });
  box(2.2, 0.16, 18.2, BRICK_SIDE, { base: true, x: 0.5, y: roof, z: 8.5, parent: G, ol: 0.02 });
  box(22.2, 0.16, 1.2, BRICK_SIDE, { base: true, x: 10.5, y: roof, z: 0, parent: G, ol: 0.02 });
  const wins = [];
  for (let z = 1.2; z < 17.5; z += 1.45) for (const y of [2.4, 3.35, 4.3, 5.1]) wins.push([1.52, y, z, "x"]);
  for (let x = 2.3; x < 21.5; x += 1.45) for (const y of [2.4, 3.35, 4.3, 5.1]) wins.push([x, y, 0.52, "z"]);
  const winMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.55), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), wins.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const one = new THREE.Vector3(1, 1, 1);
  const wc = new THREE.Color();
  const winCols = [0xffd27a, 0x8ff5ff, 0xff9ae8, 0x2a2338, 0x2a2338, 0xffe9b0];
  wins.forEach(([x, y, z, f], i) => {
    winMesh.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), f === "x" ? qx : q, one));
    winMesh.setColorAt(i, wc.setHex(winCols[Math.floor(rnd() * winCols.length)]));
  });
  G.add(winMesh);

  // Neon signage (basic-material tubes read as glow in the dark).
  const noodle = wallSign(["X-12 NOODLE", "OPEN 25 HRS"], 1.53, 3.2, 6.5, 2.8, 0.8, MAGENTA, MAGENTA, "x");
  wallSign(["PAWN · PORTALS", "WE BUY UNIVERSES"], 1.53, 2.7, 13, 2.6, 0.7, CYAN, CYAN, "x");
  wallSign(["HOTEL ∞", "VACANCY: ?"], 11.5, 3.5, 0.54, 2.2, 0.7, PAL.harvest, MAGENTA, "z");
  wallSign(["PLEASE COMPLIMENT", "THE WALKWAY"], 14, 2.7, 0.54, 2.3, 0.6, CYAN, CYAN, "z");
  wallSign(["STAFF ONLY", "PORTAL ROOM"], 16.4, 2.05, 0.54, 1.2, 0.34, PAL.harvest, PAL.harvest, "z");
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 28), neon(CYAN));
  ring.position.set(19.5, 4.4, 0.56);
  G.add(ring);
  const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 3), neon(MAGENTA));
  arrow.position.set(19.5, 4.4, 0.57);
  G.add(arrow);
  const flick = noodle.material;
  ctx.animators.push((time) => {
    const slot = Math.floor(time * 6);
    const off = (slot * 2654435761) % 17 === 0 || ((slot % 41) < 2 && Math.sin(time * 40) > 0);
    flick.color.setScalar(off ? 0.35 : 1);
    arrow.rotation.z = -Math.PI / 2 + Math.sin(time * 2) * 0.1;
  });

  // Rooftop billboard + AC units on the low right block.
  const bb = new THREE.Group();
  bb.position.set(20, 3 * LV, 5.5);
  bb.rotation.y = Math.PI / 4;
  G.add(bb);
  for (const sx of [-0.6, 0.6]) cyl(0.04, 0.04, 1.1, 6, 0x5a6070, { base: true, x: sx, parent: bb });
  const bbs = signPlane(1.8, 0.7, ["WALKWAYS", "FEELINGS INCLUDED"], { bg: 0x120a24, fg: CYAN, border: MAGENTA });
  bbs.position.y = 1.45;
  bb.add(bbs);
  for (const [ax, az] of [[19.5, 14.5], [20.5, 2.5]]) {
    box(0.8, 0.45, 0.7, 0x8a8f99, { base: true, x: ax, y: 3 * LV, z: az, parent: G, ol: 0.015 });
    cyl(0.22, 0.22, 0.04, 10, PAL.ink, { x: ax, y: 3 * LV + 0.47, z: az, parent: G, cast: false });
  }

  // Fire-escape railing on the alley side.
  const rail = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), k.toon(0x8a8f99), 20);
  let ri = 0;
  for (let r = 4; r <= 12; r++) {
    if (r === 8 || r === 9) continue;
    rail.setMatrixAt(ri++, m4.makeScale(0.04, 0.04, 1).setPosition(2.47, 3 * LV + 0.36, r));
    rail.setMatrixAt(ri++, m4.makeScale(0.04, 0.36, 0.04).setPosition(2.47, 3 * LV + 0.18, r - 0.5));
  }
  rail.count = ri;
  G.add(rail);

  // The undercity: a deep glow under the trench and the manhole, plus a warning on the far wall.
  const { c0, c1, r0, r1 } = TRENCH;
  const deep = new THREE.MeshBasicMaterial({ color: 0x14062a });
  k.mk(new THREE.PlaneGeometry(c1 - c0 + 1, r1 - r0 + 1), deep, { x: (c0 + c1) / 2, y: -0.98, z: (r0 + r1) / 2, rx: -Math.PI / 2, parent: G, cast: false, recv: false });
  k.mk(new THREE.PlaneGeometry(1, 1), deep, { x: 9, y: -0.98, z: 11, rx: -Math.PI / 2, parent: G, cast: false, recv: false });
  const glowMat = new THREE.MeshBasicMaterial({ color: MAGENTA, transparent: true, opacity: 0.35, depthWrite: false });
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), glowMat);
    d.position.set(c0 + 1 + i * 2.1, -0.9, 8.5 + (i % 2 ? 0.4 : -0.3));
    G.add(d);
  }
  ctx.animators.push((time) => (glowMat.opacity = 0.25 + Math.sin(time * 1.7) * 0.12));
  const warn = signPlane(2.6, 0.5, ["UNDERCITY ↓", "MIND THE GAP · IT MINDS YOU"], { bg: PAL.harvest, fg: PAL.ink, border: PAL.ink });
  warn.position.set(8, -0.45, 7.51);
  G.add(warn);
  cyl(0.42, 0.42, 0.04, 14, 0x4a4d58, { base: true, x: 8.15, y: 0, z: 11.25, parent: G, ol: 0.012 });
  for (const [cx, cz] of [[9.6, 10.45], [8.4, 11.6]]) {
    cyl(0.03, 0.16, 0.36, 7, PAL.burnt, { base: true, x: cx, y: 0, z: cz, parent: G, ol: 0.01 });
    cyl(0.1, 0.12, 0.06, 7, PAL.cream, { base: true, x: cx, y: 0.16, z: cz, parent: G });
  }

  // Wet asphalt: puddles that reflect the signs.
  const spots = [];
  for (const t of ctx.tiles.flat()) if (t.ch === "a" && rnd() < 0.16) spots.push(t);
  const pud = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.34, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.4, depthWrite: false }),
    Math.max(1, spots.length)
  );
  const qf = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const sc = new THREE.Vector3();
  spots.forEach((t, i) => {
    sc.set(0.7 + rnd() * 0.8, 0.5 + rnd() * 0.6, 1);
    pud.setMatrixAt(i, m4.compose(new THREE.Vector3(t.c + (rnd() - 0.5) * 0.3, 0.008, t.r + (rnd() - 0.5) * 0.3), qf, sc));
    pud.setColorAt(i, wc.setHex([MAGENTA, CYAN, 0x6a5aff][i % 3]));
  });
  pud.count = spots.length;
  G.add(pud);

  // Walkway floor stencils.
  for (const [lines, x, z, rz] of [[["SAY SOMETHING NICE"], 14.5, 4.5, Math.PI / 2], [["IT REMEMBERS"], 10, 13.5, 0], [["IT FORGIVES"], 10, 14.5, 0]]) {
    const s = signPlane(1.5, 0.32, lines, { bg: 0x2a1a3a, fg: CYAN, border: MAGENTA, px: 200 });
    s.position.set(x, 0.012, z);
    s.rotation.set(-Math.PI / 2, 0, rz);
    G.add(s);
  }

  // Noodle-bar kiosk = customer desk (row 1, cols 5-9).
  const ky = LV;
  const kx = 7;
  box(5, 0.36, 0.16, 0x5a2418, { base: true, x: kx, y: ky, z: 1.44, parent: G, ol: 0.015 });
  box(5.2, 0.05, 0.32, PAL.cream, { base: true, x: kx, y: ky + 0.36, z: 1.4, parent: G, ol: 0.012 });
  for (const px of [kx - 2.45, kx + 2.45]) box(0.1, 1.9, 0.1, 0x5a2418, { base: true, x: px, y: ky, z: 1.4, parent: G });
  const awn = box(5.4, 0.08, 1.2, MAGENTA, { x: kx, y: ky + 2.0, z: 1.2, rx: 0.28, parent: G, ol: 0.02 });
  awn.material = awn.material.clone();
  const desk = signPlane(3.8, 0.58, ["CUSTOMER DESK", "TAKE A NUMBER · NOW SERVING: ∞"], { bg: 0x120a24, fg: CYAN, border: MAGENTA });
  desk.position.set(kx, ky + 2.42, 1.08);
  G.add(desk);
  tubeRect(kx, ky + 2.42, 1.11, 3.95, 0.72, CYAN, "z");
  const lanterns = [];
  for (let i = 0; i < 4; i++) {
    const l = k.ico(0.14, 0, i % 2 ? PAL.burnt : 0xff5a5a, { x: kx - 1.8 + i * 1.2, y: ky + 1.68, z: 1.78, parent: G, ol: 0.01 });
    l.scale.y = 1.3;
    lanterns.push(l);
  }
  cyl(0.03, 0.03, 0.6, 5, PAL.ink, { base: true, x: kx + 2.15, y: ky + 0.4, z: 1.42, parent: G });
  box(0.22, 0.18, 0.12, 0xd43d3d, { x: kx + 2.15, y: ky + 1.08, z: 1.42, parent: G, ol: 0.01 });
  const ticket = signPlane(0.16, 0.1, ["#∞"], { bg: PAL.cream, fg: PAL.ink, border: PAL.cream, px: 400 });
  ticket.position.set(kx + 2.15, ky + 0.98, 1.49);
  G.add(ticket);
  for (const sx of [-1.8, -0.9, 0.9, 1.8]) {
    cyl(0.03, 0.03, 0.34, 5, 0x8a8f99, { base: true, x: kx + sx, y: 0, z: 2.0, parent: G, cast: false });
    cyl(0.13, 0.13, 0.05, 8, 0xd43d3d, { base: true, x: kx + sx, y: 0.34, z: 2.0, parent: G, ol: 0.01 });
  }
  const bowl = k.mk(new THREE.SphereGeometry(0.12, 10, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), PAL.cream, { x: kx - 0.7, y: ky + 0.53, z: 1.38, parent: G, ol: 0.01 });
  bowl.material = bowl.material.clone();
  bowl.material.side = THREE.DoubleSide;
  ctx.animators.push((time) => {
    lanterns.forEach((l, i) => (l.rotation.z = Math.sin(time * 1.3 + i) * 0.15));
    awn.material.color.setHex(Math.sin(time * 0.8) > 0.92 ? CYAN : MAGENTA);
  });

  const customer = buildBlob(k, { body: 0x4fd8e8, robe: 0xb02a8a });
  customer.root.position.set(kx, ky, 1);
  G.add(customer.root);
  return customer;
}
