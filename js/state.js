import { brierScore, oddsDisplay, payoutForProb } from "./odds.js";

export const PHASE = {
  BOOT: "boot",
  INTAKE: "intake",
  RUN: "run",
  RESULT: "result",
  WIN: "win",
  BROKE: "broke",
};

const START_BANKROLL = 100;
const DEFAULT_STAKE = 10;

/** Phase 1 session goals (any one wins). */
export const GOALS = {
  bankrollTarget: 200,
  deliveriesTarget: 5,
  executiveManifestId: "DN-1909-J",
};

const LS_BEST_BANK = "dontShip_bestBankroll";
const LS_BEST_ODDS = "dontShip_bestCalibration";

export function createGameState() {
  return {
    phase: PHASE.BOOT,
    bankroll: START_BANKROLL,
    stake: DEFAULT_STAKE,
    runs: 0,
    deliveries: 0,
    peakBankroll: START_BANKROLL,
    manifestIndex: 0,
    manifests: [],
    rooms: {},
    currentManifest: null,
    selectedDoor: null,
    lastResult: null,
    forecasts: [],
    outcomes: [],
    runSeed: 0,
    winReason: null,
    sessionBestBankroll: loadBestBankroll(),
    sessionBestCalibration: loadBestCalibration(),
  };
}

export function calibration(state) {
  return brierScore(state.forecasts, state.outcomes);
}

export function calibrationLabel(state) {
  return oddsDisplay(calibration(state));
}

export function nextManifest(state) {
  if (!state.manifests.length) return null;
  const m = state.manifests[state.manifestIndex % state.manifests.length];
  state.manifestIndex += 1;
  state.currentManifest = m;
  state.selectedDoor = null;
  state.lastResult = null;
  state.phase = PHASE.INTAKE;
  return m;
}

export function canAfford(state) {
  return state.bankroll >= state.stake;
}

export function acceptDoor(state, door) {
  if (state.phase !== PHASE.INTAKE) return { ok: false, reason: "wrong_phase" };
  if (!canAfford(state)) return { ok: false, reason: "broke" };
  state.bankroll -= state.stake;
  state.selectedDoor = door;
  state.phase = PHASE.RUN;
  return { ok: true, payout: payoutForProb(door.displayedProb) };
}

export function resolveRun(state, survived) {
  const door = state.selectedDoor;
  if (!door) return null;

  const payout = payoutForProb(door.displayedProb);
  const forecast = door.displayedProb;
  state.forecasts.push(forecast);
  state.outcomes.push(survived ? 1 : 0);
  state.runs += 1;

  let payoutAmount = 0;
  if (survived) {
    payoutAmount = +(state.stake * payout).toFixed(2);
    state.bankroll = +(state.bankroll + payoutAmount).toFixed(2);
    state.deliveries += 1;
  }

  if (state.bankroll > state.peakBankroll) state.peakBankroll = state.bankroll;
  persistBests(state);

  const manifestId = state.currentManifest?.manifestId;
  state.lastResult = {
    survived,
    payout,
    payoutAmount,
    forecast,
    stake: state.stake,
    doorId: door.id,
    manifestId,
  };
  state.phase = PHASE.RESULT;
  state.selectedDoor = null;

  const win = checkWin(state, survived, manifestId);
  if (win) {
    state.phase = PHASE.WIN;
    state.winReason = win;
  }

  return state.lastResult;
}

function checkWin(state, survived, manifestId) {
  if (state.bankroll >= GOALS.bankrollTarget) {
    return `Reached ${GOALS.bankrollTarget} C.O.D.`;
  }
  if (state.deliveries >= GOALS.deliveriesTarget) {
    return `Completed ${GOALS.deliveriesTarget} deliveries`;
  }
  if (survived && manifestId === GOALS.executiveManifestId) {
    return "Survived Executive manifest";
  }
  return null;
}

