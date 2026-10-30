// Hazard entities: { update(t, dt), check?(pos, player) → cause | null, force?(pos, player) → {x,z} | null }.
// `ctx` is the run context (k, group, player, tileAt, tileUnder, canWalk, warp, def, rnd); `t` is
// run-local sim time and every timing is a closed-form function of it, so seeded phases replay identically.
// spawnHazards turns a hazardplan.js plan into entities.
import * as THREE from "three";
import { PAL } from "./kit.js";
import { buildCar, buildPortal } from "./props.js";

const CAR_COLORS = [PAL.ibm, PAL.burnt, 0x3f8f8a, PAL.harvest, PAL.avocado];

export function spawnHazards(ctx, plan) {
  const make = {
    traffic: trafficCar,
    sprinkler,
    acid: acidZone,
    ice: iceSheen,
    wind: windZone,
    blackhole: blackHole,
    fauna: crystalCritter,
    current: currentBand,
    vanish: vanishTile,
    dejavu: dejavuDoor,
    chaser: meeseeksBox,
    belts: conveyorBelts,
  };
  for (const e of plan.entries) {
    const h = make[e.type]?.(ctx, e);
    if (h) ctx.hazards.push(h);
  }
  if (plan.physics.drift) ctx.hazards.push(driftVane(ctx, plan.physics.drift));
}

const cycle = (t, phase, period) => (((t + phase) % period) + period) % period;

/* ------------------------------------------------------------------ */

export function trafficCar(ctx, e) {
  const color = e.color ?? CAR_COLORS[Math.floor(ctx.rnd() * CAR_COLORS.length)];
  const car = buildCar(ctx.k, color, true);
  const sgn = e.dir > 0 ? 1 : -1;
  car.root.rotation.y = e.axis === "x" ? (sgn > 0 ? 0 : Math.PI) : sgn > 0 ? -Math.PI / 2 : Math.PI / 2;
  const lift = e.hover ? 0.34 : 0;
  if (e.hover) {
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 18),
      new THREE.MeshBasicMaterial({ color: PAL.harvest, transparent: true, opacity: 0.35, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.3;
    glow.scale.set(1.3, 0.7, 1);
    car.root.add(glow);
    for (const sx of [-0.55, 0.55]) ctx.k.cyl(0.12, 0.05, 0.16, 6, PAL.harvest, { x: sx, y: -0.02, parent: car.root });
  }
  ctx.group.add(car.root);
  const lo = e.from - 1;
  const span = e.to - e.from + 2;
  const local = new THREE.Vector3();
  let a = lo;
  const pos = (u) => (e.axis === "x" ? [u, e.at] : [e.at, u]);
  return {
    update(t) {
      a = lo + cycle((e.phase + e.slot) * span + sgn * e.speed * t, 0, span);
      const edge = Math.min(a - (e.from - 0.1), e.to + 0.1 - a);
      car.root.visible = edge > 0;
      car.root.scale.setScalar(THREE.MathUtils.clamp(edge / 0.9, 0.01, 1));
      const [x, z] = pos(a);
      const bob = e.hover ? Math.sin(t * 3 + e.phase * 9) * 0.05 : Math.abs(Math.sin(t * 9 + e.phase * 20)) * 0.03;
      car.root.position.set(x, e.y + lift + bob, z);
      local.copy(ctx.player.pos);
      car.root.worldToLocal(local);
      for (const p of car.pupils) p.position.z = Math.sign(p.position.z) * 0.17 + THREE.MathUtils.clamp(local.z * 0.03, -0.04, 0.04);
    },
    check(p) {
      if (!car.root.visible || p.y > e.y + 1.0 || p.y < e.y - 0.6) return null;
      const [x, z] = pos(a);
      const along = e.axis === "x" ? Math.abs(p.x - x) : Math.abs(p.z - z);
      const across = e.axis === "x" ? Math.abs(p.z - z) : Math.abs(p.x - x);
      return along < 1.0 && across < 0.55 ? "SENTIENT TRAFFIC" : null;
    },
  };
}

export function sprinkler(ctx, { x, y, z, R, spin = 1.25, angle0 = 0 }) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  ctx.group.add(g);
  ctx.k.cyl(0.08, 0.1, 0.14, 7, 0xcfd3d6, { base: true, parent: g, ol: 0.012 });
  const head = new THREE.Group();
  head.position.y = 0.16;
  g.add(head);
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x9ed3ea, transparent: true, opacity: 0.85 });
  const drops = [];
  for (let kk = 0; kk < 3; kk++)
    for (let i = 1; i <= 9; i++) {
      const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055 + i * 0.004, 0), dropMat);
      d.userData = { f: i / 9, k: kk - 1 };
      head.add(d);
      drops.push(d);
    }
  const wedge = new THREE.Mesh(
    new THREE.CircleGeometry(R, 20, -0.28, 0.56),
    new THREE.MeshBasicMaterial({ color: 0x5fb3d6, transparent: true, opacity: 0.22, depthWrite: false })
  );
  wedge.rotation.x = -Math.PI / 2;
  wedge.position.y = 0.02;
  g.add(wedge);
  let ang = angle0;
  return {
    update(t) {
      ang = angle0 + t * spin;
      head.rotation.y = ang;
      wedge.rotation.z = ang;
      for (const d of drops) {
        const { f, k } = d.userData;
        const ff = (f + t * 0.9) % 1;
        const r = 0.15 + ff * (R - 0.15);
        const a = k * 0.18;
        d.position.set(Math.cos(a) * r, Math.sin(ff * Math.PI) * 0.9, -Math.sin(a) * r);
      }
    },
    check(p) {
      const dx = p.x - x;
      const dz = p.z - z;
      const d = Math.hypot(dx, dz);
      if (d > R || d < 0.2 || p.y > y + 1.2) return null;
      let diff = Math.atan2(-dz, dx) - ang;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      return Math.abs(diff) < 0.3 ? "SPRINKLER (PARCEL SOGGY)" : null;
    },
  };
}

