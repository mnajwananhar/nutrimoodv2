"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi, AlertTriangle, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const updateOnlineStatus = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      setShowBanner(offline); // Langsung set false jika online
      if (offline) {
        console.log("Device is offline");
      } else {
        console.log("Device is online");
      }
    };

    // Initial check
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Test connection with a simple fetch
      await fetch("/manifest.json", {
        cache: "no-cache",
        mode: "no-cors",
      });
      // If successful, reload the page
      window.location.reload();
    } catch {
      console.log("Still offline");
      setIsRetrying(false);
    }
  };

  const goToOfflinePage = () => {
    router.push("/offline");
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOffline ? "bg-red-600" : "bg-green-600"
      } text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {isOffline ? (
                <WifiOff className="w-5 h-5" />
              ) : (
                <Wifi className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1">
              <p className="font-medium">
                {isOffline
                  ? "Anda sedang offline"
                  : "Koneksi kembali tersedia!"}
              </p>
              <p className="text-sm opacity-90">
                {isOffline
                  ? "Beberapa fitur mungkin tidak tersedia"
                  : "Semua fitur sudah dapat digunakan kembali"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isOffline && (
              <>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
                  />
                  <span>{isRetrying ? "Mencoba..." : "Coba Lagi"}</span>
                </button>

                <button
                  onClick={goToOfflinePage}
                  className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Mode Offline</span>
                </button>
              </>
            )}{" "}
            <button
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-white/20 rounded-md transition-colors"
              aria-label="Tutup"
            >
              <span className="sr-only">Tutup</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
