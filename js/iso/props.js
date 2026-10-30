// Code-built props shared by iso worlds. Every builder takes the run's kit `k` (or the run ctx).
import * as THREE from "three";
import { PAL } from "./kit.js";
import { tileTop } from "./map.js";

export function buildCourier(k) {
  const { box, cyl, ico, mk, flat, signPlane } = k;
  const root = new THREE.Group();
  const khaki = 0xdcc89a;
  const skin = 0xf0c08c;

  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(sx * 0.09, 0.36, 0);
    box(0.12, 0.26, 0.13, 0xcbb586, { y: -0.13, parent: hip, ol: 0.018 });
    box(0.14, 0.1, 0.2, 0x4f5f2a, { y: -0.31, z: 0.03, parent: hip, ol: 0.018 });
    root.add(hip);
    legs.push(hip);
  }

  const upper = new THREE.Group();
  upper.position.y = 0.36;
  root.add(upper);
  cyl(0.16, 0.19, 0.34, 7, khaki, { y: 0.17, parent: upper, ol: 0.02 });
  cyl(0.195, 0.195, 0.045, 7, 0x6b4325, { y: 0.03, parent: upper });
  box(0.045, 0.44, 0.03, PAL.burnt, { y: 0.17, z: 0.16, rz: 0.72, parent: upper });
  box(0.16, 0.15, 0.09, PAL.burnt, { x: -0.23, y: 0.02, parent: upper, ol: 0.018 });

  const head = new THREE.Group();
  head.position.y = 0.5;
  upper.add(head);
  ico(0.16, 1, skin, { parent: head, ol: 0.018 });
  box(0.2, 0.12, 0.08, 0x1d1a17, { y: 0.02, z: -0.12, parent: head });
  const cap = mk(new THREE.SphereGeometry(0.172, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), PAL.avocado, { y: 0.02, parent: head, ol: 0.018 });
  cap.geometry = flat(cap.geometry);
  box(0.26, 0.03, 0.16, 0x456a02, { y: 0.04, z: 0.16, parent: head, ol: 0.012 });
  box(0.03, 0.05, 0.02, PAL.ink, { x: -0.055, y: -0.02, z: 0.15, parent: head, cast: false });
  box(0.03, 0.05, 0.02, PAL.ink, { x: 0.055, y: -0.02, z: 0.15, parent: head, cast: false });
  ico(0.03, 0, skin, { y: -0.05, z: 0.17, parent: head });

  for (const sx of [-1, 1]) {
    box(0.08, 0.08, 0.24, khaki, { x: sx * 0.21, y: 0.26, z: 0.1, parent: upper, ol: 0.015 });
    box(0.09, 0.1, 0.09, 0xd9a62a, { x: sx * 0.2, y: 0.24, z: 0.27, parent: upper, ol: 0.015 });
  }

  const parcel = new THREE.Group();
  parcel.position.set(0, 0.26, 0.3);
  upper.add(parcel);
  box(0.36, 0.28, 0.26, 0xb07a45, { parent: parcel, ol: 0.02 });
  box(0.365, 0.04, 0.265, 0xe8d9b0, { parent: parcel, cast: false });
  const label = signPlane(0.26, 0.11, ["OUTCOME"], { bg: 0xc89a62, fg: PAL.ibm, border: 0xb07a45, px: 400 });
  label.position.set(0, -0.05, 0.132);
  parcel.add(label);

  return { root, legs, upper, parcel, head };
}