export function blackHole(ctx, { x, y, z, R, pull = 2.6 }) {
  const { k } = ctx;
  const g = new THREE.Group();
  g.position.set(x, y, z);
  ctx.group.add(g);
  k.mk(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: 0x05030a }), { parent: g, cast: false, recv: false });
  const disk = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 1.45, 40, 1),
    new THREE.MeshBasicMaterial({ color: PAL.harvest, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  disk.rotation.x = -Math.PI / 2 + 0.25;
  g.add(disk);
  const disk2 = new THREE.Mesh(
    new THREE.RingGeometry(1.45, 1.9, 40, 1),
    new THREE.MeshBasicMaterial({ color: PAL.burnt, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
  );
  disk2.rotation.x = -Math.PI / 2 + 0.25;
  g.add(disk2);
  const label = k.stampSprite("BLACK-HOLE SLOT", "NOT THE CUSTOMER. PROBABLY.", { w: 1.8, color: PAL.ink });
  label.position.y = 1.35;
  g.add(label);
  const motes = [];
  const moteMat = new THREE.MeshBasicMaterial({ color: PAL.cream });
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), moteMat);
    m.userData = { a: (i / 24) * Math.PI * 2, s: 0.6 + (i % 5) * 0.15 };
    g.add(m);
    motes.push(m);
  }
  return {
    update(t) {
      disk.rotation.z = t * 1.4;
      disk2.rotation.z = -t * 0.8;
      for (const m of motes) {
        const { a, s } = m.userData;
        const ph = (t * 0.35 * s + a / (Math.PI * 2)) % 1;
        const r = R * (1 - ph);
        const aa = a + ph * 6;
        m.position.set(Math.cos(aa) * r, Math.sin(aa * 2) * 0.1, Math.sin(aa) * r);
      }
    },
    force(p) {
      const dx = x - p.x;
      const dz = z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > R || d < 1e-3) return null;
      const s = pull * (1 - d / R) ** 1.3;
      return { x: (dx / d) * s, z: (dz / d) * s };
    },
    check(p) {
      return Math.hypot(p.x - x, p.z - z) < 0.75 && Math.abs(p.y - y) < 1.2 ? "BLACK-HOLE SLOT" : null;
    },
  };
}

function swirlTexture(k) {
  return k.canvasTex(128, 128, (c, W) => {
    const grd = c.createRadialGradient(W / 2, W / 2, 4, W / 2, W / 2, W / 2);
    grd.addColorStop(0, "#fff6d0");
    grd.addColorStop(0.4, "#daa520");
    grd.addColorStop(1, "#cc5500");
    c.fillStyle = grd;
    c.fillRect(0, 0, W, W);
    c.strokeStyle = "rgba(255,248,220,0.7)";
    c.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      for (let a = 0; a < 5.5; a += 0.1) {
        const r = 4 + a * 10;
        c.lineTo(W / 2 + Math.cos(a + i * 2.1) * r, W / 2 + Math.sin(a + i * 2.1) * r);
      }
      c.stroke();
    }
  });
}

