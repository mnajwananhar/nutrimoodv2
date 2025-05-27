"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface AuthButtonsProps {
  className?: string;
  mobile?: boolean;
}

export default function AuthButtons({
  className = "",
  mobile = false,
}: AuthButtonsProps) {
  const { user, isAuthLoading } = useAuth();

  // Show buttons immediately, even while loading
  if (isAuthLoading || !user) {
    if (mobile) {
      return (
        <div className={`space-y-2 ${className}`}>
          <Link
            href="/auth/login"
            className="block w-full text-center px-4 py-3 text-sage-700 hover:text-forest-700 font-medium transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full text-center bg-gradient-to-r from-forest-600 to-forest-700 text-white px-4 py-3 rounded-lg font-medium shadow-sm"
          >
            Daftar Gratis
          </Link>
        </div>
      );
    }

    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <Link
          href="/auth/login"
          className="text-sage-700 hover:text-forest-700 font-medium transition-colors"
        >
          Masuk
        </Link>
        <Link
          href="/auth/signup"
          className="bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Daftar Gratis
        </Link>
      </div>
    );
  }

  // Return null if user is logged in (let parent handle user menu)
  return null;
}
