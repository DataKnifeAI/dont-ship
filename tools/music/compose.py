#!/usr/bin/env python3
"""D.O.N.T. Ship music snippets, synthesized from scratch.

Everything is built with numpy: additive / FM / pulse oscillators, ADSR
envelopes, FFT filters and an FFT convolution reverb. Loops are rendered
"circularly" (note tails, echoes and reverb wrap back to the start), so the
last sample flows into the first one.

    python3 tools/music/compose.py               # render + encode + verify all
    python3 tools/music/compose.py coin-motif    # just one (or several) cues
    python3 tools/music/compose.py --list
    python3 tools/music/compose.py --levels      # print per-group mix levels

Outputs: assets/audio/<name>.ogg (Vorbis) and <name>.mp3, WAV masters in
tmp/music/ (gitignored). Requires numpy and ffmpeg (libvorbis, libmp3lame).
"""

from __future__ import annotations

import argparse
import math
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
TAU = 2.0 * np.pi
ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets" / "audio"
WAV_DIR = ROOT / "tmp" / "music"
PEAK_DBFS = -1.0
NYQ_SAFE = 0.45 * SR


# --------------------------------------------------------------------------
# Pitch, chords, timing
# --------------------------------------------------------------------------

NOTE_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def n(name: str) -> int:
    """'C#5' -> 73 (MIDI). C4 = 60."""
    i, acc = 1, 0
    while i < len(name) and name[i] in "#b":
        acc += 1 if name[i] == "#" else -1
        i += 1
    return 12 * (int(name[i:]) + 1) + NOTE_PC[name[0]] + acc


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)


QUALITIES = {
    "": (0, 4, 7), "m": (0, 3, 7), "6": (0, 4, 7, 9), "69": (0, 4, 7, 9, 14),
    "maj7": (0, 4, 7, 11), "maj9": (0, 4, 7, 11, 14), "maj7#11": (0, 4, 7, 11, 18),
    "add9": (0, 4, 7, 14), "7": (0, 4, 7, 10), "7b9": (0, 4, 7, 10, 13),
    "7#5": (0, 4, 8, 10), "7#11": (0, 4, 7, 10, 18), "7sus4": (0, 5, 7, 10),
    "9sus4": (0, 5, 7, 10, 14), "m7": (0, 3, 7, 10), "m9": (0, 3, 7, 10, 14),
    "m11": (0, 3, 7, 10, 14, 17), "madd9": (0, 3, 7, 14), "mb9": (0, 3, 7, 10, 13),
    "m7b5": (0, 3, 6, 10), "mmaj7": (0, 3, 7, 11), "mmaj9": (0, 3, 7, 11, 14),
    "dim7": (0, 3, 6, 9), "dimmaj7": (0, 3, 6, 9, 11), "augmaj7": (0, 4, 8, 11),
}


def _pc(name: str) -> int:
    acc = {"#": 1, "b": -1}.get(name[1:2], 0)
    return (NOTE_PC[name[0]] + acc) % 12


class Chord:
    def __init__(self, sym: str):
        s, _, slash = sym.partition("/")
        k = 2 if len(s) > 1 and s[1] in "#b" else 1
        self.sym = sym
        self.root = _pc(s[:k])
        self.ivs = QUALITIES[s[k:]]
        self.bass = _pc(slash) if slash else self.root

    def pcs(self, rootless=False):
        ivs = self.ivs
        if rootless and len(ivs) >= 4:
            ivs = [i for i in ivs if i % 12 != 0]
        return [(self.root + i) % 12 for i in ivs]


def place(pc: int, lo: int) -> int:
    """Lowest MIDI note >= lo with pitch class pc."""
    return lo + ((pc - lo) % 12)


def nearest(pc: int, ref: int, lo: int, hi: int) -> int:
    return min((m for m in range(lo, hi + 1) if m % 12 == pc % 12), key=lambda m: abs(m - ref))


def voicing(ch: Chord, lo: int, rootless=True):
    return sorted({place(pc, lo) for pc in ch.pcs(rootless)})


def voicing_open(ch: Chord, lo: int):
    """Closed voicing with every other voice lifted an octave (pads)."""
    closed = sorted({place(pc, lo) for pc in ch.pcs(False)})
    return sorted(m + 12 * (i % 2) for i, m in enumerate(closed))


class Clock:
    """Beats -> seconds, with optional swung eighths (swing=0.5 is straight)."""

    def __init__(self, bpm: float, swing: float = 0.5):
        self.bpm, self.swing = bpm, swing

    def sec(self, b: float) -> float:
        whole = math.floor(b)
        frac = b - whole
        s = self.swing
        frac = frac * 2 * s if frac < 0.5 else s + (frac - 0.5) * 2 * (1 - s)
        return (whole + frac) * 60.0 / self.bpm

    def dur(self, b: float, d: float) -> float:
        return self.sec(b + d) - self.sec(b)


# --------------------------------------------------------------------------
# DSP helpers
# --------------------------------------------------------------------------

def _t(count: int):
    return np.arange(count) / SR


def adsr(dur, a=0.005, d=0.1, s=0.8, r=0.1):
    """Envelope for a note gated for `dur` seconds plus `r` seconds release."""
    a, d, r = max(a, 1e-4), max(d, 1e-4), max(r, 1e-4)
    count = int(math.ceil((dur + r) * SR)) + 1
    t = _t(count)
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    g = dur / a if dur < a else s + (1 - s) * math.exp(-(dur - a) / d)
    rel = t >= dur
    e[rel] = g * np.exp(-(t[rel] - dur) * 6.9 / r)
    tail = min(64, count)
    e[-tail:] *= np.linspace(1, 0, tail)
    return e


def ramp_in(t, a):
    return np.minimum(t / max(a, 1e-5), 1.0)


def taper(sig, frac=0.25):
    """Half-cosine fade over the last `frac` of a fixed-length hit (no truncation clicks)."""
    k = max(1, int(len(sig) * frac))
    sig[-k:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, k)))
    return sig


def bandpass(x, lo=None, hi=None, order=2, circular=False):
    """Zero-phase Butterworth-magnitude filter in the FFT domain."""
    x = np.asarray(x, dtype=float)
    count = x.shape[-1]
    size = count if circular else 1 << (count + 4096 - 1).bit_length()
    f = np.fft.rfftfreq(size, 1 / SR)
    h = np.ones_like(f)
    if hi:
        h /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        fr = f / lo
        h *= fr ** order / np.sqrt(1 + fr ** (2 * order))
    return np.fft.irfft(np.fft.rfft(x, size, axis=-1) * h, size, axis=-1)[..., :count]


def make_ir(rt60, seed, predelay=0.014, damp=2400.0):
    """Stereo exponentially decaying noise IR; highs die faster than lows."""
    rng = np.random.default_rng(seed)
    count = int(SR * min(rt60 * 1.2, 5.0))
    t = _t(count)
    low = bandpass(rng.standard_normal((2, count)), hi=damp) * np.exp(-6.9 * t / rt60)
    high = bandpass(rng.standard_normal((2, count)), lo=damp, hi=9000) * np.exp(-6.9 * t / (rt60 * 0.45))
    ir = low + 0.6 * high
    fade = int(0.006 * SR)
    ir[:, :fade] *= np.linspace(0, 1, fade)
    ir = np.concatenate([np.zeros((2, int(predelay * SR))), ir], axis=1)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def convolve(x, ir, circular=False):
    count = x.shape[1]
    if circular:
        if ir.shape[1] > count:
            ir = ir[:, :count]
        size = count
    else:
        size = 1 << (count + ir.shape[1] - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size, axis=1) * np.fft.rfft(ir, size, axis=1), size, axis=1)
    return y[:, :count]


