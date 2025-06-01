// Service Worker NutriMood: Hanya untuk menampilkan halaman offline jika offline
const CACHE_NAME = "nutrimood-v1.2.0";
const OFFLINE_URL = "/offline";

self.addEventListener("install", () => {
  // Langsung aktif tanpa cache dan force update
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Langsung klaim client dan clear old cache
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Hanya intercept permintaan navigasi (page load)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Jika offline, redirect ke halaman offline yang sudah dibuat
        return Response.redirect(OFFLINE_URL, 302);
      })
    );
  }
  // Semua permintaan lain dilewatkan ke jaringan/browser tanpa cache
});
