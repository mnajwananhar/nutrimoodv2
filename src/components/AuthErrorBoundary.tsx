'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <Brain className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-forest-900 mb-2">
              Terjadi Kesalahan Autentikasi
            </h2>
            <p className="text-sage-600 mb-6">
              Silakan refresh halaman atau login ulang
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-forest-600 text-white px-6 py-3 rounded-lg hover:bg-forest-700 transition-colors"
              >
                Refresh Halaman
              </button>
              <Link
                href="/auth/login"
                className="bg-sage-600 text-white px-6 py-3 rounded-lg hover:bg-sage-700 transition-colors inline-block"
              >
                Login Ulang
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
