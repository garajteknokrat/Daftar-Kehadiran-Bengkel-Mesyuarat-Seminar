const CACHE_NAME = "kehadiran-upkv-v2";
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

// HTML/halaman: NETWORK-FIRST — sentiasa cuba dapatkan versi terkini dari
// server dahulu (supaya sebarang update kod terus nampak), cache cuma
// fallback bila offline. Fail statik (gambar, manifest): cache-first
// seperti biasa untuk laju & jimat data.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("script.google.com")) return; // jangan cache data live

  const isHtmlPage = event.request.mode === "navigate" || event.request.destination === "document";
  if (isHtmlPage) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
