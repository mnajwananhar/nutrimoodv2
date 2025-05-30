"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, showInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show banner after 10 seconds if installable
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled) {
        const hasSeenBanner = localStorage.getItem("pwa-banner-seen");
        if (!hasSeenBanner) {
          setIsVisible(true);
        }
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setIsAnimating(true);
    try {
      await showInstallPrompt();
      handleClose();
    } catch (error) {
      console.error("Install failed:", error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-banner-seen", "true");
  };

  const handleLater = () => {
    setIsVisible(false);
    // Show again after 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    localStorage.setItem("pwa-banner-next-show", tomorrow.toISOString());
  };

  if (!isVisible || !isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-forest-600 to-forest-700 text-white shadow-lg animate-slide-down">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-base md:text-lg">
                Install NutriMood App
              </div>
              <div className="text-white/90 text-xs md:text-sm">
                Akses lebih cepat, bekerja offline, dan dapatkan notifikasi
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleInstall}
              disabled={isAnimating}
              className="bg-white text-forest-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Download
                className={`w-4 h-4 ${isAnimating ? "animate-bounce" : ""}`}
              />
              <span>{isAnimating ? "Installing..." : "Install"}</span>
            </button>

            <button
              onClick={handleLater}
              className="text-forest-100 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Later
            </button>

            <button
              onClick={handleClose}
              className="text-forest-200 hover:text-white p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