def echo(x, delay, fb, taps=4, pingpong=True, circular=False):
    d = int(round(delay * SR))
    out = np.zeros_like(x)
    for j in range(1, taps + 1):
        src = x[::-1] if (pingpong and j % 2) else x
        g = fb ** j
        if circular:
            out += g * np.roll(src, j * d, axis=1)
        elif j * d < x.shape[1]:
            out[:, j * d:] += g * src[:, : x.shape[1] - j * d]
    return out


def tape_warp(x, cents_fn):
    """Variable-speed playback (wow/flutter/droop). cents < 0 = slower and flatter."""
    count = x.shape[1]
    ratio = 2.0 ** (cents_fn(_t(count * 2)) / 1200.0)
    pos = np.cumsum(ratio) - ratio[0]
    pos = pos[pos < count - 1]
    idx = np.arange(count)
    return np.stack([np.interp(pos, idx, ch) for ch in x])


# --------------------------------------------------------------------------
# Instruments (mono numpy arrays, roughly unit amplitude)
# --------------------------------------------------------------------------

def vibes(m, dur, vel=1.0, cents=0.0, motor=5.6, depth=0.28, ring=0.45):
    f = float(mtof(m)) * 2 ** (cents / 1200)
    t = _t(int((dur + ring) * SR))
    ph = TAU * f * t
    sig = np.sin(ph) * np.exp(-t * 1.3)
    if 4 * f < NYQ_SAFE:
        sig += 0.30 * np.sin(4 * ph + 0.3) * np.exp(-t * 6.0)
    if 9.92 * f < NYQ_SAFE:
        sig += 0.07 * np.sin(9.92 * ph) * np.exp(-t * 16.0)
    sig += 0.20 * np.sin(2 * ph) * np.exp(-t / 0.004)
    trem = 1 - depth * 0.5 * (1 - np.cos(TAU * motor * t))
    damper = np.where(t < dur, 1.0, np.exp(-(t - dur) * 6.9 / ring))
    return vel * sig * trem * ramp_in(t, 0.002) * damper


DRAWBARS = ((0.5, 0.55), (1, 1.0), (2, 0.55), (3, 0.3), (4, 0.22), (6, 0.08))
DRAWBARS_FLUTE = ((1, 1.0), (2, 0.35), (3, 0.12))


def organ(m, dur, vel=1.0, cents=0.0, bars=DRAWBARS, rate=6.4, a=0.02, r=0.09, phi=0.0):
    env = adsr(dur, a, 0.3, 0.9, r)
    t = _t(len(env))
    f = float(mtof(m)) * 2 ** (cents / 1200)
    ph = TAU * np.cumsum(f * (1 + 0.0022 * np.sin(TAU * rate * t + phi))) / SR
    sig = sum(amp * np.sin(k * ph) for k, amp in bars if k * f < NYQ_SAFE)
    sig = sig * (1 - 0.15 * (0.5 + 0.5 * np.sin(TAU * rate * t + phi + 1.3)))
    return vel * sig * env


def pad(m, dur, rng, vel=1.0, a=0.9, r=1.6, detune=7.0, bright=4.0, nharm=14, cents=0.0):
    env = adsr(dur, a, 1.0, 0.85, r)
    t = _t(len(env))
    sig = np.zeros(len(env))
    for dc in (-detune, detune):
        f = float(mtof(m)) * 2 ** ((cents + dc) / 1200)
        for k in range(1, nharm + 1):
            if k * f > NYQ_SAFE:
                break
            sig += (1 / k) * math.exp(-(k - 1) / bright) * np.sin(TAU * k * f * t + rng.uniform(0, TAU))
    return vel * 0.5 * sig * env


def upright(m, dur, rng, vel=1.0, cents=0.0, rel=0.08):
    f = float(mtof(m)) * 2 ** (cents / 1200)
    t = _t(int((dur + rel) * SR))
    amps = (1.0, 0.55, 0.30, 0.16, 0.09, 0.05)
    sig = sum(a * np.sin(TAU * k * f * t) * np.exp(-t * (1.2 + 2.0 * k))
              for k, a in enumerate(amps, 1) if k * f < NYQ_SAFE)
    thump = bandpass(rng.standard_normal(len(t)), lo=60, hi=900) * np.exp(-t / 0.008) * 0.25
    gate = np.where(t < dur, 1.0, np.exp(-(t - dur) * 6.9 / rel))
    return vel * (sig + thump) * ramp_in(t, 0.004) * gate


def synth_bass(m, dur, vel=1.0):
    env = adsr(dur, 0.004, 0.18, 0.5, 0.06)
    t = _t(len(env))
    f = float(mtof(m))
    sig = np.sin(TAU * f * t) + 0.35 * np.sin(TAU * 2 * f * t) + 0.12 * np.sin(TAU * 3 * f * t)
    return vel * sig * env


def pulse(m, dur, vel=1.0, duty=0.25, a=0.003, d=0.12, s=0.6, r=0.05, vib_cents=0.0, cents=0.0, nmax=48):
    env = adsr(dur, a, d, s, r)
    t = _t(len(env))
    pitch = m + cents / 100 + (vib_cents / 100) * np.clip((t - 0.12) / 0.2, 0, 1) * np.sin(TAU * 5.5 * t)
    f = mtof(pitch)
    ph = TAU * np.cumsum(f) / SR
    fmax = float(f.max())
    sig = np.zeros(len(t))
    for k in range(1, nmax + 1):
        if k * fmax > NYQ_SAFE:
            break
        sig += (2 / (k * np.pi)) * math.sin(k * np.pi * duty) * np.cos(k * ph)
    return vel * sig * env


def brass(m, dur, vel=1.0, a=0.05, r=0.12, bright=10.0, vib_cents=12.0, vib_rate=5.2, bend=None, wah=None):
    env = adsr(dur, a, 0.25, 0.75, r)
    t = _t(len(env))
    pitch = np.full(len(t), float(m))
    if bend is not None:
        pitch += bend(t)
    pitch += (vib_cents / 100) * np.clip((t - 0.15) / 0.3, 0, 1) * np.sin(TAU * vib_rate * t)
    f = mtof(pitch)
    ph = TAU * np.cumsum(f) / SR
    b = 1.0 + bright * env
    if wah is not None:
        b = b * wah(t)
    fmax = float(f.max())
    sig = np.zeros(len(t))
    for k in range(1, 41):
        if k * fmax > NYQ_SAFE:
            break
        sig += (1 / k) * np.exp(-(k - 1) / b) * np.sin(k * ph)
    return vel * 0.6 * sig * env


def glass(m, dur, vel=1.0, ratio=3.5, index=2.0, decay=1.4, ring=1.2):
    """Cold FM bell."""
    t = _t(int((dur + ring) * SR))
    f = float(mtof(m))
    idx = index * np.exp(-t * 3.0) + 0.25
    sig = np.sin(TAU * f * t + idx * np.sin(TAU * f * ratio * t)) * np.exp(-t * decay * 0.5)
    sig += 0.25 * np.sin(TAU * 2 * f * t) * np.exp(-t * 2.5)
    damper = np.where(t < dur, 1.0, np.exp(-(t - dur) * 6.9 / ring))
    return vel * sig * ramp_in(t, 0.001) * damper


