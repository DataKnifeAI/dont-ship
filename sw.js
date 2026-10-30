// Offline cache for D.O.N.T. Ship. Network first, so online players always get the deployed build and the
// cache is only the fallback when the network fails (or a navigation stalls past NAV_TIMEOUT).
// One cache per cache-bust version: js/pwa.js registers `sw.js?v=<version from index.html>`, so bumping
// the `?v=` suffix installs a new worker with a fresh cache and the old caches are deleted on activate.
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PREFIX = "dont-ship-";
const CACHE = PREFIX + VERSION;
const NAV_TIMEOUT = 4000;
/** Fetched on install; everything else the page loads is added by the page's "cache" message or on fetch. */
const SHELL = [
  "./",
  "manifest.webmanifest",
  `css/style.css?v=${VERSION}`,
  `js/main.js?v=${VERSION}`,
  `js/pwa.js?v=${VERSION}`,
  "vendor/three.module.js",
  "data/manifests.json",
  "data/rooms.json",
  "assets/icons/icon-192.png",
  "assets/icons/apple-touch-icon.png",
  "assets/brand/fen-wolf-logo.jpg",
  "assets/brand/fen-wolf-icon-from-herographic.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** The page posts every same-origin URL it has loaded so the first visit is fully cached too. */
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls.filter(cacheable).map(async (url) => {
          if (await cache.match(url)) return;
          try {
            const res = await fetch(url);
            if (res.ok) await cache.put(url, res);
          } catch {
            /* offline or gone: the fetch handler will try again later */
          }
        })
      )
    )
  );
});

function cacheable(url) {
  const u = new URL(url, self.location.href);
  return u.origin === self.location.origin && !u.pathname.endsWith("/sw.js");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !cacheable(req.url) || req.headers.has("range")) return;
  event.respondWith(networkFirst(req, event));
});

/** Navigations to the game page (any query string) share one cache entry: the app shell `./`. */
function isShell(req) {
  if (req.mode !== "navigate") return false;
  const path = new URL(req.url).pathname;
  const root = new URL("./", self.location.href).pathname;
  return path === root || path === root + "index.html";
}

async function networkFirst(req, event) {
  const cache = await caches.open(CACHE);
  const nav = isShell(req);
  const network = fetch(req).then((res) => {
    if (res.ok && res.type === "basic") {
      const copy = res.clone();
      event.waitUntil(cache.put(nav ? "./" : req, copy));
    }
    return res;
  });
  network.catch(() => {});
  try {
    if (!nav) return await network;
    const cached = await cache.match("./");
    if (!cached) return await network;
    const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NAV_TIMEOUT));
    return await Promise.race([network, timeout]);
  } catch (err) {
    const hit = nav ? await cache.match("./") : (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) return hit;
    throw err;
  }
}
