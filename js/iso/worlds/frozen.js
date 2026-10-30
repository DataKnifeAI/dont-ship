// Frozen Outpost-7: snow floes, glassy lake ice and a quonset research base over black arctic water.
import * as THREE from "three";
import { LV, PAL } from "../kit.js";
import { buildBlob, voidTrims } from "../props.js";

const ICE_WHITE = 0xf2fbff;
const SNOW = { top: 0xeef3f6, side: 0xb9c9d4 };
const WATER = 0x0f2c3d;
const RED = 0xd8432c;

const snow = (h, o = {}) => ({ h, top: h > 2 ? 0xfafcfd : h > 1 ? 0xf3f6f8 : SNOW.top, side: h > 1 ? 0xc3d1db : SNOW.side, jitter: 0.03, ...o });
const thing = (h, prop, o = {}) => ({ h, top: SNOW.top, side: SNOW.side, solid: true, prop, ...o });

export default {
  id: "world_frozen",
  label: "Frozen Outpost-7",
  customer: "DR. NANOOK-9, RECEIVING",
  space: false,
  gravity: -22,
  jumpV: 5.6,
  baseY: null,
  edge: "void",
  view: 7.8,
  bg: "radial-gradient(ellipse at 50% 22%, #35577a 0%, #1b3452 48%, #0a1424 100%)",
  floaty: { bob: 0.012, tilt: 0.04 },
  sign: { lines: ["OUTPOST-7", "POP. 3 + 1 YETI (CONTRACTOR)"], opts: { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt } },
  voidCause: "SWEPT INTO THE ARCTIC (PARCEL NOW A POPSICLE)",
  native: ["ice"],
  grid: [
    "GGGmmn                  ",
    "GGGmmn   nUUUnmDn  nnPnn",
    "GGGmmm   nUUUnmRn  niinn",
    "mCmmmn   nnFnpnnnqqniinn",
    "mOmmnninipppppnUU  nnPnd",
    "nnnnnd   nnZnpnUU  nnnnn",
    "nnnnnn   dnnnpnUU       ",
    "nFnnnn   nmmnpFnn       ",
    "         nmDnpnnn       ",
    "            qq    nnDDnn",
    "  hnPnn iiiinni   nnmDFn",
    "  nHnnP iiiiiin   nnnmnn",
    "  nnnnniiiiniinininnnnnZ",
    "  dnnnn iinniinininnnnnn",
    "        iiiiiii   dnnnnn",
    "                  nnnnS@",
  ],
  legend: {
    " ": { void: true },
    n: snow(1),
    m: snow(2),
    D: snow(3),
    p: { h: 1, top: 0xd9d2c4, side: SNOW.side, jitter: 0.03, cost: 0.7 },
    i: { h: 1, top: 0x9fd8ef, side: 0x5d9cbc, ice: true, cost: 1.3, jitter: 0.03 },
    q: { h: 1, top: 0x8a6a48, side: 0x5a4630, catwalk: true, prop: "planks" },
    U: thing(1),
    R: thing(3, "mast", { top: 0xfafcfd, side: 0xc3d1db }),
    F: thing(1, "drums"),
    P: thing(1, "penguin"),
    H: thing(1, "fishhole", { top: 0xb5e2f2, side: 0x5d9cbc }),
    h: thing(1, "hrdesk"),
    d: thing(1, "mound"),
    Z: thing(1, "sign"),
    G: thing(2, null, { top: 0xf3f6f8, side: 0xc3d1db }),
    C: thing(2, null, { top: 0xf3f6f8, side: 0xc3d1db }),
    O: { ...snow(2, { jitter: 0 }), goal: true },
    S: { ...snow(1, { jitter: 0 }), start: true },
    "@": thing(1, "portal"),
  },
  lights: { sky: 0xdcecff, ground: 0x3b5266, hemi: 1.45, sun: 0xeef4ff, sunI: 2.3 },
  props: {
    planks(ctx, t, x, y, z) {
      const alongZ = ctx.tileAt(t.c - 1, t.r).void;
      for (let i = -2; i <= 2; i++) {
        const o = i * 0.19;
        ctx.k.box(alongZ ? 0.92 : 0.15, 0.04, alongZ ? 0.15 : 0.92, i % 2 ? 0x9a774f : 0x7f6040, {
          x: x + (alongZ ? 0 : o), y: y + 0.02, z: z + (alongZ ? o : 0), parent: ctx.group, cast: false,
        });
      }
    },
    mast(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.04, 0.08, 2.8, 6, 0xd8dde0, { base: true, x, y, z, parent: G, ol: 0.014 });
      for (const [h, w] of [[0.8, 0.6], [1.5, 0.46], [2.2, 0.32]]) {
        k.box(w, 0.04, 0.04, RED, { x, y: y + h, z, ry: Math.PI / 4, parent: G, cast: false });
        k.box(w, 0.04, 0.04, RED, { x, y: y + h, z, ry: -Math.PI / 4, parent: G, cast: false });
      }
      const dishMat = k.toon(PAL.cream).clone();
      dishMat.side = THREE.DoubleSide;
      const dish = k.mk(k.flat(new THREE.SphereGeometry(0.32, 10, 4, 0, Math.PI * 2, 0, Math.PI / 3)), dishMat, { x: x + 0.12, y: y + 1.9, z: z + 0.12, parent: G, ol: 0.015 });
      dish.rotation.set(-Math.PI / 2 - 0.3, 0, -0.6);
      const wires = [];
      for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) wires.push(x, y + 2.4, z, x + dx, y + 0.02, z + dz);
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute("position", new THREE.Float32BufferAttribute(wires, 3));
      G.add(new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0x55606a })));
      const light = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshBasicMaterial({ color: 0xff4a2c }));
      light.position.set(x, y + 2.88, z);
      G.add(light);
      ctx.animators.push((time) => (light.visible = time % 1.4 < 0.5));
    },
    drums(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.17, 0.17, 0.5, 9, PAL.burnt, { base: true, x: x - 0.17, y, z: z - 0.12, parent: G, ol: 0.014 });
      k.cyl(0.17, 0.17, 0.5, 9, PAL.harvest, { base: true, x: x + 0.2, y, z: z - 0.16, parent: G, ol: 0.014 });
      k.cyl(0.17, 0.17, 0.5, 9, PAL.ibm, { x: x + 0.02, y: y + 0.17, z: z + 0.24, rz: Math.PI / 2, parent: G, ol: 0.014 });
      k.cyl(0.18, 0.18, 0.05, 9, 0xfafcfd, { base: true, x: x - 0.17, y: y + 0.5, z: z - 0.12, parent: G, cast: false });
    },
    penguin(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      const p = new THREE.Group();
      const ry = 0.4 + rnd() * 0.8;
      p.position.set(x, y, z);
      p.rotation.y = ry;
      G.add(p);
      const body = k.ico(0.2, 1, 0x22262c, { y: 0.3, parent: p, ol: 0.015 });
      body.scale.set(1, 1.45, 0.95);
      const belly = k.ico(0.15, 1, 0xf5f7f8, { y: 0.27, z: 0.08, parent: p, cast: false });
      belly.scale.set(1, 1.5, 0.8);
      k.ico(0.13, 1, 0x22262c, { y: 0.62, parent: p, ol: 0.012 });
      for (const sx of [-1, 1]) {
        k.ico(0.03, 0, 0xffffff, { x: sx * 0.055, y: 0.66, z: 0.105, parent: p, cast: false });
        k.box(0.04, 0.2, 0.09, 0x22262c, { x: sx * 0.2, y: 0.32, rz: sx * 0.3, parent: p, cast: false });
        k.box(0.08, 0.03, 0.12, PAL.harvest, { x: sx * 0.08, y: 0.015, z: 0.05, parent: p, cast: false });
      }
      k.cyl(0, 0.04, 0.12, 4, PAL.harvest, { y: 0.6, z: 0.15, rx: Math.PI / 2, parent: p, cast: false });
      k.box(0.05, 0.16, 0.02, PAL.burnt, { y: 0.4, z: 0.205, parent: p, cast: false });
      k.box(0.07, 0.04, 0.03, PAL.burnt, { y: 0.49, z: 0.2, parent: p, cast: false });
      const ph = rnd() * 6;
      ctx.animators.push((time) => {
        p.rotation.z = Math.sin(time * 6 + ph) * 0.12;
        p.rotation.y = ry + Math.sin(time * 0.5 + ph) * 0.6;
        p.position.x = x + Math.sin(time * 0.9 + ph) * 0.14;
      });
    },
    fishhole(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.cyl(0.36, 0.38, 0.05, 12, ICE_WHITE, { base: true, x, y, z, parent: G, cast: false });
      k.cyl(0.29, 0.29, 0.055, 12, 0x0a1f2c, { base: true, x, y, z, parent: G, cast: false });
      k.cyl(0.1, 0.12, 0.22, 6, PAL.burnt, { base: true, x: x + 0.32, y, z: z + 0.3, parent: G, ol: 0.012 });
      k.cyl(0.012, 0.018, 0.9, 4, 0x6b4325, { x: x + 0.12, y: y + 0.45, z: z + 0.12, rx: -0.5, rz: 0.5, parent: G });
      k.cyl(0.004, 0.004, 0.42, 3, PAL.ink, { base: true, x: x - 0.08, y: y + 0.05, z: z - 0.08, parent: G, cast: false });
      const bob = k.ico(0.04, 0, PAL.burnt, { x: x - 0.08, y: y + 0.07, z: z - 0.08, parent: G, cast: false });
      ctx.animators.push((time) => (bob.position.y = y + 0.07 + Math.sin(time * 2.2) * 0.015));
      const s = k.signPlane(0.9, 0.3, ["FISH UNION", "NO BITES TODAY"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt, px: 280 });
      s.position.set(x - 0.2, y + 0.55, z + 0.47);
      G.add(s);
      k.box(0.04, 0.4, 0.04, 0x6b4325, { base: true, x: x - 0.2, y, z: z + 0.45, parent: G, cast: false });
    },
    hrdesk(ctx, t, x, y, z) {
      const { k, group: G } = ctx;
      k.box(0.8, 0.06, 0.45, PAL.harvest, { x, y: y + 0.4, z, parent: G, ol: 0.012 });
      for (const sx of [-0.34, 0.34]) k.box(0.05, 0.4, 0.4, PAL.ink, { base: true, x: x + sx, y, z, parent: G, cast: false });
      k.box(0.22, 0.08, 0.3, PAL.cream, { base: true, x: x + 0.15, y: y + 0.43, z, ry: 0.2, parent: G, cast: false });
      const s = k.signPlane(0.9, 0.34, ["PENGUIN HR", "ALL TIES MANDATORY"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest, px: 280 });
      s.position.set(x, y + 0.85, z + 0.05);
      G.add(s);
    },
    mound(ctx, t, x, y, z) {
      const { k, group: G, rnd } = ctx;
      for (let i = 0; i < 3; i++) {
        const m = k.ico(0.34 - i * 0.07, 1, 0xfafcfd, { x: x + (i - 1) * 0.22, y: y + 0.06, z: z + (rnd() - 0.5) * 0.3, parent: G, ol: i ? false : 0.012 });
        m.scale.set(1.2, 0.55, 1);
      }
    },
  },
  decorate,
};