/** Timed push zone: rectangle from (x,z) along `dir` for `len` (and `back` behind), ±`width` across. */
export function windZone(ctx, e) {
  const { k } = ctx;
  const dir = new THREE.Vector2(e.dir[0], e.dir[1]).normalize();
  const g = new THREE.Group();
  g.position.set(e.x, e.y, e.z);
  ctx.group.add(g);
  let disc = null;
  if (e.emitter === "portal") {
    const em = new THREE.Group();
    em.position.y = 0.8;
    em.rotation.y = Math.atan2(dir.x, dir.y);
    g.add(em);
    k.mk(k.flat(new THREE.TorusGeometry(0.52, 0.08, 6, 18)), PAL.harvest, { parent: em, ol: 0.02 });
    disc = new THREE.Mesh(new THREE.CircleGeometry(0.47, 20), new THREE.MeshBasicMaterial({ map: swirlTexture(k), side: THREE.DoubleSide }));
    em.add(disc);
    k.cyl(0.04, 0.06, 0.45, 5, 0xcfd3d6, { y: -0.75, parent: em });
    const tag = k.signPlane(0.8, 0.22, ["PORTAL WIND"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest, px: 260 });
    tag.position.y = 0.78;
    em.add(tag);
  }
  const mat = new THREE.MeshBasicMaterial({ color: PAL.cream, transparent: true, opacity: 0.8, depthWrite: false });
  const puffs = [];
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), mat);
    m.userData = { o: i / 16, lx: (((i * 37) % 11) / 11 - 0.5) * 2 };
    g.add(m);
    puffs.push(m);
  }
  let state = "off";
  return {
    update(t, dt) {
      const c = cycle(t, e.phase, e.period);
      state = c < e.on ? "on" : c > e.period - e.warn ? "warn" : "off";
      if (disc) disc.rotation.z -= dt * (state === "on" ? 9 : state === "warn" ? 4 : 0.8);
      mat.opacity = state === "on" ? 0.85 : 0.3;
      for (const m of puffs) {
        m.visible = state !== "off";
        const ph = (t * (state === "on" ? 1.6 : 0.5) + m.userData.o) % 1;
        const along = -e.back + ph * (e.len + e.back);
        const across = m.userData.lx * e.width;
        m.position.set(dir.x * along - dir.y * across, 0.2 + Math.sin(ph * Math.PI) * 0.5, dir.y * along + dir.x * across);
      }
    },
    force(p) {
      if (state !== "on" || p.y > e.y + 2) return null;
      const rx = p.x - e.x;
      const rz = p.z - e.z;
      const along = rx * dir.x + rz * dir.y;
      const across = Math.abs(rx * dir.y - rz * dir.x);
      if (along < -e.back || along > e.len || across > e.width) return null;
      return { x: dir.x * e.strength, z: dir.y * e.strength };
    },
  };
}

