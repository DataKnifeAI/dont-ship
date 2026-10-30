// Installable / offline support. Loaded from index.html as `js/pwa.js?v=<cache-bust version>`; the same
// version goes to the service worker (`sw.js?v=…`), which names its cache after it. `?sw=0` unregisters
// the worker and drops its caches (handy while developing).
//
// Also shows an Install button in the masthead when the browser offers an install prompt.
const VERSION = new URL(import.meta.url).searchParams.get("v") || "dev";
const params = new URLSearchParams(location.search);

performance.setResourceTimingBufferSize?.(1000);

if ("serviceWorker" in navigator) {
  if (params.get("sw") === "0") disable();
  else window.addEventListener("load", register, { once: true });
}

async function register() {
  try {
    await navigator.serviceWorker.register(`sw.js?v=${encodeURIComponent(VERSION)}`);
    const reg = await navigator.serviceWorker.ready;
    const send = () => {
      const urls = [location.href, ...performance.getEntriesByType("resource").map((e) => e.name)];
      reg.active?.postMessage({ type: "cache", urls });
    };
    send();
    document.addEventListener("visibilitychange", () => document.hidden && send());
  } catch (err) {
    console.warn("Service worker unavailable:", err);
  }
}

async function disable() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith("dont-ship-")).map((k) => caches.delete(k)));
  console.info("Service worker disabled; caches cleared.");
}

let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  installButton().hidden = false;
});
window.addEventListener("appinstalled", () => {
  installEvent = null;
  installButton().hidden = true;
});

let btn = null;
function installButton() {
  if (btn) return btn;
  btn = document.createElement("button");
  btn.type = "button";
  btn.className = "install-btn";
  btn.hidden = true;
  btn.title = "Install D.O.N.T. Ship";
  btn.textContent = "Install";
  btn.addEventListener("click", async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    installEvent = null;
    btn.hidden = true;
  });
  const ledger = document.getElementById("ledger");
  ledger?.insertBefore(btn, document.getElementById("audio-ctl"));
  return btn;
}
