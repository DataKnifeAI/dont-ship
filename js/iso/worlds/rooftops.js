// Storm Rooftops-9: tar roofs at five heights over a street nine floors down; bridges, gaps, acid rain, lightning.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const SLATE = 0x34505a;
const STEEL = 0x7d878c;
const CONCRETE = 0xa9b4b8;

const ROOF = {
  2: { top: 0x5f6d70, side: 0x7a4434 },
  3: { top: 0x687b7e, side: 0x46585f },
  4: { top: 0x5a7178, side: 0x8a5a3a },
  5: { top: 0x71868a, side: SLATE },
  6: { top: 0xc9b58c, side: 0xb8743a },
};
const roof = (h, o = {}) => ({ h, top: ROOF[h].top, side: ROOF[h].side, jitter: 0.05, ...o });
const thing = (h, prop) => ({ h, top: ROOF[h].top, side: ROOF[h].side, solid: true, prop });
const stair = (h) => ({ h, top: 0x8a9499, side: ROOF[h].side, prop: "treads" });

export default {
  id: "world_rooftops",
  label: "Storm Rooftops-9",
  customer: "B. FULGUR, PENTHOUSE 9½",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: -4,
  edge: "void",
  view: 8.2,
  bg: "radial-gradient(ellipse at 50% 30%, #4d6b74 0%, #2c414a 50%, #121b21 100%)",
  floaty: { bob: 0.014, tilt: 0.05 },
  sign: { lines: ["STORM ROOFTOPS-9", "UMBRELLAS NOT REIMBURSED"], opts: { bg: PAL.cream, fg: SLATE, border: PAL.burnt } },
  voidCause: "FELL TO STREET LEVEL (−9 FLOORS)",
  native: ["acid"],
  anchors: {
    acid: [
      [[17, 10], [18, 10], [17, 11], [18, 11]],
      [[11, 9], [12, 9], [11, 10], [12, 10]],
      [[9, 6], [10, 6], [11, 6], [9, 7], [10, 7], [11, 7]],
      [[3, 6], [4, 6], [5, 6], [3, 7], [4, 7], [5, 7]],
      [[3, 3], [4, 3], [3, 4], [4, 4]],
      [[17, 14], [18, 14], [19, 14], [20, 14], [21, 14]],
    ],
    wind: [
      { x: 13.5, y: 4 * LV, z: 9.3, dir: [0, 1], len: 2.6, width: 0.9, back: 0.2 },
      { x: 13.6, y: 5 * LV, z: 8.2, dir: [-1, 0], len: 4.4, width: 0.7, back: 0.2 },
      { x: 10, y: 5 * LV, z: 4.4, dir: [0, 1], len: 2.8, width: 0.95, back: 0.2 },
    ],
  },
  grid: [
    "QQQQQ66 55M55  44bBb4444",
    "QQQQQ66 5555Y  4W44444W4",
    "66C6666 5L555  444444444",
    "66O6666 55555  444444444",
    "6666666 555L5  44444N444",
    "gggttgg 55555  444444444",
    "5555555k55555        i  ",
    "Y555555 55555  333333333",
    "               3A3333A33",
    "33ss333 VVV55  33333333H",
    "3p333p3 VVV55  333333333",
    "3333333 44444jjss3333333",
    "3p333p3 44444      i    ",
    "3333333 444N4  222rrr222",
    "3w33333i44444  2a22222a2",
    "3333333 44l44  222222222",
    "        44444  Z22222222",
    "               2222222@S",
  ],
  legend: {
    " ": { void: true },
    2: roof(2),
    3: roof(3),
    4: roof(4),
    5: roof(5),
    6: roof(6, { checker: 0.05, jitter: 0.02 }),
    r: stair(3),
    s: stair(4),
    t: stair(5),
    i: { h: 3, top: 0x8a6a48, side: 0x5a4630, catwalk: true, deck: true, prop: "planks" },
    j: { h: 4, top: STEEL, side: 0x3a4248, catwalk: true, deck: true },
    k: { h: 5, top: STEEL, side: 0x3a4248, catwalk: true, deck: true },
    a: thing(2, "ac"),
    A: thing(3, "ac"),
    Y: thing(5, "ac"),
    W: thing(4, "watertower"),
    w: thing(3, "watertower"),
    M: thing(5, "mast"),
    N: thing(4, "mast"),
    L: thing(5, "skylight"),
    l: thing(4, "skylight"),
    B: thing(4, "billboard"),
    b: thing(4),
    H: thing(3, "shed"),
    V: thing(5),
    p: thing(3, "pole"),
    g: thing(5, "planter"),
    Z: thing(2, "sign"),
    Q: thing(6),
    C: thing(6),
    O: { ...roof(6, { jitter: 0 }), goal: true },
    S: { ...roof(2, { jitter: 0 }), start: true },
    "@": thing(2, "portal"),
  },
  lights: { sky: 0xbfd8de, ground: 0x2a3238, hemi: 1.3, sun: 0xe2ecf2, sunI: 1.9 },
  props: {
    treads(ctx, t, x, y, z) {
      for (let i = -1; i <= 1; i++)
        ctx.k.box(0.95, 0.02, 0.09, PAL.harvest, { x: x + i * 0.2, y: y + 0.01, z: z - i * 0.2, ry: Math.PI / 4, parent: ctx.group, cast: false });
    },
    planks(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      const alongZ = ctx.tileAt(t.c - 1, t.r).void;
      for (let i = -2; i <= 2; i++) {
        const o = i * 0.19;
        k.box(alongZ ? 0.92 : 0.15, 0.04, alongZ ? 0.15 : 0.92, i % 2 ? 0x9a774f : 0x7f6040, {
          x: x + (alongZ ? 0 : o), y: y + 0.02, z: z + (alongZ ? o : 0), parent: G, cast: false,
        });
      }
    },
    ac(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.72, 0.5, 0.6, 0xc9cfcf, { base: true, x, y, z, parent: G, ol: 0.018 });
      k.box(0.74, 0.04, 0.62, PAL.ibm, { base: true, x, y: y + 0.5, z, parent: G, cast: false });
      k.cyl(0.21, 0.21, 0.03, 10, 0x2a3036, { x, y: y + 0.55, z, parent: G, cast: false });
      const fan = k.box(0.38, 0.02, 0.07, 0x9aa4a9, { x, y: y + 0.575, z, parent: G, cast: false });
      for (let i = 0; i < 3; i++) k.box(0.5, 0.03, 0.02, 0x8a9499, { x, y: y + 0.12 + i * 0.11, z: z + 0.305, parent: G, cast: false });
      const sp = 7 + ctx.rnd() * 5;
      ctx.animators.push((time) => (fan.rotation.y = time * sp));
    },
    watertower(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      for (const [lx, lz] of [[-0.27, -0.27], [0.27, -0.27], [-0.27, 0.27], [0.27, 0.27]])
        k.cyl(0.03, 0.045, 0.72, 5, 0x3a2f28, { base: true, x: x + lx, y, z: z + lz, parent: G });
      k.cyl(0.42, 0.42, 0.85, 10, 0x9a6a45, { base: true, x, y: y + 0.7, z, parent: G, ol: 0.022 });
      for (const by of [0.22, 0.62]) k.cyl(0.432, 0.432, 0.04, 10, 0x3a2f28, { x, y: y + 0.7 + by, z, parent: G, cast: false });
      k.cyl(0, 0.5, 0.42, 10, SLATE, { base: true, x, y: y + 1.55, z, parent: G, ol: 0.02 });
      const lbl = k.signPlane(0.42, 0.2, ["No. 9"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm, px: 260 });
      lbl.position.set(x + 0.31, y + 1.1, z + 0.31);
      lbl.rotation.y = Math.PI / 4;
      G.add(lbl);
    },
    mast(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.035, 0.06, 2.2, 6, 0xcfd3d6, { base: true, x, y, z, parent: G, ol: 0.014 });
      for (const [h, w] of [[0.9, 0.5], [1.4, 0.38], [1.85, 0.26]]) k.box(w, 0.035, 0.035, 0xcfd3d6, { x, y: y + h, z, ry: Math.PI / 4, parent: G, cast: false });
      const light = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), new THREE.MeshBasicMaterial({ color: 0xff5a3c }));
      light.position.set(x, y + 2.26, z);
      G.add(light);
      const ph = ctx.rnd() * 6;
      ctx.animators.push((time) => (light.visible = Math.sin(time * 3 + ph) > 0.1));
    },
    skylight(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.8, 0.14, 0.8, 0xcfd3d6, { base: true, x, y, z, parent: G, ol: 0.015 });
      k.cyl(0, 0.52, 0.42, 4, 0x8fd0d8, { base: true, x, y: y + 0.14, z, ry: Math.PI / 4, parent: G, ol: 0.015 });
    },
    billboard(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      for (const px of [-1.1, 1.1]) k.box(0.08, 1.4, 0.08, 0x3a4248, { base: true, x: x + px, y, z, parent: G, ol: 0.012 });
      k.box(1.6, 0.05, 0.3, 0x3a4248, { x, y: y + 1.32, z: z + 0.12, parent: G, cast: false });
      k.box(3.0, 1.0, 0.1, PAL.ink, { x, y: y + 1.85, z, parent: G, ol: 0.025 });
      let score = 4812;
      const draw = (c, W, H) => {
        c.fillStyle = "#1a1f16";
        c.fillRect(0, 0, W, H);
        c.strokeStyle = "#daa520";
        c.lineWidth = 8;
        c.strokeRect(8, 8, W - 16, H - 16);
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = "#daa520";
        c.font = 'bold 44px "Courier New", monospace';
        c.fillText("LIGHTNING SCOREBOARD", W / 2, H * 0.32, W * 0.9);
        c.fillStyle = "#f5ecd7";
        c.font = 'bold 64px "Courier New", monospace';
        c.fillText(`${score.toLocaleString("en-US")} · YOU: 0`, W / 2, H * 0.68, W * 0.9);
      };
      const tex = k.canvasTex(640, 210, draw);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
      board.position.set(x, y + 1.85, z + 0.056);
      G.add(board);
      for (let i = 0; i < 5; i++) k.ico(0.04, 0, 0xfff1c0, { x: x - 1.2 + i * 0.6, y: y + 1.31, z: z + 0.25, parent: G, cast: false });
      ctx.rooftopScore = () => {
        score++;
        const c = tex.image.getContext("2d");
        if (c) draw(c, tex.image.width, tex.image.height);
        tex.needsUpdate = true;
      };
    },
    shed(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.86, 1.0, 0.86, 0xd8cfb8, { base: true, x, y, z, parent: G, ol: 0.02 });
      k.box(1.0, 0.1, 1.0, SLATE, { base: true, x, y: y + 1.0, z, parent: G, ol: 0.018 });
      k.box(0.42, 0.74, 0.04, PAL.burnt, { base: true, x: x - 0.12, y, z: z + 0.44, parent: G, ol: 0.012 });
      k.ico(0.05, 0, 0xfff1c0, { x: x - 0.12, y: y + 0.88, z: z + 0.47, parent: G, cast: false });
      const s = k.signPlane(0.8, 0.3, ["ROOF ACCESS", "ALARM WILL SOUND (IT WON'T)"], { bg: PAL.cream, fg: PAL.burnt, border: SLATE, px: 280 });
      s.position.set(x + 0.44, y + 0.62, z);
      s.rotation.y = Math.PI / 2;
      G.add(s);
    },
    pole(ctx, t, x, y, z) {
      ctx.k.cyl(0.035, 0.045, 1.25, 6, CONCRETE, { base: true, x, y, z, parent: ctx.group, ol: 0.012 });
      ctx.k.box(0.06, 0.06, 0.4, CONCRETE, { x, y: y + 1.2, z, parent: ctx.group, cast: false });
    },
    planter(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.86, 0.34, 0.86, PAL.burnt, { base: true, x, y, z, parent: G, ol: 0.015 });
      const s = k.ico(0.3, 0, PAL.avocado, { x, y: y + 0.5, z, parent: G, ol: 0.015 });
      s.rotation.y = x * 1.3 + z;
    },
  },
  decorate,
};

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const rows = ctx.tiles.length;
  const cols = ctx.tiles[0].length;
  const STREET = -4;

  voidTrims(ctx, CONCRETE);

  // Penthouse 9½ (cols 0-4, rows 0-1).
  const py = 6 * LV;
  box(5, 1.5, 2, 0xe9dcc0, { base: true, x: 2, y: py, z: 0.5, parent: G, ol: 0.03 });
  box(5.5, 0.14, 2.5, PAL.burnt, { base: true, x: 2, y: py + 1.5, z: 0.55, parent: G, ol: 0.025 });
  const lit = new THREE.MeshBasicMaterial({ color: 0xffd47a });
  for (const wx of [0.4, 3.6]) {
    const win = k.mk(new THREE.BoxGeometry(1.1, 0.6, 0.04), lit, { x: wx, y: py + 0.8, z: 1.51, parent: G, cast: false });
    win.renderOrder = 1;
  }
  k.mk(new THREE.BoxGeometry(0.04, 0.6, 0.9), lit, { x: 4.51, y: py + 0.8, z: 0.6, parent: G, cast: false });
  box(0.7, 1.15, 0.06, PAL.ibm, { base: true, x: 2, y: py, z: 1.52, parent: G, ol: 0.02 });
  ico(0.04, 0, PAL.harvest, { x: 2.24, y: py + 0.55, z: 1.57, parent: G });
  box(1.3, 0.06, 0.5, PAL.harvest, { x: 2, y: py + 1.3, z: 1.75, rx: 0.2, parent: G, ol: 0.012 });
  const plate = signPlane(1.25, 0.3, ["RCPT · PENTHOUSE 9½"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest, px: 260 });
  plate.position.set(2, py + 1.55, 1.81);
  G.add(plate);
  const mat = signPlane(0.6, 0.22, ["WIPE ACID HERE"], { bg: 0x8a6a48, fg: PAL.cream, border: PAL.ink, px: 260 });
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(3, py + 0.012, 2.3);
  G.add(mat);
  cyl(0.02, 0.02, 1.0, 5, 0xcfd3d6, { base: true, x: 0.2, y: py + 1.64, z: 0.2, parent: G });
  ico(0.07, 0, PAL.harvest, { x: 0.2, y: py + 2.68, z: 0.2, parent: G, ol: 0.01 });

  // Glass atrium on the mid-block deck (cols 8-10, rows 9-10).
  const ay = 5 * LV;
  box(2.9, 0.2, 1.9, 0xcfd3d6, { base: true, x: 9, y: ay, z: 9.5, parent: G, ol: 0.02 });
  const glass = k.toon(0x8fd0d8);
  for (const s of [-1, 1]) {
    const pane = box(2.8, 0.05, 1.12, glass, { x: 9, y: ay + 0.58, z: 9.5 + s * 0.45, rx: s * 0.85, parent: G, ol: 0.015 });
    pane.castShadow = false;
  }
  box(2.9, 0.06, 0.06, 0xcfd3d6, { x: 9, y: ay + 0.97, z: 9.5, parent: G });
  for (const fx of [7.6, 9, 10.4]) box(0.05, 0.75, 0.05, 0xcfd3d6, { base: true, x: fx, y: ay + 0.2, z: 10.42, parent: G, cast: false });
  const atrium = signPlane(1.2, 0.26, ["ATRIUM · DO NOT STAND"], { bg: PAL.cream, fg: SLATE, border: PAL.burnt, px: 260 });
  atrium.position.set(9, ay + 0.12, 10.46);
  G.add(atrium);

  // Laundry lines between the poles on the low roof (rows 10 and 12, cols 1-5).
  const clothCols = [PAL.harvest, 0xf5ecd7, PAL.burnt, 0x3f8f8a, PAL.ibm];
  const flaps = [];
  for (const lz of [10, 12]) {
    const ly = 3 * LV + 1.18;
    box(4, 0.012, 0.012, PAL.ink, { x: 3, y: ly, z: lz, parent: G, cast: false });
    for (let i = 0; i < 4; i++) {
      const pin = new THREE.Group();
      pin.position.set(1.7 + i * 0.85, ly, lz);
      G.add(pin);
      const tall = i === 2 ? 0.5 : 0.32;
      box(i === 1 ? 0.14 : 0.32, tall, 0.02, clothCols[(i + lz) % clothCols.length], { y: -tall / 2, parent: pin, ol: 0.008 });
      flaps.push({ pin, ph: rnd() * 6 });
    }
  }
  ctx.animators.push((time) => {
    for (const f of flaps) f.pin.rotation.x = Math.sin(time * 3.4 + f.ph) * 0.35 - 0.25;
  });

  // The street, nine floors down: asphalt, lane dashes in the gaps, tiny cars that do not care.
  box(cols + 0.2, 0.02, rows + 0.2, 0x262b2f, { base: true, x: (cols - 1) / 2, y: STREET, z: (rows - 1) / 2, parent: G, cast: false });
  const dashes = [];
  for (let z = 0; z < rows; z += 1) dashes.push([13.5, z, 0], [7, z, 0]);
  for (let x = 0; x < cols; x += 1) dashes.push([x, 8, 1], [x, 12, 1]);
  const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.01, 0.45), k.toon(PAL.harvest), dashes.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const one = new THREE.Vector3(1, 1, 1);
  const p3 = new THREE.Vector3();
  dashes.forEach(([x, z, rot], i) => {
    q.setFromAxisAngle(up, rot ? Math.PI / 2 : 0);
    dashMesh.setMatrixAt(i, m4.compose(p3.set(x, STREET + 0.025, z), q, one));
  });
  G.add(dashMesh);
  const cars = [];
  for (const [axis, at, dir, color, speed] of [["z", 13.3, 1, PAL.burnt, 2.2], ["z", 13.7, -1, PAL.harvest, 1.7], ["x", 8, 1, 0x3f8f8a, 2.5], ["z", 7, -1, PAL.cream, 1.9], ["x", 12, -1, PAL.ibm, 2.1]]) {
    const car = new THREE.Group();
    car.rotation.y = axis === "x" ? 0 : Math.PI / 2;
    box(0.5, 0.14, 0.24, color, { base: true, parent: car });
    box(0.26, 0.1, 0.2, 0x2c4a6b, { base: true, y: 0.14, parent: car, cast: false });
    G.add(car);
    cars.push({ car, axis, at, dir, speed, off: rnd() * 30 });
  }
  ctx.animators.push((time) => {
    for (const c of cars) {
      const span = (c.axis === "x" ? cols : rows) + 2;
      const u = (((c.off + time * c.speed * c.dir) % span) + span) % span - 1;
      if (c.axis === "x") c.car.position.set(u, STREET + 0.02, c.at);
      else c.car.position.set(c.at, STREET + 0.02, u);
    }
  });

  // Skyline behind the block, with a few lights left on by people who also work late.
  const towers = [];
  for (let i = 0; i < 14; i++) towers.push([-4.5 - rnd() * 5, -1 + i * 1.5, 1.4 + rnd() * 0.8, true]);
  for (let i = 0; i < 18; i++) towers.push([-1 + i * 1.5, -4.5 - rnd() * 5, 1.4 + rnd() * 0.8, false]);
  const towerMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), k.toon(0xffffff), towers.length);
  const winMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd47a }), towers.length * 3);
  const col = new THREE.Color();
  let wi = 0;
  towers.forEach(([x, z, w, left], i) => {
    const h = 4 + rnd() * 7;
    towerMesh.setMatrixAt(i, m4.makeScale(w, h, w).setPosition(x, -6 + h / 2, z));
    towerMesh.setColorAt(i, col.setHex(0x22323a).offsetHSL(0, 0, rnd() * 0.05));
    for (let j = 0; j < 3; j++) {
      if (rnd() < 0.4) continue;
      const along = (rnd() - 0.5) * w * 0.7;
      const wy = -6 + h * (0.45 + rnd() * 0.5);
      winMesh.setMatrixAt(wi++, left ? m4.makeTranslation(x + w / 2, wy, z + along) : m4.makeTranslation(x + along, wy, z + w / 2));
    }
  });
  winMesh.count = wi;
  towerMesh.castShadow = false;
  G.add(towerMesh, winMesh);

  // Storm clouds.
  for (const [cx, cy, cz, s] of [[-4, 5.4, 6, 1.2], [7, 6.2, -5, 1.5], [19, 5.6, -4, 1.1]]) {
    const cg = new THREE.Group();
    cg.position.set(cx, cy, cz);
    for (let i = 0; i < 4; i++) ico(0.6 * s * (1 - i * 0.12), 0, i % 2 ? 0x55636b : 0x6b7880, { x: i * 0.6 * s, y: (i % 2) * 0.2, z: -i * 0.2, parent: cg, cast: false });
    G.add(cg);
    const ph = rnd() * 6;
    ctx.animators.push((time) => (cg.position.x = cx + Math.sin(time * 0.15 + ph) * 0.6));
  }

  // Rain: one LineSegments, streaks recycled in place.
  const N = 360;
  const rainPos = new Float32Array(N * 6);
  const drops = [];
  for (let i = 0; i < N; i++) drops.push({ x: -3 + rnd() * (cols + 6), z: -3 + rnd() * (rows + 6), o: rnd() });
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xa9d0d8, transparent: true, opacity: 0.4, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  G.add(rain);
  const TOP = 7;
  const SPAN = TOP - STREET;

  // Lightning: a whole-sky flash plane far behind the block plus a bolt over the skyline.
  const center = new THREE.Vector3((cols - 1) / 2, 0, (rows - 1) / 2);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0, depthWrite: false });
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), flashMat);
  flash.position.copy(center).addScaledVector(one, -40);
  flash.lookAt(center);
  flash.renderOrder = -1;
  flash.visible = false;
  G.add(flash);
  const boltPts = [];
  for (let i = 0; i <= 6; i++) boltPts.push(new THREE.Vector3((i % 2 ? 0.6 : -0.3) * (1 - i / 7), 9 - i * 1.6, 0));
  const bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(boltPts), new THREE.LineBasicMaterial({ color: 0xfff6c8 }));
  bolt.visible = false;
  G.add(bolt);
  const hash = (n) => {
    const s = Math.sin(n * 12.9898 + 4.1) * 43758.5453;
    return s - Math.floor(s);
  };
  const PERIOD = 6.8;
  let lastStrike = -1;

  ctx.animators.push((time) => {
    for (let i = 0; i < N; i++) {
      const d = drops[i];
      const y = TOP - ((time * 9 + d.o * SPAN) % SPAN);
      const o = i * 6;
      rainPos[o] = d.x;
      rainPos[o + 1] = y;
      rainPos[o + 2] = d.z;
      rainPos[o + 3] = d.x - 0.08;
      rainPos[o + 4] = y + 0.45;
      rainPos[o + 5] = d.z - 0.08;
    }
    rainGeo.attributes.position.needsUpdate = true;

    const n = Math.floor(time / PERIOD);
    const at = 1.2 + hash(n) * (PERIOD - 2);
    const dt = time - n * PERIOD - at;
    const on = (dt > 0 && dt < 0.09) || (dt > 0.18 && dt < 0.32);
    flash.visible = on;
    flashMat.opacity = dt < 0.09 ? 0.55 : 0.32;
    bolt.visible = on;
    rainMat.opacity = on ? 0.8 : 0.4;
    if (dt > 0 && n !== lastStrike) {
      lastStrike = n;
      const side = hash(n + 0.5);
      if (side < 0.5) bolt.position.set(-7, -2, -1 + side * 2 * rows);
      else bolt.position.set(-1 + (side - 0.5) * 2 * cols, -2, -7);
      ctx.rooftopScore?.();
    }
  });

  const customer = buildBlob(k, { body: 0xb48cd8, robe: PAL.harvest });
  customer.root.position.set(2, py, 2);
  customer.root.rotation.y = 0.35;
  G.add(customer.root);
  const brolly = new THREE.Group();
  brolly.position.set(-0.32, 0.5, 0.05);
  brolly.rotation.z = 0.25;
  customer.root.add(brolly);
  cyl(0.012, 0.012, 0.9, 4, PAL.ink, { base: true, parent: brolly });
  cyl(0, 0.5, 0.2, 8, PAL.ibm, { base: true, y: 0.82, parent: brolly, ol: 0.012 });
  return customer;
}