def theremin(notes, total, glide=0.14, vib_rate=5.6, vib_cents=24.0, a=0.18, r=0.4, gap=0.3,
             timbre=(1.0, 0.16, 0.05)):
    """notes: [(start_s, dur_s, midi, vel)], legato within `gap` seconds glides."""
    t = _t(int(total * SR))
    notes = sorted(notes)
    pt, pm, at, av = [], [], [], []
    prev = None
    for s, d, m, v in notes:
        if prev and s - prev[0] < gap:
            pt += [s, s + glide]
            pm += [prev[1], m]
            at += [s, s + glide]
            av += [prev[2], v]
        else:
            if prev:
                at += [prev[0], prev[0] + max(min(r, s - prev[0] - 0.005), 0.005)]
                av += [prev[2], 0.0]
            pt += [s]
            pm += [m]
            at += [s, s + a]
            av += [0.0, v]
        pt.append(s + d)
        pm.append(m)
        prev = (s + d, m, v)
    at += [prev[0], prev[0] + r]
    av += [prev[2], 0.0]
    pitch = np.interp(t, pt, pm)
    amp = np.interp(t, at, av, left=0.0, right=0.0)
    vib = (vib_cents / 100) * np.sin(TAU * vib_rate * t) * (0.65 + 0.35 * np.sin(TAU * 0.23 * t))
    ph = TAU * np.cumsum(mtof(pitch + vib)) / SR
    sig = sum(g * np.sin((k + 1) * ph) for k, g in enumerate(timbre))
    return sig * amp


def noise_hit(rng, dur, lo, hi, decay, a=0.001, order=2):
    t = _t(int(dur * SR))
    return taper(bandpass(rng.standard_normal(len(t)), lo, hi, order) * ramp_in(t, a) * np.exp(-t / decay))


def brush_slap(rng, vel=1.0, dark=False):
    return vel * 0.5 * noise_hit(rng, 0.35, 700, 3200 if dark else 6500, 0.07, a=0.004)


def ride(rng, vel=1.0, dark=False):
    t = _t(int(1.2 * SR))
    scale = 0.72 if dark else 1.0
    freqs = (3021, 4127, 5293, 6037, 7393, 8611)
    sig = sum(np.sin(TAU * f * scale * t + rng.uniform(0, TAU)) * np.exp(-t * (2.5 + i * 0.7))
              for i, f in enumerate(freqs)) / 6
    sig += 0.6 * noise_hit(rng, 1.2, 4000 * scale, 12000 * scale, 0.18)
    sig += 1.2 * noise_hit(rng, 1.2, 2000, 9000 * scale, 0.004)
    return vel * 0.3 * taper(sig)


def kick(vel=1.0, f0=110.0, f1=52.0, decay=0.18):
    t = _t(int(max(0.4, decay * 6) * SR))
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    return vel * taper(np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / decay) * ramp_in(t, 0.002))


def bongo(f, rng, vel=1.0):
    t = _t(int(0.3 * SR))
    ph = TAU * np.cumsum(f * (1 + 0.35 * np.exp(-t / 0.015))) / SR
    body = np.sin(ph) * np.exp(-t / 0.09)
    slap = 0.5 * noise_hit(rng, 0.3, 1500, 7000, 0.006)
    return vel * taper((body + slap) * ramp_in(t, 0.001))


def shaker(rng, vel=1.0):
    return vel * 0.4 * noise_hit(rng, 0.12, 4000, 14000, 0.025, a=0.008)


def hat(rng, vel=1.0, decay=0.035):
    return vel * 0.5 * noise_hit(rng, 0.2, 7000, 16000, decay)


def woodblock(f=1650.0, vel=1.0):
    t = _t(int(0.15 * SR))
    sig = np.sin(TAU * f * t) * np.exp(-t / 0.025) + 0.5 * np.sin(TAU * 2.71 * f * t) * np.exp(-t / 0.012)
    return vel * taper(sig * ramp_in(t, 0.0005))


def bell(f, parts, length=1.6, phase_rng=None):
    """parts: [(ratio, amp, tau_seconds)]"""
    t = _t(int(length * SR))
    sig = np.zeros(len(t))
    for ratio, amp, tau in parts:
        if f * ratio < NYQ_SAFE:
            ph0 = phase_rng.uniform(0, TAU) if phase_rng is not None else 0.0
            sig += amp * np.sin(TAU * f * ratio * t + ph0) * np.exp(-t / tau)
    return taper(sig * ramp_in(t, 0.0008))


COIN_PARTS = ((1.0, 1.0, 0.9), (2.31, 0.55, 0.5), (3.97, 0.35, 0.3), (5.81, 0.2, 0.18), (7.9, 0.1, 0.1))


def coin_ting(f, rng, vel=1.0, tau=1.0, length=1.4):
    parts = [(r, a, tt * tau) for r, a, tt in COIN_PARTS]
    return vel * bell(f, parts, length, rng)


def coin_flip(rng):
    """Thumb flick -> spin in the air -> land -> wobble faster and faster -> settle."""
    total = 2.4
    out = np.zeros(int(total * SR))
    t = _t(len(out))

    def put(sig, at, gain=1.0):
        i = int(at * SR)
        k = min(len(sig), len(out) - i)
        out[i:i + k] += gain * sig[:k]

    flick = coin_ting(2650, rng, tau=0.4, length=1.0)
    ft = _t(len(flick))
    put(flick * (0.55 + 0.45 * np.cos(TAU * 14 * ft)), 0.0, 0.9)
    whoosh = bandpass(rng.standard_normal(int(0.55 * SR)), 900, 3200)
    wt = _t(len(whoosh))
    put(whoosh * np.sin(np.pi * wt / wt[-1]) ** 2 * (0.6 + 0.4 * np.sin(TAU * 14 * wt)), 0.05, 0.12)
    put(coin_ting(1980, rng, tau=0.35, length=0.8), 0.72, 0.8)
    # Euler's-disk wobble: hit rate accelerates 9 -> 46 Hz, amplitude dies.
    span = 1.15
    st = _t(int(span * SR))
    rate = 9 + 37 * (st / span) ** 1.6
    phase = np.cumsum(rate) / SR
    hits = np.nonzero(np.diff(np.floor(phase)) > 0)[0]
    for h in hits:
        frac = h / len(st)
        put(coin_ting(2020 + rng.uniform(-25, 25), rng, tau=0.05, length=0.12), 0.78 + h / SR, 0.55 * (1 - 0.8 * frac))
    put(noise_hit(rng, 0.05, 1500, 6000, 0.01), 0.78 + span, 0.25)
    out *= np.where(t > 0.78 + span + 0.05, np.exp(-(t - 0.83 - span) / 0.05), 1.0)
    return out


