// Service Worker NutriMood: Hanya untuk menampilkan halaman offline jika offline
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
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
        // Jika offline, tampilkan halaman offline sederhana
        return new Response(
          `<!DOCTYPE html>
            <html>
            <head><title>Offline - NutriMood</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Anda Sedang Offline</h1>
              <p>Koneksi internet tidak tersedia. Silakan coba lagi nanti.</p>
              <button onclick="window.location.reload()">Coba Lagi</button>
            </body>
            </html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      })
    );
  }
  // Semua permintaan lain dilewatkan ke jaringan/browser tanpa cache
});
