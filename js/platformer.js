/**
 * 2.5D delivery platformer — Metal Gear–style lane depth on side stages.
 * Grid chars: # solid  = platform  S start  G goal (customer OUT)
 *             > < moving walk  ~ ice  ^ hazard  ? meta flicker
 * Controls: ←→ lane-run · ↑↓ change depth lane · Space jump
 * Seeded room X/Y collision unchanged; Z is tactical presence (hazards/cover).
 */

import { art, drawPlateWorld } from "./art.js";

/** Depth lanes: 0 = far (into screen), 1 = mid, 2 = near (toward camera). */
export const LANES = [
  { id: 0, name: "FAR", scale: 0.82, yLift: -14, shadow: 0.35, tint: "rgba(26,31,22,0.12)" },
  { id: 1, name: "MID", scale: 1.0, yLift: 0, shadow: 0.45, tint: null },
  { id: 2, name: "NEAR", scale: 1.22, yLift: 12, shadow: 0.55, tint: null },
];
const LANE_MIN = 0;
const LANE_MAX = 2;
const LANE_COOLDOWN = 10;

const KEY = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  jumpBuffered: false,
  jumpBufferFrames: 0,
  laneUpBuffered: false,
  laneDownBuffered: false,
};

const TIER = {
  easy: {
    grav: 0.5,
    jump: -10.4,
    speed: 3.55,
    accel: 0.7,
    friction: 0.74,
    iceFriction: 0.95,
    hazardPeriod: 140,
    coyote: 10,
    jumpBuffer: 9,
  },
  hard: {
    grav: 0.55,
    jump: -9.6,
    speed: 3.35,
    accel: 0.62,
    friction: 0.73,
    iceFriction: 0.96,
    hazardPeriod: 100,
    coyote: 9,
    jumpBuffer: 8,
  },
  brutal: {
    grav: 0.6,
    jump: -9.0,
    speed: 3.2,
    accel: 0.55,
    friction: 0.72,
    iceFriction: 0.98,
    hazardPeriod: 70,
    coyote: 8,
    jumpBuffer: 7,
  },
};

/** Pocket-universe palettes — diverse worlds; shipping is one valid biome. */
const BIOME_PAL = {
  porch: {
    bg: "#c8b888",
    wall: "#6a7a3a",
    wallTop: "#a8c060",
    wallEdge: "#568203",
    wallSide: "#4a5a28",
    ground: "rgba(200,180,120,0.22)",
    runway: "rgba(245,236,215,0.55)",
    stripe: "rgba(218,165,32,0.08)",
    accent: "#daa520",
    prop: "#568203",
    fog: null,
    skyBits: "leaves",
    plate: "porchFar",
    plateMock: "porchMock",
  },
  neighborhood: {
    bg: "#b8c0c8",
    wall: "#5a6a78",
    wallTop: "#8a9aac",
    wallEdge: "#1f4e79",
    wallSide: "#3a4a58",
    ground: "rgba(180,190,200,0.2)",
    runway: "rgba(245,236,215,0.4)",
    stripe: "rgba(31,78,121,0.08)",
    accent: "#daa520",
    prop: "#6a7a4a",
    fog: null,
    skyBits: "lamps",
    plate: "porchFar",
    plateMock: "porchMock",
  },
  lobby: {
    bg: "#2a3038",
    wall: "#4a5560",
    wallTop: "#7a8a98",
    wallEdge: "#1f4e79",
    ground: "rgba(180,170,150,0.12)",
    runway: "rgba(218,165,32,0.25)",
    stripe: "rgba(31,78,121,0.1)",
    accent: "#daa520",
    prop: "#3a5a40",
    fog: null,
    skyBits: "plants",
  },
  rooftops: {
    bg: "#1a2230",
    wall: "#3a4558",
    wallTop: "#5a6a80",
    wallEdge: "#cc5500",
    ground: "rgba(40,50,70,0.25)",
    runway: "rgba(204,85,0,0.28)",
    stripe: "rgba(100,120,160,0.08)",
    accent: "#9ec6d8",
    prop: "#6a7080",
    fog: "rgba(60,80,120,0.14)",
    skyBits: "clouds",
  },
  jungle: {
    bg: "#1e2e1a",
    wall: "#3a5a28",
    wallTop: "#5a8a30",
    wallEdge: "#6f9a12",
    ground: "rgba(60,100,40,0.2)",
    runway: "rgba(140,100,40,0.3)",
    stripe: "rgba(86,130,3,0.1)",
    accent: "#daa520",
    prop: "#2a4a18",
    fog: "rgba(40,80,30,0.12)",
    skyBits: "vines",
  },
  neon: {
    bg: "#1a1028",
    wall: "#3a2a48",
    wallTop: "#8a4a9a",
    wallEdge: "#cc5500",
    ground: "rgba(80,40,100,0.18)",
    runway: "rgba(204,85,0,0.35)",
    stripe: "rgba(180,60,200,0.1)",
    accent: "#daa520",
    prop: "#c040a0",
    fog: "rgba(120,40,160,0.1)",
    skyBits: "neon",
  },
  frozen: {
    bg: "#1e2a32",
    wall: "#3a4a58",
    wallTop: "#6a8a9a",
    wallEdge: "#9ec6d8",
    ground: "rgba(158,198,216,0.12)",
    runway: "rgba(158,198,216,0.35)",
    stripe: "rgba(158,198,216,0.06)",
    accent: "#9ec6d8",
    prop: "#5a7a8a",
    fog: "rgba(180,210,230,0.12)",
    skyBits: "snow",
  },
  gravity: {
    bg: "#12141c",
    wall: "#2a2e42",
    wallTop: "#5a5a8a",
    wallEdge: "#daa520",
    ground: "rgba(80,70,120,0.15)",
    runway: "rgba(218,165,32,0.28)",
    stripe: "rgba(100,80,180,0.08)",
    accent: "#daa520",
    prop: "#6a5a9a",
    fog: "rgba(40,30,80,0.15)",
    skyBits: "stars",
  },
  unmapped: {
    bg: "#141218",
    wall: "#3a3548",
    wallTop: "#8a7a3a",
    wallEdge: "#daa520",
    ground: "rgba(100,80,40,0.12)",
    runway: "rgba(218,165,32,0.3)",
    stripe: "rgba(139,30,30,0.08)",
    accent: "#daa520",
    prop: "#5a4a70",
    fog: "rgba(80,40,60,0.12)",
    skyBits: "glitch",
  },
  impossible: {
    bg: "#1a2230",
    wall: "#2a3a52",
    wallTop: "#4a6a8a",
    wallEdge: "#1f4e79",
    ground: "rgba(218,165,32,0.07)",
    runway: "rgba(218,165,32,0.32)",
    stripe: "rgba(31,78,121,0.12)",
    accent: "#daa520",
    prop: "#3a4a62",
    fog: null,
    skyBits: "geometry",
  },
  /** Occasional pocket: another universe's shipping floor — valid, not the whole identity. */
  shipping: {
    bg: "#2e2a22",
    wall: "#5a4a32",
    wallTop: "#9a7a3a",
    wallEdge: "#cc5500",
    ground: "rgba(218,165,32,0.08)",
    runway: "rgba(204,85,0,0.3)",
    stripe: "rgba(204,85,0,0.07)",
    accent: "#cc5500",
    prop: "#8a6a2f",
    fog: null,
    skyBits: "facility",
  },
  space: {
    bg: "#1a1820",
    wall: "#3a4a38",
    wallTop: "#8aaa5a",
    wallEdge: "#daa520",
    wallSide: "#2a3228",
    ground: "rgba(80,90,70,0.18)",
    runway: "rgba(245,236,215,0.35)",
    stripe: "rgba(31,78,121,0.1)",
    accent: "#daa520",
    prop: "#568203",
    fog: "rgba(40,36,28,0.12)",
    skyBits: "stars",
    plate: "spaceFar",
    plateMock: "spaceMock",
    lowG: true,
  },
  underwater: {
    bg: "#0a2838",
    wall: "#1a4a5a",
    wallTop: "#3a8a9a",
    wallEdge: "#4ec6d8",
    ground: "rgba(40,100,120,0.2)",
    runway: "rgba(80,180,200,0.3)",
    stripe: "rgba(40,120,140,0.1)",
    accent: "#9ec6d8",
    prop: "#2a6a5a",
    fog: "rgba(20,80,100,0.18)",
    skyBits: "bubbles",
  },
  desert: {
    bg: "#3a2a18",
    wall: "#6a4a28",
    wallTop: "#c49a4a",
    wallEdge: "#cc5500",
    ground: "rgba(180,140,60,0.15)",
    runway: "rgba(200,140,40,0.35)",
    stripe: "rgba(204,85,0,0.08)",
    accent: "#daa520",
    prop: "#8a6a2f",
    fog: "rgba(180,140,60,0.1)",
    skyBits: "dunes",
  },
};

