/**
 * Service Worker for JSB Mobile Truck and Trailer Repair PWA
 * Version: 1.0.0
 */

const CACHE_NAME = "jsb-cache-v1";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./services.html",
  "./contact.html",
  "./legal.html",
  "./css/styles.css",
  "./js/main.js",
  "./manifest.json",
  "./images/jsb-logo.webp",
  "./images/jsb-logo.png",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/icon-maskable-512.png",
  "./images/apple-touch-icon.png",
  "./images/hero-truck.webp",
  "./images/mobile-repair.webp",
  "./images/heavy-equipment.webp",
  "./images/diagnostics.webp",
  "./images/fleet-yard.webp",
  "./images/travel-trailer.webp",
  "./images/project-alignment.webp",
  "./images/project-engine.webp",
  "./images/project-hub.webp",
  "./images/cta-night.webp",
  "./images/mechanic-work.webp"
];

// Install: Pre-cache static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up previous caches and take immediate control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET requests with HTTP/HTTPS
  if (req.method !== "GET" || !req.url.startsWith("http")) {
    return;
  }

  // HTML page navigation: Network first, fallback to cache, fallback to index.html
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.ok) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) return cachedRes;
          return caches.match("./index.html");
        })
    );
    return;
  }

  // Static assets (images, CSS, JS, fonts): Cache first, fallback to network and update cache
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) {
        // Optional revalidation in background
        fetch(req).then((networkRes) => {
          if (networkRes && networkRes.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
          }
        }).catch(() => {});
        return cachedRes;
      }

      return fetch(req).then((networkRes) => {
        if (!networkRes || networkRes.status !== 200 || networkRes.type !== "basic") {
          return networkRes;
        }
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return networkRes;
      });
    })
  );
});