/** Timed acid drip band: telegraphs (cloud rumbles, puddle outline flashes), then the puddles are lethal. */
export function acidZone(ctx, e) {
  const { k } = ctx;
  const g = new THREE.Group();
  ctx.group.add(g);
  const cx = e.tiles.reduce((s, t) => s + t.c, 0) / e.tiles.length;
  const cz = e.tiles.reduce((s, t) => s + t.r, 0) / e.tiles.length;
  const top = Math.max(...e.tiles.map((t) => t.y));
  const cloud = new THREE.Group();
  cloud.position.set(cx, top + 2.3, cz);
  g.add(cloud);
  for (let i = 0; i < 4; i++)
    k.ico(0.42 - i * 0.05, 0, i % 2 ? 0x6b6f7a : 0x8a8f99, { x: (i - 1.5) * 0.42, y: (i % 2) * 0.12, z: (i % 3) * 0.12 - 0.1, parent: cloud, ol: 0.02, cast: false });
  const bolt = k.box(0.08, 0.5, 0.04, PAL.harvest, { y: -0.45, rz: 0.4, parent: cloud, cast: false });
  const puddleMat = new THREE.MeshBasicMaterial({ color: 0xb6d84a, transparent: true, opacity: 0, depthWrite: false });
  const ringMat = new THREE.MeshBasicMaterial({ color: PAL.burnt, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xc8e86a });
  const drops = [];
  for (const t of e.tiles) {
    const pud = new THREE.Mesh(new THREE.CircleGeometry(0.44, 14), puddleMat);
    pud.rotation.x = -Math.PI / 2;
    pud.position.set(t.c, t.y + 0.012, t.r);
    g.add(pud);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.48, 4, 1, Math.PI / 4), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(t.c, t.y + 0.016, t.r);
    g.add(ring);
    for (let i = 0; i < 4; i++) {
      const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.045, 0), dropMat);
      d.scale.set(0.7, 1.8, 0.7);
      d.userData = { x: t.c + (ctx.rnd() - 0.5) * 0.7, z: t.r + (ctx.rnd() - 0.5) * 0.7, y0: t.y, o: ctx.rnd() };
      g.add(d);
      drops.push(d);
    }
  }
  let active = false;
  return {
    update(t) {
      const c = cycle(t, e.phase, e.period);
      active = c < e.on;
      const warn = !active && c > e.period - e.warn;
      puddleMat.opacity = active ? 0.85 : warn ? 0.18 + 0.12 * Math.sin(t * 18) : 0;
      ringMat.opacity = warn || active ? 0.9 : 0.25;
      bolt.visible = warn && Math.sin(t * 22) > 0;
      cloud.position.y = top + 2.3 + Math.sin(t * 1.3 + e.phase) * 0.06;
      for (const d of drops) {
        d.visible = active || warn;
        const ph = (t * (active ? 1.8 : 0.9) + d.userData.o) % 1;
        d.position.set(d.userData.x, d.userData.y0 + 2.1 * (1 - ph), d.userData.z);
      }
    },
    check(p) {
      if (!active) return null;
      for (const t of e.tiles) if (Math.abs(p.x - t.c) < 0.5 && Math.abs(p.z - t.r) < 0.5 && p.y < t.y + 0.6) return "ACID RAIN (PARCEL DISSOLVED)";
      return null;
    },
  };
}

/** Low-friction tiles: the run reads `tile.ice`; this only draws the glaze so they read on any palette. */
export function iceSheen(ctx, e) {
  const g = new THREE.Group();
  ctx.group.add(g);
  const glaze = new THREE.MeshBasicMaterial({ color: 0xe2f4ff, transparent: true, opacity: 0.45, depthWrite: false });
  const glint = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const plane = new THREE.PlaneGeometry(0.94, 0.94);
  for (const t of e.tiles) {
    const m = new THREE.Mesh(plane, glaze);
    m.rotation.x = -Math.PI / 2;
    m.position.set(t.c, t.y + 0.008, t.r);
    g.add(m);
    if ((t.c * 7 + t.r * 3) % 3 === 0) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.04), glint);
      s.position.set(t.c + 0.08, t.y + 0.012, t.r - 0.1);
      s.rotation.y = Math.PI / 4;
      g.add(s);
    }
  }
  return { update() {} };
}

