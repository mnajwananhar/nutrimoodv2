import Link from "next/link";
import { WifiOff, Home, Book, History, Calculator, Heart } from "lucide-react";
import RetryButton from "@/components/RetryButton";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <WifiOff className="w-16 h-16 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-forest-900 mb-4">
            Mode Offline
          </h1>

          <p className="text-xl text-sage-700 mb-8">
            Anda sedang offline, tapi masih bisa menggunakan beberapa fitur
            NutriMood! Data yang Anda input akan tersimpan dan disinkronkan
            otomatis ketika koneksi kembali.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <RetryButton className="w-full bg-forest-600 text-white px-6 py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-forest-700 transition-colors shadow-lg" />

          <Link
            href="/"
            className="w-full border-2 border-forest-300 text-forest-700 px-6 py-4 rounded-xl font-semibold flex items-center justify-center hover:bg-forest-50 transition-colors shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Offline Features */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-sage-200 mb-8">
          <h3 className="text-2xl font-bold text-forest-900 mb-6 flex items-center justify-center">
            <Heart className="w-6 h-6 mr-2 text-red-500" />
            Fitur yang Tersedia Offline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl">
              <History className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-green-900 mb-1">
                  Riwayat Tersimpan
                </h4>
                <p className="text-green-700 text-sm">
                  Lihat analisis nutrisi dan mood yang sudah tersimpan
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-xl">
              <Book className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Artikel Edukasi
                </h4>
                <p className="text-blue-700 text-sm">
                  Baca artikel kesehatan yang sudah dimuat sebelumnya
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-purple-50 rounded-xl">
              <Calculator className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-purple-900 mb-1">
                  Input Data
                </h4>
                <p className="text-purple-700 text-sm">
                  Catat konsumsi makanan untuk disinkronkan nanti
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-xl">
              <Heart className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-orange-900 mb-1">Mode PWA</h4>
                <p className="text-orange-700 text-sm">
                  Aplikasi tetap berjalan seperti aplikasi mobile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse mr-3"></div>
            <h4 className="text-lg font-semibold text-amber-900">
              Sinkronisasi Otomatis
            </h4>
          </div>
          <p className="text-amber-800 text-sm leading-relaxed">
            Semua data yang Anda input saat offline akan otomatis
            tersinkronisasi ke server begitu koneksi internet kembali tersedia.
            Tidak ada data yang akan hilang!
          </p>
        </div>
      </div>
    </main>
  );
}
