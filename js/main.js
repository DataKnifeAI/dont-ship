import { createRng, seedFromPick } from "./rng.js";
import { formatPayout, formatProb, oddsDisplay } from "./odds.js";
import {
  PHASE,
  GOALS,
  acceptDoor,
  afterResult,
  calibrationLabel,
  canAfford,
  continueAfterWin,
  createGameState,
  nextManifest,
  resetBankroll,
  resolveRun,
  shiftTarget,
} from "./state.js";
import {
  bindControls,
  createRun,
  drawRun,
  setFragile,
  updateRun,
} from "./platformer.js";
import {
  doorCards,
  drawDoorSelect,
  els,
  hideOverlay,
  highlightDoor,
  hitTestDoor,
  hoverTestDoor,
  parcelStamps,
  refreshLedger,
  renderBrief,
  renderDoors,
  renderGoalLine,
  resultsSummaryHtml,
  setDoorsEnabled,
  setScreen,
  showOverlay,
} from "./ui.js";
import { art, preloadArt } from "./art.js";
import {
  HUB_CUE,
  audioStatus,
  mountAudioControls,
  playJingle,
  playMusic,
  playSting,
  runCueFor,
  stopMusic,
  toggleMute,
  unlock as unlockAudio,
} from "./audio.js";
import { createHub, hasIsoWorld, isoAvailable, startRun as startIsoRun } from "./iso/index.js";
import { mountTouch } from "./touch.js";

const params = new URLSearchParams(location.search);
/** `?renderer=2d` forces the legacy side-scroller (and the 2D door hall) everywhere. */
const FORCE_2D = params.get("renderer") === "2d";
/** Dev override for every door pick: `?world=world_jungle&tier=brutal&tags=ice,meta`. */
const DEBUG_DOOR = params.get("world")
  ? {
      roomTemplate: params.get("world"),
      ...(params.get("tier") && { difficultyTier: params.get("tier") }),
      ...(params.get("tags") && { hazardTags: params.get("tags").split(",") }),
    }
  : null;

const state = createGameState();
let activeRun = null;
let animId = 0;
let intakeFrame = 0;
let hoverDoor = -1;
/** 3D Box 407-B hall (null → 2D canvas hall fallback). */
let hub = null;
/** The door picked for the current run: { door, index }. */
let lastPick = null;
/** Act whose jingle last played; null replays the jingle on the next hub visit (new shift). */
let jingleAct = null;

async function boot() {
  const e = els();
  const ctx = e.canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  bindControls();
  bindCanvasInput(e.canvas);
  mountTouch(e.stage);
  mountAudioControls(document.getElementById("audio-ctl"));
  for (const type of ["pointerdown", "keydown"]) {
    window.addEventListener(type, unlockAudio, { once: true, capture: true });
  }

  try {
    const [manifests, rooms] = await Promise.all([
      fetch("data/manifests.json").then((r) => {
        if (!r.ok) throw new Error(`manifests ${r.status}`);
        return r.json();
      }),
      fetch("data/rooms.json").then((r) => {
        if (!r.ok) throw new Error(`rooms ${r.status}`);
        return r.json();
      }),
      preloadArt(),
    ]);
    state.manifests = manifests;
    state.rooms = rooms;
  } catch (err) {
    showOverlay(
      `
      <div class="stamp-title bad">TERMINAL OFFLINE</div>
      <p>Could not load deck data. Serve over HTTP (ES modules + fetch):</p>
      <p><code>python -m http.server 8080</code></p>
      <p class="fine">${escape(String(err.message || err))}</p>
    `,
      "result bad"
    );
    return;
  }

  if (!FORCE_2D && isoAvailable()) {
    try {
      hub = createHub({
        stage: e.stage,
        onPick: (i) => {
          const door = state.currentManifest?.doors?.[i];
          if (door) pickDoor(door, i);
        },
        images: { fenLogo: art("fenLogo") },
      });
      hub.setFraming("title", true);
      hub.show();
    } catch (err) {
      console.error("3D hub unavailable; using the 2D door hall:", err);
      hub = null;
    }
  }
  document.body.classList.toggle("r2d", !hub);

  showTitle();
  window.addEventListener("keydown", onGlobalKey);
  loop(ctx);
}

