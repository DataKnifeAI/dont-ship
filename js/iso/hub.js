// Box 407-B door hall: a low-poly iso room drawn by the shared renderer with the same kit as the runs
// (toon shading, ink outlines, canvas-texture signage). Three doors carry the manifest's odds; Wally, the
// J.E.V. odds terminal and the Fen poster dress the room. Small print lives in DOM tickets under each door.
//
//   const hub = createHub({ stage, onPick, onHover, images: { fenLogo } })
//   hub.show() / hub.hide() · hub.setDoors(cards, { manifestId, parcel }) · hub.setDoors(null)
//   hub.setInteractive(bool) · hub.setFraming("title" | "hub") · hub.enterDoor(i) → Promise · hub.markResult(i, ok)
import * as THREE from "three";
import { createKit, disposeTree, hex, PAL } from "./kit.js";
import { buildCourier } from "./props.js";
import { ensureShared } from "./shared.js";

const W = 12; // back wall length (x)
const D = 6.4; // floor depth (z)
const WALL_H = 4.1;
const DOOR = { w: 1.5, h: 2.6 };
const DOOR_X = [1.9, 4.5, 7.1];
const OLIVE = 0x6f7f3a;
const OLIVE_DK = 0x4c5a24;
const FRAME = 0x55652c;
const WOOD = 0xc47c36;
const STEEL = 0x56616a;
const DANGER = 0x8b1e1e;
const TIER_INK = { easy: PAL.avocado, hard: PAL.burnt, brutal: DANGER };
const TIER_GLOW = { easy: ["#fff8dc", "#b5d36a", "#568203"], hard: ["#fff6d0", "#f0b050", "#cc5500"], brutal: ["#ffe8d8", "#e0703a", "#8b1e1e"] };
/** Camera: orthographic, 30° elevation, yawed 24° off the door wall so signage stays legible. */
const ELEV = THREE.MathUtils.degToRad(30);
const YAW = THREE.MathUtils.degToRad(-24);
const CAM_OFFSET = new THREE.Vector3(Math.cos(ELEV) * Math.sin(YAW), Math.sin(ELEV), Math.cos(ELEV) * Math.cos(YAW)).multiplyScalar(40);
const FRAMES = {
  hub: { target: new THREE.Vector3(6.15, 1.55, 2.5), w: 13.4, h: 7.6 },
  title: { target: new THREE.Vector3(3.3, 1.55, 2.6), w: 14.6, h: 8.2 },
};
const COURIER_HOME = new THREE.Vector3(6.0, 0, 4.3);
const WALLY_POS = new THREE.Vector3(9.55, 0, 1.25);
const BG = "radial-gradient(ellipse at 40% 30%, #fbf4e2 0%, #efe0bd 55%, #d4bd8c 100%)";

const FONT = '"Futura", "Century Gothic", "Avenir Next", "Fira Sans Condensed", "DejaVu Sans Condensed", "Trebuchet MS", sans-serif';
const MONO = '"Courier New", "Courier Prime", "DejaVu Sans Mono", monospace';