const SHARED = {
  plat: "#8a6a2f",
  ice: "#9ec6d8",
  convR: "#cc5500",
  convL: "#1f4e79",
  hazard: "#8b1e1e",
  goal: "#daa520",
  player: "#f5ecd7",
  sash: "#568203",
  ink: "#1a1f16",
  cream: "#f5ecd7",
  package: "#c9a227",
};

export function bindControls() {
  const down = (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") KEY.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") KEY.right = true;
    // ↑/W = farther lane (into screen); ↓/S = nearer lane (toward camera)
    if (e.code === "ArrowUp" || e.code === "KeyW") {
      if (!KEY.up) KEY.laneUpBuffered = true;
      KEY.up = true;
      e.preventDefault();
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      if (!KEY.down) KEY.laneDownBuffered = true;
      KEY.down = true;
      e.preventDefault();
    }
    // Jump is Space only (↑ reserved for depth)
    if (e.code === "Space") {
      if (!KEY.jump) {
        KEY.jumpBuffered = true;
        KEY.jumpBufferFrames = 10;
      }
      KEY.jump = true;
      e.preventDefault();
    }
  };
  const up = (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") KEY.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") KEY.right = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") KEY.up = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") KEY.down = false;
    if (e.code === "Space") KEY.jump = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  };
}

function parseRoom(template, rng, tierName) {
  const grid = template.grid.map((row) => row.split(""));
  const tile = template.tileSize || 32;
  const rows = grid.length;
  const cols = grid[0].length;
  let start = { x: tile, y: tile };
  let goal = { x: (cols - 2) * tile, y: (rows - 2) * tile };
  const hazards = [];
  const meta = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = grid[y][x];
      if (c === "S") {
        start = { x: x * tile + 4, y: y * tile };
        grid[y][x] = ".";
      } else if (c === "G") {
        goal = { x: x * tile, y: y * tile };
        grid[y][x] = ".";
      } else if (c === "^") {
        hazards.push({
          x: x * tile,
          y: y * tile,
          w: tile,
          h: tile,
          phase: rng.float(0, Math.PI * 2),
          kind: "spike",
          // Tactical depth: hazards sit on a lane — dodge by changing Z
          lane: rng.int(0, 2),
        });
      } else if (c === "?") {
        meta.push({
          x: x * tile,
          y: y * tile,
          w: tile,
          h: tile,
          period: 60 + rng.int(20, 90),
          offset: rng.int(0, 40),
          solidWhen: rng.bool(0.55),
        });
        grid[y][x] = ".";
      }
    }
  }

  return {
    grid,
    tile,
    rows,
    cols,
    width: cols * tile,
    height: rows * tile,
    start,
    goal,
    hazards,
    meta,
    tier: TIER[tierName] || TIER.easy,
    tierName,
    biome: template.biome || "porch",
    label: template.label || "Pocket World",
  };
}

function solidAt(room, tx, ty, frame) {
  if (ty < 0 || ty >= room.rows || tx < 0 || tx >= room.cols) return true;
  const c = room.grid[ty][tx];
  if (c === "#" || c === "=") return true;
  if (c === ">" || c === "<" || c === "~") return true;
  for (const m of room.meta) {
    const mx = Math.floor(m.x / room.tile);
    const my = Math.floor(m.y / room.tile);
    if (mx === tx && my === ty) {
      const on = Math.floor((frame + m.offset) / m.period) % 2 === 0;
      return on ? m.solidWhen : !m.solidWhen;
    }
  }
  return false;
}