export function afterResult(state) {
  if (state.phase === PHASE.WIN) return;
  if (state.bankroll < state.stake) {
    state.phase = PHASE.BROKE;
    return;
  }
  state.phase = PHASE.INTAKE;
}

export function continueAfterWin(state) {
  state.winReason = null;
  if (state.bankroll < state.stake) {
    state.phase = PHASE.BROKE;
    return;
  }
  state.phase = PHASE.INTAKE;
}

export function resetBankroll(state) {
  state.bankroll = START_BANKROLL;
  state.forecasts = [];
  state.outcomes = [];
  state.runs = 0;
  state.deliveries = 0;
  state.peakBankroll = START_BANKROLL;
  state.manifestIndex = 0;
  state.currentManifest = null;
  state.selectedDoor = null;
  state.lastResult = null;
  state.winReason = null;
  state.phase = PHASE.INTAKE;
  state.sessionBestBankroll = loadBestBankroll();
  state.sessionBestCalibration = loadBestCalibration();
}

function loadBestBankroll() {
  try {
    const v = Number(localStorage.getItem(LS_BEST_BANK));
    return Number.isFinite(v) && v > 0 ? v : START_BANKROLL;
  } catch {
    return START_BANKROLL;
  }
}

function loadBestCalibration() {
  try {
    const v = localStorage.getItem(LS_BEST_ODDS);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function persistBests(state) {
  try {
    if (state.bankroll > state.sessionBestBankroll) {
      state.sessionBestBankroll = state.bankroll;
      localStorage.setItem(LS_BEST_BANK, String(state.bankroll));
    }
    const brier = calibration(state);
    if (brier != null) {
      const prev = state.sessionBestCalibration;
      if (prev == null || brier < prev) {
        state.sessionBestCalibration = brier;
        localStorage.setItem(LS_BEST_ODDS, String(brier));
      }
    }
  } catch {
    /* private mode */
  }
}

export function goalProgress(state) {
  return {
    bankroll: state.bankroll,
    bankrollTarget: GOALS.bankrollTarget,
    deliveries: state.deliveries,
    deliveriesTarget: GOALS.deliveriesTarget,
    executiveId: GOALS.executiveManifestId,
    atExecutive: state.currentManifest?.manifestId === GOALS.executiveManifestId,
  };
}

/** Short stake stamps for door UI (tier + hazards + parcel mods). */
export function doorStakeStamps(door, manifestModifiers = []) {
  const tier = String(door.difficultyTier || "easy").toUpperCase();
  const tags = [];
  for (const raw of door.hazardTags || []) {
    const t = stampTag(raw);
    if (t && !tags.includes(t)) tags.push(t);
  }
  for (const raw of manifestModifiers || []) {
    const t = stampTag(raw);
    if (t && !tags.includes(t)) tags.push(t);
  }
  return { tier, tags };
}

function stampTag(raw) {
  const s = String(raw || "").toLowerCase();
  if (!s || s === "none") return null;
  if (s === "fragile_parcel_required" || s === "fragile") return "FRAGILE";
  if (s === "fans" || s === "storm" || s === "acid_rain") return "ACIDRAIN";
  if (s === "belts") return "BELTS";
  if (s === "vines" || s === "crystal_fauna") return "CRYSTAL";
  if (s === "ice") return "ICE";
  if (s === "meta") return "META";
  if (s === "miscalibrated") return "MISCAL";
  if (s === "drift_watch") return "DRIFT";
  if (s === "executive") return "EXEC";
  if (s === "reckless_courier") return "RECKLESS";
  if (s === "low_gravity") return "LOW-G";
  if (s === "portal_wind") return "PORTAL";
  if (s === "sentient_traffic") return "TRAFFIC";
  if (s === "meeseeks") return "MEESEEKS";
  if (s === "black_hole_slot") return "BLKHOL";
  if (s === "pressure") return "PRESSURE";
  if (s === "heat_shimmer") return "SHIMMER";
  return s.replace(/_/g, " ").toUpperCase().slice(0, 8);
}
