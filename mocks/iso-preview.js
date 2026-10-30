// D.O.N.T. Ship — isometric low-poly preview (standalone mock, not wired to the game).
import * as THREE from "three";

const PAL = {
  avocado: 0x568203,
  harvest: 0xdaa520,
  burnt: 0xcc5500,
  cream: 0xf5ecd7,
  ibm: 0x1f4e79,
  ink: 0x1a1f16,
};

const LV = 0.3; // world units per height level
const STEP = LV * 1.05; // max walk-up without jumping
const SPEED = 3.3;
const RADIUS = 0.24;

/* ------------------------------------------------------------------ */
/* Renderer / scene / camera                                           */
/* ------------------------------------------------------------------ */

const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
const CAM_OFFSET = new THREE.Vector3(40, 40, 40);
let viewHalfH = 7.2;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  const a = w / h;
  camera.left = -viewHalfH * a;
  camera.right = viewHalfH * a;
  camera.top = viewHalfH;
  camera.bottom = -viewHalfH;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
window.addEventListener(
  "wheel",
  (e) => {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.55, 2.2);
    camera.updateProjectionMatrix();
  },
  { passive: true }
);

const hemi = new THREE.HemisphereLight(0xfff3d6, 0x6b5a3a, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1d0, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -15;
sun.shadow.camera.right = 15;
sun.shadow.camera.top = 15;
sun.shadow.camera.bottom = -15;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.radius = 3;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-2.2, 8, 5).normalize();

/* ------------------------------------------------------------------ */
/* Materials & mesh helpers                                            */
/* ------------------------------------------------------------------ */

