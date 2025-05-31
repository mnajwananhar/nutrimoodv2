"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, Brain, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";
import { AuthSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const { isAuthLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = () => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6)
      return { strength: 1, label: "Lemah", color: "bg-red-500" };
    if (password.length < 8)
      return { strength: 2, label: "Sedang", color: "bg-yellow-500" };
    if (
      password.length >= 8 &&
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    ) {
      return { strength: 3, label: "Kuat", color: "bg-green-500" };
    }
    return { strength: 2, label: "Sedang", color: "bg-yellow-500" };
  };

  const passwordStrength = getPasswordStrength();

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
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center py-8 sm:py-12 px-4">
        <AuthSkeleton />
      </div>
    );
  }

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
            Reset Password Baru
          </h1>
          <p className="text-sage-700 text-sm sm:text-base">
            Silakan masukkan password baru Anda di bawah ini.
          </p>
        </div>
        {/* Reset Password Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-forest-900 mb-2"
              >
                Password Baru
              </label>
              <div className="relative">
                {" "}
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors text-sage-900 placeholder-sage-400 text-sm sm:text-base"
                  placeholder="Password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-sage-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.strength / 3) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-sage-600">
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-forest-900 mb-2"
              >
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors text-sage-900 placeholder-sage-400 text-sm sm:text-base"
                  placeholder="Ulangi password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="hidden sm:inline">Menyimpan...</span>
                  <span className="sm:hidden">Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Simpan Password Baru</span>
                  <span className="sm:hidden">Simpan Password</span>
                </>
              )}
            </button>
          </form>
        </div>
        {/* Back to Login */}
        <div className="text-center mt-4 sm:mt-6">
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
