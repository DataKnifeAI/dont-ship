/**
 * Web Audio cues (files from tools/music/compose.py in assets/audio/).
 * Graph: track gain → duck → music bus ┐
 *        sting gain        → sfx bus   ┴→ master → destination
 * Nothing is created or played until unlock() runs inside a user gesture.
 */

const BASE = "assets/audio/";
/** Cache-bust suffix of `js/main.js` in index.html; audio URLs carry it so a bump refetches past HTTP / CDN caches. */
const VERSION = (() => {
  const src = document.querySelector('script[src*="js/main.js"]')?.src;
  return src ? new URL(src).searchParams.get("v") : null;
})();
const QUERY = VERSION ? `?v=${encodeURIComponent(VERSION)}` : "";
const LS_MUTED = "dontShip_audioMuted";
const LS_MUSIC = "dontShip_musicVolume";
const LS_SFX = "dontShip_sfxVolume";

/** `loop`: seamless loop length in seconds (the OGG masters are exactly this long). */
const CUES = {
  "jingle-dock": {},
  "jingle-executive": {},
  "hub-ambience-loop": { loop: 16 },
  "run-porch-loop": { loop: 16 },
  "run-space-loop": { loop: 19.2 },
  "coin-motif": {},
  "sting-delivered": {},
  "sting-forfeit": {},
};
const PRELOAD = ["hub-ambience-loop", "jingle-dock", "jingle-executive", "sting-delivered", "sting-forfeit"];
const PREFETCH = ["run-porch-loop", "run-space-loop", "coin-motif"];

export const HUB_CUE = "hub-ambience-loop";

/**
 * Company jingle per act. Sorting and Cold Storage replay the Dock take slowed
 * like tape (pitch drops with the rate) plus a slow detune wobble.
 */
export const JINGLE_BY_ACT = {
  dock: { cue: "jingle-dock" },
  sorting: { cue: "jingle-dock", cents: -20, wobble: 4 },
  cold: { cue: "jingle-dock", cents: -45, wobble: 10 },
  executive: { cue: "jingle-executive" },
};

/** Run bed per world template; anything unlisted gets RUN_CUE_DEFAULT. */
export const RUN_CUE_BY_WORLD = {
  world_space: "run-space-loop",
  world_unmapped: "run-space-loop",
  world_impossible: "run-space-loop",
};
const RUN_CUE_DEFAULT = "run-porch-loop";

export const runCueFor = (world) => RUN_CUE_BY_WORLD[world] || RUN_CUE_DEFAULT;

const MUSIC_FADE = 0.8;
const DUCK_LEVEL = 0.3;

const prefs = loadPrefs();
const listeners = new Set();
const buffers = new Map();
const status = { music: null, playing: null, queued: null, lastSting: null, events: [] };
/** Every started buffer source until it ends (debug view in audioStatus). */
const live = new Set();

let ctx = null;
let master = null;
let musicBus = null;
let duckBus = null;
let sfxBus = null;
let current = null;
let wantedKey = null;
let token = 0;
/** The stinger currently sounding (a sting, or a held motif): { cue, bus, ... }. */
let fg = null;
/** Music request queued behind `fg`: { name, opts }. */
let deferred = null;

/** Create/resume the AudioContext. Call from a user-gesture handler. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC({ sampleRate: 44100 });
    } catch {
      ctx = new AC();
    }
    master = node(ctx.createGain(), prefs.muted ? 0 : 1, ctx.destination);
    musicBus = node(ctx.createGain(), prefs.music, master);
    duckBus = node(ctx.createGain(), 1, musicBus);
    sfxBus = node(ctx.createGain(), prefs.sfx, master);
    document.addEventListener("visibilitychange", onVisibility);
    Promise.all(PRELOAD.map(load)).then(() => PREFETCH.forEach(load));
  }
  if (ctx.state === "suspended" && !document.hidden) ctx.resume().catch(() => {});
  return true;
}

/**
 * Crossfade the music bus to `name`. Loops repeat until replaced; one-shots
 * fall through to `then` (or silence) when they end. Re-requesting the cue
 * that is already playing is a no-op.
 *
 * `hold`: the one-shot is the foreground stinger (coin motif). The outgoing
 * bed fades over `fade` and the motif starts once it is gone.
 * `wait`: while a stinger (sting or held motif) is sounding, queue this cue
 * until it ends instead of crossfading over it; a later request replaces the
 * queued one and any non-waiting request drops it.
 * `onstart`: called when the cue actually starts.
 */