def printer_line(rng, chars=14, cps=30.0, needle_hz=440.0):
    """One dot-matrix line: needle rasp, head motor, carriage return, paper feed."""
    char_len = 1 / cps
    printing = chars * char_len
    count = int((printing + 0.5) * SR)
    t = _t(count)
    imp = np.zeros(count)
    for c in range(chars):
        if rng.random() < 0.15:
            continue
        t0 = c * char_len
        for j in range(int(char_len * needle_hz * 0.85)):
            if rng.random() < 0.65:
                imp[int((t0 + j / needle_hz) * SR)] += rng.uniform(0.5, 1.0)
    kt = _t(int(0.004 * SR))
    needle = np.exp(-kt / 0.0005) * (np.sin(TAU * 3200 * kt) + 0.7 * np.sin(TAU * 5100 * kt + 1.0)
                                     + 0.4 * np.sin(TAU * 1250 * kt))
    sig = np.convolve(imp, needle)[:count]
    gate = np.interp(t, [0, 0.01, printing, printing + 0.02], [0, 1, 1, 0], right=0.0)
    sig += 0.06 * gate * (np.sin(TAU * 230 * t) + 0.5 * np.sin(TAU * 460 * t) + 0.3 * np.sin(TAU * 690 * t))
    cr = printing + 0.04
    zip_len = int(0.12 * SR)
    zt = _t(zip_len)
    i = int(cr * SR)
    sig[i:i + zip_len] += 0.3 * bandpass(rng.standard_normal(zip_len), 500, 2500) * np.sin(np.pi * zt / zt[-1])
    th = _t(int(0.08 * SR))
    j = int((cr + 0.12) * SR)
    sig[j:j + len(th)] += 0.5 * np.sin(TAU * 140 * th) * np.exp(-th / 0.03)
    feed = np.exp(-kt / 0.001) * np.sin(TAU * 900 * kt)
    for k in range(3):
        p = int((cr + 0.2 + 0.035 * k) * SR)
        sig[p:p + len(feed)] += 0.6 * feed
    return taper(sig, 0.05)


def jev_blip():
    out = []
    for f in (988.0, 1319.0):
        t = _t(int(0.08 * SR))
        out.append(taper((np.sin(TAU * f * t) + 0.2 * np.sin(TAU * 3 * f * t)) * ramp_in(t, 0.004) * np.exp(-t / 0.05)))
    return np.concatenate(out)


def klaxon(dur=0.32, f0=330.0, f1=900.0):
    env = adsr(dur, 0.01, 0.1, 1.0, 0.03)
    t = _t(len(env))
    f = f0 * (f1 / f0) ** np.clip(t / dur, 0, 1)
    ph = TAU * np.cumsum(f) / SR
    sig = np.zeros(len(t))
    for k in range(1, 30):
        if k * f1 > NYQ_SAFE:
            break
        sig += (1 / k) * np.sin(k * ph) * (1.0 if k % 2 else 0.45)
    return sig * (1 + 0.25 * np.sin(TAU * 55 * t)) * env


def register_ding(rng):
    """Cash register: two bell strikes, drawer ka-chunk, coins settling."""
    out = np.zeros(int(2.2 * SR))

    def put(sig, at, gain):
        i = int(at * SR)
        k = min(len(sig), len(out) - i)
        out[i:i + k] += gain * sig[:k]

    parts = ((1.0, 1.0, 0.8), (2.0, 0.35, 0.5), (2.76, 0.5, 0.45), (5.4, 0.2, 0.2), (8.93, 0.08, 0.1))
    put(bell(2093, parts, 2.0, rng), 0.0, 0.7)
    put(bell(2637, parts, 2.0, rng), 0.07, 0.55)
    put(noise_hit(rng, 0.3, 150, 2500, 0.05), 0.18, 0.6)
    put(kick(0.8, 160, 80, 0.06), 0.18, 0.7)
    rattle = noise_hit(rng, 0.25, 2000, 6000, 0.08)
    put(rattle * (0.5 + 0.5 * np.sin(TAU * 35 * _t(len(rattle)))), 0.19, 0.3)
    for _ in range(6):
        put(coin_ting(rng.uniform(3000, 4500), rng, tau=0.08, length=0.15), rng.uniform(0.24, 0.5), 0.15)
    return taper(out, 0.1)


# --------------------------------------------------------------------------
# Mix bus
# --------------------------------------------------------------------------

class Mix:
    """Stereo dry / reverb-send / echo-send buses. Loops fold their tails."""

    def __init__(self, seconds, loop=False, tail=4.0):
        self.loop = loop
        self.length = int(round(seconds * SR))
        self.total = self.length + int(tail * SR)
        self.bus = {k: np.zeros((2, self.total)) for k in ("dry", "rev", "echo")}
        self.energy = {}

    def add(self, sig, t, gain=1.0, pan=0.0, rev=0.2, echo=0.0, group="misc"):
        i = int(round(t * SR))
        if i < 0:
            if self.loop:
                i += self.length
            else:
                sig, i = sig[-i:], 0
        k = min(len(sig), self.total - i)
        if k <= 0:
            return
        s = np.asarray(sig[:k]) * gain
        lr = (math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4))
        for ch in (0, 1):
            self.bus["dry"][ch, i:i + k] += s * lr[ch]
            if rev:
                self.bus["rev"][ch, i:i + k] += s * lr[ch] * rev
            if echo:
                self.bus["echo"][ch, i:i + k] += s * lr[ch] * echo
        self.energy[group] = self.energy.get(group, 0.0) + float(np.sum(s * s))

    def _fold(self, x):
        out = x[:, : self.length].copy()
        for k in range(self.length, self.total, self.length):
            seg = x[:, k:k + self.length]
            out[:, : seg.shape[1]] += seg
        return out

    def render(self, rt60=1.4, wet=0.25, echo_time=0.375, echo_fb=0.35, echo_taps=4, seed=1):
        bus = {k: self._fold(v) for k, v in self.bus.items()} if self.loop else self.bus
        c = self.loop
        dry, rev = bus["dry"], bus["rev"]
        if np.any(bus["echo"]):
            e = bandpass(echo(bus["echo"], echo_time, echo_fb, echo_taps, circular=c), lo=200, hi=5000, circular=c)
            dry = dry + e
            rev = rev + 0.5 * e
        return dry + wet * convolve(rev, make_ir(rt60, seed), circular=c)

    def levels(self):
        ref = max(self.energy.values())
        return {g: 10 * math.log10(e / ref) for g, e in sorted(self.energy.items(), key=lambda kv: -kv[1])}


def master(x, loop, drive=1.3, max_len=None, fade_out=0.05):
    x = bandpass(x, lo=28, circular=loop)
    if loop:
        x = x - x.mean(axis=1, keepdims=True)
    else:
        peak = np.abs(x).max()
        loud = np.nonzero(np.abs(x).max(axis=0) > peak * 10 ** (-66 / 20))[0]
        x = x[:, : loud[-1] + int(0.05 * SR)]
        if max_len:
            x = x[:, : int(max_len * SR)]
        fi, fo = int(0.003 * SR), int(fade_out * SR)
        x[:, :fi] *= np.linspace(0, 1, fi)
        x[:, -fo:] *= np.linspace(1, 0, fo)
    x = x / np.abs(x).max()
    if drive:
        x = np.tanh(drive * x) / math.tanh(drive)
    return x * 10 ** (PEAK_DBFS / 20)


# --------------------------------------------------------------------------
# Pieces
# --------------------------------------------------------------------------