/** Half-cylinder quonset hut along local x, with ribs, an end door and a placard. */
function quonset(ctx, x, y, z, ry, label) {
  const { k, group: G } = ctx;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  G.add(g);
  const len = 2.9;
  const r = 0.92;
  k.mk(k.flat(new THREE.CylinderGeometry(r, r, len, 12, 1, false, 0, Math.PI)), 0xc7ced2, { rz: Math.PI / 2, parent: g, ol: 0.025 });
  for (let i = 0; i <= 4; i++) k.mk(k.flat(new THREE.TorusGeometry(r + 0.012, 0.025, 4, 12, Math.PI)), 0x8a9499, { x: -len / 2 + 0.08 + i * ((len - 0.16) / 4), ry: Math.PI / 2, parent: g, cast: false });
  k.box(0.05, 0.62, 0.42, PAL.burnt, { base: true, x: len / 2 + 0.01, parent: g, ol: 0.012 });
  k.box(0.05, 0.22, 0.22, 0xffd47a, { x: len / 2 + 0.01, y: 0.72, z: 0.32, parent: g, cast: false });
  const s = k.signPlane(1.0, 0.28, label, { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt, px: 260 });
  s.position.set(len / 2 + 0.05, 0.86, -0.18);
  s.rotation.y = Math.PI / 2;
  g.add(s);
  return g;
}

