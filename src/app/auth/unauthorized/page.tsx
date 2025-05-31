"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-sage-50 to-beige-50 flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-rose-400 to-rose-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-rose-700 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-sage-700 mb-4 text-sm sm:text-base">
            Anda harus login untuk mengakses halaman ini.
            <br />
            Silakan login terlebih dahulu untuk melanjutkan.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transition-all duration-300 text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Login Sekarang</span>
            <span className="sm:hidden">Login</span>
          </Link>
        </div>
        <Link
          href="/"
          className="text-sage-600 hover:text-sage-700 text-sm transition-colors"
        >
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