JINGLE_MELODY = [
    (0, .85, "E5"), (1, .85, "G5"), (2, .85, "A5"), (3, .85, "C6"),            # D. O. N. T.
    (4, 1.6, "D6"), (6, .5, "B5"), (6.5, .5, "A5"), (7, .9, "G5"),             # Ship!
    (8, .5, "B5"), (8.5, .5, "G5"), (9, .5, "E5"), (9.5, .5, "G5"), (10, .9, "C#6"), (11, .9, "A5"),
    (12, .5, "F5"), (12.5, .5, "A5"), (13, .9, "D6"), (14, 1.4, "B5"), (15.5, .5, "G5"),
    (16, .5, "A5"), (16.5, .5, "C6"), (17, .9, "E6"), (18, .9, "Eb6"), (19, .9, "C6"),
    (20, 1.4, "E6"), (21.5, .5, "D6"), (22, .9, "C#6"), (23, .9, "A5"),
    (24, .5, "F5"), (24.5, .5, "A5"), (25, .9, "D6"), (26, .5, "B5"), (26.5, .5, "G5"),
    (27, .5, "B5"), (27.5, .5, "D6"),
    (28, 2.5, "C6"),
]
# Two chords per bar for bars 1-7 (I-vi-ii-V, iii-VI-ii-V, IV-#ivo, I/5-VI-ii-V); bar 8 is the cadence.
JINGLE_CHORDS_DOCK = ["C6", "Am7", "Dm7", "G7", "Em7", "A7", "Dm7", "G7",
                      "Fmaj7", "F#dim7", "C/G", "A7", "Dm7", "G7"]
# Same root motion, every quality bent a little wrong.
JINGLE_CHORDS_EXEC = ["Caugmaj7", "Ammaj7", "Dm7b5", "G7b9", "Emb9", "A7#5", "Dmmaj7", "G7b9",
                      "F7#11", "F#dimmaj7", "Abmaj7/G", "A7b9", "Dmmaj7", "Db7"]


def walking_bass(chords, lo):
    """Quarter notes, two per chord: root, then a chord tone or chromatic approach."""
    notes, prev = [], n("C2")
    for i, ch in enumerate(chords):
        r = nearest(ch.bass, prev, lo, lo + 15)
        nxt = nearest(chords[(i + 1) % len(chords)].bass, r, lo, lo + 15)
        if i % 2 == 0:
            second = nearest(ch.pcs()[2], r + 4, lo, lo + 15)
        else:
            second = nxt - 1 if nxt > r else nxt + 1
        notes += [(i * 2, 0.92, r), (i * 2 + 1, 0.92, second)]
        prev = r
    return notes


def piece_jingle(executive=False):
    rng = np.random.default_rng(4071 if executive else 407)
    clk = Clock(112, 0.67) if executive else Clock(132, 0.64)
    chords = [Chord(c) for c in (JINGLE_CHORDS_EXEC if executive else JINGLE_CHORDS_DOCK)]
    final = Chord("Cmmaj9" if executive else "C69")
    mix = Mix(clk.sec(32) + 0.5, loop=False, tail=4.0)
    hum = lambda: rng.normal(0, 0.004)
    note_cents = (lambda: rng.uniform(-16, 16)) if executive else (lambda: 0.0)
    motor, depth = (3.1, 0.5) if executive else (5.6, 0.28)

    for b, d, nm in JINGLE_MELODY:
        mix.add(vibes(n(nm), clk.dur(b, d), cents=note_cents(), motor=motor, depth=depth),
                clk.sec(b) + hum(), 0.5, pan=0.2, rev=0.3, group="melody")
    if executive:
        shadow = [(clk.sec(b) + 0.12, clk.dur(b, d), n(nm) - 12, 0.8) for b, d, nm in JINGLE_MELODY]
        mix.add(theremin(shadow, mix.total / SR, glide=0.18, vib_rate=4.2, vib_cents=35),
                0.0, 0.16, pan=-0.35, rev=0.6, group="theremin")

    organ_cents = (-11.0, 13.0) if executive else (0.0,)
    og = 0.07 / len(organ_cents) ** 0.5
    for i, ch in enumerate(chords):
        for m in voicing(ch, 53):
            for oc in organ_cents:
                mix.add(organ(m, clk.dur(i * 2, 1.9), cents=oc, phi=rng.uniform(0, TAU)),
                        clk.sec(i * 2), og, pan=-0.3, rev=0.25, group="organ")
    for m in voicing(final, 53):
        for oc in organ_cents:
            mix.add(organ(m, clk.dur(28, 2.8), cents=oc), clk.sec(28), og, pan=-0.3, rev=0.25, group="organ")
            mix.add(organ(m, clk.dur(31, 0.4), cents=oc), clk.sec(31), og * 1.2, pan=-0.3, rev=0.3, group="organ")
    for m in voicing(final, 65):
        mix.add(vibes(m, clk.dur(31, 0.5), motor=motor, depth=depth), clk.sec(31), 0.22, pan=0.2, rev=0.35,
                group="melody")

    bass_cents = -10.0 if executive else 0.0
    lo = n("E1")
    for b, d, m in walking_bass(chords, lo) + [(28, 1.8, n("C2")), (30, 0.9, n("G1")), (31, 0.45, n("C2"))]:
        mix.add(upright(m, clk.dur(b, d), rng, cents=bass_cents), clk.sec(b) + hum(), 0.6, rev=0.08, group="bass")

    ride_pat = ((0, 0.9), (1, 0.7), (1.5, 0.45), (2, 0.9), (3, 0.7), (3.5, 0.45))
    for bar in range(7):
        base = bar * 4
        for off, v in ride_pat:
            mix.add(ride(rng, v, dark=executive), clk.sec(base + off) + hum(), 0.32, pan=0.35, rev=0.15, group="drums")
        for off in (1, 3):
            mix.add(brush_slap(rng, dark=executive), clk.sec(base + off) + hum(), 0.45, pan=-0.1, rev=0.2, group="drums")
        for off in range(4):
            mix.add(kick(), clk.sec(base + off), 0.2, group="drums")
    swirl_len = clk.sec(28)
    st = _t(int(swirl_len * SR))
    swirl = bandpass(rng.standard_normal(len(st)), 1800, 3500 if executive else 7000)
    swirl *= (0.35 + 0.65 * np.sin(np.pi * st * clk.bpm / 120) ** 2) * np.minimum(1, (swirl_len - st) / 0.3)
    mix.add(swirl, 0.0, 0.035, pan=-0.2, rev=0.1, group="drums")
    mix.add(ride(rng, 1.0, dark=executive), clk.sec(28), 0.4, pan=0.35, rev=0.3, group="drums")
    mix.add(kick(0.9), clk.sec(31), 0.5, group="drums")
    mix.add(brush_slap(rng, dark=executive), clk.sec(31), 0.7, rev=0.3, group="drums")

    if executive:
        x = mix.render(rt60=2.6, wet=0.4, seed=11)
        end = x.shape[1] / SR

        def cents(t):
            droop = -110 * np.clip((t - (end - 3.0)) / 2.6, 0, 1) ** 2
            return -28 + 14 * np.sin(TAU * 0.45 * t) + 4 * np.sin(TAU * 4.7 * t) + droop

        x = bandpass(tape_warp(x, cents), hi=6500)
    else:
        x = mix.render(rt60=1.3, wet=0.22, seed=10)
    return master(x, loop=False, drive=1.2), mix


