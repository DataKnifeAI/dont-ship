import { formatPayout, formatProb, payoutForProb, oddsDisplay } from "./odds.js";
import { calibrationLabel, doorStakeStamps, goalProgress, GOALS } from "./state.js";
import { art, drawPlateCover } from "./art.js";

/** Hit regions for canvas doors (canvas pixel space). Updated each draw. */
export let doorHitRegions = [];

export function els() {
  return {
    app: document.getElementById("app"),
    bankroll: document.getElementById("bankroll"),
    calibration: document.getElementById("calibration"),
    runs: document.getElementById("runs"),
    deliveries: document.getElementById("deliveries"),
    memoId: document.getElementById("memo-id"),
    brief: document.getElementById("brief"),
    modifiers: document.getElementById("modifiers"),
    houseCopy: document.getElementById("house-copy"),
    doors: document.getElementById("doors"),
    overlay: document.getElementById("overlay"),
    stage: document.getElementById("stage"),
    canvas: document.getElementById("game"),
    ticker: document.getElementById("ticker"),
  };
}

/** `title` | `hub` | `run` | `result` — drives which chrome is visible (see css `[data-screen]`). */
export function setScreen(name) {
  els().app.dataset.screen = name;
}

export function refreshLedger(state) {
  const e = els();
  e.bankroll.textContent = Number(state.bankroll).toFixed(0);
  e.calibration.textContent = calibrationLabel(state);
  e.runs.textContent = String(state.runs);
  e.deliveries.textContent = `${state.deliveries}/${GOALS.deliveriesTarget}`;
}

export function renderBrief(manifest) {
  const e = els();
  if (!manifest) {
    e.memoId.textContent = "—";
    e.brief.textContent = "Awaiting terminal dispense…";
    e.modifiers.replaceChildren();
    return;
  }
  e.memoId.textContent = manifest.manifestId;
  e.brief.textContent = manifest.brief;
  const mods = parcelStamps(manifest);
  e.modifiers.innerHTML = mods.length
    ? `<span class="label">PARCEL</span>${mods.map((m) => `<span class="stamp">${escapeHtml(m)}</span>`).join("")}`
    : `<span class="label">PARCEL</span><span class="stamp quiet">STANDARD</span>`;
}

export function renderGoalLine(state) {
  const e = els();
  const g = goalProgress(state);
  e.houseCopy.textContent = `Shift goal: ${g.bankrollTarget} C.O.D. · ${g.deliveriesTarget} deliveries · or survive ${g.executiveId}`;
  document.getElementById("memo-help").innerHTML =
    `<b>Low %</b> = harder universe · deliver more often than J.E.V. predicts → <b>+EV</b> · stake <b>${state.stake} C.O.D.</b> · click a door or <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd>`;
}

/** Parcel stamps from manifest modifiers (e.g. FRAGILE). */
export function parcelStamps(manifest) {
  return (manifest?.modifiers || []).map((m) => String(m).replace(/_/g, " ").toUpperCase());
}

const TAG_LABELS = {
  none: null,
  fragile_parcel_required: "FRAGILE PARCEL",
  fragile: "FRAGILE PARCEL",
  black_hole_slot: "BLACK HOLE",
  crystal_fauna: "CRYSTAL FAUNA",
  sentient_traffic: "SENTIENT TRAFFIC",
  heat_shimmer: "HEAT SHIMMER",
  portal_wind: "PORTAL WIND",
  low_gravity: "LOW-G",
  drift_watch: "DRIFT WATCH",
};

/** View-models for the 3D hub's door signage and tickets. */
export function doorCards(manifest) {
  const mods = manifest?.modifiers || [];
  return (manifest?.doors || []).map((door) => {
    const tags = [];
    for (const raw of [...(door.hazardTags || []), ...mods]) {
      const key = String(raw || "").toLowerCase();
      const label = key in TAG_LABELS ? TAG_LABELS[key] : key.replace(/_/g, " ").toUpperCase();
      if (label && !tags.includes(label)) tags.push(label);
    }
    if (!tags.length) tags.push("LOCAL HAZARDS");
    return {
      id: door.id,
      tier: String(door.difficultyTier || "easy").toLowerCase(),
      prob: formatProb(door.displayedProb),
      payout: `×${payoutForProb(door.displayedProb).toFixed(2)}`,
      tags,
      text: door.outcomeText || "",
    };
  });
}

