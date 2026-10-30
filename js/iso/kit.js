// Low-poly toon kit: materials, mesh helpers, CanvasTexture signage.
// One kit per run so everything it allocates can be disposed with the run.
import * as THREE from "three";

export const PAL = {
  avocado: 0x568203,
  harvest: 0xdaa520,
  burnt: 0xcc5500,
  cream: 0xf5ecd7,
  ibm: 0x1f4e79,
  ink: 0x1a1f16,
};

/** World units per tile height level. */
export const LV = 0.3;

export const hex = (n) => "#" + n.toString(16).padStart(6, "0");

export function createKit() {
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
    hull.scale.set(
      (s.x + 2 * t) / Math.max(s.x, 1e-3),
      (s.y + 2 * t) / Math.max(s.y, 1e-3),
      (s.z + 2 * t) / Math.max(s.z, 1e-3)
    );
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
  const box = (w, h, d, color, o = {}) =>
    mk(new THREE.BoxGeometry(w, h, d), color, { ...o, y: (o.y || 0) + (o.base ? h / 2 : 0) });
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
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
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

  function dispose() {
    for (const m of toonCache.values()) m.dispose();
    toonCache.clear();
    inkMat.dispose();
    gradientMap.dispose();
  }

  return { toon, inkMat, flat, outline, mk, box, cyl, ico, canvasTex, signPlane, stampSprite, dispose };
}

/** Free GPU resources for every mesh/material/texture under `root`. */
export function disposeTree(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const key of ["map", "gradientMap", "alphaMap", "emissiveMap"]) m[key]?.dispose();
      m.dispose();
    }
    if (o.isInstancedMesh) o.dispose();
  });
}