def piece_hub():
    rng = np.random.default_rng(4072)
    length = 16.0                      # 60 BPM, 4 bars of 4/4: one beat per second
    mix = Mix(length, loop=True, tail=6.0)
    for b, sym in ((0, "Fmaj9"), (4, "Dm9"), (8, "Bbmaj7#11"), (12, "C9sus4")):
        ch = Chord(sym)
        for i, m in enumerate(voicing_open(ch, 53)):
            mix.add(pad(m, 4.2, rng, a=1.3, r=2.2, bright=3.0), b, 0.12, pan=(-0.4, 0.4)[i % 2], rev=0.5,
                    group="pad")
        mix.add(organ(place(ch.root, 36), 4.0, bars=DRAWBARS_FLUTE, rate=0.8, a=0.5, r=1.2), b, 0.22,
                rev=0.3, group="organ")
        mix.add(organ(place(ch.root, 48) + 7, 3.6, bars=DRAWBARS_FLUTE, rate=0.8, a=0.8, r=1.2), b + 0.3, 0.06,
                pan=0.3, rev=0.4, group="organ")

    phrase = [(0.6, 1.4, "A4"), (2.0, 1.6, "F5"), (3.6, 0.9, "E5"), (4.5, 2.6, "C5"),      # "I com-pute."
              (8.4, 1.0, "D5"), (9.4, 1.6, "A5"), (11.0, 1.6, "E5")]                       # "You choose."
    mix.add(theremin([(s, d, n(nm), 1.0) for s, d, nm in phrase], length + 1.0), 0.0, 0.3, pan=0.15,
            rev=0.55, echo=0.25, group="theremin")

    for at in (5.0, 13.0):
        mix.add(jev_blip(), at, 0.18, pan=0.5, rev=0.3, echo=0.3, group="jev")
    for at, chars in ((5.35, 14), (6.25, 10), (13.35, 18)):
        mix.add(printer_line(rng, chars), at, 0.3, pan=0.55, rev=0.12, group="printer")
    for beat in range(16):
        mix.add(woodblock(2400 if beat % 2 == 0 else 1900, 1.0), beat, 0.08, pan=-0.6, rev=0.25, group="clock")

    t = _t(mix.length)
    f_hum = round(87.31 * length) / length       # whole number of cycles per loop
    hum = (np.sin(TAU * f_hum * t) + 0.3 * np.sin(TAU * 2 * f_hum * t) + 0.1 * np.sin(TAU * 3 * f_hum * t))
    mix.add(hum * (1 + 0.3 * np.sin(TAU * t / 4)), 0.0, 0.025, rev=0.0, group="hum")

    x = mix.render(rt60=2.8, wet=0.35, echo_time=0.75, echo_fb=0.32, seed=12)
    return master(x, loop=True, drive=1.1), mix


COIN_MELODY = [(0, 1, "D5"), (1, .5, "F#5"), (1.5, .5, "A5"), (2, 1, "B5"), (3, 1, "A5"),   # SAVE HU-MAN-I-TY
               (4, 1, "G5"), (5, 1, "F#5"), (6, 1, "E5"), (7, 2, "D5")]
COIN_HOPE = [(0, 2, "D"), (2, 2, "Gadd9"), (4, 2, "Em7"), (6, 1, "A7"), (7, 2.5, "D")]
COIN_COLD = [(0, 2, "Bm7"), (2, 2, "Em11"), (4, 2, "Cmaj7#11"), (6, 1, "F#7b9"), (7, 2.5, "Bmadd9")]


def piece_coin():
    rng = np.random.default_rng(4073)
    clk = Clock(92)
    phrase_len = clk.sec(9)
    t_coin = phrase_len + 0.3
    t_cold = t_coin + 2.35
    mix = Mix(t_cold + phrase_len + 0.5, loop=False, tail=4.0)

    def phrase(t0, hopeful):
        for b, d, sym in (COIN_HOPE if hopeful else COIN_COLD):
            ch = Chord(sym)
            dur = clk.dur(b, d)
            for i, m in enumerate(voicing_open(ch, 50)):
                if hopeful:
                    mix.add(pad(m, dur, rng, a=0.25, r=1.2, bright=4.5), t0 + clk.sec(b), 0.09,
                            pan=(-0.35, 0.35)[i % 2], rev=0.35, group="chords")
                else:
                    mix.add(pad(m, dur, rng, a=0.5, r=1.6, bright=1.8, detune=16), t0 + clk.sec(b), 0.1,
                            pan=(-0.5, 0.5)[i % 2], rev=0.55, group="chords")
            root = nearest(ch.bass, n("D2"), n("A1"), n("A2"))
            if hopeful:
                mix.add(upright(root, dur, rng, rel=0.4), t0 + clk.sec(b), 0.55, rev=0.15, group="bass")
            else:
                mix.add(synth_bass(root, dur), t0 + clk.sec(b), 0.35, rev=0.2, group="bass")
        for b, d, nm in COIN_MELODY:
            m, dur, at = n(nm), clk.dur(b, d), t0 + clk.sec(b)
            if hopeful:
                mix.add(brass(m, dur * 0.95, bright=5.0, vib_cents=10), at, 0.42, pan=0.1, rev=0.3, group="melody")
                mix.add(vibes(m + 12, dur, ring=0.6), at, 0.16, pan=0.3, rev=0.35, group="melody")
            else:
                mix.add(glass(m, dur, ring=1.4), at, 0.4, pan=-0.1, rev=0.5, echo=0.2, group="melody")
                mix.add(glass(m - 12, dur, ratio=1.0, index=0.8, ring=1.0), at, 0.15, pan=0.2, rev=0.4,
                        group="melody")
        if not hopeful:
            for k in range(36):        # the counting machine, 16ths
                mix.add(woodblock(3100, 1.0 if k % 4 == 0 else 0.55), t0 + clk.sec(k / 4), 0.08,
                        pan=0.6, rev=0.15, group="ticks")

    phrase(0.0, hopeful=True)
    mix.add(coin_flip(rng), t_coin, 0.6, pan=0.0, rev=0.3, group="coin")
    phrase(t_cold, hopeful=False)
    x = mix.render(rt60=2.0, wet=0.3, echo_time=clk.sec(0.75), echo_fb=0.3, seed=13)
    return master(x, loop=False, drive=1.15), mix


PORCH_PROG = [("Fmaj7", 4), ("Gm7", 2), ("C7", 2), ("Am7", 2), ("D7", 2), ("Gm7", 2), ("C7", 2),
              ("Fmaj7", 4), ("Bbmaj7", 4), ("Am7", 2), ("D7", 2), ("Gm7", 2), ("C7", 2)]
