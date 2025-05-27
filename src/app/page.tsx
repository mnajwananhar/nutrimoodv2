import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Utensils, Heart } from "lucide-react";
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
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-sage-600 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 17l6-6 4 4 8-8"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Analytics & Insights
              </h3>
              <p className="text-sage-700 text-center">
                Lacak pola mood dan nutrisi Anda dari waktu ke waktu dengan
                visualisasi yang mudah dipahami.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-orange-300 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m13-3.13a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm-8 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Komunitas Aktif
              </h3>
              <p className="text-sage-700 text-center">
                Berbagi resep, tips kesehatan, dan cerita sukses dengan ribuan
                pengguna lainnya.
              </p>
            </div>
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
            <div className="bg-white rounded-2xl p-8 border border-sage-200 shadow-earth">
              <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-2 text-center">
                Review & Rating
              </h3>
              <p className="text-sage-700 text-center">
                Sistem review makanan dari komunitas untuk membantu Anda memilih
                yang terbaik.
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 320 512"
                    className="w-6 h-6 text-white"
                  >
                    <path
                      fill="currentColor"
                      d="M279.14 288l14.22-92.66h-88.91V127.89c0-25.35 12.42-50.06 52.24-50.06H293V6.26S259.5 0 225.36 0c-73.22 0-121 44.38-121 124.72v70.62H22.89V288h81.47v224h100.2V288z"
                    />
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17" cy="7" r="1.5" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-forest-700 rounded-lg flex items-center justify-center hover:bg-forest-600 transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.29 20.251c7.547 0 11.675-6.155 11.675-11.495 0-.175 0-.349-.012-.522A8.18 8.18 0 0 0 22 5.92a8.19 8.19 0 0 1-2.357.637 4.118 4.118 0 0 0 1.804-2.27 8.224 8.224 0 0 1-2.605.977A4.107 4.107 0 0 0 16.616 4c-2.266 0-4.104 1.828-4.104 4.084 0 .32.036.634.105.934C8.728 8.87 5.8 7.13 3.671 4.149a4.073 4.073 0 0 0-.555 2.052c0 1.42.725 2.675 1.825 3.411a4.093 4.093 0 0 1-1.858-.512v.052c0 1.984 1.417 3.637 3.293 4.017a4.1 4.1 0 0 1-1.853.07c.522 1.623 2.037 2.805 3.833 2.836A8.233 8.233 0 0 1 2 18.407a11.616 11.616 0 0 0 6.29 1.84"
                    />
                  </svg>
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