/** Crystal critter patrolling a polyline (ping-pong). Low enough to jump over. */
export function crystalCritter(ctx, e) {
  const { k } = ctx;
  const g = new THREE.Group();
  ctx.group.add(g);
  const bodyG = new THREE.Group();
  g.add(bodyG);
  const body = k.ico(0.22, 1, 0x2f5f6a, { y: 0.2, parent: bodyG, ol: 0.018 });
  body.scale.set(1.25, 0.7, 1);
  const shardCols = [0xb48cd8, 0x7fd6c8, PAL.cream, 0xb48cd8];
  shardCols.forEach((col, i) => {
    const s = k.cyl(0, 0.07, 0.3 + (i % 2) * 0.1, 5, col, { x: (i - 1.5) * 0.09, y: 0.38, z: -0.04, rz: (i - 1.5) * 0.35, parent: bodyG, ol: 0.012 });
    s.rotation.x = -0.25;
  });
  for (const sx of [-1, 1]) {
    k.ico(0.055, 1, 0xffffff, { x: sx * 0.08, y: 0.27, z: 0.2, parent: bodyG, ol: 0.01 });
    k.ico(0.028, 0, PAL.ink, { x: sx * 0.08, y: 0.27, z: 0.25, parent: bodyG, cast: false });
  }
  const legs = [];
  for (let i = 0; i < 4; i++) legs.push(k.box(0.04, 0.16, 0.04, PAL.ink, { x: (i < 2 ? -1 : 1) * 0.2, y: 0.08, z: (i % 2 ? 1 : -1) * 0.1, parent: bodyG, cast: false }));
  const pts = e.path.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const seg = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    seg.push(pts[i].distanceTo(pts[i - 1]));
    L += seg[i - 1];
  }
  const pos = pts[0].clone();
  const tmp = new THREE.Vector3();
  return {
    update(t) {
      let fwd = 1;
      if (L > 0) {
        const s = cycle(e.phase * 2 * L + e.speed * t, 0, 2 * L);
        let d = s < L ? s : 2 * L - s;
        fwd = s < L ? 1 : -1;
        let i = 0;
        while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
        pos.lerpVectors(pts[i], pts[i + 1], seg[i] ? Math.min(1, d / seg[i]) : 0);
        tmp.subVectors(pts[i + 1], pts[i]).multiplyScalar(fwd);
        if (tmp.lengthSq() > 1e-6) g.rotation.y = Math.atan2(tmp.x, tmp.z);
      }
      g.position.copy(pos);
      bodyG.position.y = Math.abs(Math.sin(t * 12 + e.phase * 9)) * 0.04;
      legs.forEach((l, i) => (l.rotation.x = Math.sin(t * 16 + i * 1.6) * 0.5));
    },
    check(p) {
      return Math.hypot(p.x - pos.x, p.z - pos.z) < 0.42 && p.y < pos.y + 0.42 && p.y > pos.y - 0.5 ? "CRYSTAL FAUNA (BITTEN ON SCHEDULE)" : null;
    },
  };
}

