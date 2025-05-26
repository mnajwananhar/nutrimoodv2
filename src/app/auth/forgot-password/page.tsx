"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        error("Gagal Mengirim Email", resetError.message);
      } else {
        success(
          "Email Terkirim",
          "Silakan cek email Anda untuk instruksi reset password."
        );
        // router.push("/auth/login"); // opsional redirect
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
            Lupa Password
          </h1>
          <p className="text-sage-700">
            Masukkan email yang terdaftar untuk reset password Anda.
          </p>
        </div>
        {/* Forgot Password Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-forest-900 mb-2"
              >
                Email
              </label>
              <div className="relative">
                {" "}
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 transition-colors text-sage-900 placeholder-sage-400"
                  placeholder="nama@email.com"
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
                  Mengirim...
                </>
              ) : (
                "Kirim Instruksi Reset Password"
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
