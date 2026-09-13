const CACHE_NAME = "orbital-cleanup-v0.15.5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./update.html",
  "./styles.css",
  "./styles.css?v=0.15.5",
  "./src/contracts.js",
  "./src/contracts.js?v=0.15.5",
  "./src/game.js",
  "./src/game.js?v=0.15.5",
  "./src/input.js",
  "./src/input.js?v=0.15.5",
  "./src/art.js",
  "./src/art.js?v=0.15.5",
  "./src/art/sprites.png",
  "./src/art/contracts.png",
  "./src/art/tool-crate.png",
  "./src/art/rocket-fragment.png",
  "./src/art/survey-capsule.png",
  "./src/art/earth.png",
  "./src/art/lunar/moon-background.png",
  "./src/art/lunar/rover-wheel.png",
  "./src/art/lunar/oxygen-tank.png",
  "./src/art/lunar/instrument-package.png",
  "./src/art/lunar/lander-leg.png",
  "./src/art/lunar/rover-chassis.png",
  "./src/levels.js",
  "./src/levels.js?v=0.15.5",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // Release-specific URLs bypass stale HTTP/CDN entries. Store canonical keys
    // only after every required file has downloaded successfully.
    const responses = await Promise.all(APP_SHELL.map(async path => {
      const url = new URL(path, self.registration.scope);
      url.searchParams.set('build', CACHE_NAME);
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error(`Cannot cache ${path}`);
      return response;
    }));
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map((path, index) => cache.put(path, responses[index])));
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("orbital-cleanup-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // The standalone recovery page must not be trapped behind an old cached copy.
  if (new URL(event.request.url).pathname.endsWith('/update.html')) {
    event.respondWith(fetch(event.request, { cache: 'reload' }).catch(() => caches.match('./update.html')));
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then((cached) => cached || fetch(event.request).then((response) => {
      if (!response || response.status !== 200 || response.type === "opaque") return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => {
      if (event.request.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    }))
  );
});