/** Oscillating cross-route push band (pressure currents). Bubbles show direction and strength. */
export function currentBand(ctx, e) {
  const dir = new THREE.Vector2(e.dir[0], e.dir[1]).normalize();
  const axis = new THREE.Vector2(dir.y, dir.x);
  const g = new THREE.Group();
  g.position.set(e.x, e.y, e.z);
  ctx.group.add(g);
  const bubMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.75, depthWrite: false });
  const bubbles = [];
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04 + (i % 3) * 0.02, 0), bubMat);
    m.userData = { o: ctx.rnd(), a: (ctx.rnd() * 2 - 1) * e.halfAlong, h: ctx.rnd() };
    g.add(m);
    bubbles.push(m);
  }
  const arrowMat = new THREE.MeshBasicMaterial({ color: PAL.cream, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  const arrows = [];
  for (const off of [-1.6, 0, 1.6]) {
    const a = new THREE.Mesh(new THREE.CircleGeometry(0.28, 3), arrowMat);
    a.rotation.x = -Math.PI / 2;
    a.position.set(dir.x * off, 0.02, dir.y * off);
    g.add(a);
    arrows.push(a);
  }
  let s = 0;
  return {
    update(t) {
      s = Math.sin((t / e.period) * Math.PI * 2 + e.phase);
      arrowMat.opacity = 0.15 + Math.abs(s) * 0.55;
      const sg = Math.sign(s || 1);
      for (const a of arrows) a.rotation.z = Math.atan2(-dir.y * sg, dir.x * sg);
      for (const m of bubbles) {
        const { o, a, h } = m.userData;
        const ph = (t * 0.45 + o) % 1;
        const across = ((o * 2 - 1) * e.halfAcross + s * e.strength * 0.5 * ph) % e.halfAcross;
        m.position.set(dir.x * across + axis.x * a, 0.1 + ph * 1.6 + h * 0.2, dir.y * across + axis.y * a);
      }
    },
    force(p) {
      if (p.y > e.y + 2) return null;
      const rx = p.x - e.x;
      const rz = p.z - e.z;
      if (Math.abs(rx * dir.x + rz * dir.y) > e.halfAcross || Math.abs(rx * axis.x + rz * axis.y) > e.halfAlong) return null;
      return { x: dir.x * e.strength * s, z: dir.y * e.strength * s };
    },
  };
}

function hash01(a, b) {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

/** A floor tile that periodically disappears (heat shimmer: steady cycle; meta glitch: hashed time slots). */
export function vanishTile(ctx, e) {
  const { k, def } = ctx;
  const tile = ctx.tileAt(e.c, e.r);
  const g = new THREE.Group();
  g.position.set(e.c, 0, e.r);
  ctx.group.add(g);
  const capMat = k.toon(tile.top).clone();
  const sideMat = k.toon(tile.side).clone();
  capMat.transparent = sideMat.transparent = true;
  const bottom = tile.deck || def.baseY == null ? e.y - 0.45 : def.baseY;
  const hgt = Math.max(0.05, e.y - 0.08 - bottom);
  const body = new THREE.Group();
  g.add(body);
  k.mk(new THREE.BoxGeometry(0.97, 0.1, 0.97), capMat, { y: e.y - 0.05, parent: body });
  k.mk(new THREE.BoxGeometry(1, hgt, 1), sideMat, { y: bottom + hgt / 2, parent: body });
  const glitch = e.mode === "glitch";
  const edgeMat = new THREE.LineBasicMaterial({ color: glitch ? 0xd43dbd : PAL.harvest, transparent: true, opacity: 0.9 });
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 0.02, 0.9)), edgeMat);
  edges.position.y = e.y + 0.012;
  g.add(edges);
  const ghostMat = new THREE.MeshBasicMaterial({ color: glitch ? 0x3dd4d0 : 0xffc56a, transparent: true, opacity: 0.18, depthWrite: false });
  const ghost = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), ghostMat);
  ghost.rotation.x = -Math.PI / 2;
  ghost.position.y = e.y + 0.01;
  g.add(ghost);
  const baseCap = new THREE.Color(tile.top);
  const warnCol = new THREE.Color(glitch ? 0xd43dbd : 0xffd27a);
  const altCol = new THREE.Color(0x3dd4d0);
  const stateAt = (t) => {
    if (glitch) {
      const s = Math.floor((t + e.phase) / e.slot);
      if (hash01(e.salt, s) < e.duty) return "gone";
      return hash01(e.salt, s + 1) < e.duty ? "warn" : "solid";
    }
    const c = cycle(t, e.phase, e.period);
    return c < e.gone ? "gone" : c > e.period - e.warn ? "warn" : "solid";
  };
  return {
    update(t) {
      const st = stateAt(t);
      tile.gone = st === "gone";
      body.visible = !tile.gone;
      ghost.visible = tile.gone;
      ghostMat.opacity = 0.12 + 0.08 * Math.sin(t * 7);
      edgeMat.opacity = st === "warn" ? (Math.sin(t * 24) > 0 ? 1 : 0.2) : tile.gone ? 0.5 : 0.75;
      const o = st === "warn" ? 0.55 + 0.35 * Math.sin(t * (glitch ? 30 : 14)) : 1;
      capMat.opacity = sideMat.opacity = o;
      if (st === "warn") capMat.color.copy(glitch && Math.sin(t * 20) > 0 ? altCol : warnCol);
      else capMat.color.copy(baseCap);
      body.position.set(st === "warn" && glitch ? Math.sin(t * 53) * 0.04 : 0, st === "warn" ? Math.sin(t * 40) * 0.015 : 0, 0);
    },
  };
}

/** A second "Box 407-B" beside the route; stepping in sends the courier back down the route. */
export function dejavuDoor(ctx, e) {
  const p = buildPortal(ctx.k);
  p.root.position.set(e.c, e.y, e.r);
  p.root.scale.setScalar(0.75);
  p.root.rotation.y = Math.PI / 4;
  ctx.group.add(p.root);
  const s = ctx.k.stampSprite("BOX 407-B?", "HAVE WE MET?", { w: 1.5, color: 0xd43dbd });
  s.position.set(e.c, e.y + 2.0, e.r);
  ctx.group.add(s);
  let cool = 0;
  return {
    update(t, dt) {
      p.plane.material.map.offset.y = (t * -0.4) % 1;
      cool = Math.max(0, cool - dt);
    },
    check(pos) {
      if (cool === 0 && Math.hypot(pos.x - e.c, pos.z - e.r) < 0.5 && Math.abs(pos.y - e.y) < 1) {
        cool = 1.5;
        ctx.warp(e.to.c, e.to.r, "DÉJÀ VU · REROUTED");
      }
      return null;
    },
  };
}