function tileAt(room, px, py) {
  const tx = Math.floor(px / room.tile);
  const ty = Math.floor(py / room.tile);
  if (ty < 0 || ty >= room.rows || tx < 0 || tx >= room.cols) return "#";
  return room.grid[ty][tx];
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createRun(template, rng, difficultyTier = "easy", _zoneIgnored = null) {
  const room = parseRoom(template, rng, difficultyTier);
  if (!BIOME_PAL[room.biome]) room.biome = "porch";
  // Space / low-g pocket: floatier jumps, softer fall — still a platformer.
  if (BIOME_PAL[room.biome]?.lowG) {
    room.tier = {
      ...room.tier,
      grav: room.tier.grav * 0.55,
      jump: room.tier.jump * 1.15,
    };
  }
  room.props = buildProps(room, rng);
  room.goalLane = 1; // customer OUT is on the mid lane
  // Assign prop lanes for draw order / cover feel
  for (const p of room.props) {
    if (p.lane == null) {
      if (p.kind === "mailbox") p.lane = 1;
      else if (p.kind === "stripe") p.lane = room.hazards.find((h) => h.x === p.x)?.lane ?? 1;
      else p.lane = rng.int(0, 2);
    }
  }
  const player = {
    x: room.start.x,
    y: room.start.y,
    // Collision footprint — visual courier draws much larger (mock scale)
    w: 22,
    h: 36,
    vx: 0,
    vy: 0,
    onGround: false,
    coyote: 0,
    jumpLock: 0,
    facing: 1,
    lane: 1,
    laneCooldown: 0,
    laneDisplay: 1, // smoothed for foreshortening tween
  };
  settleSpawn(room, player);
  return {
    room,
    player,
    frame: 0,
    status: "playing",
    message: "",
    fragile: false,
    hardLandings: 0,
    camX: null,
    camY: null,
  };
}

/** Drop courier onto the first solid under the start tile so draw/camera see them on-floor. */
function settleSpawn(room, player) {
  const maxDrop = room.tile * 4;
  for (let i = 0; i < maxDrop; i++) {
    const feetY = player.y + player.h;
    const tx0 = Math.floor(player.x / room.tile);
    const tx1 = Math.floor((player.x + player.w - 0.01) / room.tile);
    const ty = Math.floor(feetY / room.tile);
    let hit = false;
    for (let tx = tx0; tx <= tx1; tx++) {
      if (solidAt(room, tx, ty, 0)) {
        hit = true;
        break;
      }
    }
    if (hit) {
      player.y = ty * room.tile - player.h;
      player.onGround = true;
      player.coyote = 8;
      return;
    }
    player.y += 1;
  }
}

function buildProps(room, rng) {
  const props = [];
  const t = room.tile;
  const sky = BIOME_PAL[room.biome]?.skyBits || "leaves";

  if (sky === "facility") {
    for (let x = 2; x < room.cols - 2; x += 3 + rng.int(0, 2)) {
      if (room.grid[1]?.[x] === ".") {
        props.push({ kind: "pipe", x: x * t, y: t + 4, w: t * 2, h: 6 });
      }
    }
    for (let y = 2; y < room.rows - 2; y++) {
      for (let x = 1; x < room.cols - 1; x++) {
        if (room.grid[y][x] !== "#") continue;
        const rightOpen = room.grid[y][x + 1] === ".";
        const leftOpen = room.grid[y][x - 1] === ".";
        if ((rightOpen || leftOpen) && rng.bool(0.12)) {
          props.push({
            kind: "sign",
            x: x * t + (rightOpen ? t - 2 : -14),
            y: y * t + 8,
            text: rng.pick(["SORT", "BELT", "ODDS OK", "JEV", "DOCK"]),
          });
        }
      }
    }
    for (const h of room.hazards) {
      if (rng.bool(0.4)) props.push({ kind: "fan", x: h.x + 4, y: h.y - t, phase: h.phase });
    }
  } else if (sky === "leaves" || sky === "vines") {
    for (let x = 2; x < room.cols - 2; x += 2 + rng.int(0, 3)) {
      if (room.grid[1]?.[x] === "." && rng.bool(0.55)) {
        props.push({ kind: "tree", x: x * t + 4, y: t + 2, h: 10 + rng.int(0, 8) });
      }
    }
    if (sky === "vines") {
      for (let x = 3; x < room.cols - 3; x += 4) {
        if (room.grid[2]?.[x] === ".") {
          props.push({ kind: "vine", x: x * t + 12, y: 2 * t, h: t * (1 + rng.int(0, 2)) });
        }
      }
    }
  } else if (sky === "lamps") {
    for (let x = 3; x < room.cols - 3; x += 5 + rng.int(0, 2)) {
      if (room.grid[room.rows - 3]?.[x] === "." || room.grid[1]?.[x] === ".") {
        props.push({ kind: "lamp", x: x * t + 10, y: (room.rows - 3) * t - 20 });
      }
    }
  } else if (sky === "plants") {
    for (let x = 4; x < room.cols - 4; x += 6) {
      if (room.grid[room.rows - 3]?.[x] === ".") {
        props.push({ kind: "plant", x: x * t + 6, y: (room.rows - 3) * t + 8 });
      }
    }
  } else if (sky === "clouds") {
    for (let i = 0; i < 5; i++) {
      props.push({
        kind: "cloud",
        x: rng.int(t, room.width - t * 2),
        y: rng.int(t, Math.max(t * 2, room.height / 3)),
        w: 20 + rng.int(0, 24),
      });
    }
    for (const h of room.hazards) {
      props.push({ kind: "antenna", x: h.x + 8, y: h.y - 14 });
    }
  } else if (sky === "neon") {
    for (let y = 2; y < room.rows - 2; y++) {
      for (let x = 1; x < room.cols - 1; x++) {
        if (room.grid[y][x] !== "#") continue;
        const rightOpen = room.grid[y][x + 1] === ".";
        if (rightOpen && rng.bool(0.1)) {
          props.push({
            kind: "sign",
            x: x * t + t - 2,
            y: y * t + 8,
            text: rng.pick(["OPEN", "24H", "ODDS", "DELIV", "NEON"]),
          });
        }
      }
    }
  } else if (sky === "snow") {
    for (let i = 0; i < 8; i++) {
      props.push({
        kind: "flake",
        x: rng.int(0, room.width),
        y: rng.int(0, room.height),
        phase: rng.float(0, Math.PI * 2),
      });
    }
  } else if (sky === "stars" || sky === "glitch" || sky === "geometry") {
    for (let i = 0; i < 12; i++) {
      props.push({
        kind: "star",
        x: rng.int(0, room.width),
        y: rng.int(0, room.height),
        phase: rng.float(0, Math.PI * 2),
        glitch: sky === "glitch",
      });
    }
  } else if (sky === "bubbles") {
    for (let i = 0; i < 10; i++) {
      props.push({
        kind: "bubble",
        x: rng.int(0, room.width),
        y: rng.int(0, room.height),
        phase: rng.float(0, Math.PI * 2),
        r: 2 + rng.int(0, 3),
      });
    }
  } else if (sky === "dunes") {
    for (let x = 2; x < room.cols - 2; x += 3 + rng.int(0, 2)) {
      if (room.grid[1]?.[x] === ".") {
        props.push({ kind: "cactus", x: x * t + 8, y: t + 6 });
      }
    }
  }

  for (const h of room.hazards) {
    props.push({ kind: "stripe", x: h.x, y: h.y + t - 6, w: t, h: 6 });
  }

  // Customer mailbox / porch OUT prop near goal
  props.push({
    kind: "mailbox",
    x: room.goal.x + 2,
    y: room.goal.y - 10,
  });

  return props;
}

export function setFragile(run, on) {
  run.fragile = !!on;
}

export function updateRun(run) {
  if (run.status !== "playing") return run.status;

  const { room, player } = run;
  const phys = room.tier;
  run.frame += 1;

  if (KEY.left) player.vx -= phys.accel;
  if (KEY.right) player.vx += phys.accel;
  if (KEY.left && !KEY.right) player.facing = -1;
  if (KEY.right && !KEY.left) player.facing = 1;

  // Depth lane change (Metal Gear–style Z)
  if (player.laneCooldown > 0) player.laneCooldown -= 1;
  if (player.laneCooldown <= 0) {
    if (KEY.laneUpBuffered && player.lane > LANE_MIN) {
      player.lane -= 1;
      player.laneCooldown = LANE_COOLDOWN;
      KEY.laneUpBuffered = false;
    } else if (KEY.laneDownBuffered && player.lane < LANE_MAX) {
      player.lane += 1;
      player.laneCooldown = LANE_COOLDOWN;
      KEY.laneDownBuffered = false;
    }
  }
  KEY.laneUpBuffered = false;
  KEY.laneDownBuffered = false;
  // Smooth foreshortening toward discrete lane
  player.laneDisplay += (player.lane - player.laneDisplay) * 0.28;

  const feetTile = tileAt(room, player.x + player.w / 2, player.y + player.h + 1);
  const onIce = feetTile === "~";
  const fric = onIce ? phys.iceFriction : phys.friction;
  player.vx *= fric;
  if (Math.abs(player.vx) > phys.speed) player.vx = Math.sign(player.vx) * phys.speed;

  if (feetTile === ">") player.vx += 0.55;
  if (feetTile === "<") player.vx -= 0.55;

  const coyoteMax = phys.coyote ?? 8;
  if (player.onGround) player.coyote = coyoteMax;
  else if (player.coyote > 0) player.coyote -= 1;
  if (player.jumpLock > 0) player.jumpLock -= 1;
  if (KEY.jumpBufferFrames > 0) KEY.jumpBufferFrames -= 1;
  else KEY.jumpBuffered = false;

  const wantJump = KEY.jumpBuffered || KEY.jumpBufferFrames > 0 || KEY.jump;
  if (wantJump && player.coyote > 0 && player.jumpLock <= 0) {
    player.vy = phys.jump;
    player.onGround = false;
    player.coyote = 0;
    player.jumpLock = 10;
    KEY.jumpBuffered = false;
    KEY.jumpBufferFrames = 0;
  }

  // Variable jump height: release early → cut ascent
  if (!KEY.jump && player.vy < -3.2) player.vy *= 0.55;

  player.vy += phys.grav;
  if (player.vy > 13) player.vy = 13;

  moveAxis(run, player.vx, 0);
  moveAxis(run, 0, player.vy);

  if (player.y > room.height + 40) {
    run.status = "dead";
    run.message = "Fell out of this universe.";
    return run.status;
  }

  const period = phys.hazardPeriod;
  for (const h of room.hazards) {
    const pulse = Math.sin(run.frame / period + h.phase);
    const active = pulse > -0.15;
    if (!active) continue;
    // Same-lane collision only — change depth to slip past
    if ((h.lane ?? 1) !== player.lane) continue;
    if (
      rectsOverlap(player, {
        x: h.x + 4,
        y: h.y + 10,
        w: h.w - 8,
        h: h.h - 10,
      })
    ) {
      run.status = "dead";
      run.message = "Hazard on your lane. Step depth next time.";
      return run.status;
    }
  }

  const goalBox = {
    x: room.goal.x + 4,
    y: room.goal.y + 4,
    w: room.tile - 8,
    h: room.tile - 8,
  };
  if (rectsOverlap(player, goalBox) && player.lane === (room.goalLane ?? 1)) {
    run.status = "won";
    run.message = "Delivered to recipient. Timing optional.";
    return run.status;
  }

  return run.status;
}

function moveAxis(run, dx, dy) {
  const { room, player } = run;
  player.x += dx;
  player.y += dy;

  const tiles = coveredTiles(player, room.tile);
  let grounded = false;

  for (const t of tiles) {
    if (!solidAt(room, t.tx, t.ty, run.frame)) continue;
    const sx = t.tx * room.tile;
    const sy = t.ty * room.tile;
    const tileRect = { x: sx, y: sy, w: room.tile, h: room.tile };
    if (!rectsOverlap(player, tileRect)) continue;

    if (dx > 0) {
      player.x = sx - player.w;
      player.vx = 0;
    } else if (dx < 0) {
      player.x = sx + room.tile;
      player.vx = 0;
    }

    if (dy > 0) {
      const impact = player.vy;
      player.y = sy - player.h;
      player.vy = 0;
      grounded = true;
      if (run.fragile && impact > 11) {
        run.status = "dead";
        run.message = "Fragile: possibility shattered.";
      }
    } else if (dy < 0) {
      player.y = sy + room.tile;
      player.vy = 0;
    }
  }

  if (dy !== 0) player.onGround = grounded;
}

function coveredTiles(player, tile) {
  const x0 = Math.floor(player.x / tile);
  const x1 = Math.floor((player.x + player.w - 0.01) / tile);
  const y0 = Math.floor(player.y / tile);
  const y1 = Math.floor((player.y + player.h - 0.01) / tile);
  const out = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) out.push({ tx, ty });
  }
  return out;
}