export function createHub({ stage, onPick, onHover, images = {} } = {}) {
  const sh = ensureShared();
  const { renderer, layer, canvas } = sh;
  const k = createKit();
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
  const root = new THREE.Group();
  scene.add(root);

  const hemi = new THREE.HemisphereLight(0xfff4dc, 0x8a6a3a, 1.35);
  const sun = new THREE.DirectionalLight(0xffe6bf, 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 3;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 80 });
  const center = new THREE.Vector3(W / 2, 0, D / 2);
  sun.target.position.copy(center);
  sun.position.copy(center).addScaledVector(new THREE.Vector3(-3.2, 8, 5.5).normalize(), 30);
  scene.add(hemi, sun, sun.target);

  buildRoom(k, root, images);
  const doors = DOOR_X.map((x, i) => buildDoor(k, root, x, i));
  const wally = buildWally(k);
  wally.root.position.copy(WALLY_POS);
  wally.root.rotation.y = -0.55;
  root.add(wally.root);
  const podium = buildPodium(k, root);
  const jev = buildJev(k, root);
  const courier = buildCourier(k);
  courier.root.position.copy(COURIER_HOME);
  courier.root.rotation.y = -0.5;
  root.add(courier.root);

  /* ---------------- DOM: tickets + help line ---------------- */
  const ui = document.createElement("div");
  ui.className = "hub-ui";
  ui.innerHTML = `<div class="hub-tickets"></div>`;
  layer.appendChild(ui);
  const ticketsEl = ui.querySelector(".hub-tickets");
  let tickets = [];

  /* ---------------- State ---------------- */
  let cards = null;
  let interactive = false;
  let visible = false;
  let hover = -1;
  let entering = null; // { i, t, resolve, from }
  let framing = "hub";
  const camTarget = FRAMES.hub.target.clone();
  let camW = FRAMES.hub.w;
  let camH = FRAMES.hub.h;
  let raf = 0;
  let last = 0;
  let time = 0;
  let resultStamp = null;

  /* ---------------- Doors: signage per manifest ---------------- */
  function setDoors(next, info = {}) {
    cards = next && next.length ? next : null;
    entering = null;
    clearResult();
    doors.forEach((d, i) => {
      const card = cards?.[i] || null;
      d.card = card;
      d.open = 0;
      d.target = 0;
      setMap(d.headerMat, headerTexture(k, card, String.fromCharCode(65 + i)));
      setMap(d.stampMat, stampTexture(k, card, i));
      setMap(d.glowMat, glowTexture(k, card?.tier || "easy"));
      d.glowMat.color.setHex(0xffffff);
    });
    setMap(jev.screenMat, jevTexture(k, cards, info.manifestId));
    setMap(podium.labelMat, parcelTexture(k, info.parcel || []));
    courier.root.position.copy(COURIER_HOME);
    courier.parcel.visible = true;
    renderTickets();
    setHover(-1);
  }

  function renderTickets() {
    ticketsEl.replaceChildren();
    tickets = [];
    if (!cards) return;
    cards.forEach((c, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `ticket tier-${c.tier}`;
      el.innerHTML = `
        <span class="ticket-head"><kbd>${i + 1}</kbd><span class="ticket-door">${esc(c.id)} · <b>${esc(c.prob)}</b> · ${esc(c.payout)}</span><span class="ticket-tier">${esc(c.tier.toUpperCase())}</span></span>
        <span class="ticket-tags">${c.tags.map((t) => `<i>${esc(t)}</i>`).join("")}</span>
        <span class="ticket-text">${esc(c.text)}</span>`;
      el.addEventListener("mouseenter", () => setHover(i));
      el.addEventListener("mouseleave", () => setHover(-1));
      el.addEventListener("focus", () => setHover(i));
      el.addEventListener("click", () => pick(i));
      ticketsEl.appendChild(el);
      tickets.push(el);
    });
    placeTickets();
  }

  const v3 = new THREE.Vector3();
  const view = { w: 960, h: 540 };
  function toScreen(x, y, z) {
    v3.set(x, y, z).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * view.w, y: (-v3.y * 0.5 + 0.5) * view.h };
  }
  function placeTickets() {
    if (!tickets.length) return;
    const a = toScreen(0, 0, 0);
    const b = toScreen(2.6, 0, 0);
    const width = Math.min(300, Math.hypot(b.x - a.x, b.y - a.y) * 0.94);
    tickets.forEach((el, i) => {
      const p = toScreen(DOOR_X[i], 0, 0.3);
      el.style.width = `${width}px`;
      el.style.transform = `translate(${Math.round(p.x - width / 2)}px, ${Math.round(p.y)}px)`;
    });
  }

  function setHover(i) {
    if (entering) return;
    if (!cards || !interactive) i = -1;
    if (i === hover) return;
    hover = i;
    tickets.forEach((el, j) => el.classList.toggle("hot", j === i));
    canvas.style.cursor = i >= 0 ? "pointer" : "";
    onHover?.(i);
  }

  function pick(i) {
    if (!cards || !interactive || entering) return;
    onPick?.(i);
  }

  /** Door swings open, courier walks in; resolves when the run should start. */
  function enterDoor(i) {
    return new Promise((resolve) => {
      if (!visible || !doors[i]) return resolve();
      hover = i;
      tickets.forEach((el, j) => el.classList.toggle("hot", j === i));
      entering = { i, t: 0, resolve, from: courier.root.position.clone() };
      podium.stampT = 0.5;
    });
  }

  function markResult(i, delivered) {
    clearResult();
    if (!doors[i]) return;
    resultStamp = k.stampSprite(delivered ? "DELIVERED" : "FORFEIT", delivered ? "J.E.V. NOTES YOUR OPTIMISM" : "STAKE ABSORBED BY THE HOUSE", {
      w: 1.9,
      color: delivered ? PAL.avocado : DANGER,
    });
    resultStamp.position.set(DOOR_X[i], DOOR.h * 0.62, 0.5);
    resultStamp.material.rotation = -0.12;
    root.add(resultStamp);
  }
  function clearResult() {
    if (!resultStamp) return;
    root.remove(resultStamp);
    disposeTree(resultStamp);
    resultStamp = null;
  }

  /* ---------------- Input ---------------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hits = doors.map((d) => d.hit);
  function doorAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    return hit ? hit.object.userData.door : -1;
  }
  const onMove = (e) => visible && setHover(doorAt(e));
  const onLeave = () => setHover(-1);
  const onClick = (e) => {
    if (!visible) return;
    const i = doorAt(e);
    if (i >= 0) pick(i);
  };

  /* ---------------- Camera / resize ---------------- */
  function applyCamera() {
    const aspect = view.w / view.h;
    const half = Math.max(camH / 2, camW / 2 / aspect);
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.position.copy(camTarget).add(CAM_OFFSET);
    camera.lookAt(camTarget);
    camera.updateProjectionMatrix();
  }
  function resize() {
    view.w = layer.clientWidth || 960;
    view.h = layer.clientHeight || 540;
    renderer.setSize(view.w, view.h, false);
    applyCamera();
    placeTickets();
  }
  const ro = new ResizeObserver(() => visible && resize());

  function setFraming(name, instant = false) {
    framing = FRAMES[name] ? name : "hub";
    if (instant) {
      const f = FRAMES[framing];
      camTarget.copy(f.target);
      camW = f.w;
      camH = f.h;
      if (visible) resize();
    }
  }

  /* ---------------- Loop ---------------- */
  const tmp = new THREE.Vector3();
  function step(dt) {
    time += dt;
    const f = FRAMES[framing];
    const ease = Math.min(1, dt * 3.2);
    if (camTarget.distanceToSquared(f.target) > 1e-6 || Math.abs(camW - f.w) > 1e-3) {
      camTarget.lerp(f.target, ease);
      camW += (f.w - camW) * ease;
      camH += (f.h - camH) * ease;
      applyCamera();
    }

    // Doors: hover peeks open, entering swings wide.
    doors.forEach((d, i) => {
      d.target = entering?.i === i ? 1.75 : hover === i ? 0.42 : 0;
      d.open += (d.target - d.open) * Math.min(1, dt * (entering ? 6 : 9));
      d.hinge.rotation.y = -d.open;
      d.spillMat.opacity = Math.min(0.75, d.open * 0.55);
      const hot = hover === i;
      d.frameMat.color.setHex(hot ? PAL.harvest : FRAME);
      d.header.scale.setScalar(1 + (hot ? 0.06 + Math.sin(time * 6) * 0.015 : 0));
      d.glowMat.color.setScalar(0.85 + Math.sin(time * 3 + i) * 0.15);
    });

    // Courier: idle bob, faces the hovered door, walks in when entering.
    const c = courier.root.position;
    let face = -0.5;
    if (entering) {
      entering.t += dt;
      const goal = tmp.set(DOOR_X[entering.i], 0, 0.45);
      const u = Math.min(1, entering.t / 0.75);
      c.lerpVectors(entering.from, goal, u * u * (3 - 2 * u));
      face = Math.atan2(goal.x - entering.from.x, goal.z - entering.from.z);
      const walk = Math.sin(entering.t * 16) * 0.6 * (u < 1 ? 1 : 0);
      courier.legs[0].rotation.x = walk;
      courier.legs[1].rotation.x = -walk;
      courier.root.scale.setScalar(1 - Math.max(0, u - 0.7) * 1.2);
      if (entering.t >= 0.95) {
        const { resolve } = entering;
        entering = null;
        courier.root.scale.setScalar(1);
        resolve();
      }
    } else {
      courier.legs[0].rotation.x = courier.legs[1].rotation.x = 0;
      if (hover >= 0) face = Math.atan2(DOOR_X[hover] - c.x, 0 - c.z);
    }
    let dy = face - courier.root.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    courier.root.rotation.y += dy * Math.min(1, dt * 10);
    courier.upper.position.y = 0.36 + Math.sin(time * 3.2) * 0.012;
    courier.parcel.position.y = 0.26 + Math.sin(time * 2.4) * 0.01;

    // Wally: sleepy blink, looks at the hovered door, stamps on a pick.
    const look = hover >= 0 ? Math.atan2(DOOR_X[hover] - WALLY_POS.x, 0.6 - WALLY_POS.z) - wally.root.rotation.y : 0.25 + Math.sin(time * 0.5) * 0.25;
    const lookC = THREE.MathUtils.clamp(Math.atan2(Math.sin(look), Math.cos(look)), -1.5, 1.2);
    wally.neck.rotation.y += (lookC * 0.35 - wally.neck.rotation.y) * Math.min(1, dt * 5);
    wally.head.rotation.y += (lookC * 0.65 - wally.head.rotation.y) * Math.min(1, dt * 5);
    wally.head.rotation.z = Math.sin(time * 0.9) * 0.06;
    wally.body.position.y = 1.08 + Math.sin(time * 1.6) * 0.012;
    const blink = (time % 4.2) < 0.14 ? 1.9 : 1;
    for (const lid of wally.lids) lid.scale.y = blink;
    if (podium.stampT > 0) podium.stampT = Math.max(0, podium.stampT - dt);
    podium.stamp.position.y = podium.stampY + (podium.stampT > 0 ? Math.abs(Math.sin(podium.stampT * Math.PI * 2)) * -0.08 + 0.12 : 0);

    jev.animate(time);
    if (resultStamp) resultStamp.position.y = DOOR.h * 0.62 + Math.sin(time * 2) * 0.03;
    placeTickets();
  }

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    step(dt);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  function show() {
    if (stage && layer.parentElement !== stage) stage.appendChild(layer);
    layer.dataset.mode = "hub";
    layer.classList.remove("space");
    layer.style.background = BG;
    layer.hidden = false;
    if (visible) return;
    visible = true;
    courier.root.position.copy(COURIER_HOME);
    courier.root.scale.setScalar(1);
    doors.forEach((d) => (d.open = d.target = 0));
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    ro.observe(layer);
    resize();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame((now) => {
      last = now;
      frame(now);
    });
  }

  function hide() {
    if (!visible) return;
    visible = false;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("click", onClick);
    canvas.style.cursor = "";
    ro.disconnect();
    renderer.renderLists.dispose();
    if (entering) {
      const { resolve } = entering;
      entering = null;
      resolve();
    }
  }

  function setInteractive(on) {
    interactive = !!on;
    if (!interactive) setHover(-1);
    tickets.forEach((el) => (el.disabled = !interactive));
  }

  setDoors(null);
  setFraming("hub", true);

  const api = {
    show,
    hide,
    setDoors,
    setInteractive,
    setFraming,
    enterDoor,
    markResult,
    get visible() {
      return visible;
    },
    get hover() {
      return hover;
    },
    /** Dev: hover a door as if pointed at; returns the door's screen rect (CSS px, relative to the stage). */
    hoverDoor(i) {
      setHover(i);
      return api.doorRect(i);
    },
    doorRect(i) {
      const d = doors[i];
      if (!d) return null;
      const pts = [
        toScreen(DOOR_X[i] - DOOR.w / 2, 0, 0.1),
        toScreen(DOOR_X[i] + DOOR.w / 2, 0, 0.1),
        toScreen(DOOR_X[i] - DOOR.w / 2, DOOR.h, 0.1),
        toScreen(DOOR_X[i] + DOOR.w / 2, DOOR.h, 0.1),
      ];
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    },
    snapshot(type = "image/jpeg", quality = 0.88) {
      renderer.render(scene, camera);
      return canvas.toDataURL(type, quality);
    },
  };
  window.__isoHub = api;
  return api;
}