/** Side door list retired — canvas doors are the only pick UI. Keep hooks no-op. */
export function renderDoors(_manifest, _opts) {
  const e = els();
  if (e.doors) e.doors.innerHTML = "";
}

export function setDoorsEnabled(on) {
  document.querySelectorAll("#doors button").forEach((b) => {
    b.disabled = !on;
  });
}

export function highlightDoor(doorId) {
  document.querySelectorAll(".door").forEach((el) => {
    el.classList.toggle("selected", el.dataset.door === doorId);
  });
}

/** `variant`: space-separated card modifiers, e.g. "title", "result good", "result bad", "win", "broke". */
export function showOverlay(html, variant = "") {
  const e = els();
  e.overlay.className = `overlay visible ${variant}`.trim();
  e.overlay.innerHTML = `<div class="card ${variant}">${html}</div>`;
}

export function hideOverlay() {
  const e = els();
  e.overlay.className = "overlay";
  e.overlay.innerHTML = "";
}

/**
 * Primary door select: cream linoleum Box 407-B hall (mock-matched 2.5D).
 * Labels: A/B/C, %, payout, tier stamps, short outcome.
 */
export function drawDoorSelect(ctx, manifest, frame = 0, hoverIndex = -1) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  doorHitRegions = [];

  drawDoorHall(ctx, W, H, frame);

  const title = manifest
    ? `${manifest.manifestId} · pick a universe`
    : "Box 407-B · awaiting doorway";
  ctx.fillStyle = "#1f4e79";
  ctx.font = "bold 17px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, W / 2, 28);

  const mods = manifest?.modifiers || [];
  if (mods.length) {
    const ribbon = mods.map((m) => String(m).toUpperCase().replace(/_/g, " ")).join("  ·  ");
    ctx.fillStyle = "#cc5500";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText(`PARCEL STAMP: ${ribbon}`, W / 2, 48);
  }

  const doors = manifest?.doors || [];
  // Perspective depth like the mock: left closest, mid mid, right farthest
  const layouts = [
    { scale: 1.12, yBias: 6, depth: 24 },
    { scale: 1.02, yBias: 0, depth: 18 },
    { scale: 0.92, yBias: -8, depth: 14 },
  ];
  const baseW = 198;
  const baseH = 278;
  const gap = 22;
  const sizes = doors.map((_, i) => {
    const L = layouts[i] || layouts[1];
    return { w: Math.round(baseW * L.scale), h: Math.round(baseH * L.scale), ...L };
  });
  const totalW = sizes.reduce((s, d) => s + d.w, 0) + gap * Math.max(0, doors.length - 1);
  let cursorX = (W - totalW) / 2;
  const floorY = H - 52;

  doors.forEach((door, i) => {
    const S = sizes[i];
    const x = cursorX;
    const y = 78 + S.yBias + (baseH - S.h);
    const hot = i === hoverIndex;
    drawLiteralDoor(ctx, x, y, S.w, S.h, door, mods, i, hot, frame, floorY, S.depth);
    doorHitRegions.push({ index: i, id: door.id, x, y, w: S.w, h: S.h });
    cursorX += S.w + gap;
  });

  drawFenSeal(ctx, W - 78, 86, frame);
  drawWallyVignette(ctx, 18, H - 128, frame);
  drawFgHallProps(ctx, W, H, floorY, frame);

  ctx.fillStyle = "rgba(26,31,22,0.78)";
  ctx.fillRect(0, H - 34, W, 34);
  ctx.fillStyle = "#daa520";
  ctx.font = "12px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "Low % = harder world. Deliver more often than the odds → +EV.  Click or 1–3.",
    W / 2,
    H - 13
  );
  ctx.textAlign = "left";
}

