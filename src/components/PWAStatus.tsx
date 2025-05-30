"use client";

import { Wifi, WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function PWAStatus() {
  const { isOnline, isInstalled } = usePWA();

  // Hanya render jika offline atau sudah terinstall
  if (isOnline && !isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="flex flex-col space-y-2">
        {/* Online/Offline Status */}
        <div
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
            isOnline
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
        {/* Installed Info */}
        {isInstalled && (
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium border border-green-200">
            App sudah terinstall di perangkat Anda
          </div>
        )}
      </div>
    </div>
  );
}