/* ====================================================================== */
/* Room                                                                    */
/* ====================================================================== */

function buildRoom(k, G, images) {
  const { box, cyl, signPlane } = k;

  // Floor: cream linoleum tiles on a slab, burnt-orange base trim (same diorama base as the runs).
  box(W + 0.3, 0.5, D + 0.3, 0x8a7f68, { base: true, x: W / 2 - 0.15, y: -0.56, z: D / 2 - 0.15, parent: G });
  box(W + 0.42, 0.12, D + 0.42, PAL.burnt, { base: true, x: W / 2 - 0.15, y: -0.68, z: D / 2 - 0.15, parent: G });
  const n = W * Math.ceil(D);
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.965, 0.08, 0.965), k.toon(0xffffff), n);
  tiles.receiveShadow = true;
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  let i = 0;
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < Math.ceil(D); z++) {
      const depth = Math.min(1, D - z);
      m4.makeScale(1, 1, depth).setPosition(x + 0.5, -0.04, z + depth / 2);
      tiles.setMatrixAt(i, m4);
      col.setHex((x + z) % 2 ? 0xe9dcb8 : 0xf3e8cc).offsetHSL(0, 0, (((x * 7 + z * 13) % 5) - 2) * 0.006);
      tiles.setColorAt(i++, col);
    }
  }
  G.add(tiles);

  // IBM-blue guide stripe with a harvest pinline, running the length of the hall.
  box(W, 0.012, 0.42, PAL.ibm, { x: W / 2, y: 0.006, z: 2.75, parent: G, cast: false });
  box(W, 0.014, 0.06, PAL.harvest, { x: W / 2, y: 0.007, z: 3.08, parent: G, cast: false });

  // Back wall: cream over olive wainscot for the door run, all olive for Wally's bay (x > 8.4).
  const bay = 8.45;
  box(bay, WALL_H, 0.3, 0xefe4c8, { base: true, x: bay / 2, z: -0.15, parent: G, ol: 0.02 });
  box(W - bay + 0.3, WALL_H, 0.3, OLIVE, { base: true, x: (bay + W + 0.3) / 2, z: -0.15, parent: G, ol: 0.02 });
  box(bay, 1.15, 0.04, OLIVE, { base: true, x: bay / 2, z: 0.02, parent: G });
  box(W - bay, 1.15, 0.04, OLIVE_DK, { base: true, x: (bay + W) / 2, z: 0.02, parent: G });
  box(W, 0.08, 0.08, PAL.harvest, { base: true, x: W / 2, y: 1.15, z: 0.04, parent: G });
  box(W, 0.14, 0.06, 0x2f3a18, { base: true, x: W / 2, z: 0.03, parent: G, cast: false });
  box(0.16, WALL_H, 0.12, OLIVE_DK, { base: true, x: bay, z: 0.04, parent: G, ol: 0.015 });

  // Right wall (olive), wall-top caps for the cut-away diorama look.
  box(0.3, WALL_H, D + 0.3, OLIVE, { base: true, x: W + 0.15, z: D / 2 - 0.15, parent: G, ol: 0.02 });
  box(0.04, 1.15, D, OLIVE_DK, { base: true, x: W - 0.02, z: D / 2, parent: G });
  box(0.08, 0.08, D, PAL.harvest, { base: true, x: W - 0.04, y: 1.15, z: D / 2, parent: G });
  box(W + 0.42, 0.12, 0.42, OLIVE_DK, { base: true, x: W / 2 + 0.06, y: WALL_H, z: -0.15, parent: G, ol: 0.015 });
  box(0.42, 0.12, D + 0.42, OLIVE_DK, { base: true, x: W + 0.15, y: WALL_H, z: D / 2 - 0.15, parent: G, ol: 0.015 });

  // BOX 407-B plaque over Wally's bay.
  box(2.7, 0.66, 0.08, PAL.ink, { x: 10.1, y: 3.3, z: 0.04, parent: G });
  const plaque = signPlane(2.6, 0.56, ["BOX 407-B", "DOORWAY DISPATCH · COURIERS ONLY"], { bg: OLIVE_DK, fg: PAL.harvest, border: PAL.cream, px: 260 });
  plaque.position.set(10.1, 3.3, 0.085);
  G.add(plaque);

  // Fen poster (the logo is the logo — framed like the mock's wall seal).
  box(1.5, 1.5, 0.08, PAL.cream, { x: 10.95, y: 2.0, z: 0.04, parent: G, ol: 0.02 });
  box(1.58, 0.07, 0.1, PAL.ibm, { x: 10.95, y: 2.78, z: 0.05, parent: G });
  box(1.58, 0.07, 0.1, PAL.ibm, { x: 10.95, y: 1.22, z: 0.05, parent: G });
  const fenTex = images.fenLogo ? new THREE.Texture(images.fenLogo) : fenFallback(k);
  fenTex.colorSpace = THREE.SRGBColorSpace;
  fenTex.needsUpdate = true;
  const fen = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.36), new THREE.MeshBasicMaterial({ map: fenTex, color: 0xf2ece0 }));
  fen.position.set(10.95, 2.0, 0.085);
  G.add(fen);

  // Wall clock between doors B and C: TIME: APPROXIMATE.
  const clock = new THREE.Group();
  clock.position.set(5.8, 3.62, 0.04);
  G.add(clock);
  cyl(0.24, 0.24, 0.06, 16, PAL.cream, { rx: Math.PI / 2, parent: clock, ol: 0.02 });
  for (const [len, rz, c] of [[0.15, 0.6, PAL.ink], [0.2, -1.9, PAL.burnt]]) {
    const h = box(0.025, len, 0.01, c, { parent: clock, cast: false });
    h.geometry.translate(0, len / 2, 0);
    h.position.z = 0.04;
    h.rotation.z = rz;
  }

  // Foreground: railing along the front-right edge, crates, a parcel stack by door A.
  const railY = 0.95;
  box(5.2, 0.07, 0.07, PAL.harvest, { x: 9.4, y: railY, z: D - 0.2, parent: G, ol: 0.012 });
  box(5.2, 0.05, 0.05, STEEL, { x: 9.4, y: railY * 0.5, z: D - 0.2, parent: G });
  for (let x = 6.9; x <= 12.01; x += 1.27) cyl(0.04, 0.04, railY, 6, STEEL, { base: true, x, z: D - 0.2, parent: G, ol: 0.01 });
  box(0.86, 0.72, 0.86, 0xb07a45, { base: true, x: 11.3, z: 4.9, ry: 0.15, parent: G, ol: 0.02 });
  box(0.6, 0.5, 0.6, 0xc89a62, { base: true, x: 11.25, y: 0.72, z: 4.85, ry: -0.25, parent: G, ol: 0.018 });
  const crateSign = signPlane(0.62, 0.26, ["THIS WAY UP", "(ALLEGEDLY)"], { bg: PAL.cream, fg: PAL.burnt, border: PAL.ink, px: 300 });
  crateSign.position.set(11.3, 0.4, 5.34);
  crateSign.rotation.y = 0.15;
  G.add(crateSign);
  for (const [x, y, z, s, r, c] of [[0.55, 0, 4.4, 0.55, 0.2, 0xb07a45], [0.6, 0.44, 4.38, 0.42, -0.3, 0xc89a62], [1.15, 0, 4.9, 0.4, 0.5, 0xc89a62]]) {
    box(s, s * 0.8, s, c, { base: true, x, y, z, ry: r, parent: G, ol: 0.015 });
  }
}