PORCH_LEAD = [
    (0, .5, "C5"), (.5, .5, "A4"), (1, .5, "C5"), (1.5, 1, "F5"), (2.5, .5, "E5"), (3, 1, "C5"),
    (4, .5, "D5"), (4.5, .5, "Bb4"), (5, .5, "D5"), (5.5, 1, "G5"), (6.5, .5, "E5"), (7, 1, "Bb4"),
    (8, .5, "E5"), (8.5, .5, "C5"), (9, .5, "E5"), (9.5, 1, "A5"), (10.5, .5, "F#5"), (11, 1, "C5"),
    (12, .5, "D5"), (12.5, .5, "F5"), (13, .5, "A5"), (13.5, .5, "G5"), (14, 1, "E5"), (15, .5, "G5"),
    (15.5, .5, "Bb4"),
    (16, 1.5, "A5"), (17.5, .5, "G5"), (18, .5, "F5"), (18.5, .5, "E5"), (19, 1, "C5"),
    (20, .5, "F5"), (20.5, .5, "A5"), (21, 1, "D6"), (22, .5, "C6"), (22.5, .5, "A5"), (23, 1, "F5"),
    (24, .5, "E5"), (24.5, .5, "G5"), (25, 1, "C6"), (26, .5, "A5"), (26.5, .5, "F#5"), (27, 1, "D5"),
    (28, 1, "G5"), (29, .5, "F5"), (29.5, .5, "D5"), (30, .5, "E5"), (30.5, .5, "G5"), (31, .5, "Bb5"),
    (31.5, .5, "G5"),
]


def slots(prog):
    out, b = [], 0
    for sym, d in prog:
        out.append((b, d, Chord(sym)))
        b += d
    return out


def chord_at(sl, beat):
    for b, d, ch in sl:
        if b <= beat < b + d:
            return ch
    return sl[-1][2]


def piece_porch():
    rng = np.random.default_rng(4074)
    clk = Clock(120, 0.54)
    mix = Mix(clk.sec(32), loop=True, tail=4.0)
    sl = slots(PORCH_PROG)
    hum = lambda: rng.normal(0, 0.003)
    lo = n("F1")

    for b, d, ch in sl:
        r = place(ch.root, lo)
        fifth = place((ch.root + 7) % 12, lo)
        pat = [(0, 1.4, r), (1.5, 0.45, fifth)]
        if d == 4:
            pat += [(2, 1.4, fifth), (3.5, 0.45, r)]
        for off, dd, m in pat:
            mix.add(upright(m, clk.dur(b + off, dd), rng), clk.sec(b + off) + hum(), 0.6, rev=0.06, group="bass")

    for bar in range(8):
        for off, dd in ((0, 0.9), (2.5, 0.9)):
            beat = bar * 4 + off
            for m in voicing(chord_at(sl, beat), 57):
                mix.add(vibes(m, clk.dur(beat, dd), vel=0.9, motor=6.0), clk.sec(beat) + hum(), 0.1, pan=0.4,
                        rev=0.3, group="vibes")

    arp_shape = (0, 1, 2, 3, 2, 1, 0, 1)
    for k in range(128):
        beat = k / 4
        tones = voicing(chord_at(sl, beat), 72, rootless=False)
        m = tones[arp_shape[k % 8] % len(tones)]
        mix.add(pulse(m, clk.dur(beat, 0.2), duty=0.125, d=0.05, s=0.3), clk.sec(beat), 0.15, pan=-0.45,
                rev=0.1, echo=0.25, group="chip-arp")

    for b, d, nm in PORCH_LEAD:
        dur = clk.dur(b, d * (0.8 if d <= 0.5 else 0.92))
        mix.add(pulse(n(nm), dur, duty=0.25, vib_cents=18), clk.sec(b), 0.2, pan=0.05, rev=0.18, echo=0.3,
                group="lead")
        mix.add(vibes(n(nm), dur, motor=6.0), clk.sec(b), 0.18, pan=0.15, rev=0.25, group="lead")

    bongo_pat = ((380, 0.9), (380, 0.4), (260, 0.6), (380, 0.4), (380, 0.8), (380, 0.4), (260, 0.9), (260, 0.5))
    for bar in range(8):
        for e, (f, v) in enumerate(bongo_pat):
            beat = bar * 4 + e / 2
            mix.add(bongo(f, rng, v), clk.sec(beat) + hum(), 0.2, pan=(0.5 if f > 300 else 0.3), rev=0.15,
                    group="perc")
        for s in range(16):
            beat = bar * 4 + s / 4
            mix.add(shaker(rng, 1.0 if s % 2 else 0.5), clk.sec(beat) + hum(), 0.12, pan=-0.3, rev=0.1,
                    group="perc")
        for off in (0, 1.5, 2, 3.5):
            mix.add(kick(0.8), clk.sec(bar * 4 + off), 0.32, group="perc")
    for two in range(4):
        for off in (0, 1.5, 3, 5, 6):          # 3-2 son clave
            mix.add(woodblock(1650, 1.0), clk.sec(two * 8 + off) + hum(), 0.08, pan=-0.5, rev=0.2, group="perc")

    x = mix.render(rt60=1.0, wet=0.2, echo_time=clk.sec(0.75), echo_fb=0.3, seed=14)
    return master(x, loop=True, drive=1.3), mix


SPACE_PROG = [("Dm9", 4), ("Bbmaj7#11", 4), ("Gm9", 4), ("A7sus4", 2), ("A7b9", 2)] * 2
SPACE_THEREMIN = [(16, 1.8, "A4"), (18, 1, "D5"), (19, 1, "E5"), (20, 2.8, "F5"), (23, 0.9, "E5"),
                  (24, 1.8, "D5"), (26, 0.9, "Bb4"), (27, 0.9, "A4"), (28, 1.8, "E5"), (30, 1.7, "C#5")]
SPACE_VIBES = [(6.5, .5, "F5"), (7, 1.5, "E5"), (14.5, .5, "G5"), (15, 1, "C#6")]


def piece_space():
    rng = np.random.default_rng(4075)
    clk = Clock(100)
    mix = Mix(clk.sec(32), loop=True, tail=5.0)
    sl = slots(SPACE_PROG)

    for b, d, ch in sl:
        for i, m in enumerate(voicing_open(ch, 50)):
            mix.add(pad(m, clk.dur(b, d) + 0.2, rng, a=0.8, r=1.8, bright=3.5, detune=10), clk.sec(b), 0.08,
                    pan=(-0.5, 0.5)[i % 2], rev=0.5, group="pad")
        r = place(ch.root, n("D1"))
        for e in range(int(d * 2)):
            beat = b + e / 2
            mix.add(synth_bass(r + (12 if e % 2 else 0), clk.dur(beat, 0.4)), clk.sec(beat), 0.32, rev=0.05,
                    group="bass")

    arp_shape = (0, 2, 1, 3, 2, 4, 3, 1)
    for k in range(128):
        beat = k / 4
        tones = voicing(chord_at(sl, beat), 74, rootless=False)
        m = tones[arp_shape[k % 8] % len(tones)]
        mix.add(pulse(m, clk.dur(beat, 0.18), duty=0.25, d=0.04, s=0.25), clk.sec(beat), 0.12,
                pan=0.4 * math.sin(k * 0.4), rev=0.2, echo=0.35, group="chip-arp")

    for at in (0, 16):
        ping_t = _t(int(1.6 * SR))
        ping = np.sin(TAU * np.cumsum(1318.5 * (1 - 0.02 * ping_t)) / SR) * np.exp(-ping_t / 0.35)
        mix.add(ping * ramp_in(ping_t, 0.003), clk.sec(at), 0.2, pan=-0.3, rev=0.5, echo=0.5, group="sonar")
    for b, d, nm in SPACE_VIBES:
        mix.add(vibes(n(nm), clk.dur(b, d), motor=4.5, depth=0.4), clk.sec(b), 0.25, pan=0.3, rev=0.4, echo=0.2,
                group="vibes")
    notes = [(clk.sec(b), clk.dur(b, d), n(nm), 1.0) for b, d, nm in SPACE_THEREMIN]
    mix.add(theremin(notes, clk.sec(32) + 1.5, vib_cents=28), 0.0, 0.3, pan=-0.1, rev=0.5, echo=0.25,
            group="theremin")

    for bar in range(8):
        for off in (0, 2):
            mix.add(kick(1.0, 120, 48, 0.25), clk.sec(bar * 4 + off), 0.45, group="drums")
        for off in (1, 3):
            mix.add(brush_slap(rng), clk.sec(bar * 4 + off), 0.25, pan=-0.1, rev=0.3, group="drums")
        for e in range(8):
            mix.add(hat(rng, 1.0 if e % 2 else 0.35), clk.sec(bar * 4 + e / 2), 0.12, pan=0.35, rev=0.1,
                    group="drums")

    x = mix.render(rt60=3.0, wet=0.32, echo_time=clk.sec(0.75), echo_fb=0.38, echo_taps=5, seed=15)
    return master(x, loop=True, drive=1.2), mix