function drawDoorHall(ctx, W, H, frame) {
  const floorY = H - 52;
  const vanishX = W / 2;
  const vanishY = 64;

  // Prefer the approved mock still as hall underlay when available
  const mockHub = art("hubMock") || art("hubHall");
  if (mockHub) {
    drawPlateCover(ctx, mockHub, W, H, 0.62);
    ctx.fillStyle = "rgba(245,236,215,0.18)";
    ctx.fillRect(0, 0, W, H);
  } else {
    const ceil = ctx.createLinearGradient(0, 0, 0, floorY);
    ceil.addColorStop(0, "#e8d9b0");
    ceil.addColorStop(0.55, "#f5ecd7");
    ceil.addColorStop(1, "#d8c9a0");
    ctx.fillStyle = ceil;
    ctx.fillRect(0, 0, W, H);
  }

  // Olive-gold wall panels (mock mid-century wood-corporate, not neon avocado)
  ctx.fillStyle = "#6a6432";
  ctx.beginPath();
  ctx.moveTo(0, 54);
  ctx.lineTo(vanishX - 260, vanishY);
  ctx.lineTo(vanishX - 260, floorY - 6);
  ctx.lineTo(0, floorY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 54);
  ctx.lineTo(vanishX + 260, vanishY);
  ctx.lineTo(vanishX + 260, floorY - 6);
  ctx.lineTo(W, floorY);
  ctx.closePath();
  ctx.fill();
  // Soft avocado glaze so brand green still reads
  ctx.fillStyle = "rgba(86,130,3,0.22)";
  ctx.fillRect(0, 54, W * 0.22, floorY - 54);
  ctx.fillRect(W * 0.78, 54, W * 0.22, floorY - 54);

  // Panel seams
  ctx.strokeStyle = "rgba(26,31,22,0.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const xL = 8 + t * (vanishX - 268);
    const y0 = 54 + t * (vanishY - 54);
    ctx.beginPath();
    ctx.moveTo(xL, y0);
    ctx.lineTo(xL * 0.2, floorY - 4);
    ctx.stroke();
    const xR = W - 8 - t * (W - (vanishX + 268));
    ctx.beginPath();
    ctx.moveTo(xR, y0);
    ctx.lineTo(W - (W - xR) * 0.2, floorY - 4);
    ctx.stroke();
  }

  // Back wall cream band
  ctx.fillStyle = "#efe4c8";
  ctx.fillRect(vanishX - 268, vanishY, 536, floorY - vanishY - 4);
  ctx.fillStyle = "rgba(86,130,3,0.18)";
  ctx.fillRect(vanishX - 268, vanishY, 536, 18);

  // Fluorescent harvest strip lights
  const flicker = 0.75 + 0.25 * Math.sin(frame / 16);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const y = 50 + t * (vanishY - 42);
    const inset = 24 + t * 230;
    ctx.fillStyle = `rgba(218,165,32,${0.55 * flicker})`;
    ctx.fillRect(inset, y, W - inset * 2, 5);
    ctx.fillStyle = `rgba(245,236,215,${0.35 * flicker})`;
    ctx.fillRect(inset + 4, y + 1, W - inset * 2 - 8, 2);
  }

  // Cream linoleum perspective floor
  const floorG = ctx.createLinearGradient(0, floorY - 100, 0, H);
  floorG.addColorStop(0, "#e6d5b0");
  floorG.addColorStop(0.45, "#f5ecd7");
  floorG.addColorStop(1, "#d4c29a");
  ctx.fillStyle = floorG;
  ctx.beginPath();
  ctx.moveTo(vanishX - 280, floorY - 2);
  ctx.lineTo(vanishX + 280, floorY - 2);
  ctx.lineTo(W + 50, H);
  ctx.lineTo(-50, H);
  ctx.closePath();
  ctx.fill();

  // Linoleum seams
  ctx.strokeStyle = "rgba(26,31,22,0.12)";
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    ctx.beginPath();
    ctx.moveTo(vanishX + i * 28, floorY);
    ctx.lineTo(vanishX + i * 150, H);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const y = floorY + 10 + i * 14;
    ctx.beginPath();
    ctx.moveTo(30 - i * 18, y);
    ctx.lineTo(W - 30 + i * 18, y);
    ctx.stroke();
  }

  // IBM-blue floor stripe
  ctx.fillStyle = "#1f4e79";
  ctx.beginPath();
  ctx.moveTo(vanishX - 200, floorY + 6);
  ctx.lineTo(vanishX + 200, floorY + 6);
  ctx.lineTo(vanishX + 340, floorY + 18);
  ctx.lineTo(vanishX - 340, floorY + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#daa520";
  ctx.fillRect(0, floorY - 3, W, 3);

  // Alcove pillars
  drawPillar(ctx, 52, 88, floorY - 96);
  drawPillar(ctx, W - 76, 88, floorY - 96);

  // Banner
  ctx.fillStyle = "rgba(245,236,215,0.92)";
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = "#1f4e79";
  ctx.fillRect(W / 2 - 220, 6, 440, 22);
  ctx.fillStyle = "#f5ecd7";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("J.E.V. · BOX 407-B · MULTIVERSE DOORWAYS · COURIERS ONLY", W / 2, 21);
  ctx.fillStyle = "rgba(31,78,121,0.35)";
  ctx.fillRect(0, 52, W, 3);
}