function fenFallback(k) {
  return k.canvasTex(256, 256, (g, S) => {
    g.fillStyle = "#f5ecd7";
    g.fillRect(0, 0, S, S);
    g.strokeStyle = "#568203";
    g.lineWidth = 14;
    g.beginPath();
    g.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#1f4e79";
    g.font = `bold 64px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("FEN", S / 2, S / 2);
  });
}

/* ====================================================================== */
/* Doors                                                                   */
/* ====================================================================== */

function buildDoor(k, G, x, i) {
  const { box, ico } = k;
  const g = new THREE.Group();
  g.position.set(x, 0, 0);
  G.add(g);

  // Frame (own material so hover can tint it).
  const frameMat = new THREE.MeshToonMaterial({ color: FRAME, gradientMap: k.toon(FRAME).gradientMap });
  const fw = 0.16;
  box(fw, DOOR.h + fw, 0.24, frameMat, { base: true, x: -DOOR.w / 2 - fw / 2, z: 0.09, parent: g, ol: 0.018 });
  box(fw, DOOR.h + fw, 0.24, frameMat, { base: true, x: DOOR.w / 2 + fw / 2, z: 0.09, parent: g, ol: 0.018 });
  box(DOOR.w + fw * 2, fw, 0.24, frameMat, { x: 0, y: DOOR.h + fw / 2, z: 0.09, parent: g, ol: 0.018 });

  // Doorway glow behind the slab (pocket-universe light) + floor light spill when open.
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.w, DOOR.h), glowMat);
  glow.position.set(0, DOOR.h / 2, 0.012);
  g.add(glow);
  const spillMat = new THREE.MeshBasicMaterial({ map: spillTexture(k), transparent: true, opacity: 0, depthWrite: false });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.w * 1.25, 1.8), spillMat);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.012, 0.95);
  g.add(spill);

  // Slab on a left hinge; swings out into the hall.
  const hinge = new THREE.Group();
  hinge.position.set(-DOOR.w / 2, 0, 0.07);
  g.add(hinge);
  box(DOOR.w - 0.02, DOOR.h - 0.01, 0.08, WOOD, { base: true, x: DOOR.w / 2, parent: hinge, ol: 0.014 });
  box(DOOR.w - 0.22, 0.16, 0.02, 0xc9a24a, { base: true, x: DOOR.w / 2, y: 0.08, z: 0.045, parent: hinge, cast: false });
  box(0.07, 0.28, 0.03, STEEL, { x: DOOR.w - 0.17, y: 1.18, z: 0.05, parent: hinge, cast: false });
  ico(0.06, 0, PAL.harvest, { x: DOOR.w - 0.17, y: 1.2, z: 0.1, parent: hinge, ol: 0.01 });
  const stampMat = new THREE.MeshBasicMaterial({ transparent: true, color: 0xeeeeee, depthWrite: false });
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.w * 0.9, DOOR.w * 0.9 * 1.3), stampMat);
  stamp.position.set(DOOR.w / 2, 1.62, 0.042);
  hinge.add(stamp);

  // Header sign on the wall above the frame.
  const header = new THREE.Group();
  header.position.set(0, DOOR.h + 0.62, 0.06);
  g.add(header);
  box(2.02, 0.88, 0.07, PAL.ink, { parent: header });
  const headerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 0.8), headerMat);
  sign.position.z = 0.04;
  header.add(sign);

  // Click/hover target: door, frame and header sign.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.1, DOOR.h + 1.2, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, (DOOR.h + 1.2) / 2, 0.45);
  hit.userData.door = i;
  g.add(hit);

  return { root: g, hinge, header, hit, frameMat, glowMat, spillMat, stampMat, headerMat, open: 0, target: 0, card: null };
}

function setMap(mat, tex) {
  mat.map?.dispose();
  mat.map = tex;
  mat.needsUpdate = true;
}

function headerTexture(k, card, letter) {
  return k.canvasTex(496, 204, (g, Wd, H) => {
    g.fillStyle = hex(PAL.cream);
    g.fillRect(0, 0, Wd, H);
    const ink = card ? hex(TIER_INK[card.tier] || PAL.burnt) : hex(PAL.ibm);
    g.fillStyle = ink;
    g.fillRect(0, 0, Wd, 14);
    g.fillRect(0, H - 14, Wd, 14);
    // Letter disc
    const r = H * 0.33;
    g.fillStyle = hex(PAL.ibm);
    g.beginPath();
    g.arc(r + 30, H / 2, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = hex(PAL.harvest);
    g.lineWidth = 7;
    g.stroke();
    g.fillStyle = hex(PAL.cream);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `bold ${Math.round(r * 1.25)}px ${FONT}`;
    g.fillText(letter, r + 30, H / 2 + 4);
    const tx = r * 2 + 54;
    const tw = Wd - tx - 18;
    g.textAlign = "left";
    if (!card) {
      g.fillStyle = hex(PAL.burnt);
      g.font = `bold 50px ${FONT}`;
      g.fillText("CLOSED", tx, H * 0.42, tw);
      g.fillStyle = hex(PAL.ibm);
      g.font = `bold 24px ${MONO}`;
      g.fillText("OPENS AT CLOCK-IN", tx, H * 0.72, tw);
      return;
    }
    g.fillStyle = hex(PAL.ibm);
    g.font = `bold 92px ${FONT}`;
    g.fillText(card.prob, tx, H * 0.44, tw);
    g.fillStyle = hex(PAL.burnt);
    g.font = `bold 32px ${MONO}`;
    g.fillText(`PAYS ${card.payout}`, tx, H * 0.79, tw);
  });
}

function stampTexture(k, card, i) {
  return k.canvasTex(300, 390, (g, Wd, H) => {
    if (!card) return;
    const ink = "rgba(204,85,0,0.82)";
    g.save();
    g.translate(Wd / 2, H / 2);
    g.rotate(((i % 2 ? 4 : -5) * Math.PI) / 180);
    g.fillStyle = ink;
    // Rubber-stamp silhouette: knob, neck, block.
    g.beginPath();
    g.arc(0, -H * 0.28, Wd * 0.13, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-Wd * 0.07, -H * 0.2);
    g.lineTo(Wd * 0.07, -H * 0.2);
    g.lineTo(Wd * 0.12, -H * 0.06);
    g.lineTo(-Wd * 0.12, -H * 0.06);
    g.fill();
    roundRect(g, -Wd * 0.3, -H * 0.06, Wd * 0.6, H * 0.07, 6);
    g.fill();
    // Stamped label.
    const bw = Wd * 0.86;
    const bh = H * 0.22;
    g.strokeStyle = ink;
    g.lineWidth = 11;
    roundRect(g, -bw / 2, H * 0.06, bw, bh, 14);
    g.stroke();
    g.font = `bold ${Math.round(bh * 0.62)}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(card.tier.toUpperCase(), 0, H * 0.06 + bh / 2 + 3, bw * 0.84);
    g.restore();
    // Worn-ink speckle.
    g.globalCompositeOperation = "destination-out";
    let s = 1234 + i * 977;
    for (let n = 0; n < 420; n++) {
      s = (s * 16807) % 2147483647;
      const x = (s % 1000) / 1000;
      s = (s * 16807) % 2147483647;
      const y = (s % 1000) / 1000;
      g.fillRect(x * Wd, y * H, 2 + (n % 3), 2 + (n % 2));
    }
  });
}

