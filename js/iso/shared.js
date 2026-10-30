// The one WebGL renderer (one GL context) shared by the Box 407-B hub and every iso run.
// Created lazily; the layer holds the GL canvas plus the run HUD. The hub adds its own DOM to the same layer.
import * as THREE from "three";

let shared = null;

export function ensureShared() {
  if (shared) return shared;
  const layer = document.createElement("div");
  layer.className = "iso-layer";
  layer.hidden = true;
  layer.innerHTML = `
    <canvas class="iso-view"></canvas>
    <div class="iso-hud">
      <div class="kicker">COURIER RUN · BOX 407-B</div>
      <div class="universe" data-hud="universe">—</div>
      <div class="row" data-hud="manifest">—</div>
      <div class="row odds" data-hud="odds">—</div>
      <div class="tags" data-hud="tags"></div>
      <div class="parcel">PARCEL <b data-hud="parcel">IN TRANSIT</b></div>
    </div>
    <div class="iso-tag" data-hud="tag"></div>
    <div class="iso-keys"><kbd>WASD</kbd> / <kbd>↑←↓→</kbd> move · <kbd>Space</kbd> jump · reach <b>OUT / RCPT</b></div>
    <div class="iso-stamp" data-hud="stamp"></div>`;
  const canvas = layer.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const hud = {};
  for (const el of layer.querySelectorAll("[data-hud]")) hud[el.dataset.hud] = el;
  shared = { layer, canvas, renderer, hud };
  window.__isoMemory = () => ({ ...renderer.info.memory, programs: renderer.info.programs?.length ?? 0 });
  return shared;
}

/** True when WebGL is usable; creates the shared renderer on first call. */
export function isoAvailable() {
  try {
    ensureShared();
    return true;
  } catch (err) {
    console.warn("Iso renderer unavailable, using 2D fallback:", err);
    return false;
  }
}
