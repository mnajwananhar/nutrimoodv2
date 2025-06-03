import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Utensils,
  Heart,
  Check,
  Users,
  Grid3X3,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import NutritionDemo from "@/components/NutritionDemo";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 overflow-hidden bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50">
        <div className="absolute inset-0 bg-gradient-to-r from-forest-600/5 to-orange-600/5" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200">
              <Brain className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">AI Nutrisi & Mood</span>
              <span className="sm:hidden">AI Nutrisi & Mood</span>
            </div>
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-forest-900 leading-tight px-2">
              <span className="block">Temukan Makanan</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-sage-600">
                Sesuai Mood Anda
              </span>
            </h1>{" "}
            {/* Subtitle */}
            <p className="max-w-3xl mx-auto text-lg sm:text-xl md:text-2xl text-sage-700 leading-relaxed px-4">
              Dapatkan rekomendasi makanan Indonesia terbaik berdasarkan
              analisis AI dari mood yang ingin Anda rasakan.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              {" "}
              <Link
                href="/recommendations/assessment"
                className="group bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center w-full sm:w-auto justify-center"
              >
                <span className="hidden sm:inline">Mulai Analisis Mood</span>
                <span className="sm:hidden">Mulai Analisis</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/learn"
                className="group border-2 border-sage-300 text-sage-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-sage-50 transition-all duration-300 flex items-center w-full sm:w-auto justify-center"
              >
                <span className="hidden sm:inline">Pelajari Lebih Lanjut</span>
                <span className="sm:hidden">Pelajari</span>
                <Brain className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto pt-8 sm:pt-12 px-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-forest-700">
                  1,346
                </div>
                <div className="text-sm sm:text-base text-sage-600">
                  Makanan Indonesia
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                  4
                </div>
                <div className="text-sm sm:text-base text-sage-600">
                  Kategori Mood
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-beige-600">
                  AI
                </div>
                <div className="text-sm sm:text-base text-sage-600">
                  Model Prediksi
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="fitur"
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-white/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-forest-900 mb-4 sm:mb-6 px-2">
              Bagaimana Cara Kerjanya?
            </h2>{" "}
            <p className="text-lg sm:text-xl text-sage-700 max-w-3xl mx-auto px-4">
              NutriMood menggunakan teknologi AI untuk menganalisis mood yang
              Anda inginkan dan memberikan rekomendasi makanan Indonesia yang
              tepat untuk mencapai mood tersebut.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center group">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>{" "}
              <h3 className="text-xl sm:text-2xl font-bold text-forest-900 mb-3 sm:mb-4 px-2">
                1. Pilih Mood Anda
              </h3>
              <p className="text-sage-700 leading-relaxed px-4">
                Pilih mood yang ingin Anda rasakan hari ini: energizing,
                relaxing, focusing, atau neutral.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>{" "}
              <h3 className="text-xl sm:text-2xl font-bold text-forest-900 mb-3 sm:mb-4 px-2">
                2. AI Analisis Makanan
              </h3>
              <p className="text-sage-700 leading-relaxed px-4">
                Model AI kami menganalisis database makanan Indonesia untuk
                menemukan makanan yang cocok dengan mood yang Anda pilih.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-r from-sage-500 to-sage-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 sm:w-10 h-8 sm:h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-forest-900 mb-3 sm:mb-4 px-2">
                3. Rekomendasi Personal
              </h3>{" "}
              <p className="text-sage-700 leading-relaxed px-4">
                Dapatkan 5 makanan Indonesia terbaik yang sesuai dengan mood
                yang Anda inginkan dan kondisi kesehatan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section
        id="demo"
        className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-gradient-to-r from-forest-50 to-sage-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-forest-900 mb-4 sm:mb-6 px-2">
              Coba Sekarang Juga!
            </h2>
            <p className="text-lg sm:text-xl text-sage-700 px-4">
              Tidak perlu daftar. Langsung coba fitur utama NutriMood di bawah
              ini.
            </p>
          </div>{" "}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
              </div>
            }
          >
            <NutritionDemo />
          </Suspense>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-forest-900 mb-4 sm:mb-6 px-2">
              Fitur Utama NutriMood
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* AI Mood Prediction */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage-200 shadow-earth">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-forest-600 text-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <Brain className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 text-center">
                AI Mood Prediction
              </h3>
              <p className="text-sage-700 text-center text-sm sm:text-base">
                Model pembelajaran mesin canggih yang memprediksi mood Anda
                berdasarkan pola nutrisi dengan akurasi tinggi.
              </p>
            </div>
            {/* 1,346 Makanan Indonesia */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage-200 shadow-earth">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <Utensils className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 text-center">
                1,346 Makanan Indonesia
              </h3>
              <p className="text-sage-700 text-center text-sm sm:text-base">
                Database lengkap makanan tradisional Indonesia dengan informasi
                nutrisi detail dan resep autentik.
              </p>
            </div>
            {/* Analytics & Insights */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage-200 shadow-earth">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-sage-700 text-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <Check className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 text-center">
                Analytics & Insights
              </h3>
              <p className="text-sage-700 text-center text-sm sm:text-base">
                Lacak pola mood dan nutrisi Anda dari waktu ke waktu dengan
                visualisasi yang mudah dipahami.
              </p>
            </div>
            {/* Komunitas Aktif */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage-200 shadow-earth">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-orange-300 text-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <Users className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 text-center">
                Komunitas Aktif
              </h3>
              <p className="text-sage-700 text-center text-sm sm:text-base">
                Berbagi resep, tips kesehatan, dan cerita sukses dengan ribuan
                pengguna lainnya.
              </p>
            </div>
            {/* Kondisi Kesehatan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage-200 shadow-earth">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-forest-600 text-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <Heart className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 text-center">
                Kondisi Kesehatan
              </h3>
              <p className="text-sage-700 text-center text-sm sm:text-base">
                Rekomendasi disesuaikan dengan kondisi kesehatan seperti
                diabetes, hipertensi, atau diet khusus.
              </p>
            </div>
            {/* Dashboard */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-sage-200 shadow-earth">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto">
                <Grid3X3 className="w-6 sm:w-8 h-6 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 text-center">
                Dashboard
              </h3>
              <p className="text-sage-700 text-center text-sm sm:text-base">
                Pantau dan kelola data nutrisi serta mood Anda secara terpusat
                melalui dashboard interaktif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 bg-gradient-to-r from-forest-600 to-forest-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
            Mulai Hidup Sehat Hari Ini
          </h2>
          <p className="text-lg sm:text-xl text-forest-100 mb-8 sm:mb-10 leading-relaxed px-4">
            Bergabunglah dengan ribuan orang yang telah menemukan keseimbangan
            nutrisi dan mood yang tepat. Daftar gratis dan mulai perjalanan
            kesehatan Anda bersama NutriMood.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link
              href="/auth/signup"
              className="group bg-white text-forest-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              <span className="hidden sm:inline">Daftar Gratis Sekarang</span>
              <span className="sm:hidden">Daftar Sekarang</span>
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#demo"
              className="group border-2 border-forest-200 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-forest-500 transition-all duration-300 flex items-center justify-center"
            >
              Coba Tanpa Daftar
              <Brain className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer"
        className="bg-forest-900 text-forest-100 px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              NutriMood
            </h3>
            <p className="text-forest-200 max-w-xl text-sm sm:text-base px-4">
              NutriMood hadir sebagai sahabat nutrisi dan mood Anda. Kami
              percaya bahwa pola makan yang tepat dapat meningkatkan kualitas
              hidup, kebahagiaan, dan produktivitas masyarakat Indonesia.
            </p>
            <p className="text-forest-300 text-xs sm:text-sm max-w-xl px-4">
              Misi kami adalah membantu Anda menemukan keseimbangan nutrisi dan
              mood setiap hari, dengan teknologi AI yang mudah diakses siapa
              saja.
            </p>
            <div>
              <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                Ikuti Kami
              </h4>
              <div className="flex justify-center space-x-3 sm:space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <Facebook className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <Instagram className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <Twitter className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-forest-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
            <p className="text-forest-300 text-xs sm:text-sm px-4">
              © 2024 NutriMood. Dibuat dengan ❤️ untuk kesehatan masyarakat
              Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
