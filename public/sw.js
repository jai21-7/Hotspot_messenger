// Service worker — caches the app shell so the UI loads fast (and partly offline)
const CACHE_NAME = "hotspot-messenger-v4";
const SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/connection.js",
  "/native.js",
  "/mobile.js",
  "/crypto.js",
  "/themes.js",
  "/pwa.js",
  "/vendor/socket.io.min.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) {
          return k !== CACHE_NAME;
        }).map(function (k) {
          return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const url = new URL(event.request.url);

  // Never cache API, uploads, or Socket.io — always use network
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/uploads/") ||
    url.pathname.startsWith("/socket.io/")
  ) {
    return;
  }

  // App shell: cache first, then network
  if (event.request.method === "GET") {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        return (
          cached ||
          fetch(event.request).then(function (response) {
            return response;
          })
        );
      })
    );
  }
});
