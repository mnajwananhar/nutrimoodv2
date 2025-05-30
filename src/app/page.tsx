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
    <main className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50">
      {/* Hero Section */}
      <section className="relative px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-forest-600/5 to-orange-600/5" />

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200">
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Nutrition & Mood Analysis
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-forest-900 leading-tight">
              Temukan Makanan
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-sage-600">
                Sesuai Mood Anda
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-sage-700 leading-relaxed">
              Dapatkan rekomendasi makanan Indonesia terbaik berdasarkan
              analisis AI dari tingkat nutrisi dan mood Anda.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/recommendations/assessment"
                className="group bg-gradient-to-r from-forest-600 to-forest-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center"
              >
                Mulai Analisis Nutrisi
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/learn"
                className="group border-2 border-sage-300 text-sage-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-sage-50 transition-all duration-300 flex items-center"
              >
                Pelajari Lebih Lanjut
                <Brain className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-forest-700">1,346</div>
                <div className="text-sage-600">Makanan Indonesia</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">4</div>
                <div className="text-sage-600">Kategori Mood</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-beige-600">AI</div>
                <div className="text-sage-600">Model Prediksi</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="fitur" className="px-4 py-20 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Bagaimana Cara Kerjanya?
            </h2>
            <p className="text-xl text-sage-700 max-w-3xl mx-auto">
              NutriMood menggunakan teknologi AI untuk menganalisis pola nutrisi
              Anda dan memprediksi mood, kemudian memberikan rekomendasi makanan
              Indonesia yang tepat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Utensils className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-forest-900 mb-4">
                1. Input Nutrisi Anda
              </h3>
              <p className="text-sage-700 leading-relaxed">
                Masukkan level kalori, protein, lemak, dan karbohidrat yang Anda
                konsumsi hari ini dengan skala sederhana.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-forest-900 mb-4">
                2. AI Prediksi Mood
              </h3>
              <p className="text-sage-700 leading-relaxed">
                Model AI kami menganalisis pola nutrisi Anda untuk memprediksi
                mood (energizing, calming, focusing, dll).
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-sage-500 to-sage-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-forest-900 mb-4">
                3. Rekomendasi Personal
              </h3>
              <p className="text-sage-700 leading-relaxed">
                Dapatkan 5 makanan Indonesia terbaik yang sesuai dengan mood dan
                kebutuhan nutrisi Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section
        id="demo"
        className="px-4 py-20 bg-gradient-to-r from-forest-50 to-sage-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Coba Sekarang Juga!
            </h2>
            <p className="text-xl text-sage-700">
              Tidak perlu daftar. Langsung coba fitur utama NutriMood di bawah
              ini.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
              </div>
            }
          >
            <NutritionDemo />
          </Suspense>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-forest-900 mb-6">
              Fitur Utama NutriMood
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Mood Prediction */}
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-forest-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Brain className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                AI Mood Prediction
              </h3>
              <p className="text-sage-700 text-center">
                Model pembelajaran mesin canggih yang memprediksi mood Anda
                berdasarkan pola nutrisi dengan akurasi tinggi.
              </p>
            </div>
            {/* 1,346 Makanan Indonesia */}
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                1,346 Makanan Indonesia
              </h3>
              <p className="text-sage-700 text-center">
                Database lengkap makanan tradisional Indonesia dengan informasi
                nutrisi detail dan resep autentik.
              </p>
            </div>
            {/* Analytics & Insights */}
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-sage-700 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Analytics & Insights
              </h3>
              <p className="text-sage-700 text-center">
                Lacak pola mood dan nutrisi Anda dari waktu ke waktu dengan
                visualisasi yang mudah dipahami.
              </p>
            </div>
            {/* Komunitas Aktif */}
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-orange-300 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Komunitas Aktif
              </h3>
              <p className="text-sage-700 text-center">
                Berbagi resep, tips kesehatan, dan cerita sukses dengan ribuan
                pengguna lainnya.
              </p>
            </div>
            {/* Kondisi Kesehatan */}
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-forest-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Kondisi Kesehatan
              </h3>
              <p className="text-sage-700 text-center">
                Rekomendasi disesuaikan dengan kondisi kesehatan seperti
                diabetes, hipertensi, atau diet khusus.
              </p>
            </div>
            {/* Dashboard */}
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Grid3X3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Dashboard
              </h3>
              <p className="text-sage-700 text-center">
                Pantau dan kelola data nutrisi serta mood Anda secara terpusat
                melalui dashboard interaktif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gradient-to-r from-forest-600 to-forest-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Mulai Hidup Sehat Hari Ini
          </h2>
          <p className="text-xl text-forest-100 mb-10 leading-relaxed">
            Bergabunglah dengan ribuan orang yang telah menemukan keseimbangan
            nutrisi dan mood yang tepat. Daftar gratis dan mulai perjalanan
            kesehatan Anda bersama NutriMood.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="group bg-white text-forest-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              Daftar Gratis Sekarang
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#demo"
              className="group border-2 border-forest-200 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-forest-500 transition-all duration-300 flex items-center justify-center"
            >
              Coba Tanpa Daftar
              <Brain className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-forest-900 text-forest-100 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6">
            <h3 className="text-2xl font-bold text-white">NutriMood</h3>
            <p className="text-forest-200 max-w-xl">
              NutriMood hadir sebagai sahabat nutrisi dan mood Anda. Kami
              percaya bahwa pola makan yang tepat dapat meningkatkan kualitas
              hidup, kebahagiaan, dan produktivitas masyarakat Indonesia.
            </p>
            <p className="text-forest-300 text-sm max-w-xl">
              Misi kami adalah membantu Anda menemukan keseimbangan nutrisi dan
              mood setiap hari, dengan teknologi AI yang mudah diakses siapa
              saja.
            </p>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Ikuti Kami
              </h4>
              <div className="flex justify-center space-x-4">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <Facebook className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <Instagram className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <Twitter className="w-6 h-6 text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-forest-700 mt-12 pt-8 text-center">
            <p className="text-forest-300">
              © 2024 NutriMood. Dibuat dengan ❤️ untuk kesehatan masyarakat
              Indonesia.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