function glowTexture(k, tier) {
  const [a, b, c] = TIER_GLOW[tier] || TIER_GLOW.easy;
  return k.canvasTex(96, 160, (g, Wd, H) => {
    const grd = g.createRadialGradient(Wd / 2, H * 0.55, 4, Wd / 2, H * 0.55, H * 0.62);
    grd.addColorStop(0, a);
    grd.addColorStop(0.4, b);
    grd.addColorStop(1, c);
    g.fillStyle = grd;
    g.fillRect(0, 0, Wd, H);
    g.strokeStyle = "rgba(255,248,220,0.45)";
    g.lineWidth = 2;
    for (let r = 10; r < H; r += 16) {
      g.beginPath();
      g.ellipse(Wd / 2, H * 0.55, r * 0.55, r, 0, 0, Math.PI * 2);
      g.stroke();
    }
  });
}

function spillTexture(k) {
  return k.canvasTex(64, 128, (g, Wd, H) => {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "rgba(255,236,170,0.95)");
    grd.addColorStop(1, "rgba(255,236,170,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(Wd * 0.12, 0);
    g.lineTo(Wd * 0.88, 0);
    g.lineTo(Wd, H);
    g.lineTo(0, H);
    g.fill();
  });
}

/* ====================================================================== */
/* Wally, podium, J.E.V.                                                   */
/* ====================================================================== */

