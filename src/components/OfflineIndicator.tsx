"use client";

import { useState, useEffect } from "react";
import { WifiOff, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflineIndicator() {
  const [showDetails, setShowDetails] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const router = useRouter();
  // Enhanced offline detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);

      // If we're offline and not already on offline page, redirect
      if (!online && window.location.pathname !== "/offline") {
        router.push("/offline");
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
  }, [router]);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className="bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm cursor-pointer transition-all duration-300 border-red-500"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-red-100">
            <WifiOff className="w-5 h-5 text-red-600" />
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Anda Offline</h4>
            <p className="text-sm text-gray-600">Beberapa fitur terbatas</p>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2 text-amber-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  Aplikasi akan kembali normal ketika koneksi internet tersedia.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