function showTitle() {
  setScreen("title");
  const bestOdds = state.sessionBestCalibration != null ? oddsDisplay(state.sessionBestCalibration) : "—";
  showOverlay(
    `
    <img class="title-logo" src="assets/brand/fen-wolf-logo.jpg" alt="Fen, the D.O.N.T. Ship wolf" width="112" height="112" />
    <div class="card-kicker">BOX 407-B · MULTIVERSE PARCEL DISPATCH</div>
    <h2 class="title-wordmark"><span class="dont">D.O.N.T.</span> <span class="ship">Ship</span></h2>
    <p class="title-tag">Delivering Outcomes, Not Timelines.</p>
    <p class="title-blurb">
      Wally opens three doorways, each into a pocket universe. Stake ${state.stake} C.O.D. on one,
      carry the parcel to the recipient, and get paid at J.E.V.'s posted odds.
    </p>
    <button type="button" class="btn btn-primary" id="start-btn">Clock in <kbd>Enter</kbd></button>
    <ul class="title-controls">
      <li class="key-hint"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> or click: pick a door</li>
      <li class="key-hint"><kbd>WASD</kbd> move · <kbd>Space</kbd> jump · wheel zoom</li>
      <li class="touch-hint">Tap a door · left thumb moves · right thumb jumps</li>
    </ul>
    <dl class="title-bests">
      <div><dt>Best bankroll</dt><dd>${Number(state.sessionBestBankroll).toFixed(0)} C.O.D.</dd></div>
      <div><dt>Best O.D.D.S.</dt><dd>${bestOdds}</dd></div>
      <div><dt>Shift goal</dt><dd>${shiftTarget(state)} C.O.D. or ${GOALS.deliveriesTarget} deliveries</dd></div>
    </dl>
  `,
    "title"
  );
  document.getElementById("start-btn").addEventListener("click", clockIn);
}

function clockIn() {
  if (state.phase !== PHASE.BOOT) return;
  unlockAudio();
  hideOverlay();
  hub?.setFraming("hub");
  beginIntake();
  els().canvas.focus();
}

function bindCanvasInput(canvas) {
  canvas.addEventListener("mousemove", (e) => {
    if (state.phase !== PHASE.INTAKE || hub) {
      hoverDoor = -1;
      return;
    }
    hoverDoor = hoverTestDoor(canvas, e.clientX, e.clientY);
    canvas.style.cursor = hoverDoor >= 0 ? "pointer" : "default";
  });
  canvas.addEventListener("click", (e) => {
    if (state.phase !== PHASE.INTAKE || hub) return;
    const idx = hitTestDoor(canvas, e.clientX, e.clientY);
    const door = state.currentManifest?.doors?.[idx];
    if (door) pickDoor(door, idx);
  });
}

function beginIntake() {
  nextManifest(state);
  if (!canAfford(state)) {
    state.phase = PHASE.BROKE;
    showBroke();
    return;
  }
  const m = state.currentManifest;
  cueHub(m);
  renderBrief(m);
  renderDoors(m, {
    enabled: true,
    onPick: (door) => pickDoor(door),
  });
  renderGoalLine(state);
  refreshLedger(state);
  if (hub) {
    hub.setDoors(doorCards(m), { manifestId: m.manifestId, parcel: parcelStamps(m) });
    hub.setInteractive(true);
    hub.show();
  }
  setScreen("hub");
  activeRun = null;
  hoverDoor = -1;
  intakeFrame = 0;
}

function actOf(manifest) {
  return manifest?.act || (manifest?.modifiers?.includes("executive") ? "executive" : "dock");
}

/**
 * Hub bed, preceded by the company jingle whenever the act changes. Both wait
 * behind a sounding sting or coin motif; a jingle dropped by an early door
 * pick plays on the next hub visit.
 */
function cueHub(manifest) {
  const act = actOf(manifest);
  if (act !== jingleAct) {
    playJingle(act, { then: HUB_CUE, wait: true, onstart: () => (jingleAct = act) });
  } else {
    playMusic(HUB_CUE, { wait: true });
  }
}

