// Render quality tier for the shared WebGL renderer, picked once at load.
//   high   desktop: devicePixelRatio up to 2, 2048 PCF shadows, ink outlines
//   medium touch / phones: DPR up to 1.5, 1024 PCF shadows, ink outlines
//   low    weak devices (≤2 cores, ≤2 GB, Save-Data): DPR 1, 1024 hard shadows, no outline hulls
// `?quality=low|medium|high` overrides the guess. Safe to import outside a browser (iso-check → high).
const PROFILES = {
  high: { name: "high", maxDpr: 2, shadowMap: 2048, softShadows: true, outlines: true },
  medium: { name: "medium", maxDpr: 1.5, shadowMap: 1024, softShadows: true, outlines: true },
  low: { name: "low", maxDpr: 1, shadowMap: 1024, softShadows: false, outlines: false },
};

function detect() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "high";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (PROFILES[forced]) return forced;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  const weak = cores <= 2 || memory <= 2 || navigator.connection?.saveData;
  if (weak) return coarse ? "low" : "medium";
  return coarse ? "medium" : "high";
}

export const QUALITY = PROFILES[detect()];