function playBandY(room) {
  let minY = room.rows;
  let maxY = 0;
  for (let y = 0; y < room.rows; y++) {
    for (let x = 0; x < room.cols; x++) {
      if (room.grid[y][x] === "#") continue;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (minY > maxY) return { top: 0, bottom: room.height };
  const top = Math.max(0, minY - 1) * room.tile;
  const bottom = Math.min(room.rows, maxY + 2) * room.tile;
  return { top, bottom };
}

function cameraFor(run, W, H) {
  const { room, player } = run;
  const band = playBandY(room);
  const bandH = Math.max(room.tile * 6, band.bottom - band.top);
  const idealViewH = Math.min(Math.max(bandH, 8 * room.tile), 12 * room.tile);
  const fitScale = Math.min(W / room.width, H / room.height);
  const zoomScale = H / idealViewH;
  const scale =
    fitScale >= 1.35
      ? fitScale
      : Math.max(fitScale, Math.min(zoomScale, W / (16 * room.tile)));
  const viewW = W / scale;
  const viewH = H / scale;

  // Slight camera bias by depth lane (into-screen vs toward-camera)
  const laneBias = ((player.laneDisplay ?? player.lane ?? 1) - 1) * 10;
  let targetX = player.x + player.w / 2 - viewW * 0.34;
  let targetY = player.y + player.h / 2 - viewH * 0.58 + laneBias;

  if (room.width <= viewW) targetX = (room.width - viewW) / 2;
  else targetX = Math.max(0, Math.min(targetX, room.width - viewW));

  if (room.height <= viewH) targetY = (room.height - viewH) / 2;
  else targetY = Math.max(0, Math.min(targetY, room.height - viewH));

  if (run.camX == null) {
    run.camX = targetX;
    run.camY = targetY;
  } else {
    const lerp = 0.14;
    run.camX += (targetX - run.camX) * lerp;
    run.camY += (targetY - run.camY) * lerp;
  }

  return { scale, camX: run.camX, camY: run.camY };
}

function isFloorSupport(c) {
  return c === "#" || c === "=" || c === "~" || c === ">" || c === "<";
}

function biomePal(biome) {
  return BIOME_PAL[biome] || BIOME_PAL.porch;
}

/** Scroll-linked layer factors for Phase 1.5 Canvas parallax (not Three.js). */
const PARALLAX = {
  far: 0.18,
  mid: 0.42,
  play: 1,
  fg: 1.22,
};

export function drawRun(ctx, run) {
  const { room, player } = run;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const pal = biomePal(room.biome);
  const { scale, camX, camY } = cameraFor(run, W, H);

  drawSkyBackdrop(ctx, W, H, pal, room.biome, run.frame);

  // Far background — painted plate + silhouettes
  withParallax(ctx, scale, camX, camY, PARALLAX.far, PARALLAX.far * 0.55, () => {
    if (pal.plate) {
      const plate = art(pal.plate) || art(pal.plateMock);
      if (plate) drawPlateWorld(ctx, plate, room.width, room.height, 0.9);
    }
    drawFarLayer(ctx, room, pal, run.frame);
  });

  // Mid scenery — medium scroll
  withParallax(ctx, scale, camX, camY, PARALLAX.mid, PARALLAX.mid * 0.65, () => {
    drawMidLayer(ctx, room, pal, run.frame);
  });

  // Play plane — tile world + lane-depth staging
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);

  drawDepthLaneRibbons(ctx, room, pal, player);

  for (let y = 0; y < room.rows; y++) {
    for (let x = 0; x < room.cols; x++) {
      const c = room.grid[y][x];
      const px = x * room.tile;
      const py = y * room.tile;
      if (c === "#") {
        drawSolidTile(ctx, px, py, room.tile, pal, room.grid, x, y);
      } else if (c === "=") {
        drawThickPlatform(ctx, px, py, room.tile, SHARED.plat, pal.accent, "#5a4220");
      } else if (c === "~") {
        drawThickPlatform(ctx, px, py + 2, room.tile, SHARED.ice, "rgba(255,255,255,0.55)", "#4a6a78");
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(px + 4, py + 14, 8, 3);
      } else if (c === ">") {
        drawWalkway(ctx, px, py, room.tile, 1, run.frame, room.biome);
      } else if (c === "<") {
        drawWalkway(ctx, px, py, room.tile, -1, run.frame, room.biome);
      } else {
        ctx.fillStyle = pal.ground;
        ctx.fillRect(px, py, room.tile, room.tile);
        const below = y + 1 < room.rows ? room.grid[y + 1][x] : "#";
        if (isFloorSupport(below)) {
          ctx.fillStyle = pal.runway;
          ctx.fillRect(px, py + room.tile - 7, room.tile, 7);
          ctx.fillStyle = "rgba(26,31,22,0.12)";
          ctx.fillRect(px, py + room.tile - 7, room.tile, 2);
        }
      }
    }
  }

  drawProps(ctx, room, run.frame, pal);

  for (const m of room.meta) {
    const on = Math.floor((run.frame + m.offset) / m.period) % 2 === 0;
    const solid = on ? m.solidWhen : !m.solidWhen;
    ctx.fillStyle = solid ? "rgba(218,165,32,0.85)" : "rgba(58,53,80,0.45)";
    ctx.fillRect(m.x + 2, m.y + 2, m.w - 4, m.h - 4);
    ctx.fillStyle = SHARED.cream;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("?", m.x + m.w / 2, m.y + 21);
    ctx.textAlign = "left";
  }

  // Hazards drawn per-lane (foreshortened); only same-lane ones are lethal
  for (const h of room.hazards) {
    drawLaneHazard(ctx, room, h, player, run.frame);
  }

  // Door entry pad
  ctx.fillStyle = "rgba(86,130,3,0.75)";
  ctx.fillRect(room.start.x - 4, room.start.y + player.h - 4, player.w + 8, 5);
  ctx.fillStyle = SHARED.goal;
  ctx.font = "bold 10px monospace";
  ctx.fillText("IN", room.start.x + 1, room.start.y - 4);

  // Customer OUT / RCPT — mid-lane goal
  drawGoalStamp(ctx, room);

  // Far/mid courier behind FG props
  if (player.laneDisplay < 1.55) {
    const prevSmooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    drawCourier(ctx, player, run.frame);
    ctx.imageSmoothingEnabled = prevSmooth;
  }

  ctx.restore();

  // Foreground — skip heavy cover when courier is on NEAR lane
  withParallax(ctx, scale, camX, camY, PARALLAX.fg, PARALLAX.fg * 0.4, () => {
    ctx.globalAlpha = player.laneDisplay >= 1.55 ? 0.35 : 0.7;
    drawFgLayer(ctx, room, pal, run.frame);
    ctx.globalAlpha = 1;
  });

  // Near-lane courier drawn in front of FG (Metal Gear presence)
  if (player.laneDisplay >= 1.55) {
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.scale(scale, scale);
    ctx.translate(-camX, -camY);
    drawCourier(ctx, player, run.frame);
    ctx.restore();
  }

  // Soft side vignette (screen-space depth cue)
  ctx.fillStyle = "rgba(10,12,8,0.16)";
  ctx.fillRect(0, 30, 18, H - 30);
  ctx.fillRect(W - 18, 30, 18, H - 30);

  // HUD — depth lane + controls
  ctx.fillStyle = "rgba(26,31,22,0.78)";
  ctx.fillRect(0, 0, W, 34);
  ctx.fillStyle = SHARED.cream;
  ctx.font = "12px 'Courier New', monospace";
  const worldName = String(room.label || room.biome).toUpperCase();
  const laneName = LANES[player.lane]?.name || "MID";
  ctx.fillText(
    `←→ run · ↑↓ depth · Space jump · LANE ${laneName} · ${worldName} · ${String(room.tierName).toUpperCase()}`,
    12,
    14
  );
  // Lane meter
  for (let i = 0; i < 3; i++) {
    const lx = 12 + i * 22;
    ctx.fillStyle = i === player.lane ? "#daa520" : "rgba(245,236,215,0.25)";
    ctx.fillRect(lx, 20, 18, 8);
    ctx.fillStyle = SHARED.ink;
    ctx.font = "bold 7px monospace";
    ctx.fillText(["F", "M", "N"][i], lx + 5, 27);
  }
  ctx.fillStyle = "rgba(245,236,215,0.7)";
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillText("OUT on MID lane", 90, 27);
  if (run.fragile) {
    ctx.fillStyle = "#cc5500";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("FRAGILE", W - 88, 22);
  }
}

function withParallax(ctx, scale, camX, camY, fx, fy, drawFn) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  ctx.translate(-camX * fx, -camY * fy);
  drawFn();
  ctx.restore();
}