function pickDoor(door, index = -1) {
  if (state.phase !== PHASE.INTAKE) return;
  if (index < 0) index = state.currentManifest?.doors?.indexOf(door) ?? -1;
  if (DEBUG_DOOR) door = { ...door, ...DEBUG_DOOR };
  const result = acceptDoor(state, door);
  if (!result.ok) {
    if (result.reason === "broke") showBroke();
    return;
  }
  lastPick = { door, index };

  highlightDoor(door.id);
  setDoorsEnabled(false);
  hub?.setInteractive(false);
  refreshLedger(state);

  const seed = seedFromPick(state.currentManifest.manifestId, door.id, 0);
  state.runSeed = seed;
  const rng = createRng(seed);
  const templateName = door.roomTemplate;
  const template = state.rooms[templateName];
  if (!template) {
    showOverlay(`<div class="stamp-title bad">MISSING ROOM</div><p>No template: ${escape(templateName)}</p><div class="actions"><button type="button" class="btn btn-primary" id="ok">Refund stake</button></div>`, "result bad");
    document.getElementById("ok").onclick = () => {
      state.bankroll += state.stake;
      hideOverlay();
      beginIntake();
    };
    return;
  }

  const fragile =
    state.currentManifest.modifiers?.includes("fragile") ||
    door.hazardTags?.includes("fragile_parcel_required");
  const useIso = !FORCE_2D && hasIsoWorld(templateName) && isoAvailable();

  const tier = String(door.difficultyTier || "easy").toUpperCase();
  els().houseCopy.textContent = `Door ${door.id} · ${tier} · ${formatProb(door.displayedProb)} → ${formatPayout(result.payout)} · seed ${seed}${useIso ? " · iso" : ""}`;
  els().canvas.focus();

  const start2d = () => {
    hub?.hide();
    setScreen("run");
    playMusic(runCueFor(templateName));
    const zone = state.currentManifest.zone || "dock";
    activeRun = createRun(template, rng, door.difficultyTier || "easy", zone);
    setFragile(activeRun, fragile);
  };
  if (!useIso) {
    start2d();
    return;
  }

  activeRun = null;
  const launch = () => {
    if (state.phase !== PHASE.RUN) return;
    hub?.hide();
    setScreen("run");
    playMusic(runCueFor(templateName));
    startIsoRun({ ...template, id: templateName }, seed, {
      stage: els().stage,
      tier: door.difficultyTier || "easy",
      fragile,
      hazardTags: door.hazardTags,
      modifiers: state.currentManifest.modifiers,
      manifestId: state.currentManifest.manifestId,
      doorId: door.id,
      prob: door.displayedProb,
      payout: result.payout,
      stake: state.stake,
    })
      .then(({ delivered, cause }) => finishRun(delivered, cause))
      .catch((err) => {
        console.error("Iso run failed; falling back to 2D for this door:", err);
        if (state.phase === PHASE.RUN && !activeRun) start2d();
      });
  };
  if (hub?.visible && index >= 0) hub.enterDoor(index).then(launch);
  else launch();
}

function finishRun(survived, cause = null) {
  if (state.phase !== PHASE.RUN) return;
  const result = resolveRun(state, survived);
  activeRun = null;
  refreshLedger(state);
  if (hub) {
    hub.show();
    hub.markResult(lastPick?.index ?? -1, survived);
  }
  setScreen("result");

  if (state.phase === PHASE.WIN) {
    playMusic("coin-motif", { hold: true, fade: 0.3, then: HUB_CUE });
    showWin(result);
    return;
  }

  playMusic(HUB_CUE);
  playSting(survived ? "sting-delivered" : "sting-forfeit");
  showRunResult(result, cause);
}

function showRunResult(result, cause) {
  const summary = resultsSummaryHtml(state, result);
  const tier = String(lastPick?.door?.difficultyTier || "").toUpperCase();
  const kicker = `<div class="card-kicker">${escape(result.manifestId)} · DOOR ${escape(result.doorId)}${tier ? ` · ${tier}` : ""}</div>`;
  const next = `<div class="actions"><button type="button" class="btn btn-primary" id="next-btn">Next manifest <kbd>Enter</kbd></button></div>`;
  if (result.survived) {
    showOverlay(
      `
      ${kicker}
      <div class="stamp-title good">DELIVERED</div>
      <dl class="tally">
        <div><dt>Stake</dt><dd>${result.stake} C.O.D.</dd></div>
        <div><dt>Payout</dt><dd>×${result.payout.toFixed(2)}</dd></div>
        <div class="net good"><dt>Returned</dt><dd>+${result.payoutAmount.toFixed(0)} C.O.D.</dd></div>
      </dl>
      <p class="fine">Forecast ${formatProb(result.forecast)} logged for O.D.D.S. Bankroll now ${Number(state.bankroll).toFixed(0)} C.O.D.</p>
      ${summary}
      ${next}
    `,
      "result good"
    );
  } else {
    showOverlay(
      `
      ${kicker}
      <div class="stamp-title bad">FORFEIT</div>
      ${cause ? `<p class="cause">${escape(cause)}</p>` : ""}
      <dl class="tally">
        <div><dt>Stake</dt><dd>${result.stake} C.O.D.</dd></div>
        <div><dt>Payout</dt><dd>×${result.payout.toFixed(2)}</dd></div>
        <div class="net bad"><dt>Absorbed</dt><dd>−${result.stake} C.O.D.</dd></div>
      </dl>
      <p class="fine">Forecast ${formatProb(result.forecast)} logged · outcome miss. Bankroll now ${Number(state.bankroll).toFixed(0)} C.O.D.</p>
      ${summary}
      ${next}
    `,
      "result bad"
    );
  }

  document.getElementById("next-btn").addEventListener("click", () => {
    hideOverlay();
    afterResult(state);
    if (state.phase === PHASE.BROKE) showBroke();
    else beginIntake();
  });
}

