import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import PWAStatus from "@/components/PWAStatus";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#369957",
};

export const metadata: Metadata = {
  title: "NutriMood - AI Food Recommendations Based on Your Nutrition & Mood",
  description:
    "Dapatkan rekomendasi makanan Indonesia terbaik berdasarkan analisis AI dari tingkat nutrisi dan mood Anda. 100% Gratis selamanya!",
  keywords:
    "nutrisi, mood, makanan indonesia, AI, kesehatan, rekomendasi makanan",
  authors: [{ name: "NutriMood Team" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "NutriMood - Temukan Makanan Sesuai Mood Anda",
    description:
      "Platform AI untuk rekomendasi makanan Indonesia berdasarkan nutrisi dan mood. Gratis untuk semua!",
    type: "website",
    locale: "id_ID",
    siteName: "NutriMood",
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriMood - Temukan Makanan Sesuai Mood Anda",
    description:
      "Platform AI untuk rekomendasi makanan Indonesia berdasarkan nutrisi dan mood. Gratis untuk semua!",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "your-google-verification-code",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriMood",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NutriMood" />
        <meta name="msapplication-TileColor" content="#369957" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-16x16.png"
        />
      </head>
      <body className={inter.className}>
        <AuthErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              {" "}
              <div className="min-h-screen ">
                <Navbar />
                <main>{children}</main> <PWAStatus />
                <OfflineIndicator /> <PWAInstallBanner />
              </div>
            </ToastProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