function buildMeeseeks(k) {
  const g = new THREE.Group();
  const blue = 0x86cdea;
  for (const sx of [-1, 1]) k.cyl(0.035, 0.04, 0.32, 5, blue, { x: sx * 0.07, y: 0.16, parent: g, ol: 0.012 });
  k.cyl(0.12, 0.15, 0.36, 7, blue, { y: 0.48, parent: g, ol: 0.016 });
  const head = k.ico(0.19, 1, blue, { y: 0.84, parent: g, ol: 0.016 });
  head.scale.set(1, 1.25, 1);
  for (const sx of [-1, 1]) {
    k.ico(0.05, 1, 0xffffff, { x: sx * 0.07, y: 0.9, z: 0.15, parent: g, ol: 0.008 });
    k.ico(0.025, 0, PAL.ink, { x: sx * 0.07, y: 0.9, z: 0.19, parent: g, cast: false });
  }
  k.box(0.12, 0.03, 0.02, PAL.ink, { y: 0.76, z: 0.18, parent: g, cast: false });
  const arms = [];
  for (const sx of [-1, 1]) arms.push(k.cyl(0.03, 0.03, 0.34, 5, blue, { x: sx * 0.17, y: 0.62, rz: sx * 2.6, parent: g }));
  return { root: g, arms };
}

/** Meeseeks box near the route: spawns `n` chasers that speed up until they poof and respawn. */
export function meeseeksBox(ctx, e) {
  const { k } = ctx;
  const boxG = new THREE.Group();
  boxG.position.set(e.x, e.y, e.z);
  ctx.group.add(boxG);
  k.box(0.5, 0.32, 0.5, PAL.ibm, { base: true, parent: boxG, ol: 0.02 });
  const btn = k.cyl(0.12, 0.14, 0.08, 10, 0x86cdea, { y: 0.36, parent: boxG, ol: 0.012 });
  const lbl = k.signPlane(0.48, 0.14, ["MEESEEKS BOX"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.harvest, px: 300 });
  lbl.position.set(0, 0.16, 0.255);
  boxG.add(lbl);
  const seekers = [];
  for (let i = 0; i < e.n; i++) {
    const m = buildMeeseeks(k);
    m.root.visible = false;
    ctx.group.add(m.root);
    const speech = k.stampSprite("CAN DO!", "I'M MR. MEESEEKS", { w: 1.2, color: 0x2f86b0 });
    speech.position.y = 1.5;
    m.root.add(speech);
    seekers.push({ ...m, speech, alive: false, x: e.x, z: e.z, y: e.y, born: 0, next: e.delay + i * 1.3, flip: i % 2 ? 1 : -1 });
  }
  const pl = ctx.player;
  return {
    update(t, dt) {
      boxG.rotation.z = seekers.some((s) => !s.alive && s.next - t < 0.8) ? Math.sin(t * 40) * 0.06 : 0;
      btn.position.y = 0.36 - (Math.sin(t * 3) > 0.9 ? 0.03 : 0);
      for (const s of seekers) {
        if (!s.alive) {
          if (t >= s.next) Object.assign(s, { alive: true, x: e.x + s.flip * 0.3, z: e.z, y: e.y, born: t });
          s.root.visible = false;
          continue;
        }
        const age = t - s.born;
        if (age > e.life) {
          s.alive = false;
          s.next = t + 1.5;
          continue;
        }
        if (pl.state === "transit") {
          const spd = Math.min(e.cap, e.speed + e.ramp * age) * dt;
          let dx = pl.pos.x - s.x;
          let dz = pl.pos.z - s.z;
          const d = Math.hypot(dx, dz) || 1;
          dx /= d;
          dz /= d;
          let moved = false;
          if (ctx.canWalk(s.x + dx * spd, s.z, s.y)) (s.x += dx * spd), (moved = true);
          if (ctx.canWalk(s.x, s.z + dz * spd, s.y)) (s.z += dz * spd), (moved = true);
          if (!moved) {
            const sx = -dz * s.flip * spd;
            const sz = dx * s.flip * spd;
            if (ctx.canWalk(s.x + sx, s.z + sz, s.y)) (s.x += sx), (s.z += sz);
            else s.flip *= -1;
          }
          const gy = ctx.groundAt(s.x, s.z);
          if (gy > -Infinity) s.y = gy;
          s.root.rotation.y = Math.atan2(dx, dz);
        }
        const shrink = Math.min(1, age * 4, (e.life - age) * 3);
        s.root.visible = true;
        s.root.scale.setScalar(Math.max(0.01, shrink));
        s.root.position.set(s.x, s.y + Math.abs(Math.sin(t * 10 + s.flip)) * 0.06, s.z);
        s.arms[0].rotation.z = 2.6 + Math.sin(t * 12) * 0.4;
        s.arms[1].rotation.z = -2.6 - Math.sin(t * 12) * 0.4;
        s.speech.visible = age < 1.6 || (e.life - age < 2 && Math.sin(t * 8) > 0);
      }
    },
    check(p) {
      for (const s of seekers)
        if (s.alive && s.root.scale.x > 0.6 && Math.hypot(p.x - s.x, p.z - s.z) < 0.42 && Math.abs(p.y - s.y) < 0.9)
          return "MEESEEKS (EXISTENCE IS PAIN)";
      return null;
    },
  };
}