function drawSkyBackdrop(ctx, W, H, pal, biome, frame) {
  const sky = skyGradient(biome, pal);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sky.top);
  g.addColorStop(0.55, sky.mid);
  g.addColorStop(1, sky.bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (biome === "porch" || biome === "neighborhood") {
    // Harvest sun
    const sx = W * 0.78;
    const sy = H * 0.18;
    const rad = ctx.createRadialGradient(sx, sy, 4, sx, sy, 70);
    rad.addColorStop(0, "rgba(218,165,32,0.85)");
    rad.addColorStop(0.4, "rgba(218,165,32,0.35)");
    rad.addColorStop(1, "rgba(218,165,32,0)");
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(sx, sy, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#daa520";
    ctx.beginPath();
    ctx.arc(sx, sy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  if (biome === "space") {
    // Burnt-orange planet rim
    ctx.fillStyle = "#cc5500";
    ctx.beginPath();
    ctx.ellipse(W * 0.15, H * 0.75, 90, 36, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(245,236,215,0.15)";
    ctx.beginPath();
    ctx.ellipse(W * 0.12, H * 0.72, 40, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = pal.stripe;
  for (let i = 0; i < W; i += 64) ctx.fillRect(i, 0, 32, H);

  if (pal.fog) {
    ctx.fillStyle = pal.fog;
    ctx.fillRect(0, 0, W, H);
  }

  if (biome === "space" || biome === "gravity" || biome === "unmapped") {
    for (let i = 0; i < 36; i++) {
      const tw = 0.25 + 0.55 * Math.abs(Math.sin(frame / 25 + i * 1.7));
      ctx.fillStyle = `rgba(218,165,32,${tw * 0.65})`;
      const sx = ((i * 97 + frame * 0.02) % W + W) % W;
      const sy = (i * 53) % Math.floor(H * 0.7);
      ctx.fillRect(sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
  }
}

function skyGradient(biome, pal) {
  const table = {
    porch: { top: "#fff0c4", mid: "#f5ecd7", bot: "#d8c898" },
    neighborhood: { top: "#e8eef4", mid: "#c8d0d8", bot: "#9aa8b4" },
    lobby: { top: "#3a424c", mid: "#2a3038", bot: "#1c2228" },
    rooftops: { top: "#243048", mid: "#1a2230", bot: "#101820" },
    jungle: { top: "#2a3e22", mid: "#1e2e1a", bot: "#121c10" },
    neon: { top: "#2a1840", mid: "#1a1028", bot: "#0c0818" },
    frozen: { top: "#2a3a48", mid: "#1e2a32", bot: "#141c24" },
    gravity: { top: "#1a1c2a", mid: "#12141c", bot: "#080a10" },
    unmapped: { top: "#221820", mid: "#141218", bot: "#0a080c" },
    impossible: { top: "#243448", mid: "#1a2230", bot: "#101820" },
    shipping: { top: "#3a3428", mid: "#2e2a22", bot: "#1e1a14" },
    space: { top: "#3a3428", mid: "#1a1820", bot: "#08060c" },
    underwater: { top: "#0e3848", mid: "#0a2838", bot: "#061820" },
    desert: { top: "#6a4a28", mid: "#3a2a18", bot: "#2a1c10" },
  };
  return table[biome] || { top: pal.bg, mid: pal.bg, bot: pal.bg };
}

function drawSolidTile(ctx, px, py, tile, pal, grid, tx, ty) {
  const depth = 7;
  const side = pal.wallSide || "#3a4528";
  const rightOpen = !isFloorSupport(grid[ty]?.[tx + 1] || "#");
  const above = ty > 0 ? grid[ty - 1][tx] : "#";

  // Side face (2.5D thickness)
  if (rightOpen) {
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(px + tile, py);
    ctx.lineTo(px + tile + depth, py + 4);
    ctx.lineTo(px + tile + depth, py + tile + 4);
    ctx.lineTo(px + tile, py + tile);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = pal.wall;
  ctx.fillRect(px, py, tile, tile);

  // Top bevel / grass lip
  if (above !== "#" && above !== "=") {
    ctx.fillStyle = pal.wallTop;
    ctx.fillRect(px, py, tile, 9);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(px, py, tile, 3);
    if (rightOpen) {
      ctx.fillStyle = pal.wallEdge;
      ctx.beginPath();
      ctx.moveTo(px + tile, py);
      ctx.lineTo(px + tile + depth, py + 4);
      ctx.lineTo(px + tile, py + 9);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.fillStyle = pal.wallEdge;
    ctx.fillRect(px, py, tile, 3);
  }

  ctx.fillStyle = "rgba(245,236,215,0.12)";
  ctx.fillRect(px, py, 3, tile);
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(px + tile - 3, py, 3, tile);
}

function drawThickPlatform(ctx, px, py, tile, face, top, side) {
  const depth = 6;
  const topY = py + 8;
  const h = tile - 8;
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(px + tile, topY);
  ctx.lineTo(px + tile + depth, topY + 4);
  ctx.lineTo(px + tile + depth, topY + h + 4);
  ctx.lineTo(px + tile, topY + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = face;
  ctx.fillRect(px, topY, tile, h);
  ctx.fillStyle = top;
  ctx.fillRect(px, topY, tile, 4);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(px, topY + h - 3, tile, 3);
}

/** World-anchored far silhouettes — scroll via withParallax translate factor. */
function drawFarLayer(ctx, room, pal, frame) {
  const biome = room.biome;
  const span = room.width + 160;
  const baseY = Math.floor(room.height * 0.52);

  if (biome === "space" || biome === "gravity") {
    for (let i = 0; i < 40; i++) {
      const x = (i * 73) % span;
      const y = (i * 41) % Math.max(40, room.height - 40);
      const tw = 0.3 + 0.5 * Math.abs(Math.sin(frame / 30 + i));
      ctx.fillStyle = `rgba(218,165,32,${tw * 0.55})`;
      ctx.fillRect(x, y, 2, 2);
    }
    // Corporate dock silhouette beams
    ctx.fillStyle = "rgba(86,130,3,0.35)";
    ctx.fillRect(room.width * 0.55, room.height * 0.12, 10, room.height * 0.45);
    ctx.fillRect(room.width * 0.55, room.height * 0.2, 80, 8);
    ctx.fillStyle = "rgba(31,78,121,0.35)";
    ctx.fillRect(room.width * 0.2, room.height * 0.35, 100, 10);
    ctx.fillStyle = "rgba(204,85,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(room.width * 0.75, room.height * 0.22, 50, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (biome === "porch" || biome === "neighborhood" || biome === "lobby") {
    // Soft tree line
    ctx.fillStyle = biome === "porch" ? "rgba(86,130,3,0.45)" : "rgba(58,74,90,0.45)";
    ctx.beginPath();
    ctx.moveTo(-40, baseY + 80);
    for (let x = 0; x < span; x += 70) {
      ctx.lineTo(x, baseY - (32 + ((x * 13) % 36)));
    }
    ctx.lineTo(span, baseY + 80);
    ctx.closePath();
    ctx.fill();
    // Neighborhood houses with harvest roofs
    for (let i = 0; i < Math.ceil(span / 100); i++) {
      const bx = 30 + i * 100;
      const bh = 40 + (i % 3) * 14;
      ctx.fillStyle = biome === "porch" ? "rgba(214,196,150,0.7)" : "rgba(160,170,180,0.55)";
      ctx.fillRect(bx, baseY - bh, 54, bh);
      ctx.fillStyle = "rgba(204,85,0,0.55)";
      ctx.beginPath();
      ctx.moveTo(bx - 4, baseY - bh);
      ctx.lineTo(bx + 27, baseY - bh - 16);
      ctx.lineTo(bx + 58, baseY - bh);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(31,78,121,0.45)";
      ctx.fillRect(bx + 10, baseY - bh + 14, 12, 12);
      ctx.fillRect(bx + 30, baseY - bh + 14, 12, 12);
    }
    return;
  }

  if (biome === "shipping" || biome === "rooftops") {
    for (let i = 0; i < Math.ceil(span / 95); i++) {
      const bx = i * 95;
      const bh = 50 + (i % 4) * 18;
      ctx.fillStyle = "rgba(58,50,36,0.55)";
      ctx.fillRect(bx, baseY - bh, 70, bh);
      ctx.fillStyle = "rgba(204,85,0,0.2)";
      ctx.fillRect(bx + 8, baseY - bh + 12, 14, 8);
    }
    ctx.strokeStyle = "rgba(218,165,32,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, baseY - 100);
    ctx.lineTo(220, baseY - 40);
    ctx.stroke();
    return;
  }

  if (biome === "jungle") {
    ctx.fillStyle = "rgba(42,74,24,0.5)";
    for (let i = 0; i < Math.ceil(span / 70); i++) {
      const tx = i * 70;
      ctx.fillRect(tx + 10, baseY - 90, 8, 90);
      ctx.fillRect(tx, baseY - 100, 28, 18);
      ctx.fillRect(tx + 4, baseY - 112, 20, 14);
    }
    return;
  }

  if (biome === "neon") {
    for (let i = 0; i < Math.ceil(span / 100); i++) {
      const bx = i * 100;
      const bh = 70 + (i % 3) * 24;
      ctx.fillStyle = "rgba(40,20,60,0.65)";
      ctx.fillRect(bx, baseY - bh, 60, bh);
      ctx.fillStyle = i % 2 ? "rgba(204,85,0,0.45)" : "rgba(180,60,200,0.4)";
      ctx.fillRect(bx + 6, baseY - bh + 20, 30, 6);
    }
    return;
  }

  if (biome === "frozen") {
    ctx.fillStyle = "rgba(90,130,150,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, baseY + 40);
    for (let x = 0; x < span; x += 60) {
      ctx.lineTo(x, baseY - 20 - ((x * 7) % 50));
    }
    ctx.lineTo(span, baseY + 40);
    ctx.fill();
    return;
  }

  if (biome === "underwater") {
    ctx.fillStyle = "rgba(20,80,100,0.35)";
    for (let i = 0; i < Math.ceil(span / 140); i++) {
      const wx = i * 140 + Math.sin(frame / 40 + i) * 8;
      ctx.fillRect(wx, baseY - 30, 100, 50);
    }
    return;
  }

  if (biome === "desert") {
    ctx.fillStyle = "rgba(140,100,40,0.4)";
    ctx.beginPath();
    ctx.moveTo(0, baseY + 50);
    for (let x = 0; x < span; x += 90) {
      ctx.quadraticCurveTo(x + 45, baseY - 35 - (x % 40), x + 90, baseY + 10);
    }
    ctx.lineTo(span, baseY + 50);
    ctx.fill();
    return;
  }

  if (biome === "unmapped" || biome === "impossible") {
    for (let i = 0; i < Math.ceil(span / 120); i++) {
      const gx = i * 120;
      ctx.strokeStyle = `rgba(218,165,32,${0.15 + 0.1 * Math.sin(frame / 20 + i)})`;
      ctx.strokeRect(gx, 40 + (i % 3) * 30, 80, 50);
    }
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0, baseY, span, room.height - baseY);
}

function drawMidLayer(ctx, room, pal, frame) {
  const biome = room.biome;
  const groundY = Math.floor(room.height * 0.7);
  const span = room.width + 80;

  if (biome === "porch" || biome === "neighborhood") {
    // Cream sidewalk band
    ctx.fillStyle = "rgba(245,236,215,0.55)";
    ctx.fillRect(0, groundY - 4, span, 18);
    ctx.fillStyle = "rgba(90,70,40,0.45)";
    ctx.fillRect(0, groundY + 12, span, 4);
    for (let x = 0; x < span; x += 40) ctx.fillRect(x, groundY - 10, 3, 14);
    // Streetlamps
    for (let i = 0; i < Math.ceil(span / 150); i++) {
      const lx = 70 + i * 150;
      ctx.fillStyle = "#4a5560";
      ctx.fillRect(lx, groundY - 78, 5, 78);
      ctx.fillStyle = "rgba(218,165,32,0.75)";
      ctx.fillRect(lx - 8, groundY - 86, 22, 10);
      ctx.fillStyle = "rgba(218,165,32,0.2)";
      ctx.beginPath();
      ctx.arc(lx + 2, groundY - 70, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    // Mid trees
    for (let i = 0; i < Math.ceil(span / 120); i++) {
      const tx = 20 + i * 120;
      ctx.fillStyle = "#5a3a18";
      ctx.fillRect(tx + 10, groundY - 54, 7, 54);
      ctx.fillStyle = "#568203";
      ctx.fillRect(tx, groundY - 68, 28, 18);
      ctx.fillRect(tx + 4, groundY - 80, 20, 14);
    }
    return;
  }

  if (biome === "shipping") {
    for (let i = 0; i < Math.ceil(span / 140); i++) {
      const cx = 40 + i * 140;
      ctx.fillStyle = "rgba(138,106,47,0.45)";
      ctx.fillRect(cx, groundY - 36, 50, 36);
      ctx.fillStyle = "rgba(204,85,0,0.35)";
      ctx.fillRect(cx + 4, groundY - 28, 18, 12);
    }
    ctx.fillStyle = "rgba(204,85,0,0.25)";
    ctx.fillRect(0, groundY - 8, span, 6);
    return;
  }

  if (biome === "space") {
    // Cream–avocado dock walkway rib
    ctx.fillStyle = "rgba(245,236,215,0.35)";
    ctx.fillRect(10, groundY - 16, span * 0.95, 14);
    ctx.fillStyle = "rgba(86,130,3,0.4)";
    ctx.fillRect(10, groundY - 4, span * 0.95, 6);
    for (let i = 0; i < Math.ceil(span / 90); i++) {
      const px = 40 + i * 90;
      ctx.fillStyle = "rgba(31,78,121,0.55)";
      ctx.fillRect(px, groundY - 36, 10, 24);
      ctx.fillStyle = "rgba(218,165,32,0.45)";
      ctx.fillRect(px - 4, groundY - 40, 18, 5);
      ctx.fillStyle = "rgba(204,85,0,0.35)";
      ctx.beginPath();
      ctx.arc(px + 36, groundY - 55, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (biome === "neon") {
    for (let i = 0; i < Math.ceil(span / 150); i++) {
      const nx = 60 + i * 150;
      const pulse = 0.35 + 0.25 * Math.sin(frame / 12 + i);
      ctx.fillStyle = `rgba(204,85,0,${pulse})`;
      ctx.fillRect(nx, groundY - 50, 40, 6);
      ctx.fillStyle = `rgba(180,60,200,${pulse * 0.8})`;
      ctx.fillRect(nx + 50, groundY - 70, 6, 50);
    }
    return;
  }

  if (biome === "frozen") {
    ctx.fillStyle = "rgba(200,220,235,0.2)";
    for (let i = 0; i < 10; i++) {
      const fx = i * 90 + Math.sin(frame / 35 + i) * 4;
      ctx.fillRect(fx, ((i * 37 + frame * 0.3) % room.height), 3, 3);
    }
    ctx.fillStyle = "rgba(90,122,138,0.4)";
    ctx.fillRect(0, groundY - 10, span, 14);
    return;
  }

  if (biome === "jungle") {
    ctx.strokeStyle = "rgba(86,130,3,0.45)";
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.ceil(span / 100); i++) {
      const vx = 40 + i * 100;
      ctx.beginPath();
      ctx.moveTo(vx, 20);
      ctx.lineTo(vx + Math.sin(frame / 40 + i) * 6, groundY - 20);
      ctx.stroke();
    }
    return;
  }

  if (biome === "rooftops") {
    ctx.fillStyle = "rgba(100,120,160,0.25)";
    for (let i = 0; i < Math.ceil(span / 160); i++) {
      const cx = 40 + i * 160 + Math.sin(frame / 50 + i) * 10;
      ctx.fillRect(cx, 30 + (i % 3) * 20, 70, 12);
      ctx.fillRect(cx + 12, 22 + (i % 3) * 20, 40, 10);
    }
    return;
  }

  if (biome === "underwater") {
    for (let i = 0; i < 12; i++) {
      const bx = (i * 80 + frame * 0.4) % span;
      const by = room.height - ((frame * 0.6 + i * 40) % room.height);
      ctx.strokeStyle = "rgba(158,198,216,0.35)";
      ctx.strokeRect(bx, by, 4 + (i % 3), 4 + (i % 3));
    }
    return;
  }

  if (biome === "desert") {
    ctx.fillStyle = "rgba(138,106,47,0.35)";
    for (let i = 0; i < Math.ceil(span / 150); i++) {
      ctx.fillRect(70 + i * 150, groundY - 24, 6, 24);
      ctx.fillRect(64 + i * 150, groundY - 16, 6, 4);
    }
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, groundY - 8, span, 16);
}

function drawFgLayer(ctx, room, pal, frame) {
  const biome = room.biome;
  const bottom = room.height;
  const span = room.width;

  // FG props near floor — sparse so courier stays readable mid-screen
  ctx.globalAlpha = 0.7;

  if (biome === "porch" || biome === "neighborhood" || biome === "jungle") {
    // Porch railing + pots (mock FG language)
    ctx.fillStyle = biome === "jungle" ? "#2a4a18" : "#3a5a28";
    for (let i = 0; i < Math.ceil(span / 130); i++) {
      const bx = 8 + i * 130;
      ctx.fillRect(bx, bottom - 30, 34, 16);
      ctx.fillRect(bx + 6, bottom - 40, 22, 12);
    }
    ctx.fillStyle = "#5a3a18";
    ctx.fillRect(18, bottom - 58, 6, 48);
    ctx.fillRect(48, bottom - 58, 6, 48);
    ctx.fillRect(18, bottom - 58, 36, 5);
    ctx.fillStyle = "#8a6a2f";
    ctx.fillRect(span - 70, bottom - 36, 28, 22);
    ctx.fillStyle = "#568203";
    ctx.fillRect(span - 66, bottom - 48, 8, 14);
    ctx.fillRect(span - 54, bottom - 52, 8, 18);
  } else if (biome === "shipping") {
    ctx.fillStyle = "#8a6a2f";
    ctx.fillRect(10, bottom - 40, 44, 28);
    ctx.fillRect(span - 70, bottom - 36, 50, 24);
    ctx.fillStyle = "#cc5500";
    ctx.fillRect(16, bottom - 32, 12, 8);
  } else if (biome === "space" || biome === "gravity") {
    // Floating crates + IBM hazard stripes
    ctx.fillStyle = "rgba(31,78,121,0.75)";
    for (let i = 0; i < Math.ceil(span / 48); i++) {
      ctx.fillRect(i * 48, bottom - 14, 24, 6);
      ctx.fillStyle = "rgba(218,165,32,0.75)";
      ctx.fillRect(i * 48 + 24, bottom - 14, 24, 6);
      ctx.fillStyle = "rgba(31,78,121,0.75)";
    }
    ctx.fillStyle = "rgba(138,106,47,0.85)";
    ctx.fillRect(20, bottom - 44, 36, 26);
    ctx.fillRect(span - 80, bottom - 50, 40, 30);
    ctx.fillStyle = "#cc5500";
    ctx.fillRect(26, bottom - 36, 14, 10);
    ctx.strokeStyle = "rgba(245,236,215,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(100, bottom - 30, 18, Math.PI * 0.2, Math.PI * 1.1);
    ctx.stroke();
  } else if (biome === "neon") {
    ctx.fillStyle = `rgba(204,85,0,${0.35 + 0.2 * Math.sin(frame / 10)})`;
    ctx.fillRect(0, bottom - 14, span, 4);
    ctx.fillStyle = "rgba(40,20,60,0.7)";
    ctx.fillRect(20, bottom - 42, 28, 30);
    ctx.fillRect(span - 50, bottom - 42, 28, 30);
  } else if (biome === "frozen") {
    ctx.fillStyle = "rgba(200,220,235,0.45)";
    ctx.fillRect(0, bottom - 16, span, 12);
    for (let i = 0; i < Math.ceil(span / 180); i++) {
      ctx.fillRect(60 + i * 180, bottom - 40, 8, 28);
    }
  } else if (biome === "underwater") {
    ctx.fillStyle = "rgba(42,106,90,0.55)";
    for (let i = 0; i < Math.ceil(span / 90); i++) {
      ctx.fillRect(i * 90, bottom - 20 - (i % 3) * 8, 4, 20 + (i % 3) * 8);
    }
  } else if (biome === "desert") {
    ctx.fillStyle = "rgba(180,140,60,0.5)";
    ctx.fillRect(0, bottom - 20, span, 16);
  } else if (biome === "rooftops") {
    ctx.fillStyle = "rgba(106,112,128,0.55)";
    ctx.fillRect(15, bottom - 36, 22, 28);
    ctx.fillRect(span - 50, bottom - 40, 26, 32);
  } else {
    ctx.fillStyle = "rgba(26,31,22,0.35)";
    ctx.fillRect(0, bottom - 18, span, 14);
  }

  ctx.globalAlpha = 1;
}

function drawProps(ctx, room, frame, pal) {
  for (const p of room.props || []) {
    if (p.kind === "pipe") {
      ctx.fillStyle = pal.prop;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2);
      ctx.fillStyle = "#8a9a78";
      ctx.fillRect(p.x + 6, p.y - 4, 8, 8);
    } else if (p.kind === "sign") {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(p.x, p.y, 18, 12);
      ctx.fillStyle = SHARED.ink;
      ctx.font = "6px monospace";
      ctx.fillText(p.text.slice(0, 4), p.x + 1, p.y + 8);
    } else if (p.kind === "stripe") {
      ctx.fillStyle = "#daa520";
      for (let i = 0; i < p.w; i += 8) ctx.fillRect(p.x + i, p.y, 4, p.h);
      ctx.fillStyle = SHARED.ink;
      for (let i = 4; i < p.w; i += 8) ctx.fillRect(p.x + i, p.y, 4, p.h);
    } else if (p.kind === "fan") {
      const spin = frame * 0.15 + (p.phase || 0);
      ctx.fillStyle = "#4a5560";
      ctx.fillRect(p.x + 8, p.y + 8, 12, 12);
      ctx.save();
      ctx.translate(p.x + 14, p.y + 14);
      ctx.rotate(spin);
      ctx.fillStyle = "#8b1e1e";
      ctx.fillRect(-10, -2, 20, 4);
      ctx.fillRect(-2, -10, 4, 20);
      ctx.restore();
    } else if (p.kind === "tree") {
      ctx.fillStyle = "#5a3a18";
      ctx.fillRect(p.x + 6, p.y + 4, 4, p.h);
      ctx.fillStyle = pal.prop;
      ctx.fillRect(p.x, p.y, 16, 10);
      ctx.fillRect(p.x + 2, p.y - 6, 12, 8);
    } else if (p.kind === "vine") {
      ctx.fillStyle = "#3a6a28";
      ctx.fillRect(p.x, p.y, 3, p.h);
      ctx.fillStyle = "#6f9a12";
      ctx.fillRect(p.x - 4, p.y + p.h - 6, 10, 4);
    } else if (p.kind === "lamp") {
      ctx.fillStyle = "#4a5560";
      ctx.fillRect(p.x + 4, p.y, 3, 22);
      ctx.fillStyle = "rgba(218,165,32,0.85)";
      ctx.fillRect(p.x, p.y - 4, 11, 6);
    } else if (p.kind === "plant") {
      ctx.fillStyle = "#8a6a2f";
      ctx.fillRect(p.x + 4, p.y + 8, 8, 6);
      ctx.fillStyle = "#568203";
      ctx.fillRect(p.x + 2, p.y, 4, 10);
      ctx.fillRect(p.x + 8, p.y + 2, 4, 8);
    } else if (p.kind === "cloud") {
      ctx.fillStyle = "rgba(200,210,230,0.35)";
      ctx.fillRect(p.x, p.y, p.w, 8);
      ctx.fillRect(p.x + 6, p.y - 4, p.w - 8, 8);
    } else if (p.kind === "antenna") {
      ctx.fillStyle = "#8a9aaa";
      ctx.fillRect(p.x, p.y, 2, 16);
      ctx.fillStyle = "#cc5500";
      ctx.fillRect(p.x - 3, p.y, 8, 3);
    } else if (p.kind === "flake") {
      const ox = Math.sin(frame / 40 + p.phase) * 6;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(p.x + ox, (p.y + frame * 0.4 + p.phase * 10) % room.height, 2, 2);
    } else if (p.kind === "star") {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / 20 + p.phase));
      ctx.fillStyle = p.glitch
        ? `rgba(218,165,32,${tw})`
        : `rgba(245,236,215,${tw})`;
      ctx.fillRect(p.x, p.y, p.glitch ? 3 : 2, p.glitch ? 3 : 2);
    } else if (p.kind === "mailbox") {
      ctx.fillStyle = "#1f4e79";
      ctx.fillRect(p.x + 6, p.y + 4, 14, 10);
      ctx.fillStyle = "#daa520";
      ctx.fillRect(p.x + 8, p.y + 6, 6, 4);
      ctx.fillStyle = "#4a5560";
      ctx.fillRect(p.x + 11, p.y + 14, 3, 8);
    } else if (p.kind === "bubble") {
      const oy = -((frame * 0.5 + p.phase * 20) % room.height);
      const y = (p.y + oy + room.height * 4) % room.height;
      ctx.strokeStyle = "rgba(158,198,216,0.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x, y, p.r * 2, p.r * 2);
    } else if (p.kind === "cactus") {
      ctx.fillStyle = "#4a7a28";
      ctx.fillRect(p.x + 4, p.y, 5, 16);
      ctx.fillRect(p.x, p.y + 4, 4, 3);
      ctx.fillRect(p.x + 9, p.y + 6, 4, 3);
    }
  }
}

function laneLerp(display) {
  const a = Math.max(0, Math.min(2, display));
  const i0 = Math.floor(a);
  const i1 = Math.min(2, i0 + 1);
  const t = a - i0;
  const L0 = LANES[i0];
  const L1 = LANES[i1];
  return {
    scale: L0.scale + (L1.scale - L0.scale) * t,
    yLift: L0.yLift + (L1.yLift - L0.yLift) * t,
    shadow: L0.shadow + (L1.shadow - L0.shadow) * t,
  };
}

/** Depth ribbons under the play plane — reads as walkable Z stages. */
function drawDepthLaneRibbons(ctx, room, pal, player) {
  const baseY = room.height - 4;
  const colors = [
    "rgba(86,130,3,0.22)",
    "rgba(218,165,32,0.28)",
    "rgba(31,78,121,0.28)",
  ];
  for (let lane = 0; lane < 3; lane++) {
    const L = LANES[lane];
    const y = baseY - (2 - lane) * 7 + L.yLift * 0.15;
    ctx.fillStyle = colors[lane];
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.lineTo(room.width + 20, y - 4);
    ctx.lineTo(room.width + 20, y + 10);
    ctx.lineTo(-20, y + 14);
    ctx.closePath();
    ctx.fill();
    if (lane === player.lane) {
      ctx.strokeStyle = "rgba(218,165,32,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, y + 2);
      ctx.lineTo(room.width + 20, y - 2);
      ctx.stroke();
    }
  }
  void pal;
}

function drawGoalStamp(ctx, room) {
  const gx = room.goal.x + room.tile / 2;
  const gy = room.goal.y + room.tile / 2;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(-0.12);
  ctx.fillStyle = "rgba(218,165,32,0.92)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1f16";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = SHARED.ink;
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("OUT", 0, -1);
  ctx.font = "bold 7px monospace";
  ctx.fillText("RCPT · MID", 0, 11);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawLaneHazard(ctx, room, h, player, frame) {
  const lane = h.lane ?? 1;
  const L = LANES[lane];
  const pulse = Math.sin(frame / room.tier.hazardPeriod + h.phase);
  const active = pulse > -0.15;
  const same = lane === player.lane;
  ctx.save();
  const cx = h.x + room.tile / 2;
  const cy = h.y + room.tile;
  ctx.translate(cx, cy + L.yLift * 0.35);
  ctx.scale(L.scale, L.scale);
  ctx.translate(-cx, -cy);
  ctx.globalAlpha = same ? 1 : 0.4;
  ctx.fillStyle = active ? SHARED.hazard : "rgba(139,30,30,0.35)";
  for (let i = 0; i < 3; i++) {
    const bx = h.x + 6 + i * 8;
    ctx.beginPath();
    ctx.moveTo(bx, h.y + room.tile);
    ctx.lineTo(bx + 4, h.y + (active ? 8 : 18));
    ctx.lineTo(bx + 8, h.y + room.tile);
    ctx.fill();
  }
  ctx.fillStyle = same ? "#daa520" : "rgba(245,236,215,0.45)";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.fillText(LANES[lane].name[0], h.x + room.tile / 2, h.y + 6);
  ctx.restore();
}

/**
 * Mock-scale courier — painted sprite with foreshortening by depth lane.
 * Falls back to chunky vector silhouette if sprite missing.
 */
function drawCourier(ctx, player, frame) {
  const vis = laneLerp(player.laneDisplay ?? player.lane ?? 1);
  const f = player.facing >= 0 ? 1 : -1;
  const moving = player.onGround && Math.abs(player.vx) > 0.45;
  const bob = moving ? (Math.floor(frame / 5) % 2) * 2 : 0;

  const feetX = player.x + player.w / 2;
  const feetY = player.y + player.h + vis.yLift + bob;

  // Ground contact shadow (lane-scaled)
  ctx.fillStyle = `rgba(26,31,22,${vis.shadow})`;
  ctx.beginPath();
  ctx.ellipse(feetX, feetY + 2, 16 * vis.scale, 5 * vis.scale, 0, 0, Math.PI * 2);
  ctx.fill();

  const sprite = art("courier");
  const drawH = 56 * vis.scale;
  const drawW = 48 * vis.scale;

  ctx.save();
  ctx.translate(feetX, feetY);
  ctx.scale(f * vis.scale, vis.scale);
  ctx.imageSmoothingEnabled = true;

  if (sprite) {
    // Sprite feet at origin
    ctx.drawImage(sprite, -24, -58, 48, 58);
  } else {
    drawCourierFallback(ctx);
  }

  ctx.restore();

  // Package highlight when facing camera-ish (near lane)
  if ((player.laneDisplay ?? 1) > 1.4) {
    ctx.fillStyle = "rgba(218,165,32,0.15)";
    ctx.beginPath();
    ctx.arc(feetX, feetY - drawH * 0.45, drawW * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCourierFallback(ctx) {
  // Drawn in local space: feet at 0, facing +X, unit scale
  ctx.fillStyle = "#3a2e1a";
  ctx.fillRect(-10, -12, 8, 12);
  ctx.fillRect(2, -12, 8, 12);
  ctx.fillStyle = "#f5ecd7";
  ctx.fillRect(-12, -36, 24, 26);
  ctx.fillStyle = "#cc5500";
  ctx.fillRect(-12, -28, 24, 7);
  ctx.fillStyle = "#daa520";
  ctx.fillRect(-12, -26, 24, 2);
  ctx.fillStyle = "#e8dcc0";
  ctx.fillRect(-10, -52, 20, 18);
  ctx.fillStyle = "#1a1f16";
  ctx.fillRect(4, -44, 4, 4);
  ctx.fillStyle = "#b8860b";
  ctx.fillRect(8, -34, 22, 20);
  ctx.fillStyle = "#1a1f16";
  ctx.fillRect(8, -24, 22, 3);
  ctx.fillRect(17, -34, 3, 20);
  ctx.fillStyle = "#568203";
  ctx.fillRect(14, -30, 6, 6);
}

function drawWalkway(ctx, px, py, tile, dir, frame, biome) {
  const neon = biome === "neon";
  ctx.fillStyle = neon
    ? dir > 0
      ? "#a04080"
      : "#4040a0"
    : dir > 0
      ? SHARED.convR
      : SHARED.convL;
  ctx.fillRect(px, py + 8, tile, tile - 8);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(px, py + 8, tile, 3);
  ctx.fillStyle = SHARED.cream;
  const shift = ((frame * dir * 2.5) % tile + tile) % tile;
  for (let i = -tile; i < tile * 2; i += 8) {
    const x = px + ((i + shift) % tile);
    if (x < px || x > px + tile - 5) continue;
    ctx.beginPath();
    if (dir > 0) {
      ctx.moveTo(x, py + 16);
      ctx.lineTo(x + 5, py + 19);
      ctx.lineTo(x, py + 22);
    } else {
      ctx.moveTo(x + 5, py + 16);
      ctx.lineTo(x, py + 19);
      ctx.lineTo(x + 5, py + 22);
    }
    ctx.fill();
  }
  ctx.fillStyle = neon ? "#daa520" : SHARED.goal;
  ctx.fillRect(px, py + 8, tile, 2);
}