export function playMusic(name, opts = {}) {
  const { cents = 0, wobble = 0, then = null, fade = MUSIC_FADE, wait = false, hold = false, onstart = null } = opts;
  if (!ctx) return;
  const key = `${name}|${cents}|${wobble}`;
  if (wait && fg) {
    deferred = key === wantedKey ? null : { name, opts: { ...opts, wait: false } };
    status.queued = deferred && name;
    if (deferred) logEvent("queued", name, { behind: fg.cue });
    return;
  }
  deferred = null;
  status.queued = null;
  if (key === wantedKey) return;
  if (fg?.bus === "music") fg = null;
  wantedKey = key;
  const my = ++token;
  status.music = name;
  logEvent("music", name, cents ? { cents, wobble } : null);
  const stinger = hold ? { cue: name, bus: "music", track: null } : null;
  if (stinger) {
    cutSting();
    fg = stinger;
  }
  load(name).then((entry) => {
    if (my !== token || !entry) {
      if (stinger && fg === stinger) fg = null;
      return;
    }
    const loop = !!CUES[name]?.loop;
    const t = ctx.currentTime;
    const at = stinger && current ? t + fade : t;
    fadeOutCurrent(t, fade);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(1, at + (loop ? fade : 0.02));
    g.connect(duckBus);
    const src = ctx.createBufferSource();
    src.buffer = entry.buffer;
    if (loop) {
      src.loop = true;
      src.loopStart = entry.loopStart;
      src.loopEnd = entry.loopEnd;
    }
    if (cents) src.playbackRate.value = 2 ** (cents / 1200);
    let lfo = null;
    if (wobble && src.detune) {
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.45;
      lfo.connect(node(ctx.createGain(), wobble, src.detune));
      lfo.start(at);
    }
    src.connect(g);
    src.start(at, loop ? entry.loopStart : 0);
    trackLive(src, name, "music", g, at);
    const track = { name, src, gain: g, lfo };
    if (stinger) stinger.track = track;
    current = track;
    status.playing = name;
    onstart?.();
    src.onended = () => {
      lfo?.stop();
      if (stinger && fg === stinger) fg = null;
      if (current !== track) return;
      current = null;
      status.playing = null;
      wantedKey = null;
      const next = deferred || (then && { name: then, opts: {} });
      deferred = null;
      status.queued = null;
      if (next) playMusic(next.name, next.opts);
      else status.music = null;
    };
  });
}

/** The act's company jingle, then `then` (normally the hub bed). Other options pass to playMusic. */
export function playJingle(act, { then = HUB_CUE, ...opts } = {}) {
  const j = JINGLE_BY_ACT[act] || JINGLE_BY_ACT.dock;
  playMusic(j.cue, { ...opts, cents: j.cents || 0, wobble: j.wobble || 0, then });
}

export function stopMusic(fade = 1) {
  token += 1;
  wantedKey = null;
  deferred = null;
  status.queued = null;
  if (fg?.bus === "music") fg = null;
  status.music = null;
  logEvent("music", null);
  if (ctx) fadeOutCurrent(ctx.currentTime, fade);
}

/**
 * One-shot on the SFX bus; music ducks underneath for its length. Only one
 * sting sounds at a time: the same sting while it is still sounding is a
 * no-op, a different one cuts it.
 */