function buildWally(k) {
  const { box, cyl, ico, signPlane } = k;
  const WHITE = 0xf6f1e4;
  const LEG = 0x2a2a2a;
  const root = new THREE.Group();
  for (const sx of [-0.1, 0.1]) {
    cyl(0.026, 0.026, 0.8, 5, LEG, { base: true, x: sx, parent: root });
    box(0.16, 0.03, 0.22, LEG, { base: true, x: sx, z: 0.05, parent: root });
  }

  const body = new THREE.Group();
  body.position.y = 1.08;
  root.add(body);
  const torso = ico(0.36, 1, WHITE, { parent: body, ol: 0.022 });
  torso.scale.set(0.95, 1.15, 0.85);
  box(0.32, 0.07, 0.3, PAL.ink, { y: -0.12, z: -0.36, rx: -0.55, parent: body });
  for (const sx of [-1, 1]) {
    const wing = ico(0.24, 0, WHITE, { x: sx * 0.33, y: 0.0, z: -0.02, rz: sx * 0.12, parent: body, ol: 0.016 });
    wing.scale.set(0.42, 1.1, 0.95);
  }
  box(0.1, 0.92, 0.04, PAL.avocado, { x: -0.02, y: 0.02, z: 0.27, rz: 0.62, parent: body });
  box(0.035, 0.92, 0.045, PAL.burnt, { x: -0.01, y: 0.02, z: 0.285, rz: 0.62, parent: body });
  box(0.08, 0.3, 0.03, PAL.harvest, { y: 0.14, z: 0.3, rx: -0.3, parent: body, ol: 0.01 });
  ico(0.05, 0, PAL.harvest, { y: 0.3, z: 0.27, parent: body });
  const badge = signPlane(0.24, 0.13, ["WALLY", "SUPERVISOR"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.cream, px: 500 });
  badge.position.set(0.15, 0.08, 0.31);
  badge.rotation.y = 0.25;
  body.add(badge);

  // Clipboard tucked under the left wing.
  const clip = new THREE.Group();
  clip.position.set(-0.34, -0.05, 0.26);
  clip.rotation.set(-0.25, 0.45, 0.18);
  body.add(clip);
  box(0.32, 0.42, 0.03, PAL.burnt, { parent: clip, ol: 0.012 });
  box(0.26, 0.32, 0.01, PAL.cream, { y: -0.02, z: 0.02, parent: clip, cast: false });
  box(0.12, 0.05, 0.04, PAL.ink, { y: 0.2, z: 0.01, parent: clip });

  const neck = new THREE.Group();
  neck.position.y = 1.38;
  root.add(neck);
  cyl(0.07, 0.1, 0.52, 7, WHITE, { base: true, parent: neck, ol: 0.015 });
  const head = new THREE.Group();
  head.position.y = 0.6;
  neck.add(head);
  head.scale.setScalar(1.2);
  const skull = ico(0.17, 1, WHITE, { parent: head, ol: 0.018 });
  skull.scale.set(1, 0.95, 1.05);
  for (const [x, rz] of [[-0.04, 0.4], [0.02, -0.1], [0.07, -0.5]]) k.cyl(0, 0.04, 0.12, 4, WHITE, { x, y: 0.18, rz, parent: head });
  const lids = [];
  for (const sx of [-0.075, 0.075]) {
    ico(0.05, 1, 0xffffff, { x: sx, y: 0.03, z: 0.13, parent: head, cast: false });
    ico(0.024, 0, PAL.ink, { x: sx, y: 0.015, z: 0.172, parent: head, cast: false });
    const lid = box(0.11, 0.045, 0.08, 0xe9e0c8, { x: sx, y: 0.065, z: 0.14, rz: sx > 0 ? -0.18 : 0.18, parent: head, cast: false });
    lid.geometry.translate(0, 0.02, 0);
    lids.push(lid);
  }
  const beak = k.cyl(0, 0.06, 0.55, 6, 0xe8a628, { x: 0, y: -0.07, z: 0.38, rx: Math.PI / 2 + 0.38, parent: head, ol: 0.012 });
  beak.scale.set(1, 1, 0.75);
  return { root, body, neck, head, lids };
}

