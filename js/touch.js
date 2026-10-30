// Touch controls: a floating virtual joystick on the left half of the stage and a jump zone on the right
// half, shown only during runs in touch mode. The iso run reads the analog stick through touchStick();
// the stick and jump also press WASD / Space as synthetic key events, so the legacy 2D run (and anything
// else listening for keys) works unchanged.
//
// Touch mode (`body.touch`) starts on for coarse-pointer devices, turns on at the first touch and off at
// the first real game key or mouse press, so touch laptops follow whatever was used last.
//
// Also here: the portrait "rotate your phone" prompt dismissal, the fullscreen button, and the routing
// memo height the compact layout needs.

/** Knob travel in CSS px at full deflection. */
const RADIUS = 56;
/** Deflection (0–1) ignored around the centre, and the deflection that already means full speed. */
const DEAD = 0.14;
const FULL = 0.72;
/** Deflection on one axis that presses its synthetic WASD key. */
const KEY_AXIS = 0.38;
const KEYS = { w: "KeyW", a: "KeyA", s: "KeyS", d: "KeyD", " ": "Space" };
const GAME_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
const PORTRAIT_OK = "dontShip_portraitOk";

/** Analog stick in screen space (x right, y up, length ≤ 1) while a finger holds it, else null. */
let stick = null;
const pressed = new Set();

export function touchStick() {
  return stick;
}

export function isTouchMode() {
  return document.body.classList.contains("touch");
}

function press(key, down) {
  if (pressed.has(key) === down) return;
  if (down) pressed.add(key);
  else pressed.delete(key);
  window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key, code: KEYS[key], bubbles: true, cancelable: true }));
}

function syncStickKeys() {
  const x = stick?.x ?? 0;
  const y = stick?.y ?? 0;
  press("d", x > KEY_AXIS);
  press("a", x < -KEY_AXIS);
  press("w", y > KEY_AXIS);
  press("s", y < -KEY_AXIS);
}

export function mountTouch(stage) {
  const body = document.body;
  const setTouch = (on) => body.classList.toggle("touch", on);
  setTouch(!!window.matchMedia?.("(pointer: coarse)").matches);
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") setTouch(true);
      else if (e.pointerType === "mouse") setTouch(false);
    },
    { capture: true, passive: true }
  );
  window.addEventListener("keydown", (e) => e.isTrusted && GAME_CODES.has(e.code) && setTouch(false), { capture: true });

  const pad = document.createElement("div");
  pad.className = "touch-pad";
  pad.setAttribute("aria-hidden", "true");
  pad.innerHTML = `
    <div class="stick-zone"><div class="stick-base"><div class="stick-knob"></div></div></div>
    <div class="jump-zone"><div class="jump-btn">JUMP</div></div>`;
  stage.appendChild(pad);
  const zone = pad.querySelector(".stick-zone");
  const base = pad.querySelector(".stick-base");
  const knob = pad.querySelector(".stick-knob");
  const jumpZone = pad.querySelector(".jump-zone");

  let stickId = null;
  let origin = null;
  const moveStick = (e) => {
    let dx = e.clientX - origin.x;
    let dy = e.clientY - origin.y;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx *= RADIUS / len;
      dy *= RADIUS / len;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const m = Math.min(1, len / RADIUS);
    if (m < DEAD) stick = null;
    else {
      const mag = Math.min(1, (m - DEAD) / (FULL - DEAD));
      stick = { x: (dx / len) * mag, y: (-dy / len) * mag };
    }
    syncStickKeys();
  };
  const releaseStick = () => {
    stickId = null;
    stick = null;
    zone.classList.remove("active");
    base.style.left = base.style.top = "";
    knob.style.transform = "";
    syncStickKeys();
  };
  zone.addEventListener("pointerdown", (e) => {
    if (stickId !== null) return;
    e.preventDefault();
    stickId = e.pointerId;
    zone.setPointerCapture?.(e.pointerId);
    const r = zone.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, RADIUS), r.width - RADIUS);
    const y = Math.min(Math.max(e.clientY - r.top, RADIUS), r.height - RADIUS);
    origin = { x: r.left + x, y: r.top + y };
    base.style.left = `${x}px`;
    base.style.top = `${y}px`;
    zone.classList.add("active");
    moveStick(e);
  });
  zone.addEventListener("pointermove", (e) => e.pointerId === stickId && moveStick(e));
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    zone.addEventListener(type, (e) => e.pointerId === stickId && releaseStick());
  }

  let jumpId = null;
  const releaseJump = () => {
    jumpId = null;
    jumpZone.classList.remove("active");
    press(" ", false);
  };
  jumpZone.addEventListener("pointerdown", (e) => {
    if (jumpId !== null) return;
    e.preventDefault();
    jumpId = e.pointerId;
    jumpZone.setPointerCapture?.(e.pointerId);
    jumpZone.classList.add("active");
    press(" ", true);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    jumpZone.addEventListener(type, (e) => e.pointerId === jumpId && releaseJump());
  }

  const releaseAll = () => {
    if (stickId !== null) releaseStick();
    if (jumpId !== null) releaseJump();
  };
  const app = document.getElementById("app");
  new MutationObserver(() => app.dataset.screen !== "run" && releaseAll()).observe(app, { attributes: true, attributeFilter: ["data-screen"] });
  window.addEventListener("blur", releaseAll);
  document.addEventListener("visibilitychange", () => document.hidden && releaseAll());

  mountRotatePrompt();
  mountFullscreen();
  trackMemoHeight(stage);
}

/** `--memo-h` on the stage: the compact layout ends the hub hall above the routing memo. */
function trackMemoHeight(stage) {
  const memo = document.getElementById("brief-panel");
  if (!memo) return;
  new ResizeObserver(() => {
    if (memo.offsetHeight) stage.style.setProperty("--memo-h", `${memo.offsetHeight}px`);
  }).observe(memo);
}

function mountRotatePrompt() {
  const ok = document.getElementById("rotate-ok");
  if (!ok) return;
  if (sessionStorage.getItem(PORTRAIT_OK)) document.body.classList.add("portrait-ok");
  ok.addEventListener("click", () => {
    document.body.classList.add("portrait-ok");
    sessionStorage.setItem(PORTRAIT_OK, "1");
  });
}

function mountFullscreen() {
  const ledger = document.getElementById("ledger");
  if (!ledger || !document.fullscreenEnabled) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "fs-btn";
  btn.title = "Fullscreen";
  btn.setAttribute("aria-label", "Toggle fullscreen");
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>`;
  btn.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen({ navigationUI: "hide" });
        await screen.orientation?.lock?.("landscape").catch(() => {});
      }
    } catch (err) {
      console.warn("Fullscreen unavailable:", err);
    }
  });
  ledger.insertBefore(btn, document.getElementById("audio-ctl"));
}