function drawPillar(ctx, x, y, h) {
  ctx.fillStyle = "#3a5520";
  ctx.fillRect(x, y, 26, h);
  ctx.fillStyle = "#6f9a12";
  ctx.fillRect(x, y, 6, h);
  ctx.fillStyle = "#daa520";
  ctx.fillRect(x - 4, y, 34, 6);
  ctx.fillRect(x - 4, y + h - 4, 34, 6);
}

function drawLiteralDoor(ctx, x, y, w, h, door, mods, index, hot, frame, floorY = y + h + 20, depth = 16) {
  const payout = payoutForProb(door.displayedProb);
  const { tier, tags } = doorStakeStamps(door, mods);
  const stampLabel = tier === "BRUTAL" ? "HARD" : tier === "HARD" ? "MED" : "EASY";
  const faceBias = index === 0 ? 1 : index === 2 ? -1 : 0;

  // Floor contact shadow
  ctx.fillStyle = "rgba(26,31,22,0.28)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, Math.min(floorY - 4, y + h + 10), w * 0.46, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dark alcove recess
  ctx.fillStyle = "#2a2214";
  ctx.fillRect(x - 8, y - 10, w + 16, h + 16);

  // Dimensional frame thickness
  ctx.fillStyle = hot ? "#5a7a14" : "#4a3a1e";
  if (faceBias >= 0) {
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + depth, y + 10);
    ctx.lineTo(x + w + depth, y + h + 10);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
  if (faceBias <= 0) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - depth, y + 10);
    ctx.lineTo(x - depth, y + h + 10);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = hot ? "#6f9a12" : "#6a5430";
  ctx.fillRect(x - 6, y - 12, w + 12, 10);
  if (faceBias >= 0) {
    ctx.beginPath();
    ctx.moveTo(x + w + 6, y - 2);
    ctx.lineTo(x + w + depth, y + 8);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
  }
  if (faceBias <= 0) {
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 2);
    ctx.lineTo(x - depth, y + 8);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  // Outer wood frame
  ctx.fillStyle = hot ? "#7a9a28" : "#5a4220";
  ctx.fillRect(x - 7, y - 7, w + 14, h + 14);

  // Portal glow peek
  const glow = 0.14 + 0.07 * Math.sin(frame / 14 + index);
  ctx.fillStyle =
    tier === "BRUTAL"
      ? `rgba(139,30,30,${glow + 0.18})`
      : tier === "HARD"
        ? `rgba(204,85,0,${glow + 0.14})`
        : `rgba(86,130,3,${glow + 0.12})`;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

  // Door face — warm mid-century wood (mock orange-brown)
  const wood = ctx.createLinearGradient(x, y, x + w, y);
  wood.addColorStop(0, hot ? "#e0a858" : "#c48438");
  wood.addColorStop(0.4, hot ? "#d49440" : "#a86828");
  wood.addColorStop(1, hot ? "#a86020" : "#7a4818");
  ctx.fillStyle = wood;
  ctx.fillRect(x, y, w, h);

  // Bevels + grain
  ctx.fillStyle = "rgba(245,236,215,0.28)";
  ctx.fillRect(x, y, 5, h);
  ctx.fillStyle = "rgba(26,31,22,0.22)";
  ctx.fillRect(x + w - 5, y, 5, h);
  ctx.strokeStyle = "rgba(26,31,22,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const gx = x + 10 + i * ((w - 20) / 5);
    ctx.beginPath();
    ctx.moveTo(gx, y + 8);
    ctx.lineTo(gx + 2, y + h - 8);
    ctx.stroke();
  }

  // Raised panels
  ctx.fillStyle = "rgba(26,31,22,0.18)";
  ctx.fillRect(x + 14, y + 18, w - 28, h * 0.34);
  ctx.fillRect(x + 14, y + h * 0.44, w - 28, h * 0.34);
  ctx.strokeStyle = "rgba(245,236,215,0.2)";
  ctx.strokeRect(x + 14, y + 18, w - 28, h * 0.34);
  ctx.strokeRect(x + 14, y + h * 0.44, w - 28, h * 0.34);

  // Brass knob
  ctx.fillStyle = "rgba(26,31,22,0.3)";
  ctx.beginPath();
  ctx.arc(x + w - 26, y + h * 0.55 + 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#daa520";
  ctx.beginPath();
  ctx.arc(x + w - 28, y + h * 0.55, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5ecd7";
  ctx.beginPath();
  ctx.arc(x + w - 30, y + h * 0.55 - 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Letter plate
  ctx.fillStyle = "#1a1f16";
  ctx.fillRect(x + w / 2 - 20, y + 26, 40, 32);
  ctx.fillStyle = "#daa520";
  ctx.font = "bold 26px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(door.id, x + w / 2, y + 50);

  // Probability
  ctx.fillStyle = "#1a1f16";
  ctx.font = "bold 20px 'Courier New', monospace";
  ctx.fillText(formatProb(door.displayedProb), x + w / 2, y + 92);

  // Burnt-orange rubber stake stamp (mock language)
  drawRubberStamp(ctx, x + w / 2, y + 118, stampLabel, frame + index * 7);

  // Tags + payout
  const stakeBits = [...tags.slice(0, 2), formatPayout(payout)];
  ctx.fillStyle = "#1f4e79";
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillText(stakeBits.join(" · "), x + w / 2, y + 148);

  // Outcome blurb
  ctx.fillStyle = "#1a1f16";
  ctx.font = "10px 'Courier New', monospace";
  const lines = wrapText(ctx, door.outcomeText || "", w - 22, 3);
  let ty = y + 168;
  for (const line of lines) {
    ctx.fillText(line, x + w / 2, ty);
    ty += 13;
  }

  ctx.fillStyle = "rgba(26,31,22,0.75)";
  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillText(`[${index + 1}]`, x + w / 2, y + h - 14);

  if (hot) {
    ctx.strokeStyle = `rgba(204,85,0,${0.55 + 0.35 * Math.sin(frame / 7)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
  }
  ctx.textAlign = "left";
}

function drawRubberStamp(ctx, cx, cy, label, frame) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-8 + Math.sin(frame / 40) * 1.5) * (Math.PI / 180));
  ctx.fillStyle = "rgba(204,85,0,0.88)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(139,40,0,0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#f5ecd7";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 1);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawFenSeal(ctx, x, y, frame) {
  const seal = art("fenSeal");
  ctx.fillStyle = "rgba(245,236,215,0.9)";
  ctx.beginPath();
  ctx.arc(x + 22, y + 22, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1f4e79";
  ctx.lineWidth = 3;
  ctx.stroke();
  if (seal) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 22, y + 22, 20, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(seal, x + 2, y + 2, 40, 40);
    ctx.restore();
  } else {
    ctx.fillStyle = "#568203";
    ctx.beginPath();
    ctx.arc(x + 22, y + 22, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#1f4e79";
  ctx.font = "bold 8px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("FEN", x + 22, y + 56 + Math.sin(frame / 30));
  ctx.textAlign = "left";
}

function drawFgHallProps(ctx, W, H, floorY, frame) {
  // Foreground crate + railing (mock depth cue)
  ctx.fillStyle = "rgba(138,106,47,0.92)";
  ctx.fillRect(W - 110, floorY - 36, 72, 34);
  ctx.fillStyle = "#cc5500";
  ctx.fillRect(W - 102, floorY - 28, 22, 14);
  ctx.fillStyle = "#1a1f16";
  ctx.font = "bold 8px 'Courier New', monospace";
  ctx.fillText("ODDS", W - 98, floorY - 18);

  ctx.strokeStyle = "rgba(26,31,22,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, floorY - 40);
  ctx.lineTo(8, floorY);
  ctx.moveTo(8, floorY - 40);
  ctx.lineTo(70, floorY - 40);
  ctx.stroke();
  ctx.fillStyle = "rgba(86,130,3,0.45)";
  ctx.fillRect(12, floorY - 38, 4, 28);
  ctx.fillRect(40, floorY - 38, 4, 28);
  void frame;
}

function wrapText(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
      if (lines.length >= maxLines) break;
    } else {
      cur = test;
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? `${last.slice(0, -2)}…` : last;
  }
  return lines;
}

function drawWallyVignette(ctx, x, y, frame) {
  // Small dock-supervisor vignette — secondary, not clutter
  ctx.fillStyle = "rgba(245,236,215,0.92)";
  ctx.fillRect(x, y, 96, 78);
  ctx.strokeStyle = "#1f4e79";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 96, 78);

  const portrait = art("wally");
  if (portrait) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 6, y + 6, 40, 48);
    ctx.clip();
    ctx.drawImage(portrait, x + 6, y + 6, 40, 48);
    ctx.restore();
  } else {
    ctx.fillStyle = "#f5ecd7";
    ctx.fillRect(x + 28, y + 30, 18, 28);
    ctx.fillRect(x + 30, y + 14, 14, 14);
    ctx.fillStyle = "#cc5500";
    ctx.fillRect(x + 42, y + 20, 14, 4);
  }

  // Clipboard
  ctx.fillStyle = "#1f4e79";
  ctx.fillRect(x + 52, y + 18, 34, 42);
  ctx.fillStyle = "#f5ecd7";
  ctx.fillRect(x + 56, y + 24, 26, 30);
  ctx.fillStyle = "#daa520";
  ctx.fillRect(x + 62, y + 14, 14, 6);
  ctx.fillStyle = "#1a1f16";
  ctx.font = "6px 'Courier New', monospace";
  ctx.fillText("JEV", x + 60, y + 40);
  ctx.fillText("OK?", x + 60, y + 50);

  ctx.fillStyle = "#cc5500";
  ctx.font = "bold 9px 'Courier New', monospace";
  ctx.textAlign = "center";
  const tip = Math.floor(frame / 90) % 2 === 0 ? "Wally" : "Pick.";
  ctx.fillText(tip, x + 48, y + 70);
  ctx.textAlign = "left";
}

/** Map canvas click (client coords) → door index or -1. */
export function hitTestDoor(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  const mx = (clientX - rect.left) * sx;
  const my = (clientY - rect.top) * sy;
  for (const r of doorHitRegions) {
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return r.index;
  }
  return -1;
}

export function hoverTestDoor(canvas, clientX, clientY) {
  return hitTestDoor(canvas, clientX, clientY);
}

export function resultsSummaryHtml(state, result) {
  const bestOdds =
    state.sessionBestCalibration != null
      ? oddsDisplay(state.sessionBestCalibration)
      : "—";
  return `
    <div class="session-strip">
      <span>Peak <b>${Number(state.peakBankroll).toFixed(0)}</b></span>
      <span>Best <b>${Number(state.sessionBestBankroll).toFixed(0)}</b></span>
      <span>Best O.D.D.S. <b>${bestOdds}</b></span>
      <span>Delivered <b>${state.deliveries}/${GOALS.deliveriesTarget}</b></span>
      <span>Runs <b>${state.runs}</b></span>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