/** Customer blob (porch resident / space accounts-payable). */
export function buildBlob(k, { body = 0x8db03a, robe = PAL.burnt, helmet = false, mug = true } = {}) {
  const { cyl, ico, mk } = k;
  const g = new THREE.Group();
  const b = ico(0.3, 1, body, { y: 0.48, parent: g, ol: 0.02 });
  b.scale.set(1, 1.3, 1);
  cyl(0.28, 0.34, 0.36, 8, robe, { y: 0.2, parent: g, ol: 0.02 });
  ico(0.12, 1, 0xffffff, { y: 0.62, z: 0.22, parent: g, ol: 0.012 });
  const pupil = ico(0.055, 0, PAL.ink, { y: 0.62, z: 0.32, parent: g, cast: false });
  cyl(0.015, 0.015, 0.26, 4, PAL.ink, { y: 0.98, parent: g });
  ico(0.05, 0, PAL.harvest, { y: 1.12, parent: g });
  if (mug) cyl(0.06, 0.06, 0.11, 7, PAL.cream, { x: 0.3, y: 0.42, z: 0.12, parent: g, ol: 0.012 });
  if (helmet) {
    const glass = new THREE.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.28, depthWrite: false });
    mk(new THREE.SphereGeometry(0.46, 12, 8), glass, { y: 0.62, parent: g, cast: false, recv: false });
    cyl(0.36, 0.36, 0.06, 10, PAL.harvest, { y: 0.3, parent: g });
  }
  return { root: g, pupil, held: null };
}

/** Parcel handed to the customer on delivery. */
export function buildHeldParcel(k) {
  const parcel = new THREE.Group();
  k.box(0.36, 0.28, 0.26, 0xb07a45, { parent: parcel, ol: 0.02 });
  k.box(0.365, 0.04, 0.265, 0xe8d9b0, { parent: parcel, cast: false });
  return parcel;
}

export function buildCar(k, color, sentient) {
  const { box, cyl, ico } = k;
  const g = new THREE.Group();
  box(1.7, 0.32, 0.82, color, { y: 0.28, parent: g, ol: 0.025 });
  box(1.72, 0.06, 0.84, PAL.cream, { y: 0.3, parent: g });
  box(0.9, 0.24, 0.72, 0x2c4a6b, { x: -0.05, y: 0.56, parent: g, ol: 0.02 });
  box(1.0, 0.06, 0.8, PAL.cream, { x: -0.05, y: 0.71, parent: g, ol: 0.015 });
  for (const sz of [-1, 1]) {
    box(0.38, 0.16, 0.05, color, { x: -0.72, y: 0.48, z: sz * 0.36, rz: 0.35, parent: g, ol: 0.012 });
    for (const sx of [-1, 1]) cyl(0.15, 0.15, 0.1, 10, 0x2a2a2a, { x: sx * 0.55, y: 0.15, z: sz * 0.42, rx: Math.PI / 2, parent: g });
    ico(0.06, 0, 0xfff6c8, { x: 0.86, y: 0.3, z: sz * 0.28, parent: g });
  }
  for (const sx of [-1, 1]) box(0.06, 0.1, 0.88, 0xcfd3d6, { x: sx * 0.87, y: 0.2, parent: g });
  const pupils = [];
  if (sentient) {
    for (const sz of [-1, 1]) {
      ico(0.11, 1, 0xffffff, { x: 0.4, y: 0.6, z: sz * 0.17, parent: g, ol: 0.012 });
      pupils.push(ico(0.05, 0, PAL.ink, { x: 0.5, y: 0.61, z: sz * 0.17, parent: g, cast: false }));
    }
  }
  return { root: g, pupils };
}

export function buildPortal(k) {
  const { box, canvasTex, signPlane } = k;
  const g = new THREE.Group();
  const frame = PAL.cream;
  box(0.12, 1.5, 0.12, frame, { base: true, z: -0.45, parent: g, ol: true });
  box(0.12, 1.5, 0.12, frame, { base: true, z: 0.45, parent: g, ol: true });
  box(0.14, 0.14, 1.04, PAL.harvest, { y: 1.55, parent: g, ol: true });
  const glow = canvasTex(128, 256, (c, W, H) => {
    const grd = c.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, H * 0.6);
    grd.addColorStop(0, "#fff6d0");
    grd.addColorStop(0.35, "#daa520");
    grd.addColorStop(1, "#cc5500");
    c.fillStyle = grd;
    c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(255,248,220,0.55)";
    c.lineWidth = 3;
    for (let r = 14; r < H; r += 22) {
      c.beginPath();
      c.ellipse(W / 2, H / 2, r * 0.5, r, 0, 0, Math.PI * 2);
      c.stroke();
    }
  });
  glow.wrapT = THREE.RepeatWrapping;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.42), new THREE.MeshBasicMaterial({ map: glow, side: THREE.DoubleSide }));
  plane.position.y = 0.73;
  plane.rotation.y = Math.PI / 2;
  g.add(plane);
  const sign = signPlane(1.1, 0.32, ["BOX 407-B"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
  sign.position.set(0.08, 1.85, 0);
  sign.rotation.y = Math.PI / 2;
  g.add(sign);
  return { root: g, plane };
}

export function buildGoal(k, name) {
  const { canvasTex, stampSprite } = k;
  const g = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: PAL.harvest, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.46, 28), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(ring);
  const discTex = canvasTex(256, 256, (c, W) => {
    c.fillStyle = "#f5ecd7";
    c.beginPath();
    c.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#cc5500";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = 'bold 54px "Courier New", monospace';
    c.fillText("RCPT", W / 2, W / 2);
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.29, 24), new THREE.MeshBasicMaterial({ map: discTex }));
  disc.rotation.x = -Math.PI / 2;
  disc.rotation.z = Math.PI / 4;
  disc.position.y = 0.015;
  g.add(disc);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.44, 2.4, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: PAL.harvest, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.y = 1.2;
  g.add(beam);
  const sprite = stampSprite("OUT / RCPT", `DELIVER TO: ${name}`);
  sprite.position.y = 2.25;
  g.add(sprite);
  return { root: g, ring, sprite };
}