function buildPodium(k, G) {
  const { box, cyl, signPlane } = k;
  const g = new THREE.Group();
  g.position.set(8.55, 0, 1.95);
  g.rotation.y = -0.3;
  G.add(g);
  box(1.0, 0.95, 0.6, 0xa86828, { base: true, parent: g, ol: 0.02 });
  box(1.1, 0.07, 0.7, PAL.harvest, { base: true, y: 0.95, parent: g, ol: 0.015 });
  box(1.0, 0.1, 0.6, OLIVE_DK, { base: true, parent: g });
  const front = signPlane(0.86, 0.34, ["DOCK SUPERVISOR", "ALL ODDS FINAL"], { bg: PAL.cream, fg: PAL.ibm, border: PAL.burnt, px: 300 });
  front.position.set(0, 0.56, 0.305);
  g.add(front);
  // Parcel awaiting dispatch (label shows the manifest's parcel stamps).
  const parcel = new THREE.Group();
  parcel.position.set(-0.2, 1.02, 0.02);
  parcel.rotation.y = 0.3;
  g.add(parcel);
  box(0.44, 0.32, 0.34, 0xb07a45, { base: true, parent: parcel, ol: 0.016 });
  box(0.445, 0.05, 0.345, 0xe8d9b0, { base: true, y: 0.14, parent: parcel, cast: false });
  const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.15), labelMat);
  label.position.set(0, 0.16, 0.172);
  parcel.add(label);
  // Ink pad + REVIEW stamp.
  box(0.24, 0.04, 0.16, PAL.ink, { base: true, x: 0.3, y: 1.02, z: 0.05, parent: g });
  const stamp = new THREE.Group();
  const stampY = 1.07;
  stamp.position.set(0.3, stampY, 0.05);
  g.add(stamp);
  box(0.2, 0.07, 0.12, PAL.burnt, { base: true, parent: stamp, ol: 0.01 });
  cyl(0.025, 0.035, 0.12, 6, 0x6b4325, { base: true, y: 0.07, parent: stamp });
  k.ico(0.05, 0, 0x6b4325, { y: 0.21, parent: stamp, ol: 0.01 });
  return { root: g, labelMat, stamp, stampY, stampT: 0 };
}