function decorate(ctx) {
  const { k, group: G, rnd } = ctx;
  const { box, cyl, ico, signPlane } = k;
  const rows = ctx.tiles.length;
  const cols = ctx.tiles[0].length;

  voidTrims(ctx, ICE_WHITE);

  // Arctic water under everything; the floes poke out of it.
  box(cols + 60, 0.04, rows + 60, WATER, { x: (cols - 1) / 2, y: 0.08, z: (rows - 1) / 2, parent: G, cast: false });
  const floes = [];
  for (const [fx, fz, s] of [[-2.2, 3, 0.5], [-1.8, 12, 0.35], [0.4, 14.6, 0.3], [9.5, -1.6, 0.4], [20, -1.4, 0.45], [25, 8, 0.4], [3.5, 8.4, 0.25], [17.2, 6.6, 0.3]]) {
    const f = ico(s, 0, ICE_WHITE, { x: fx, y: 0.1, z: fz, parent: G, ol: 0.012 });
    f.scale.set(1.3, 0.35, 1);
    floes.push({ f, ph: rnd() * 6 });
  }
  ctx.animators.push((time) => {
    for (const { f, ph } of floes) {
      f.position.y = 0.1 + Math.sin(time * 1.1 + ph) * 0.03;
      f.rotation.y = ph + time * 0.05;
    }
  });

  // Research base: two quonset huts and a mess-hall stovepipe.
  quonset(ctx, 11, LV, 1.5, 0, ["LAB 2", "DO NOT LICK SAMPLES"]);
  const mess = quonset(ctx, 15.5, LV, 5, -Math.PI / 2, ["MESS HALL", "TODAY: ICE (WARM)"]);
  cyl(0.06, 0.06, 0.6, 6, 0x55606a, { base: true, x: 0.4, y: 0.75, z: 0.3, parent: mess });
  const puffs = [];
  for (let i = 0; i < 4; i++) {
    const p = ico(0.07 + i * 0.02, 0, 0xdfe6ea, { parent: G, cast: false });
    puffs.push({ p, o: i / 4 });
  }
  const pipeTop = new THREE.Vector3(0.4, 1.4, 0.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), mess.rotation.y).add(mess.position);
  ctx.animators.push((time) => {
    for (const { p, o } of puffs) {
      const ph = (time * 0.35 + o) % 1;
      p.position.set(pipeTop.x + ph * 0.35, pipeTop.y + ph * 1.1, pipeTop.z - ph * 0.2);
      p.scale.setScalar(0.6 + ph * 1.2);
    }
  });

  // Igloo (cols 0-2, rows 0-2) with an entrance tunnel facing the courier.
  const iy = 2 * LV;
  k.mk(k.flat(new THREE.SphereGeometry(1.42, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), 0xe8f3f8, { x: 1, y: iy, z: 1, parent: G, ol: 0.03 });
  for (const h of [0.45, 0.9]) {
    const ring = k.mk(new THREE.TorusGeometry(Math.sqrt(1.42 * 1.42 - h * h) + 0.01, 0.02, 4, 24), 0xb9d4e2, { x: 1, y: iy + h, z: 1, rx: Math.PI / 2, parent: G, cast: false });
    ring.receiveShadow = false;
  }
  const tunnel = new THREE.Group();
  tunnel.position.set(1, iy, 2.2);
  tunnel.rotation.y = -Math.PI / 2;
  G.add(tunnel);
  k.mk(k.flat(new THREE.CylinderGeometry(0.46, 0.46, 0.9, 10, 1, false, 0, Math.PI)), 0xe8f3f8, { rz: Math.PI / 2, parent: tunnel, ol: 0.02 });
  const door = new THREE.Mesh(new THREE.CircleGeometry(0.36, 10, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x14202a }));
  door.position.set(1, iy + 0.005, 2.66);
  G.add(door);
  for (const sx of [0.18, 1.82]) box(0.05, 1.3, 0.05, sx < 1 ? PAL.burnt : PAL.harvest, { base: true, x: sx, y: iy, z: 2.42, rz: sx < 1 ? 0.08 : -0.08, parent: G, ol: 0.01 });
  const recv = signPlane(1.7, 0.42, ["RECEIVING", "KNOCK TWICE · THAW ONCE"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  recv.position.set(1, iy + 1.08, 2.46);
  G.add(recv);

  // Aurora ribbons in the sky behind the outpost: wavy additive planes.
  const auroraTex = k.canvasTex(16, 128, (c, W, H) => {
    const grd = c.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "rgba(255,255,255,0)");
    grd.addColorStop(0.55, "rgba(255,255,255,0.85)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = grd;
    c.fillRect(0, 0, W, H);
  });
  const ribbons = [];
  for (const [ax, ay, az, color, rot, ph] of [[-7, 7.5, 3, 0x5dffb0, 0.35, 0], [3, 8.5, -8, 0x6fd8ff, 0.1, 2], [-3, 10, -4, 0xd07aff, 0.25, 4]]) {
    const geo = new THREE.PlaneGeometry(26, 3.4, 30, 1);
    const mat = new THREE.MeshBasicMaterial({ color, map: auroraTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(ax, ay, az);
    m.lookAt(ax + 1, ay - 0.4, az + 1);
    m.rotateZ(rot);
    m.renderOrder = -1;
    G.add(m);
    ribbons.push({ geo, base: Float32Array.from(geo.attributes.position.array), mat, ph });
  }
  ctx.animators.push((time) => {
    for (const r of ribbons) {
      const arr = r.geo.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        const u = r.base[i];
        arr[i + 1] = r.base[i + 1] + Math.sin(u * 0.32 + time * 0.7 + r.ph) * 0.9;
        arr[i + 2] = Math.sin(u * 0.21 - time * 0.45 + r.ph) * 1.4;
      }
      r.geo.attributes.position.needsUpdate = true;
      r.mat.opacity = 0.38 + Math.sin(time * 0.6 + r.ph) * 0.14;
    }
  });

  // Stars and snowfall (Points, recycled in place).
  const starPos = [];
  for (let s = 0; s < 160; s++) starPos.push(-30 + rnd() * 30, 6 + rnd() * 10, -30 + rnd() * 50);
  G.add(new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3)), new THREE.PointsMaterial({ color: 0xf5ecd7, size: 2, sizeAttenuation: false })));
  const NF = 260;
  const flakes = new Float32Array(NF * 3);
  const seeds = [];
  for (let i = 0; i < NF; i++) seeds.push({ x: -3 + rnd() * (cols + 6), z: -3 + rnd() * (rows + 6), o: rnd(), w: rnd() * 6 });
  const snowGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(flakes, 3));
  const snowPts = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, opacity: 0.85 }));
  snowPts.frustumCulled = false;
  G.add(snowPts);
  ctx.animators.push((time) => {
    for (let i = 0; i < NF; i++) {
      const s = seeds[i];
      flakes[i * 3] = s.x + Math.sin(time * 0.8 + s.w) * 0.3;
      flakes[i * 3 + 1] = 6 - ((time * 0.7 + s.o * 6.2) % 6.2);
      flakes[i * 3 + 2] = s.z + Math.cos(time * 0.6 + s.w) * 0.3;
    }
    snowGeo.attributes.position.needsUpdate = true;
  });

  // The contractor: a yeti in a hard hat on a background berg, clipboard ready, invoice pending.
  const berg = new THREE.Group();
  berg.position.set(-3.6, 0, 9.5);
  G.add(berg);
  const bergRock = ico(1.5, 0, 0xdcecf4, { y: 0.2, parent: berg, ol: 0.025 });
  bergRock.scale.set(1.2, 0.8, 1);
  const yeti = new THREE.Group();
  yeti.position.set(0, 1.1, 0);
  yeti.rotation.y = 0.9;
  berg.add(yeti);
  const fur = ico(0.42, 1, 0xf7f7f2, { y: 0.55, parent: yeti, ol: 0.02 });
  fur.scale.set(1, 1.35, 0.9);
  ico(0.26, 1, 0xf7f7f2, { y: 1.15, parent: yeti, ol: 0.016 });
  box(0.3, 0.14, 0.05, 0x7aa0b8, { y: 1.12, z: 0.22, parent: yeti, cast: false });
  for (const sx of [-1, 1]) ico(0.03, 0, PAL.ink, { x: sx * 0.07, y: 1.15, z: 0.25, parent: yeti, cast: false });
  k.mk(k.flat(new THREE.SphereGeometry(0.22, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2)), PAL.harvest, { y: 1.3, parent: yeti, ol: 0.012 });
  cyl(0.3, 0.3, 0.03, 10, PAL.harvest, { y: 1.3, parent: yeti });
  const arm = new THREE.Group();
  arm.position.set(0.38, 0.85, 0);
  yeti.add(arm);
  const armMesh = box(0.14, 0.5, 0.14, 0xf7f7f2, { y: 0.22, parent: arm, ol: 0.012 });
  armMesh.rotation.z = -0.2;
  box(0.26, 0.34, 0.03, 0x8a6a48, { x: -0.34, y: 0.6, z: 0.3, parent: yeti, ol: 0.01 });
  box(0.22, 0.28, 0.01, PAL.cream, { x: -0.34, y: 0.6, z: 0.32, parent: yeti, cast: false });
  ctx.animators.push((time) => (arm.rotation.z = -0.4 - Math.max(0, Math.sin(time * 1.3)) * 1.6));
  const yetiSign = signPlane(1.5, 0.36, ["CONTRACTOR", "BILLING BY THE GLACIER"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm });
  yetiSign.position.set(0.6, 0.55, 1.3);
  yetiSign.rotation.y = 0.7;
  berg.add(yetiSign);

  // Big background bergs.
  for (const [bx, bz, s] of [[-6, -3, 2.2], [6, -6.5, 2.6], [26.5, 2, 1.8], [-7, 15, 1.6]]) {
    const b = ico(s, 0, 0xcfe4ef, { x: bx, y: 0.1, z: bz, parent: G, cast: false });
    b.scale.set(1, 1.1, 0.9);
    b.rotation.y = bx;
  }

  const customer = buildBlob(k, { body: 0xb8a6e0, robe: PAL.burnt });
  customer.root.position.set(1, iy, 3);
  customer.root.rotation.y = 0.45;
  G.add(customer.root);
  k.mk(k.flat(new THREE.SphereGeometry(0.4, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)), PAL.burnt, { y: 0.7, z: -0.06, rx: -0.35, parent: customer.root, ol: 0.015 });
  k.mk(new THREE.TorusGeometry(0.27, 0.07, 5, 14), PAL.cream, { y: 0.63, z: 0.16, parent: customer.root, ol: 0.01 });
  return customer;
}
