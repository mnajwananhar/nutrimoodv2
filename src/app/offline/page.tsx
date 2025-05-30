import Link from "next/link";
import { WifiOff, Home, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <WifiOff className="w-12 h-12 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-forest-900 mb-4">
          Anda Sedang Offline
        </h1>

        {/* Description */}
        <p className="text-sage-700 mb-8 leading-relaxed">
          Koneksi internet tidak tersedia. Silakan periksa koneksi Anda dan coba
          lagi.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-forest-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center hover:bg-forest-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Coba Lagi
          </button>

          <Link
            href="/"
            className="w-full border-2 border-sage-300 text-sage-700 px-6 py-3 rounded-xl font-semibold flex items-center justify-center hover:bg-sage-50 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
