"use client";

import { Wifi, WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useState, useEffect } from "react";

export default function PWAStatus() {
  const { isOnline, isInstalled } = usePWA();
  const [showOfflineStatus, setShowOfflineStatus] = useState(false);
  const [showInstalledStatus, setShowInstalledStatus] = useState(false);
  const [justWentOnline, setJustWentOnline] = useState(false);

  useEffect(() => {
    // Show offline status immediately when offline
    if (!isOnline) {
      setShowOfflineStatus(true);
      setJustWentOnline(false);
    } else {
      // When back online, show "back online" message briefly
      if (showOfflineStatus) {
        setJustWentOnline(true);
        setTimeout(() => {
          setJustWentOnline(false);
        }, 3000);
      }
      setShowOfflineStatus(false);
    }
  }, [isOnline, showOfflineStatus]);

  useEffect(() => {
    // Show installed status briefly when app is first detected as installed
    if (isInstalled && !showInstalledStatus) {
      setShowInstalledStatus(true);
      setTimeout(() => {
        setShowInstalledStatus(false);
      }, 5000);
    }
  }, [isInstalled, showInstalledStatus]);

  // Only show in development mode for debugging
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Don't show anything if nothing needs to be displayed
  if (!showOfflineStatus && !showInstalledStatus && !justWentOnline && !isDevelopment) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="flex flex-col space-y-2">
        {/* Offline Status - only when offline */}
        {showOfflineStatus && (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </div>
        )}
        
        {/* Back Online Status - briefly when back online */}
        {justWentOnline && (
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <Wifi className="w-4 h-4" />
            <span>Kembali Online</span>
          </div>
        )}
        
        {/* Installed Status - briefly when first installed */}
        {showInstalledStatus && (
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium border border-green-200">
            App berhasil diinstall!
          </div>
        )}
        
        {/* Development mode indicator */}
        {isDevelopment && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-xs font-medium border border-yellow-200 opacity-75">
            DEV: {isOnline ? "Online" : "Offline"} | {isInstalled ? "Installed" : "Not Installed"}
          </div>
        )}
      </div>
    </div>
  );
}
