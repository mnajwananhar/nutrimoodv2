"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, Brain } from "lucide-react";
import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center py-8 sm:py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 sm:space-x-3 group mb-4 sm:mb-6"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-forest-600 to-forest-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-forest-900 group-hover:text-forest-700 transition-colors">
              NutriMood
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-forest-900 mb-2">
            Verifikasi Email Anda
          </h1>
          <p className="text-sage-700 text-sm sm:text-base">
            Kami telah mengirimkan link verifikasi ke email Anda
            {email && (
              <span className="font-semibold text-forest-700"> {email}</span>
            )}
            .
            <br />
            Silakan cek inbox atau folder spam untuk mengaktifkan akun Anda.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:gap-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-6 sm:p-8">
          <MailCheck className="w-12 h-12 sm:w-16 sm:h-16 text-forest-600 mb-1 sm:mb-2" />
          <p className="text-sage-700 text-center text-sm sm:text-base">
            Setelah verifikasi, Anda bisa login ke aplikasi NutriMood.
          </p>
          <Link
            href="/auth/login"
            className="w-full bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transition-all duration-300 text-center text-sm sm:text-base"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