function parcelTexture(k, parcel) {
  const stamps = parcel.length ? parcel : ["STANDARD"];
  return k.canvasTex(272, 120, (g, Wd, H) => {
    g.fillStyle = "#c89a62";
    g.fillRect(0, 0, Wd, H);
    g.fillStyle = hex(PAL.cream);
    g.fillRect(8, 8, Wd - 16, H - 16);
    g.fillStyle = hex(parcel.length ? PAL.burnt : PAL.ibm);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `bold 40px ${MONO}`;
    g.fillText(stamps.join(" · "), Wd / 2, H / 2 + 2, Wd - 28);
  });
}

function buildJev(k, G) {
  const { box, cyl, ico, signPlane } = k;
  const g = new THREE.Group();
  g.position.set(11.25, 0, 2.95);
  g.rotation.y = -1.0;
  G.add(g);
  box(1.4, 2.0, 0.62, 0xd9cfb6, { base: true, parent: g, ol: 0.022 });
  box(1.44, 0.14, 0.66, PAL.ibm, { base: true, y: 2.0, parent: g, ol: 0.015 });
  box(1.4, 0.16, 0.62, OLIVE_DK, { base: true, parent: g });
  box(1.08, 0.78, 0.04, PAL.ink, { x: 0, y: 1.42, z: 0.31, parent: g, ol: 0.012 });
  const screenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.68), screenMat);
  screen.position.set(0, 1.42, 0.335);
  g.add(screen);
  // Tape reels + lamp row.
  const reels = [];
  for (const sx of [-0.3, 0.3]) {
    cyl(0.2, 0.2, 0.04, 14, 0x3a3f4a, { x: sx, y: 0.62, z: 0.32, rx: Math.PI / 2, parent: g, ol: 0.01 });
    const hub = new THREE.Group();
    hub.position.set(sx, 0.62, 0.35);
    g.add(hub);
    for (let s = 0; s < 3; s++) box(0.3, 0.035, 0.012, PAL.cream, { rz: (s * Math.PI) / 3, parent: hub, cast: false });
    reels.push(hub);
  }
  const lamps = [];
  for (let n = 0; n < 6; n++) {
    const base = new THREE.Color([PAL.harvest, PAL.burnt, PAL.avocado][n % 3]);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: base.clone() }));
    lamp.position.set(-0.42 + n * 0.17, 0.96, 0.32);
    lamp.userData.base = base;
    g.add(lamp);
    lamps.push(lamp);
  }
  const title = signPlane(1.36, 0.32, ["J.E.V.", "ODDS POSTED HOURLY · ISH"], { bg: PAL.ibm, fg: PAL.cream, border: PAL.harvest, px: 300 });
  title.position.set(0, 2.38, 0.0);
  g.add(title);
  box(1.42, 0.38, 0.05, PAL.ink, { y: 2.38, z: -0.03, parent: g });
  cyl(0.03, 0.03, 0.2, 5, STEEL, { base: true, x: -0.5, y: 2.12, parent: g });
  cyl(0.03, 0.03, 0.2, 5, STEEL, { base: true, x: 0.5, y: 2.12, parent: g });
  ico(0.07, 0, PAL.burnt, { x: 0.6, y: 2.2, z: 0.2, parent: g });
  return {
    screenMat,
    animate(time) {
      reels[0].rotation.z = time * 1.4;
      reels[1].rotation.z = -time * 0.9;
      lamps.forEach((l, n) => l.material.color.copy(l.userData.base).multiplyScalar(Math.floor(time * 3 + n * 1.7) % 3 ? 1 : 0.35));
    },
  };
}

function jevTexture(k, cards, manifestId) {
  return k.canvasTex(392, 272, (g, Wd, H) => {
    g.fillStyle = "#10261a";
    g.fillRect(0, 0, Wd, H);
    g.fillStyle = "rgba(160,232,112,0.06)";
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, Wd, 2);
    g.fillStyle = "#a6ec7a";
    g.textBaseline = "top";
    g.font = `bold 26px ${MONO}`;
    g.fillText("J.E.V. ODDS FEED", 18, 14);
    g.fillStyle = "#e8c35a";
    g.font = `bold 20px ${MONO}`;
    g.fillText(manifestId ? `MANIFEST ${manifestId}` : "AWAITING CLOCK-IN", 18, 48);
    g.font = `bold 30px ${MONO}`;
    if (cards) {
      cards.forEach((c, n) => {
        g.fillStyle = "#a6ec7a";
        g.fillText(`${c.id}`, 18, 88 + n * 42);
        g.fillText(c.prob.padStart(4, " "), 60, 88 + n * 42);
        g.fillStyle = "#e8c35a";
        g.fillText(c.payout, 180, 88 + n * 42);
      });
    } else {
      g.fillStyle = "#a6ec7a";
      g.fillText("DOORS: SEALED", 18, 100);
      g.fillText("FATE: PENDING", 18, 142);
    }
    g.fillStyle = "rgba(166,236,122,0.7)";
    g.font = `bold 18px ${MONO}`;
    g.fillText("HOUSE EDGE 0.05 · NO REFUNDS", 18, H - 34);
  });
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