function chevronTexture(k) {
  const tex = k.canvasTex(64, 64, (c, W) => {
    c.fillStyle = "#3a3f4a";
    c.fillRect(0, 0, W, W);
    c.strokeStyle = "#daa520";
    c.lineWidth = 7;
    for (const y0 of [8, 40]) {
      c.beginPath();
      c.moveTo(12, y0 + 18);
      c.lineTo(32, y0);
      c.lineTo(52, y0 + 18);
      c.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Conveyor tiles (`tile.belt` = [dx, dz]); optional reversal stops the belts for `warn` s, then flips them. */
export function conveyorBelts(ctx, e) {
  const { k } = ctx;
  const mat = new THREE.MeshBasicMaterial({ map: chevronTexture(k) });
  const plane = new THREE.PlaneGeometry(0.86, 0.9);
  const g = new THREE.Group();
  ctx.group.add(g);
  for (const t of e.tiles) {
    const tg = new THREE.Group();
    tg.position.set(t.c, t.y + 0.006, t.r);
    tg.rotation.y = Math.atan2(-t.dir[0], -t.dir[1]);
    g.add(tg);
    const m = new THREE.Mesh(plane, mat);
    m.rotation.x = -Math.PI / 2;
    tg.add(m);
    for (const sx of [-0.46, 0.46]) k.box(0.06, 0.07, 0.98, 0x2a2a2a, { x: sx, y: 0.035, parent: tg, cast: false });
  }
  const rate = (e.tiles[0]?.speed ?? 1.6) / 0.9;
  let sign = 1;
  return {
    update(t, dt) {
      if (e.reverse) {
        const c = cycle(t, e.reverse.phase, e.reverse.period);
        const flipped = Math.floor((t + e.reverse.phase) / e.reverse.period) % 2 === 1;
        sign = c < e.reverse.warn ? 0 : flipped ? -1 : 1;
        mat.color.setHex(sign === 0 && Math.sin(t * 20) > 0 ? 0xff9a6a : 0xffffff);
      }
      mat.map.offset.y -= rate * sign * dt;
    },
    force(p, player) {
      if (!player.grounded || sign === 0) return null;
      const t = ctx.tileUnder(p.x, p.z);
      if (!t.belt) return null;
      const s = (t.beltSpeed ?? 1.6) * sign;
      return { x: t.belt[0] * s, z: t.belt[1] * s };
    },
  };
}

/**
 * Manifest drift: a slow, rotating nudge while the courier is walking (standing still is always safe),
 * with a ground arrow under the courier showing where it pulls.
 */
export function driftVane(ctx, d) {
  const arrow = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 3),
    new THREE.MeshBasicMaterial({ color: PAL.burnt, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })
  );
  arrow.rotation.x = -Math.PI / 2;
  ctx.group.add(arrow);
  let a = 0;
  return {
    update(t) {
      a = d.phase + (t / d.period) * Math.PI * 2;
      const p = ctx.player.pos;
      arrow.position.set(p.x + Math.cos(a) * 0.55, p.y + 0.03, p.z + Math.sin(a) * 0.55);
      arrow.rotation.z = -a;
    },
    force(p, player) {
      if (!player.moving) return null;
      return { x: Math.cos(a) * d.strength, z: Math.sin(a) * d.strength };
    },
  };
}
