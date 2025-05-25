"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, Brain } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      error("Password tidak cocok", "Pastikan kedua password sama persis.");
      return;
    }
    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        error("Gagal Reset Password", updateError.message);
      } else {
        success(
          "Password Berhasil Diubah",
          "Silakan login dengan password baru."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch {
      error("Terjadi Kesalahan", "Silakan coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

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
            Reset Password Baru
          </h1>
          <p className="text-sage-700">
            Silakan masukkan password baru Anda di bawah ini.
          </p>
        </div>
        {/* Reset Password Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-forest-900 mb-2"
              >
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
                  placeholder="Password baru"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-forest-900 mb-2"
              >
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </button>
          </form>
        </div>
        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            href="/auth/login"
            className="text-forest-600 hover:text-forest-700 text-sm font-semibold transition-colors"
          >
            ← Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}
