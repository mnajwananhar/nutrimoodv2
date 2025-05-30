// Service Worker NutriMood: Hanya untuk menampilkan halaman offline jika offline
const OFFLINE_URL = "/offline";

self.addEventListener("install", () => {
  // Langsung aktif tanpa cache
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Langsung klaim client
  event.waitUntil(self.clients.claim());
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