export function lollipopTree(k, parent, x, y, z) {
  k.cyl(0.05, 0.08, 0.7, 6, 0x6b4325, { base: true, x, y, z, parent, ol: 0.015 });
  const c = k.ico(0.42, 0, 0x6f9e1e, { x, y: y + 0.95, z, parent, ol: 0.022 });
  c.rotation.y = x * 1.7;
  k.ico(0.26, 0, 0x86b22c, { x: x + 0.12, y: y + 1.3, z: z + 0.05, parent, ol: 0.018 });
}

export function cypressTree(k, parent, x, y, z) {
  k.cyl(0.05, 0.06, 0.25, 5, 0x6b4325, { base: true, x, y, z, parent });
  k.cyl(0.0, 0.3, 1.25, 7, 0x3f6a12, { base: true, x, y: y + 0.18, z, parent, ol: 0.02 });
}

/** Trims on every void-facing tile edge (rails on `catwalk` tiles) — for worlds floating over a void. */
export function voidTrims(ctx, color = PAL.harvest) {
  const { k, group: G, tileAt } = ctx;
  const trims = [];
  for (const t of ctx.tiles.flat()) {
    if (t.void) continue;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (tileAt(t.c + dc, t.r + dr).void) trims.push({ t, dc, dr });
    }
  }
  if (!trims.length) return;
  const trimMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), k.toon(color), trims.length * 2);
  trimMesh.castShadow = true;
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (const { t, dc, dr } of trims) {
    const y = tileTop(t);
    const ex = t.c + dc * 0.47;
    const ez = t.r + dr * 0.47;
    const along = dc === 0;
    if (t.catwalk) {
      m4.makeScale(along ? 1 : 0.05, 0.05, along ? 0.05 : 1).setPosition(ex, y + 0.34, ez);
      trimMesh.setMatrixAt(i++, m4);
      m4.makeScale(0.05, 0.34, 0.05).setPosition(ex, y + 0.17, ez);
      trimMesh.setMatrixAt(i++, m4);
    } else {
      m4.makeScale(along ? 1 : 0.06, 0.07, along ? 0.06 : 1).setPosition(ex, y + 0.035, ez);
      trimMesh.setMatrixAt(i++, m4);
    }
  }
  trimMesh.count = i;
  G.add(trimMesh);
}

export function signpost(k, parent, x, y, z, lines, opts) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.PI / 4;
  k.cyl(0.04, 0.04, 1.1, 6, 0x6b4325, { base: true, x: -0.45, parent: g });
  k.cyl(0.04, 0.04, 1.1, 6, 0x6b4325, { base: true, x: 0.45, parent: g });
  k.box(1.24, 0.56, 0.06, PAL.burnt, { y: 1.02, parent: g, ol: 0.02 });
  const s = k.signPlane(1.16, 0.48, lines, opts);
  s.position.set(0, 1.02, 0.035);
  g.add(s);
  parent.add(g);
  return g;
}
