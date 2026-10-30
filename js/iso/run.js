// Iso courier run behind the plan's contract:
//   startRun(roomTemplate, seed, mods) → Promise<{ delivered, cause }>
// One WebGLRenderer (one GL context) is created lazily and reused for every run;
// each run builds its own scene and disposes it (plus listeners) before resolving.
import * as THREE from "three";
import { createRng } from "../rng.js";
import { createKit, disposeTree } from "./kit.js";
import { planHazards } from "./hazardplan.js";
import { spawnHazards } from "./hazards.js";
import { buildTiles, SPEED, STEP, tileTop, walkable } from "./map.js";
import { buildCourier, buildGoal, buildHeldParcel } from "./props.js";
import { ISO_WORLDS, buildProp } from "./worlds.js";
import { ensureShared, isoAvailable } from "./shared.js";

const RADIUS = 0.24;
const CAM_OFFSET = new THREE.Vector3(40, 40, 40);
const SUN_DIR = new THREE.Vector3(-2.2, 8, 5).normalize();
const VOID_Y = -3.5;
/**
 * Downward landing speed that breaks a fragile parcel (world units / s). At normal gravity a
 * jump down 3+ levels breaks it; walking off a ledge or any low-G landing does not.
 */
const FRAGILE_IMPACT = 8.2;
/** Velocity response (1/s): grippy floor and air vs. ice. */
const GRIP = 30;
const ICE_GRIP = 1.6;
/** Seconds the result stamp stays up before the promise resolves. */
const HOLD = { delivered: 2.2, lost: 1.6 };
const SPAWN_GRACE = 0.6;
const BLOCKED_KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", " "];

export { isoAvailable };

export function hasIsoWorld(templateId) {
  return Object.prototype.hasOwnProperty.call(ISO_WORLDS, templateId);
}

/**
 * @param {{ id: string, label?: string }} template room template (with its rooms.json key as `id`)
 * @param {number} seed seeded RNG for cosmetics + hazard phases
 * @param {{ stage: HTMLElement, tier?: string, fragile?: boolean, hazardTags?: string[],
 *           manifestId?: string, doorId?: string, prob?: number, payout?: number, stake?: number,
 *           signal?: AbortSignal }} mods
 * @returns {Promise<{ delivered: boolean, cause: string | null }>}
 */
export function startRun(template, seed, mods = {}) {
  return new Promise((resolve) => {
    const def = ISO_WORLDS[template?.id];
    if (!def) throw new Error(`No iso map for template ${template?.id}`);
    const run = createIsoRun(ensureShared(), def, template, seed >>> 0, mods, resolve);
    mods.signal?.addEventListener("abort", run.abort, { once: true });
  });
}

