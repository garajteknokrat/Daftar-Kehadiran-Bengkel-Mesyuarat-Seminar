const CACHE_NAME = "kehadiran-upkv-v1";
const SHELL_FILES = [
  "index.html",
  "kursus.html",
  "checkin.html",
  "style.css",
  "app.js",
  "manifest.json",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/sijil-template.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first untuk data API (Apps Script), cache-first untuk fail statik.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("script.google.com")) return; // jangan cache data live
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