export function playSting(name, { duck = DUCK_LEVEL } = {}) {
  if (!ctx) return;
  if (fg?.cue === name) {
    logEvent("sting-skip", name);
    return;
  }
  cutSting();
  const rec = { cue: name, bus: "sfx", src: null, gain: null };
  fg = rec;
  status.lastSting = name;
  logEvent("sting", name);
  load(name).then((entry) => {
    if (fg !== rec) return;
    if (!entry) {
      fg = null;
      flushDeferred();
      return;
    }
    const t = ctx.currentTime;
    const dur = entry.buffer.duration;
    const src = ctx.createBufferSource();
    src.buffer = entry.buffer;
    rec.src = src;
    rec.gain = node(ctx.createGain(), 1, sfxBus);
    src.connect(rec.gain);
    src.start(t);
    trackLive(src, name, "sfx", rec.gain);
    src.addEventListener("ended", () => {
      if (fg !== rec) return;
      fg = null;
      flushDeferred();
    });
    const p = duckBus.gain;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.linearRampToValueAtTime(duck, t + 0.08);
    p.setValueAtTime(duck, t + Math.max(0.1, dur - 0.4));
    p.linearRampToValueAtTime(1, t + dur + 0.6);
  });
}

function cutSting(fade = 0.12) {
  if (fg?.bus !== "sfx") return;
  const { src, gain } = fg;
  fg = null;
  if (!src) return;
  const t = ctx.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(0, t + fade);
  src.stop(t + fade + 0.02);
}

function flushDeferred() {
  if (!deferred) return;
  const { name, opts } = deferred;
  deferred = null;
  status.queued = null;
  playMusic(name, opts);
}

export function isMuted() {
  return prefs.muted;
}

export function setMuted(muted) {
  prefs.muted = !!muted;
  save(LS_MUTED, prefs.muted ? "1" : "0");
  if (master) ramp(master.gain, prefs.muted ? 0 : 1, 0.05);
  listeners.forEach((fn) => fn());
}

export function toggleMute() {
  unlock();
  setMuted(!prefs.muted);
}

/** `bus`: "music" | "sfx"; `value`: 0..1. */
export function setVolume(bus, value) {
  const v = Math.min(1, Math.max(0, Number(value) || 0));
  prefs[bus] = v;
  save(bus === "music" ? LS_MUSIC : LS_SFX, String(v));
  const g = bus === "music" ? musicBus : sfxBus;
  if (g) ramp(g.gain, v, 0.05);
  listeners.forEach((fn) => fn());
}

export function getVolume(bus) {
  return prefs[bus];
}