function createIsoRun(sh, def, template, seed, mods, resolve) {
  const { renderer, layer, canvas, hud } = sh;
  if (mods.stage && layer.parentElement !== mods.stage) mods.stage.appendChild(layer);
  layer.dataset.mode = "run";
  layer.classList.toggle("space", def.space);
  layer.style.background = def.bg || "";

  const tierName = String(mods.tier || "easy").toLowerCase();
  const stake = mods.stake ?? 10;
  const prob = mods.prob ?? null;
  const payout = mods.payout ?? (prob ? 1 / prob - 0.05 : 0);
  const fragile = !!mods.fragile;

  const k = createKit();
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);

  const hemi = new THREE.HemisphereLight(def.lights.sky, def.lights.ground, def.lights.hemi);
  const sun = new THREE.DirectionalLight(def.lights.sun, def.lights.sunI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 3;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun, sun.target);

  const group = new THREE.Group();
  scene.add(group);

  /* ---------------- Map + hazard plan ---------------- */
  const map = buildTiles(def);
  const { rows, cols, tiles, tileAt, tileUnder } = map;
  if (map.unknown.length) console.warn(`Unknown iso tiles in ${def.id}:`, map.unknown.join(""));
  if (!map.start || !map.goal) throw new Error(`Iso map ${def.id} needs a start and a goal tile`);
  const fxRng = createRng(seed ^ 0x9e3779b9);
  const hzRng = createRng(seed);
  const plan = planHazards(def, map, {
    hz: hzRng.next,
    tier: tierName,
    hazardTags: mods.hazardTags,
    modifiers: mods.modifiers,
  });
  if (!plan.routeOk) console.warn(`Iso map ${def.id}: no start→goal route found`);
  const gravity = def.gravity * plan.physics.gravityMul;
  const jumpV = def.jumpV * plan.physics.jumpMul;
  const gone = (t) => t.void || t.gone;

  const half = Math.max(cols, rows) * 0.8 + 2;
  Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 90 });

  const player = {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector2(),
    grip: GRIP,
    vy: 0,
    grounded: true,
    yaw: -Math.PI * 0.75,
    displayY: 0,
    walkPhase: 0,
    walkAmt: 0,
    state: "transit", // transit | delivered | lost
    stateT: 0,
    grace: SPAWN_GRACE,
    cause: null,
  };

  const groundAt = (x, z) => {
    const t = tileUnder(x, z);
    return gone(t) ? -Infinity : tileTop(t);
  };
  const ctx = {
    k,
    group,
    def,
    tiles,
    tileAt,
    tileUnder,
    groundAt,
    /** Can a ground-bound entity at height y step onto (x, z)? */
    canWalk(x, z, y) {
      const t = tileUnder(x, z);
      return walkable(t) && !t.gone && tileTop(t) - y <= STEP && y - tileTop(t) <= 0.95;
    },
    warp: null,
    hazards: [],
    animators: [],
    player,
    rnd: fxRng.next,
    hz: hzRng.next,
    plan,
    route: plan.route,
    prob,
  };

  const solidTiles = tiles.flat().filter((t) => !t.void && !t.dynamic);
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.97, 0.1, 0.97), k.toon(0xffffff), solidTiles.length);
  const columns = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), k.toon(0xffffff), solidTiles.length);
  caps.receiveShadow = columns.receiveShadow = true;
  caps.castShadow = columns.castShadow = true;
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  solidTiles.forEach((t, i) => {
    const top = tileTop(t);
    m4.makeTranslation(t.c, top - 0.05, t.r);
    caps.setMatrixAt(i, m4);
    col.setHex(t.top);
    if (t.jitter) col.offsetHSL(0, 0, (ctx.rnd() - 0.5) * t.jitter);
    if (t.checker && (t.c + t.r) % 2) col.offsetHSL(0, 0, -t.checker);
    caps.setColorAt(i, col);
    const bottom = t.deck || def.baseY == null ? top - 0.45 : def.baseY;
    const hgt = top - 0.08 - bottom;
    m4.makeScale(1, hgt, 1).setPosition(t.c, bottom + hgt / 2, t.r);
    columns.setMatrixAt(i, m4);
    col.setHex(t.side);
    columns.setColorAt(i, col);
  });
  group.add(caps, columns);

  if (def.baseY != null) {
    const mid = { x: (cols - 1) / 2, z: (rows - 1) / 2 };
    k.box(cols + 0.2, 0.35, rows + 0.2, 0x5c3a20, { ...mid, y: def.baseY - 0.35, base: true, parent: group });
    k.box(cols + 0.3, 0.12, rows + 0.3, 0xcc5500, { ...mid, y: def.baseY - 0.47, base: true, parent: group });
  }

  const startPos = new THREE.Vector3(map.start.c, tileTop(map.start), map.start.r);
  const goalTile = map.goal;
  for (const t of tiles.flat()) if (t.prop) buildProp(ctx, t);

  const goalFx = buildGoal(k, def.customer);
  goalFx.root.position.set(goalTile.c, tileTop(goalTile), goalTile.r);
  group.add(goalFx.root);

  const customer = def.decorate(ctx);
  spawnHazards(ctx, plan);
  const custBaseY = customer.root.position.y;
  const courier = buildCourier(k);
  scene.add(courier.root);

  const center = new THREE.Vector3((cols - 1) / 2, 0, (rows - 1) / 2);
  sun.target.position.copy(center);
  sun.position.copy(center).addScaledVector(SUN_DIR, 30);

  /* ---------------- HUD ---------------- */
  hud.universe.textContent = template.label || def.label;
  hud.manifest.textContent = `${mods.manifestId ?? "—"} · DOOR ${mods.doorId ?? "—"} · ${tierName.toUpperCase()}`;
  hud.odds.textContent = `${prob != null ? Math.round(prob * 100) + "%" : "—"} · ×${payout.toFixed(2)} · STAKE ${stake} C.O.D.`;
  hud.tag.textContent = `SEED ${seed}`;
  const tagLabels = [...plan.labels];
  if (fragile) tagLabels.push("FRAGILE PARCEL");
  hud.tags.replaceChildren(
    ...tagLabels.map((t) => {
      const s = document.createElement("span");
      s.textContent = t;
      return s;
    })
  );
  const setParcel = (text, cls) => {
    hud.parcel.textContent = text;
    hud.parcel.className = cls;
  };
  let stampTimer = 0;
  const showStamp = (title, sub, good) => {
    hud.stamp.replaceChildren(document.createTextNode(title), Object.assign(document.createElement("small"), { textContent: sub }));
    hud.stamp.className = "iso-stamp show" + (good ? " good" : "");
    stampTimer = good ? 3.0 : 1.5;
  };
  const hideStamp = () => (hud.stamp.className = "iso-stamp");
  setParcel("IN TRANSIT", "");
  hideStamp();

  /* ---------------- Input / resize ---------------- */
  const keys = new Set();
  let jumpQueued = false;
  const onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (BLOCKED_KEYS.includes(key)) e.preventDefault();
    if (key === " " && !e.repeat) jumpQueued = true;
    keys.add(key);
  };
  const onKeyUp = (e) => keys.delete(e.key.toLowerCase());
  const onBlur = () => keys.clear();
  const onWheel = (e) => {
    e.preventDefault();
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.55, 2.2);
    camera.updateProjectionMatrix();
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  const resize = () => {
    const w = layer.clientWidth || 960;
    const h = layer.clientHeight || 540;
    renderer.setSize(w, h, false);
    const a = w / h;
    camera.left = -def.view * a;
    camera.right = def.view * a;
    camera.top = def.view;
    camera.bottom = -def.view;
    camera.updateProjectionMatrix();
  };
  layer.hidden = false;
  const ro = new ResizeObserver(resize);
  ro.observe(layer);
  resize();

  // Debug autopilot: walks plan.route waypoint by waypoint, jumping at ledges and gaps. Ignores hazards.
  const pilot = { on: false, ghost: false, i: 1 };
  function pilotDir(p) {
    const route = plan.route;
    while (pilot.i < route.length - 1 && Math.hypot(route[pilot.i].c - p.x, route[pilot.i].r - p.z) < 0.22) pilot.i++;
    const w = route[pilot.i];
    const v = new THREE.Vector2(w.c - p.x, w.r - p.z);
    if (v.lengthSq() < 1e-4) return v;
    v.normalize();
    const ahead = tileUnder(p.x + v.x * 0.42, p.z + v.y * 0.42);
    if (player.grounded && ahead !== tileUnder(p.x, p.z) && (gone(ahead) || tileTop(ahead) > p.y + STEP)) jumpQueued = true;
    return v;
  }

  function inputDir() {
    if (pilot.on) return pilotDir(player.pos);
    const ix = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    const iy = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    // Screen right = world (1,0,-1); screen up = world (-1,0,-1).
    const v = new THREE.Vector2(ix - iy, -ix - iy);
    if (v.lengthSq() > 0) v.normalize();
    return v;
  }

  /* ---------------- Physics ---------------- */
  const canOccupy = (x, z, y) => {
    for (const [ox, oz] of [[-RADIUS, -RADIUS], [RADIUS, -RADIUS], [-RADIUS, RADIUS], [RADIUS, RADIUS]]) {
      const t = tileUnder(x + ox, z + oz);
      if (t.solid) return false;
      if (!gone(t) && tileTop(t) > y + STEP) return false;
    }
    return true;
  };

  function fail(cause) {
    if (player.state !== "transit" || player.grace > 0) return;
    player.state = "lost";
    player.stateT = HOLD.lost;
    const isVoid = cause === "VOID";
    const voidCause = def.voidCause || "FELL INTO THE VOID";
    player.cause = isVoid ? voidCause : cause;
    setParcel(isVoid ? "LOST TO THE VOID" : `DAMAGED · ${cause}`, "bad");
    showStamp(isVoid ? "LOST IN TRANSIT" : "PARCEL DAMAGED", `${player.cause} — stake ${stake} C.O.D. forfeited`, false);
  }

  ctx.warp = (c, r, note) => {
    const t = tileAt(c, r);
    player.pos.set(c, tileTop(t), r);
    player.displayY = player.pos.y;
    player.vel.set(0, 0);
    player.vy = 0;
    player.grounded = true;
    player.grace = Math.max(player.grace, SPAWN_GRACE);
    pilot.i = Math.max(1, plan.route.findIndex((s) => s.c === c && s.r === r) + 1);
    if (note) showStamp(note, "J.E.V. regrets nothing", false);
  };

  function deliver() {
    player.state = "delivered";
    player.stateT = HOLD.delivered;
    courier.parcel.visible = false;
    setParcel("DELIVERED", "good");
    showStamp("DELIVERED", `STAKE ${stake} × ${payout.toFixed(2)} = ${(stake * payout).toFixed(1)} C.O.D. · O.D.D.S. logged`, true);
    if (!customer.held) {
      customer.held = buildHeldParcel(k);
      customer.held.position.set(0, 1.25, 0);
      customer.root.add(customer.held);
    }
  }

  player.pos.copy(startPos);
  player.displayY = startPos.y;
  const camTarget = player.pos.clone();
  const camGoal = new THREE.Vector3();
  let time = 0;

  function step(dt) {
    time += dt;
    const p = player.pos;

    if (player.state === "transit") {
      player.grace = Math.max(0, player.grace - dt);
      const dir = inputDir();
      player.moving = dir.lengthSq() > 0;
      // Ice keeps whatever grip you had when you left the ground; ice also lets you slide a bit faster.
      const floor = tileUnder(p.x, p.z);
      if (player.grounded) player.grip = floor.ice && !gone(floor) ? ICE_GRIP : GRIP;
      const top = SPEED * (player.grip === ICE_GRIP ? 1.15 : 1);
      const blend = Math.min(1, player.grip * dt);
      player.vel.x += (dir.x * top - player.vel.x) * blend;
      player.vel.y += (dir.y * top - player.vel.y) * blend;
      let mx = player.vel.x * dt;
      let mz = player.vel.y * dt;
      for (const h of pilot.ghost ? [] : ctx.hazards) {
        const f = h.force?.(p, player);
        if (f) {
          mx += f.x * dt;
          mz += f.z * dt;
        }
      }
      if (canOccupy(p.x + mx, p.z, p.y)) p.x += mx;
      else player.vel.x = 0;
      if (canOccupy(p.x, p.z + mz, p.y)) p.z += mz;
      else player.vel.y = 0;

      if (jumpQueued && player.grounded) {
        player.vy = jumpV;
        player.grounded = false;
      }
      jumpQueued = false;

      const ground = groundAt(p.x, p.z);
      if (player.grounded) {
        if (ground >= p.y - STEP && ground !== -Infinity) p.y = ground;
        else player.grounded = false;
      }
      if (!player.grounded) {
        player.vy += gravity * dt;
        p.y += player.vy * dt;
        if (p.y <= ground) {
          const impact = -player.vy;
          p.y = ground;
          player.vy = 0;
          player.grounded = true;
          if (fragile && impact > FRAGILE_IMPACT) fail("FRAGILE · HARD LANDING");
        }
      }

      const moving = dir.lengthSq() > 0;
      if (moving) {
        let d = Math.atan2(dir.x, dir.y) - player.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        player.yaw += d * Math.min(1, dt * 14);
        player.walkPhase += dt * 11;
      }
      player.walkAmt = THREE.MathUtils.lerp(player.walkAmt, moving ? 1 : 0, Math.min(1, dt * 10));

      if (p.y < VOID_Y) fail("VOID");
      const under = tileUnder(p.x, p.z);
      if (under.gone && p.y < tileTop(under) - 0.3) fail(under.goneCause || "VOID");
      for (const h of pilot.ghost ? [] : ctx.hazards) {
        const cause = h.check?.(p, player);
        if (cause) fail(cause);
      }
      if (player.state === "transit" && tileUnder(p.x, p.z) === goalTile && player.grounded) deliver();
    } else {
      player.stateT -= dt;
      if (player.state === "lost" && !player.grounded) {
        player.vy += gravity * dt * 0.5;
        if (p.y > -6) p.y += player.vy * dt;
      }
      if (player.stateT <= 0) {
        end({ delivered: player.state === "delivered", cause: player.cause });
        return;
      }
    }

    for (const h of ctx.hazards) h.update(time, dt);
    for (const a of ctx.animators) a(time, dt);

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
    courier.parcel.position.y = 0.26 + Math.sin(time * 2.4) * def.floaty.bob;
    courier.parcel.rotation.z = Math.sin(time * 1.7) * def.floaty.tilt;
    courier.root.visible = player.grace > 0 ? Math.floor(time * 12) % 2 === 0 : true;

    // Goal + customer.
    goalFx.ring.scale.setScalar(1 + Math.sin(time * 4) * 0.08);
    goalFx.sprite.position.y = 2.25 + Math.sin(time * 2) * 0.08;
    const hop = player.state === "delivered" ? Math.abs(Math.sin(time * 9)) * 0.25 : 0;
    customer.root.position.y = custBaseY + Math.abs(Math.sin(time * 2.2)) * 0.03 + hop;
    customer.root.rotation.z = Math.sin(time * 1.6) * 0.05;

    if (stampTimer > 0) {
      stampTimer -= dt;
      if (stampTimer <= 0 && player.state === "transit") hideStamp();
    }

    // Camera follow.
    camTarget.lerp(camGoal.set(p.x, Math.max(0, p.y) * 0.6, p.z), Math.min(1, dt * 4));
    camera.position.copy(camTarget).add(CAM_OFFSET);
    camera.lookAt(camTarget);
  }

  /* ---------------- Loop / teardown ---------------- */
  let raf = 0;
  let last = 0;
  let ended = false;

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    step(dt);
    if (ended) return;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  const debug = {
    seed,
    world: def.id,
    player,
    goal: { c: goalTile.c, r: goalTile.r },
    get state() {
      return player.state;
    },
    plan: {
      tier: plan.tier.name,
      types: plan.types,
      labels: plan.labels,
      entries: plan.entries.map((e) => e.type),
      physics: plan.physics,
      routeOk: plan.routeOk,
    },
    route: plan.route,
    teleport(c, r) {
      const t = tileAt(c, r);
      player.pos.set(c, t.void ? 0 : tileTop(t), r);
      player.displayY = player.pos.y;
      player.vel.set(0, 0);
      player.vy = 0;
      player.grounded = true;
    },
    /** Walk the planned route automatically (does not dodge hazards; `ghost` ignores them entirely). */
    autopilot(on = true, { ghost = false } = {}) {
      pilot.on = on;
      pilot.ghost = on && ghost;
      return plan.route.length;
    },
    /** Render now and return the canvas as a data URL; `overview` frames the whole map. */
    snapshot({ overview = false, type = "image/jpeg", quality = 0.85 } = {}) {
      resize();
      const saved = { pos: camera.position.clone(), zoom: camera.zoom };
      if (overview) {
        camera.zoom = (2 * def.view) / ((cols + rows) * 0.6);
        camera.position.copy(center).add(CAM_OFFSET);
        camera.lookAt(center);
        camera.updateProjectionMatrix();
      }
      renderer.render(scene, camera);
      const url = canvas.toDataURL(type, quality);
      camera.position.copy(saved.pos);
      camera.zoom = saved.zoom;
      camera.updateProjectionMatrix();
      return url;
    },
    /** Advance the sim without rendering (for throttled/background tabs). */
    advance(seconds = 1, dt = 1 / 60) {
      for (let s = 0; s < seconds && !ended; s += dt) step(dt);
      return { state: player.state, cause: player.cause, pos: player.pos.toArray().map((v) => +v.toFixed(2)), wp: pilot.i };
    },
    abort: () => end({ delivered: false, cause: "ABORTED" }),
  };

  function teardown() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    canvas.removeEventListener("wheel", onWheel);
    ro.disconnect();
    sun.shadow.dispose();
    disposeTree(scene);
    k.dispose();
    scene.clear();
    renderer.renderLists.dispose();
    renderer.clear();
    hideStamp();
    layer.hidden = true;
    if (window.__isoRun === debug) window.__isoRun = null;
  }

  function end(result) {
    if (ended) return;
    ended = true;
    teardown();
    resolve(result);
  }

  window.__isoRun = debug;
  raf = requestAnimationFrame((now) => {
    last = now;
    frame(now);
  });

  return { abort: debug.abort };
}
