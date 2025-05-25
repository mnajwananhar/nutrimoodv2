"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-sage-50 to-beige-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-rose-400 to-rose-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-rose-700 mb-2">
            Akses Ditolak
          </h1>
          <p className="text-sage-700 mb-4">
            Anda harus login untuk mengakses halaman ini.
            <br />
            Silakan login terlebih dahulu untuk melanjutkan.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transition-all duration-300"
          >
            Login Sekarang
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