/** Masthead speaker button + level popover (markup in index.html). */
export function mountAudioControls(root) {
  if (!root) return;
  const btn = root.querySelector(".audio-btn");
  const more = root.querySelector(".audio-more");
  const pop = root.querySelector(".audio-pop");
  const sliders = root.querySelectorAll("input[data-bus]");
  const sync = () => {
    btn.setAttribute("aria-pressed", String(prefs.muted));
    btn.title = prefs.muted ? "Sound off (M)" : "Sound on (M)";
    root.classList.toggle("muted", prefs.muted);
    sliders.forEach((s) => {
      s.value = String(Math.round(prefs[s.dataset.bus] * 100));
    });
  };
  listeners.add(sync);
  sync();
  btn.addEventListener("click", () => toggleMute());
  sliders.forEach((s) => s.addEventListener("input", () => setVolume(s.dataset.bus, s.value / 100)));
  const setOpen = (open) => {
    pop.hidden = !open;
    more.setAttribute("aria-expanded", String(open));
  };
  more.addEventListener("click", () => setOpen(pop.hidden));
  document.addEventListener("pointerdown", (e) => {
    if (!pop.hidden && !root.contains(e.target)) setOpen(false);
  });
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

/** Debug snapshot for `__dontShip.audio`. */
export function audioStatus() {
  return {
    context: ctx ? ctx.state : "none",
    sampleRate: ctx?.sampleRate ?? null,
    muted: prefs.muted,
    music: status.music,
    playing: status.playing,
    queued: status.queued,
    stinger: fg?.cue ?? null,
    rate: current ? current.src.playbackRate.value : null,
    lastSting: status.lastSting,
    loaded: [...buffers.keys()],
    duck: duckBus ? +duckBus.gain.value.toFixed(3) : null,
    sources: [...live].map(({ cue, bus, start, gain }) => ({
      cue,
      bus,
      start: +start.toFixed(2),
      gain: gain ? +gain.gain.value.toFixed(3) : 1,
    })),
    time: ctx ? +ctx.currentTime.toFixed(2) : null,
    events: status.events.slice(-12),
  };
}

function trackLive(src, cue, bus, gain, start = ctx.currentTime) {
  const rec = { cue, bus, start, gain };
  live.add(rec);
  src.addEventListener("ended", () => live.delete(rec));
}

function load(name) {
  if (!buffers.has(name)) {
    buffers.set(
      name,
      fetchDecode(name).catch((err) => {
        console.warn(`audio: could not load ${name}:`, err);
        return null;
      })
    );
  }
  return buffers.get(name);
}

async function fetchDecode(name) {
  let lastErr = null;
  for (const ext of formats()) {
    try {
      const res = await fetch(`${BASE}${name}.${ext}${QUERY}`);
      if (!res.ok) throw new Error(`${name}.${ext} HTTP ${res.status}`);
      const buffer = await decode(await res.arrayBuffer());
      return { buffer, ext, ...loopPoints(buffer, ext, CUES[name]?.loop) };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function formats() {
  const probe = document.createElement("audio");
  return probe.canPlayType?.('audio/ogg; codecs="vorbis"') ? ["ogg", "mp3"] : ["mp3"];
}

function decode(data) {
  return new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(data, resolve, reject);
    p?.catch?.(() => {});
  });
}

/**
 * OGG loops use the whole buffer. MP3 fallbacks may carry encoder padding, so
 * skip leading near-silence and clamp to the nominal loop length.
 */
function loopPoints(buffer, ext, loopLen) {
  if (!loopLen || ext === "ogg") return { loopStart: 0, loopEnd: buffer.duration };
  const ch = buffer.getChannelData(0);
  const max = Math.min(ch.length, Math.floor(buffer.sampleRate * 0.1));
  let lead = 0;
  while (lead < max && Math.abs(ch[lead]) < 1e-4) lead += 1;
  if (lead >= max) lead = 0;
  const loopStart = lead / buffer.sampleRate;
  return { loopStart, loopEnd: Math.min(buffer.duration, loopStart + loopLen) };
}

function fadeOutCurrent(t, fade) {
  if (!current) return;
  const { src, gain, lfo } = current;
  current = null;
  status.playing = null;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(0, t + fade);
  src.onended = () => lfo?.stop();
  src.stop(t + fade + 0.05);
}

function onVisibility() {
  if (!ctx) return;
  if (document.hidden) ctx.suspend().catch(() => {});
  else ctx.resume().catch(() => {});
}

function node(n, value, dest) {
  n.gain.value = value;
  n.connect(dest);
  return n;
}

function ramp(param, value, secs) {
  const t = ctx.currentTime;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(value, t + secs);
}

function logEvent(kind, name, extra = null) {
  status.events.push({ kind, name, ...extra, t: Math.round(performance.now()) });
  if (status.events.length > 40) status.events.shift();
}

function loadPrefs() {
  const num = (k, d) => {
    const v = read(k);
    const n = v == null || v === "" ? NaN : Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : d;
  };
  return { muted: read(LS_MUTED) === "1", music: num(LS_MUSIC, 0.8), sfx: num(LS_SFX, 0.9) };
}

function read(k) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

function save(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode */
  }
}