def piece_delivered():
    rng = np.random.default_rng(4076)
    mix = Mix(3.0, loop=False, tail=2.0)
    for at, d, nm in ((0.00, 0.10, "G4"), (0.11, 0.10, "C5"), (0.22, 0.10, "E5"), (0.33, 0.8, "G5")):
        mix.add(brass(n(nm), d, bright=12, a=0.02, vib_cents=8), at, 0.32, pan=0.1, rev=0.2, group="brass")
    for nm, pan in (("E5", -0.25), ("C5", 0.3), ("G4", -0.1), ("C4", 0.0)):
        mix.add(brass(n(nm), 0.8, bright=9, a=0.025, vib_cents=6), 0.33, 0.2, pan=pan, rev=0.2, group="brass")
    for i, nm in enumerate(("C6", "E6", "G6", "C7")):
        mix.add(vibes(n(nm), 0.6, ring=0.8), 0.33 + 0.05 * i, 0.16, pan=0.35, rev=0.35, group="vibes")
    mix.add(upright(n("C2"), 0.8, rng), 0.33, 0.6, group="bass")
    mix.add(kick(1.0), 0.33, 0.5, group="drums")
    mix.add(ride(rng, 1.0), 0.33, 0.35, pan=0.3, rev=0.3, group="drums")
    mix.add(register_ding(rng), 1.2, 0.5, pan=-0.15, rev=0.2, group="register")
    x = mix.render(rt60=1.1, wet=0.2, seed=16)
    return master(x, loop=False, drive=1.2, max_len=3.0, fade_out=0.12), mix


def piece_forfeit():
    rng = np.random.default_rng(4077)
    mix = Mix(3.0, loop=False, tail=1.5)
    for at in (0.0, 0.34):
        mix.add(klaxon(), at, 0.3, pan=-0.2, rev=0.25, group="klaxon")
        mix.add(klaxon(f0=220, f1=600), at, 0.15, pan=0.2, rev=0.25, group="klaxon")

    def wah_short(t):
        return 0.25 + 0.75 * (1 - np.exp(-t / 0.07))

    for at, nm in ((0.80, "Bb3"), (1.10, "A3"), (1.40, "Ab3")):
        mix.add(brass(n(nm), 0.25, bright=8, a=0.03, vib_cents=0, wah=wah_short), at, 0.45, rev=0.2, group="trombone")

    def bend(t):
        return -1.2 * np.clip((t - 0.6) / 0.45, 0, 1) ** 2

    def wah_long(t):
        return wah_short(t) * (0.75 + 0.25 * np.sin(TAU * 5.5 * t))

    mix.add(brass(n("G3"), 1.0, bright=8, a=0.03, vib_cents=40, vib_rate=5.5, bend=bend, wah=wah_long, r=0.15),
            1.70, 0.45, rev=0.25, group="trombone")
    mix.add(upright(n("G1"), 1.0, rng), 1.70, 0.4, group="bass")
    x = mix.render(rt60=1.0, wet=0.18, seed=17)
    return master(x, loop=False, drive=1.2, max_len=3.0, fade_out=0.12), mix


PIECES = {
    "jingle-dock": (lambda: piece_jingle(False), False),
    "jingle-executive": (lambda: piece_jingle(True), False),
    "hub-ambience-loop": (piece_hub, True),
    "coin-motif": (piece_coin, False),
    "run-porch-loop": (piece_porch, True),
    "run-space-loop": (piece_space, True),
    "sting-delivered": (piece_delivered, False),
    "sting-forfeit": (piece_forfeit, False),
}


# --------------------------------------------------------------------------
# Output + verification
# --------------------------------------------------------------------------

def write_wav(path: Path, x):
    pcm = np.round(np.clip(x, -1, 1).T * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def encode(wav: Path, name: str):
    common = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-map_metadata", "-1"]
    subprocess.run(common + ["-c:a", "libvorbis", "-q:a", "4", str(OUT_DIR / f"{name}.ogg")], check=True)
    subprocess.run(common + ["-c:a", "libmp3lame", "-q:a", "4", str(OUT_DIR / f"{name}.mp3")], check=True)


def decode(path: Path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).T


def check(name: str, loop: bool, expected: int):
    ogg = OUT_DIR / f"{name}.ogg"
    x = decode(ogg)
    peak = 20 * math.log10(np.abs(x).max())
    rms = 20 * math.log10(np.sqrt(np.mean(x ** 2)))
    row = (f"{name:20s} {x.shape[1] / SR:6.2f}s  samples {x.shape[1]:>7d}/{expected:<7d}  "
           f"peak {peak:5.2f} dBFS  rms {rms:6.1f}  ogg {ogg.stat().st_size / 1024:5.0f}K  "
           f"mp3 {(OUT_DIR / f'{name}.mp3').stat().st_size / 1024:5.0f}K")
    if loop:
        seam = np.abs(x[:, 0] - x[:, -1]).max()
        p99 = np.percentile(np.abs(np.diff(x, axis=1)), 99)
        w = int(0.05 * SR)
        edge = 20 * math.log10(np.sqrt(np.mean(x[:, -w:] ** 2)) / np.sqrt(np.mean(x[:, :w] ** 2)))
        row += f"  seam {seam:.4f} (p99 step {p99:.4f})  end/start rms {edge:+.1f} dB"
    print(row)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("names", nargs="*", help="cues to render (default: all)")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--levels", action="store_true", help="print per-group mix energy (dB re loudest)")
    args = ap.parse_args()
    if args.list:
        print("\n".join(PIECES))
        return
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found")
    names = args.names or list(PIECES)
    unknown = [nm for nm in names if nm not in PIECES]
    if unknown:
        sys.exit(f"unknown cue(s): {', '.join(unknown)}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WAV_DIR.mkdir(parents=True, exist_ok=True)
    for name in names:
        fn, loop = PIECES[name]
        x, mix = fn()
        wav = WAV_DIR / f"{name}.wav"
        write_wav(wav, x)
        encode(wav, name)
        if args.levels:
            print(name, "  ".join(f"{g} {db:+.1f}" for g, db in mix.levels().items()))
        check(name, loop, x.shape[1])


if __name__ == "__main__":
    main()