const gradientMap = new THREE.DataTexture(new Uint8Array([105, 185, 255]), 3, 1, THREE.RedFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.generateMipmaps = false;
gradientMap.needsUpdate = true;

const toonCache = new Map();
function toon(color) {
  if (!toonCache.has(color)) toonCache.set(color, new THREE.MeshToonMaterial({ color, gradientMap }));
  return toonCache.get(color);
}
const inkMat = new THREE.MeshBasicMaterial({ color: PAL.ink, side: THREE.BackSide });

function flat(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
}

function outline(mesh, t = 0.022) {
  const geo = mesh.geometry;
  geo.computeBoundingBox();
  const s = new THREE.Vector3();
  geo.boundingBox.getSize(s);
  const hull = new THREE.Mesh(geo, inkMat);
  hull.scale.set((s.x + 2 * t) / Math.max(s.x, 1e-3), (s.y + 2 * t) / Math.max(s.y, 1e-3), (s.z + 2 * t) / Math.max(s.z, 1e-3));
  hull.castShadow = false;
  hull.receiveShadow = false;
  mesh.add(hull);
  return mesh;
}

/** Generic mesh: position is the geometry center unless `base` is set (then y is the bottom). */
function mk(geo, color, o = {}) {
  const mat = typeof color === "number" ? toon(color) : color;
  const m = new THREE.Mesh(geo, mat);
  m.position.set(o.x || 0, o.y || 0, o.z || 0);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  m.castShadow = o.cast !== false;
  m.receiveShadow = o.recv !== false;
  if (o.ol) outline(m, typeof o.ol === "number" ? o.ol : undefined);
  if (o.parent) o.parent.add(m);
  return m;
}
const box = (w, h, d, color, o = {}) => mk(new THREE.BoxGeometry(w, h, d), color, { ...o, y: (o.y || 0) + (o.base ? h / 2 : 0) });
const cyl = (rt, rb, h, seg, color, o = {}) =>
  mk(flat(new THREE.CylinderGeometry(rt, rb, h, seg)), color, { ...o, y: (o.y || 0) + (o.base ? h / 2 : 0) });
const ico = (r, detail, color, o = {}) => mk(flat(new THREE.IcosahedronGeometry(r, detail)), color, o);

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const hex = (n) => "#" + n.toString(16).padStart(6, "0");

/** Flat sign board with text. Faces +z by default. */
function signPlane(w, h, lines, { bg = PAL.cream, fg = PAL.ibm, border = PAL.burnt, px = 220 } = {}) {
  const tex = canvasTex(Math.round(w * px), Math.round(h * px), (g, W, H) => {
    g.fillStyle = hex(bg);
    g.fillRect(0, 0, W, H);
    g.strokeStyle = hex(border);
    g.lineWidth = H * 0.07;
    g.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
    g.textAlign = "center";
    g.textBaseline = "middle";
    const n = lines.length;
    lines.forEach((ln, i) => {
      const big = i === 0;
      g.font = `bold ${Math.round(H * (big ? 0.34 : 0.19) * (n === 1 ? 1.25 : 1))}px "Courier New", monospace`;
      g.fillStyle = hex(big ? fg : border);
      const y = n === 1 ? H / 2 : H * (big ? 0.4 : 0.4 + 0.28 * i);
      g.fillText(ln, W / 2, y, W * 0.9);
    });
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  return m;
}

function stampSprite(title, sub, { w = 2.0, color = PAL.burnt } = {}) {
  const tex = canvasTex(512, 256, (g, W, H) => {
    g.fillStyle = "rgba(245,236,215,0.96)";
    g.fillRect(14, 14, W - 28, H - 28);
    g.strokeStyle = hex(color);
    g.lineWidth = 12;
    g.strokeRect(20, 20, W - 40, H - 40);
    g.lineWidth = 4;
    g.strokeRect(40, 40, W - 80, H - 80);
    g.fillStyle = hex(color);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = 'bold 76px "Courier New", monospace';
    g.fillText(title, W / 2, H * 0.44, W * 0.82);
    g.fillStyle = hex(PAL.ibm);
    g.font = 'bold 26px "Courier New", monospace';
    g.fillText(sub, W / 2, H * 0.72, W * 0.82);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  s.scale.set(w, w / 2, 1);
  s.renderOrder = 10;
  return s;
}

/* ------------------------------------------------------------------ */
/* Prop builders                                                       */
/* ------------------------------------------------------------------ */

function buildCourier() {
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

function buildBlob({ body = 0x8db03a, robe = PAL.burnt, helmet = false, mug = true } = {}) {
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
  return { root: g, pupil };
}

function buildCar(color, sentient) {
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

function buildPortal() {
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

function buildGoal(name) {
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

function lollipopTree(parent, x, y, z) {
  cyl(0.05, 0.08, 0.7, 6, 0x6b4325, { base: true, x, y, z, parent, ol: 0.015 });
  const c = ico(0.42, 0, 0x6f9e1e, { x, y: y + 0.95, z, parent, ol: 0.022 });
  c.rotation.y = x * 1.7;
  ico(0.26, 0, 0x86b22c, { x: x + 0.12, y: y + 1.3, z: z + 0.05, parent, ol: 0.018 });
}

function cypressTree(parent, x, y, z) {
  cyl(0.05, 0.06, 0.25, 5, 0x6b4325, { base: true, x, y, z, parent });
  cyl(0.0, 0.3, 1.25, 7, 0x3f6a12, { base: true, x, y: y + 0.18, z, parent, ol: 0.02 });
}

function signpost(parent, x, y, z, lines, opts) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = Math.PI / 4;
  cyl(0.04, 0.04, 1.1, 6, 0x6b4325, { base: true, x: -0.45, parent: g });
  cyl(0.04, 0.04, 1.1, 6, 0x6b4325, { base: true, x: 0.45, parent: g });
  box(1.24, 0.56, 0.06, PAL.burnt, { y: 1.02, parent: g, ol: 0.02 });
  const s = signPlane(1.16, 0.48, lines, opts);
  s.position.set(0, 1.02, 0.035);
  g.add(s);
  parent.add(g);
  return g;
}

/* ------------------------------------------------------------------ */
/* World definitions                                                   */
/* ------------------------------------------------------------------ */

const PORCH = {
  id: "world_porch",
  label: "Suburban Porch-3",
  manifest: "DN-1001-A · DOOR A",
  prob: 0.78,
  tier: "EASY",
  tags: ["SENTIENT TRAFFIC", "SPRINKLER (MOCK)", "MAILBOX KNOWS YOUR NAME"],
  customer: "R. GLORBO",
  bodyClass: "",
  gravity: -22,
  jumpV: 5.6,
  baseY: -1.0,
  edge: "solid",
  view: 7.2,
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
    a: { h: 0, top: 0x4a4850, side: 0x3a383f, jitter: 0.02 },
  },
  lights: { sky: 0xfff3d6, ground: 0x6b5a3a, hemi: 1.5, sun: 0xfff1d0, sunI: 2.6 },
  decorate: decoratePorch,
};

const SPACE = {
  id: "world_space",
  label: "Deep Space Docklet",
  manifest: "DN-1515-F · DOOR C",
  prob: 0.12,
  tier: "BRUTAL",
  tags: ["LOW GRAVITY", "BLACK-HOLE SLOT", "PORTAL WIND"],
  customer: "ZORP-7, ACCTS PAYABLE",
  bodyClass: "space",
  gravity: -8.5,
  jumpV: 4.4,
  baseY: null,
  edge: "void",
  view: 7.6,
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
  decorate: decorateSpace,
};

const WORLDS = { 1: PORCH, 2: SPACE };

/* ------------------------------------------------------------------ */
/* World build                                                         */
/* ------------------------------------------------------------------ */

let world = null;
let worldGroup = null;
let tiles = [];
let hazards = [];
let animators = [];
let startPos = null;
let goalTile = null;
let goalFx = null;
let customer = null;

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const tileTop = (t) => t.h * LV;

function buildWorld(def) {
  if (worldGroup) {
    scene.remove(worldGroup);
    worldGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
  world = def;
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  hazards = [];
  animators = [];
  document.body.className = def.bodyClass;
  hemi.color.setHex(def.lights.sky);
  hemi.groundColor.setHex(def.lights.ground);
  hemi.intensity = def.lights.hemi;
  sun.color.setHex(def.lights.sun);
  sun.intensity = def.lights.sunI;
  viewHalfH = def.view;
  resize();

  const rows = def.grid.length;
  const cols = def.grid[0].length;
  const rnd = rand(def.id.length * 977);
  tiles = def.grid.map((line, r) =>
    [...line.padEnd(cols, " ")].map((ch, c) => {
      const L = def.legend[ch];
      if (!L) console.warn("Unknown tile", ch, r, c);
      return { ...(L || { void: true }), ch, c, r };
    })
  );

  const solidTiles = tiles.flat().filter((t) => !t.void);
  const capGeo = new THREE.BoxGeometry(0.97, 0.1, 0.97);
  const colGeo = new THREE.BoxGeometry(1, 1, 1);
  const caps = new THREE.InstancedMesh(capGeo, toon(0xffffff), solidTiles.length);
  const columns = new THREE.InstancedMesh(colGeo, toon(0xffffff), solidTiles.length);
  caps.receiveShadow = columns.receiveShadow = true;
  caps.castShadow = columns.castShadow = true;
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  solidTiles.forEach((t, i) => {
    const top = tileTop(t);
    m4.makeTranslation(t.c, top - 0.05, t.r);
    caps.setMatrixAt(i, m4);
    col.setHex(t.top);
    if (t.jitter) col.offsetHSL(0, 0, (rnd() - 0.5) * t.jitter);
    if (t.checker && (t.c + t.r) % 2) col.offsetHSL(0, 0, -t.checker);
    caps.setColorAt(i, col);
    const bottom = def.baseY ?? top - 0.45;
    const hgt = top - 0.08 - bottom;
    m4.makeScale(1, hgt, 1).setPosition(t.c, bottom + hgt / 2, t.r);
    columns.setMatrixAt(i, m4);
    col.setHex(t.side);
    columns.setColorAt(i, col);
  });
  worldGroup.add(caps, columns);

  if (def.baseY != null) {
    box(cols + 0.2, 0.35, rows + 0.2, 0x5c3a20, { x: (cols - 1) / 2, y: def.baseY - 0.35, z: (rows - 1) / 2, base: true, parent: worldGroup });
    box(cols + 0.3, 0.12, rows + 0.3, PAL.burnt, { x: (cols - 1) / 2, y: def.baseY - 0.47, z: (rows - 1) / 2, base: true, parent: worldGroup });
  }

  for (const t of tiles.flat()) {
    if (t.start) startPos = new THREE.Vector3(t.c, tileTop(t), t.r);
    if (t.goal) goalTile = t;
    if (t.prop) buildProp(t, rnd);
  }

  goalFx = buildGoal(def.customer);
  goalFx.root.position.set(goalTile.c, tileTop(goalTile), goalTile.r);
  worldGroup.add(goalFx.root);

  def.decorate(rnd);

  const center = new THREE.Vector3((cols - 1) / 2, 0, (rows - 1) / 2);
  sun.target.position.copy(center);
  sun.position.copy(center).addScaledVector(SUN_DIR, 30);

  updateHud();
  respawn(true);
}

function buildProp(t, rnd) {
  const x = t.c;
  const z = t.r;
  const y = tileTop(t);
  const G = worldGroup;
  switch (t.prop) {
    case "hedge": {
      const shade = new THREE.Color(0x4d7a16).offsetHSL(0, 0, (rnd() - 0.5) * 0.05).getHex();
      box(0.98, 0.42 + rnd() * 0.12, 0.98, shade, { base: true, x, y, z, parent: G });
      break;
    }
    case "lollipop":
      lollipopTree(G, x, y, z);
      break;
    case "cypress":
      cypressTree(G, x, y, z);
      break;
    case "flowers":
      for (let i = 0; i < 6; i++) {
        const fx = x + (rnd() - 0.5) * 0.7;
        const fz = z + (rnd() - 0.5) * 0.7;
        cyl(0.01, 0.02, 0.18, 4, 0x3f6a12, { base: true, x: fx, y, z: fz, parent: G, cast: false });
        ico(0.07, 0, [PAL.burnt, PAL.harvest, PAL.cream][i % 3], { x: fx, y: y + 0.2, z: fz, parent: G });
      }
      break;
    case "mailbox": {
      cyl(0.04, 0.04, 0.55, 5, 0xe8dcc0, { base: true, x, y, z, parent: G, ol: 0.012 });
      const mb = new THREE.Group();
      mb.position.set(x, y + 0.6, z);
      mb.rotation.y = Math.PI / 4;
      G.add(mb);
      box(0.24, 0.16, 0.38, PAL.ibm, { parent: mb, ol: 0.018 });
      cyl(0.12, 0.12, 0.38, 8, PAL.ibm, { y: 0.08, rx: Math.PI / 2, parent: mb, ol: 0.018 });
      box(0.02, 0.22, 0.05, PAL.burnt, { x: 0.13, y: 0.18, z: -0.08, parent: mb, ol: 0.01 });
      ico(0.075, 1, 0xffffff, { y: 0.06, z: 0.2, parent: mb, ol: 0.01 });
      const pupil = ico(0.035, 0, PAL.ink, { y: 0.06, z: 0.26, parent: mb, cast: false });
      animators.push(() => {
        const local = mb.worldToLocal(player.pos.clone().add(new THREE.Vector3(0, 0.6, 0)));
        local.sub(new THREE.Vector3(0, 0.06, 0.2)).normalize().multiplyScalar(0.06);
        pupil.position.set(local.x, 0.06 + local.y, 0.2 + Math.max(0.03, local.z));
      });
      break;
    }
    case "sign":
      if (world === PORCH) signpost(G, x, y, z, ["PORCH-3", "POP. ∞ · EST. Ω"]);
      else signpost(G, x, y, z, ["LOW-G ZONE", "HOLD PARCEL FIRMLY"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.harvest });
      break;
    case "portal": {
      const p = buildPortal();
      p.root.position.set(x, y, z);
      G.add(p.root);
      animators.push((time) => {
        p.plane.material.map.offset.y = (time * 0.25) % 1;
      });
      break;
    }
    case "crate": {
      box(0.78, 0.6, 0.78, 0xb07a45, { base: true, x, y, z, parent: G, ol: 0.02 });
      box(0.79, 0.07, 0.79, 0xe8d9b0, { base: true, x, y: y + 0.27, z, parent: G, cast: false });
      const top = box(0.5, 0.4, 0.5, PAL.ibm, { base: true, x: x - 0.05, y: y + 0.6, z: z + 0.05, parent: G, ol: 0.02 });
      top.rotation.y = 0.4;
      for (const [lx, lz, ry] of [[x + 0.395, z, Math.PI / 2], [x, z + 0.395, 0]]) {
        const lbl = signPlane(0.5, 0.22, ["FRAGILE", "THIS WAY UP ↑"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ink, px: 260 });
        lbl.position.set(lx + (ry ? 0.003 : 0), y + 0.4, lz + (ry ? 0 : 0.003));
        lbl.rotation.y = ry;
        G.add(lbl);
      }
      break;
    }
    case "antenna": {
      cyl(0.05, 0.08, 1.4, 6, 0xcfd3d6, { base: true, x, y, z, parent: G, ol: 0.015 });
      const dish = mk(flat(new THREE.SphereGeometry(0.5, 10, 4, 0, Math.PI * 2, 0, Math.PI / 3)), PAL.cream, { x, y: y + 1.45, z, parent: G, ol: 0.02 });
      dish.material = toon(PAL.cream).clone();
      dish.material.side = THREE.DoubleSide;
      dish.rotation.set(Math.PI * 0.85, 0, 0.5);
      const blink = ico(0.07, 0, PAL.harvest, { x, y: y + 1.5, z, parent: G });
      animators.push((time) => {
        dish.rotation.y = time * 0.4;
        blink.visible = Math.sin(time * 4) > 0;
      });
      break;
    }
    case "airlock": {
      cyl(0.48, 0.48, 1.5, 10, PAL.cream, { base: true, x, y, z, parent: G, ol: 0.025 });
      cyl(0.5, 0.5, 0.18, 10, PAL.ibm, { base: true, x, y: y + 0.9, z, parent: G });
      const dome = mk(flat(new THREE.SphereGeometry(0.48, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2)), PAL.harvest, { x, y: y + 1.5, z, parent: G, ol: 0.02 });
      dome.castShadow = true;
      cyl(0.3, 0.3, 0.05, 12, PAL.burnt, { x: x + 0.47, y: y + 0.55, z, rz: Math.PI / 2, parent: G, ol: 0.015 });
      cyl(0.13, 0.13, 0.06, 10, 0x2c4a6b, { x: x + 0.49, y: y + 0.62, z, rz: Math.PI / 2, parent: G });
      const s = signPlane(1.3, 0.34, ["AIRLOCK 7 · RECEIVING"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest });
      s.position.set(x + 0.1, y + 2.25, z + 0.1);
      s.rotation.y = Math.PI / 4;
      G.add(s);
      break;
    }
    case "vent": {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      G.add(g);
      for (let i = -2; i <= 2; i++) box(0.8, 0.03, 0.06, PAL.harvest, { x: 0, y: 0.015, z: i * 0.15, parent: g, cast: false });
      hazards.push(portalWind(g, new THREE.Vector2(0, 1)));
      break;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Per-world decoration + hazards                                      */
/* ------------------------------------------------------------------ */

function decoratePorch(rnd) {
  const G = worldGroup;
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
  const parked = buildCar(0x3f8f8a, false);
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
    animators.push((time) => (cg.position.x = cx + Math.sin(time * 0.2 + cx) * 0.4));
  }

  // Customer on porch.
  customer = buildBlob();
  customer.root.position.set(5, 3 * LV, 5);
  customer.root.rotation.y = 0.35;
  G.add(customer.root);

  // Hazards: sentient traffic + rotating lawn sprinkler.
  hazards.push(trafficCar(0x1f4e79, 12.1, -1, 3.4, 4));
  hazards.push(trafficCar(PAL.burnt, 12.9, 1, 2.6, 11));
  hazards.push(sprinkler(8, LV, 9, 3.1));
}

function decorateSpace(rnd) {
  const G = worldGroup;

  // Trims / rails on every edge that faces the void.
  const trims = [];
  for (const t of tiles.flat()) {
    if (t.void) continue;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = tileAt(t.c + dc, t.r + dr);
      if (!n.void) continue;
      trims.push({ t, dc, dr });
    }
  }
  const trimMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), toon(PAL.harvest), trims.length * 2);
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
    animators.push((time) => {
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
  const bbs = signPlane(1.6, 0.62, ["J.E.V. SAYS", "ODDS 0.12  :)"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ibm });
  bbs.position.set(0, 1.75, 0.035);
  bb.add(bbs);

  // Customer at the airlock.
  customer = buildBlob({ body: 0x8db03a, robe: PAL.cream, helmet: true, mug: false });
  customer.root.position.set(3, 2 * LV, 2);
  customer.root.rotation.y = 0.5;
  G.add(customer.root);

  hazards.push(blackHole(8, 0.2, 6.5, 4.4));
}

/* ------------------------------------------------------------------ */
/* Hazards                                                             */
/* ------------------------------------------------------------------ */

function trafficCar(color, z, dir, speed, phase) {
  const car = buildCar(color, true);
  car.root.rotation.y = dir > 0 ? 0 : Math.PI;
  worldGroup.add(car.root);
  const span = 20;
  let x = (phase % span) - 1;
  return {
    update(t, dt) {
      x += dir * speed * dt;
      if (x > 18.5) x -= span;
      if (x < -1.5) x += span;
      const edge = Math.min(x + 0.6, 17.6 - x);
      car.root.visible = edge > 0;
      car.root.scale.setScalar(THREE.MathUtils.clamp(edge / 0.9, 0.01, 1));
      car.root.position.set(x, Math.abs(Math.sin(t * 9 + phase)) * 0.03, z);
      for (const p of car.pupils) p.position.z = Math.sign(p.position.z) * 0.17 + THREE.MathUtils.clamp((player.pos.z - z) * 0.03, -0.04, 0.04) * dir;
    },
    check(p) {
      if (car.root.visible && Math.abs(p.x - x) < 1.0 && Math.abs(p.z - z) < 0.55 && p.y < 1.0) return "SENTIENT TRAFFIC";
      return null;
    },
  };
}

function sprinkler(x, y, z, R) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  worldGroup.add(g);
  cyl(0.08, 0.1, 0.14, 7, 0xcfd3d6, { base: true, parent: g, ol: 0.012 });
  const head = new THREE.Group();
  head.position.y = 0.16;
  g.add(head);
  const dropMat = new THREE.MeshBasicMaterial({ color: 0x9ed3ea, transparent: true, opacity: 0.85 });
  const drops = [];
  for (let k = 0; k < 3; k++)
    for (let i = 1; i <= 9; i++) {
      const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055 + i * 0.004, 0), dropMat);
      d.userData = { f: i / 9, k: k - 1 };
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
  const SPIN = 1.25;
  let ang = 0;
  return {
    update(t) {
      ang = t * SPIN;
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

function blackHole(x, y, z, R) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  worldGroup.add(g);
  mk(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: 0x05030a }), { parent: g, cast: false, recv: false });
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
  const label = stampSprite("BLACK-HOLE SLOT", "NOT THE CUSTOMER. PROBABLY.", { w: 1.8, color: PAL.ink });
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
      const s = 2.6 * (1 - d / R) ** 1.3;
      return { x: (dx / d) * s, z: (dz / d) * s };
    },
    check(p) {
      return Math.hypot(p.x - x, p.z - z) < 0.75 && Math.abs(p.y - y) < 1.2 ? "BLACK-HOLE SLOT" : null;
    },
  };
}

function portalWind(g, dir) {
  const puffs = [];
  const mat = new THREE.MeshBasicMaterial({ color: PAL.cream, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), mat);
    m.userData = { o: i / 14, lx: ((i * 37) % 7) / 7 - 0.5 };
    g.add(m);
    puffs.push(m);
  }
  const PERIOD = 3.6;
  const ON = 1.6;
  let active = false;
  const wx = g.position.x;
  const wz = g.position.z;
  return {
    update(t) {
      active = t % PERIOD < ON;
      for (const m of puffs) {
        m.visible = active;
        const ph = (t * 1.6 + m.userData.o) % 1;
        m.position.set(m.userData.lx * 0.7 + dir.x * ph * 2.4, 0.1 + ph * 0.5, m.userData.lx * 0.3 + dir.y * ph * 2.4);
      }
    },
    force(p) {
      if (!active) return null;
      const d = Math.hypot(p.x - wx, p.z - wz);
      if (d > 1.4) return null;
      return { x: dir.x * 4.2, z: dir.y * 4.2 };
    },
    check() {
      return null;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Player                                                              */
/* ------------------------------------------------------------------ */

const courier = buildCourier();
scene.add(courier.root);

const player = {
  pos: new THREE.Vector3(),
  vy: 0,
  grounded: true,
  yaw: -Math.PI * 0.75,
  displayY: 0,
  walkPhase: 0,
  walkAmt: 0,
  state: "transit", // transit | delivered | lost
  stateT: 0,
  invuln: 0,
};

function tileAt(c, r) {
  if (r < 0 || r >= tiles.length || c < 0 || c >= tiles[0].length) return world.edge === "void" ? { void: true } : { solid: true, h: 99 };
  return tiles[r][c];
}
const tileUnder = (x, z) => tileAt(Math.round(x), Math.round(z));
function groundAt(x, z) {
  const t = tileUnder(x, z);
  return t.void ? -Infinity : tileTop(t);
}
function canOccupy(x, z, y) {
  for (const [ox, oz] of [[-RADIUS, -RADIUS], [RADIUS, -RADIUS], [-RADIUS, RADIUS], [RADIUS, RADIUS]]) {
    const t = tileUnder(x + ox, z + oz);
    if (t.solid) return false;
    if (!t.void && tileTop(t) > y + STEP) return false;
  }
  return true;
}

function respawn(silent) {
  player.pos.copy(startPos);
  player.displayY = startPos.y;
  player.vy = 0;
  player.grounded = true;
  player.yaw = -Math.PI * 0.75;
  player.state = "transit";
  player.invuln = silent ? 0 : 1.2;
  courier.parcel.visible = true;
  if (customer && customer.held) customer.held.visible = false;
  camTarget.copy(player.pos);
  setParcel("IN TRANSIT", "");
  if (silent) hideStamp();
}

function fail(cause) {
  if (player.state !== "transit" || player.invuln > 0) return;
  player.state = "lost";
  player.stateT = 1.6;
  setParcel(cause === "VOID" ? "LOST TO THE VOID" : `DAMAGED · ${cause}`, "bad");
  showStamp(
    cause === "VOID" ? "LOST IN TRANSIT" : "PARCEL DAMAGED",
    `${cause === "VOID" ? "FELL INTO THE VOID" : cause} — stake forfeited (mock: respawning)`,
    false
  );
}

function deliver() {
  player.state = "delivered";
  player.stateT = 3.2;
  courier.parcel.visible = false;
  const mult = 1 / world.prob - 0.05;
  setParcel("DELIVERED", "good");
  showStamp("DELIVERED", `STAKE 10 × ${mult.toFixed(2)} = ${(10 * mult).toFixed(1)} C.O.D. · O.D.D.S. logged`, true);
  if (!customer.held) {
    const parcel = new THREE.Group();
    box(0.36, 0.28, 0.26, 0xb07a45, { parent: parcel, ol: 0.02 });
    box(0.365, 0.04, 0.265, 0xe8d9b0, { parent: parcel, cast: false });
    parcel.position.set(0, 1.25, 0);
    customer.root.add(parcel);
    customer.held = parcel;
  }
  customer.held.visible = true;
}

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

const keys = new Set();
let jumpQueued = false;
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  if (k === " " && !e.repeat) jumpQueued = true;
  if (k === "1" || k === "2") buildWorld(WORLDS[k]);
  if (k === "r") respawn(true);
  keys.add(k);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());

function inputDir() {
  const ix = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  const iy = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
  // Screen right = world (1,0,-1); screen up = world (-1,0,-1).
  const v = new THREE.Vector2(ix - iy, -ix - iy);
  if (v.lengthSq() > 0) v.normalize();
  return v;
}

/* ------------------------------------------------------------------ */
/* HUD                                                                 */
/* ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
function updateHud() {
  $("hud-universe").textContent = `UNIVERSE: ${world.label}`;
  $("hud-manifest").textContent = `MANIFEST ${world.manifest} · TIER ${world.tier}`;
  $("hud-odds").textContent = `DISPLAYED p ${world.prob.toFixed(2)} · PAYOUT ×${(1 / world.prob - 0.05).toFixed(2)} · STAKE 10`;
  $("hud-tags").innerHTML = world.tags.map((t) => `<span>${t}</span>`).join("");
}
function setParcel(text, cls) {
  const el = $("hud-parcel");
  el.textContent = text;
  el.className = cls;
}
let stampTimer = 0;
function showStamp(title, sub, good) {
  const s = $("stamp");
  s.innerHTML = `${title}<small>${sub}</small>`;
  s.className = "stamp show" + (good ? " good" : "");
  stampTimer = good ? 3.0 : 1.5;
}
function hideStamp() {
  $("stamp").className = "stamp";
}

/* ------------------------------------------------------------------ */
/* Loop                                                                */
/* ------------------------------------------------------------------ */

const camTarget = new THREE.Vector3();
const clock = new THREE.Clock();
let time = 0;

function step(dt) {
  time += dt;
  const p = player.pos;

  if (player.state === "transit") {
    player.invuln = Math.max(0, player.invuln - dt);
    const dir = inputDir();
    let mx = dir.x * SPEED * dt;
    let mz = dir.y * SPEED * dt;
    for (const h of hazards) {
      const f = h.force?.(p);
      if (f) {
        mx += f.x * dt;
        mz += f.z * dt;
      }
    }
    if (canOccupy(p.x + mx, p.z, p.y)) p.x += mx;
    if (canOccupy(p.x, p.z + mz, p.y)) p.z += mz;

    if (jumpQueued && player.grounded) {
      player.vy = world.jumpV;
      player.grounded = false;
    }
    jumpQueued = false;

    const ground = groundAt(p.x, p.z);
    if (player.grounded) {
      if (ground >= p.y - STEP && ground !== -Infinity) p.y = ground;
      else player.grounded = false;
    }
    if (!player.grounded) {
      player.vy += world.gravity * dt;
      p.y += player.vy * dt;
      if (p.y <= ground) {
        p.y = ground;
        player.vy = 0;
        player.grounded = true;
      }
    }

    const moving = dir.lengthSq() > 0;
    if (moving) {
      const target = Math.atan2(dir.x, dir.y);
      let d = target - player.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      player.yaw += d * Math.min(1, dt * 14);
      player.walkPhase += dt * 11;
    }
    player.walkAmt = THREE.MathUtils.lerp(player.walkAmt, moving ? 1 : 0, Math.min(1, dt * 10));

    if (p.y < -3.5) fail("VOID");
    for (const h of hazards) {
      const cause = h.check(p);
      if (cause) fail(cause);
    }
    const tu = tileUnder(p.x, p.z);
    if (tu === goalTile && player.grounded) deliver();
  } else {
    player.stateT -= dt;
    if (player.state === "lost" && !player.grounded) {
      player.vy += world.gravity * dt * 0.5;
      if (p.y > -6) p.y += player.vy * dt;
    }
    if (player.stateT <= 0) respawn(false);
  }

  for (const h of hazards) h.update(time, dt);
  for (const a of animators) a(time, dt);

  // Courier pose.
  player.displayY = player.grounded ? THREE.MathUtils.lerp(player.displayY, p.y, Math.min(1, dt * 18)) : p.y;
  courier.root.position.set(p.x, player.displayY, p.z);
  courier.root.rotation.y = player.yaw;
  const swing = Math.sin(player.walkPhase) * 0.65 * player.walkAmt;
  if (player.grounded) {
    courier.legs[0].rotation.x = swing;
    courier.legs[1].rotation.x = -swing;
  } else {
    courier.legs[0].rotation.x = -0.6;
    courier.legs[1].rotation.x = 0.3;
  }
  const bob = Math.sin(time * 3.2) * 0.012 + Math.abs(Math.sin(player.walkPhase)) * 0.03 * player.walkAmt;
  courier.upper.position.y = 0.36 + bob;
  courier.upper.rotation.x = 0.08 * player.walkAmt;
  const floaty = world === SPACE ? 0.05 : 0.012;
  courier.parcel.position.y = 0.26 + Math.sin(time * 2.4) * floaty;
  courier.parcel.rotation.z = Math.sin(time * 1.7) * (world === SPACE ? 0.12 : 0.03);
  courier.root.visible = player.invuln > 0 ? Math.floor(time * 12) % 2 === 0 : true;

  // Goal + customer.
  goalFx.ring.scale.setScalar(1 + Math.sin(time * 4) * 0.08);
  goalFx.sprite.position.y = 2.25 + Math.sin(time * 2) * 0.08;
  const hop = player.state === "delivered" ? Math.abs(Math.sin(time * 9)) * 0.25 : 0;
  customer.root.position.y = (world === PORCH ? 3 : 2) * LV + Math.abs(Math.sin(time * 2.2)) * 0.03 + hop;
  customer.root.rotation.z = Math.sin(time * 1.6) * 0.05;

  if (stampTimer > 0) {
    stampTimer -= dt;
    if (stampTimer <= 0) hideStamp();
  }

  // Camera follow.
  camTarget.lerp(new THREE.Vector3(p.x, Math.max(0, p.y) * 0.6, p.z), Math.min(1, dt * 4));
  camera.position.copy(camTarget).add(CAM_OFFSET);
  camera.lookAt(camTarget);
}

function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  step(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

buildWorld(WORLDS[new URLSearchParams(location.search).get("world") === "space" ? 2 : 1]);
camTarget.copy(player.pos);
frame();

window.__iso = {
  player,
  setWorld: (n) => buildWorld(WORLDS[n]),
  teleport: (c, r) => {
    const t = tileAt(c, r);
    player.pos.set(c, tileTop(t), r);
    player.displayY = player.pos.y;
  },
};
