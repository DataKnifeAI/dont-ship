/**
 * Seeded PRNG (mulberry32) + string hash for reproducible runs.
 * Identical manifestId + doorId (+ optional salt) → identical sequence.
 */

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    seed: seed >>> 0,
    next,
    float(min = 0, max = 1) {
      return min + next() * (max - min);
    },
    int(min, maxInclusive) {
      return Math.floor(min + next() * (maxInclusive - min + 1));
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    bool(p = 0.5) {
      return next() < p;
    },
  };
}

/** Stable seed from manifest + door pick (and optional run index). */
export function seedFromPick(manifestId, doorId, salt = 0) {
  return hashString(`${manifestId}|${doorId}|${salt}`);
}
