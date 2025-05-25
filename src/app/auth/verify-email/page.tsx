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
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-3 group mb-6"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-forest-600 to-forest-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-forest-900 group-hover:text-forest-700 transition-colors">
              NutriMood
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-forest-900 mb-2">
            Verifikasi Email Anda
          </h1>
          <p className="text-sage-700">
            Kami telah mengirimkan link verifikasi ke email Anda
            {email && (
              <span className="font-semibold text-forest-700"> {email}</span>
            )}
            .
            <br />
            Silakan cek inbox atau folder spam untuk mengaktifkan akun Anda.
          </p>
        </div>
        <div className="flex flex-col items-center gap-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-8">
          <MailCheck className="w-16 h-16 text-forest-600 mb-2" />
          <p className="text-sage-700 text-center">
            Setelah verifikasi, Anda bisa login ke aplikasi NutriMood.
          </p>
          <Link
            href="/auth/login"
            className="w-full bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transition-all duration-300 text-center"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
