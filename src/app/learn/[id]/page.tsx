"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Utensils,
  Heart,
  Clock,
  FileText,
  Target,
  Lightbulb,
} from "lucide-react";

const categories = [
  { key: "all", label: "Semua", icon: BookOpen },
  { key: "nutrition-basics", label: "Dasar Nutrisi", icon: Utensils },
  { key: "mood-food", label: "Mood & Makanan", icon: Brain },
  { key: "indonesian-foods", label: "Makanan Indonesia", icon: Heart },
  { key: "health-tips", label: "Tips Kesehatan", icon: Target },
  { key: "myths-facts", label: "Mitos vs Fakta", icon: Lightbulb },
];

const featuredArticles = [
  {
    id: "1",
    title: "Apa itu Kalori dan Mengapa Penting?",
    slug: "apa-itu-kalori-dan-mengapa-penting",
    excerpt:
      "Memahami kalori sebagai unit energi dan bagaimana menghitung kebutuhan kalori harian Anda.",
    category: "nutrition-basics",
    reading_time: 5,
    views: 1250,
    likes: 89,
    is_featured: true,
    published_at: "2024-01-15",
  },
  {
    id: "2",
    title: "Makanan untuk Meningkatkan Energi",
    slug: "makanan-untuk-meningkatkan-energi",
    excerpt:
      "Daftar makanan Indonesia yang dapat memberikan energi berkelanjutan sepanjang hari.",
    category: "mood-food",
    reading_time: 7,
    views: 980,
    likes: 76,
    is_featured: true,
    published_at: "2024-01-12",
  },
  {
    id: "3",
    title: "Gado-gado: Superfood Indonesia",
    slug: "gado-gado-superfood-indonesia",
    excerpt:
      "Analisis nutrisi lengkap gado-gado dan manfaatnya untuk kesehatan tubuh.",
    category: "indonesian-foods",
    reading_time: 6,
    views: 750,
    likes: 65,
    is_featured: true,
    published_at: "2024-01-10",
  },
];

function getCategoryIcon(category: string) {
  const cat = categories.find((c) => c.key === category);
  const Icon = cat?.icon || BookOpen;
  return <Icon className="w-4 h-4" />;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const { id } = params;
  const article = featuredArticles.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Artikel tidak ditemukan</h2>
          <Link href="/learn" className="text-forest-600 underline">
            Kembali ke Learn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/learn"
            className="text-forest-600 hover:text-forest-800 flex items-center gap-2 mb-4"
          >
            <FileText className="w-4 h-4" />
            Kembali ke Artikel
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8 border border-sage-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-forest-100 text-forest-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              {getCategoryIcon(article.category)}
              {categories.find((c) => c.key === article.category)?.label}
            </div>
            {article.is_featured && (
              <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-forest-900 mb-2">
            {article.title}
          </h1>
          <div className="flex items-center gap-4 text-sage-600 text-sm mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{article.reading_time} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{article.likes}</span>
            </div>
            <div>
              {new Date(article.published_at).toLocaleDateString("id-ID")}
            </div>
          </div>
          <p className="text-lg text-sage-800 mb-6">{article.excerpt}</p>
          <div className="text-sage-700">
            <em>(Konten lengkap artikel bisa ditambahkan di sini...)</em>
          </div>
        </div>
      </div>
    </div>
  );
}