function showWin(result) {
  const summary = resultsSummaryHtml(state, result);
  const bestOdds =
    state.sessionBestCalibration != null
      ? oddsDisplay(state.sessionBestCalibration)
      : "—";
  showOverlay(
    `
    <div class="card-kicker">SHIFT ${state.shift} REPORT · BOX 407-B</div>
    <div class="stamp-title win">SHIFT CLEARED</div>
    <p class="cause">${escape(state.winReason)}</p>
    <dl class="tally">
      <div><dt>Bankroll</dt><dd>${Number(state.bankroll).toFixed(0)} C.O.D.</dd></div>
      <div><dt>O.D.D.S.</dt><dd>${escape(calibrationLabel(state))}</dd></div>
      <div><dt>Deliveries</dt><dd>${state.shiftDeliveries} this shift · ${state.deliveries} total</dd></div>
    </dl>
    ${summary}
    <p class="fine">Local bests: ${Number(state.sessionBestBankroll).toFixed(0)} C.O.D. · O.D.D.S. ${bestOdds} (no online leaderboard yet)</p>
    <div class="actions">
      <button type="button" class="btn btn-primary" id="continue-btn">Keep shipping <kbd>Enter</kbd></button>
      <button type="button" class="btn" id="reset-btn">New shift (reset 100)</button>
    </div>
  `,
    "result win"
  );

  document.getElementById("continue-btn").addEventListener("click", () => {
    hideOverlay();
    continueAfterWin(state);
    if (state.phase === PHASE.BROKE) showBroke();
    else beginIntake();
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    hideOverlay();
    resetBankroll(state);
    refreshLedger(state);
    jingleAct = null;
    beginIntake();
  });
}

function showBroke() {
  setScreen("result");
  hub?.setInteractive(false);
  stopMusic(1.2);
  playSting("sting-forfeit");
  const summary = resultsSummaryHtml(state, state.lastResult);
  showOverlay(
    `
    <div class="card-kicker">WALLY STAMPS YOUR BADGE</div>
    <div class="stamp-title bad">INSUFFICIENT C.O.D.</div>
    <p class="cause">“Come back when you can afford optimism.”</p>
    ${summary}
    <div class="actions"><button type="button" class="btn btn-primary" id="reset-btn">Reset bankroll (100) <kbd>Enter</kbd></button></div>
  `,
    "result bad"
  );
  document.getElementById("reset-btn").addEventListener("click", () => {
    hideOverlay();
    resetBankroll(state);
    refreshLedger(state);
    jingleAct = null;
    beginIntake();
  });
}

function onGlobalKey(e) {
  if (e.code === "KeyM" && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
    toggleMute();
    return;
  }
  if (state.phase === PHASE.BOOT && e.code === "Enter" && document.getElementById("start-btn")) {
    e.preventDefault();
    clockIn();
    return;
  }
  if (state.phase === PHASE.INTAKE && ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"].includes(e.code)) {
    const map = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 };
    const door = state.currentManifest?.doors?.[map[e.code]];
    if (door) pickDoor(door, map[e.code]);
  }
  if (e.code === "Enter" && (state.phase === PHASE.RESULT || state.phase === PHASE.WIN || state.phase === PHASE.BROKE)) {
    const btn = document.getElementById("next-btn") || document.getElementById("continue-btn") || document.getElementById("reset-btn");
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  }
}

function loop(ctx) {
  const frame = () => {
    if (state.phase === PHASE.RUN && activeRun) {
      const status = updateRun(activeRun);
      drawRun(ctx, activeRun);
      if (status === "won") finishRun(true);
      else if (status === "dead") finishRun(false, activeRun.message);
    } else if (!hub && !activeRun && (state.phase === PHASE.INTAKE || state.phase === PHASE.BOOT)) {
      intakeFrame += 1;
      drawDoorSelect(ctx, state.phase === PHASE.INTAKE ? state.currentManifest : null, intakeFrame, hoverDoor);
    }
    animId = requestAnimationFrame(frame);
  };
  animId = requestAnimationFrame(frame);
}

/** Dev hooks (console / Runtime.evaluate). `play` starts a run in any world from the door hub. */
window.__dontShip = {
  state,
  get hub() {
    return hub;
  },
  worlds: () => Object.keys(state.rooms),
  audio: audioStatus,
  play(world, { tier = "easy", tags = ["none"], fragile = false } = {}) {
    if (state.phase !== PHASE.INTAKE || !state.currentManifest) return `not at the door hub (phase ${state.phase})`;
    hideOverlay();
    const door = state.currentManifest.doors[0];
    pickDoor({ ...door, roomTemplate: world, difficultyTier: tier, hazardTags: fragile ? [...tags, "fragile_parcel_required"] : tags }, 0);
    return state.phase;
  },
};

function escape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

boot();
