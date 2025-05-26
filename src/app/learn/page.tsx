"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Utensils,
  Heart,
  Search,
  FileText,
  Target,
  Lightbulb,
  ImageOff,
} from "lucide-react";
import Image from "next/image";
import { articles } from "./data";

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  // Tambahkan state untuk error gambar
  const [imageError, setImageError] = useState<{ [key: string]: boolean }>({});

  const categories = [
    { key: "all", label: "Semua", icon: BookOpen },
    { key: "nutrition-basics", label: "Dasar Nutrisi", icon: Utensils },
    { key: "mood-food", label: "Mood & Makanan", icon: Brain },
    { key: "indonesian-foods", label: "Makanan Indonesia", icon: Heart },
    { key: "health-tips", label: "Tips Kesehatan", icon: Target },
    { key: "myths-facts", label: "Mitos vs Fakta", icon: Lightbulb },
  ];

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.key === category);
    const Icon = cat?.icon || BookOpen;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            Education Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-forest-900 mb-4">
            Pusat Edukasi NutriMood
          </h1>
          <p className="text-xl text-sage-700 max-w-3xl mx-auto">
            Pelajari segala hal tentang nutrisi, mood, dan kesehatan melalui
            artikel yang telah dikurasi oleh para ahli.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />{" "}
              <input
                type="text"
                placeholder="Cari artikel atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sage-900 placeholder-sage-400"
              />
            </div>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-forest-900">
              Artikel Edukasi
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link key={article.id} href={`/learn/${article.id}`}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-sage-200 hover:shadow-earth hover:-translate-y-1 transition-all duration-300">
                  <div className="h-48 bg-gradient-to-br from-forest-400 to-sage-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    {!article.image ||
                    article.image.trim() === "" ||
                    imageError[article.id] ? (
                      <ImageOff className="w-16 h-16 text-sage-200" />
                    ) : (
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover w-full h-full"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                        onError={() =>
                          setImageError((prev) => ({
                            ...prev,
                            [article.id]: true,
                          }))
                        }
                      />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-forest-100 text-forest-700 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-semibold text-forest-900 mb-2 group-hover:text-forest-700 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sage-700 mb-4 leading-relaxed line-clamp-3">
                      {article.content.slice(0, 150)}
                      {article.content.length > 150 ? "..." : ""}
                    </p>
                    <div className="flex justify-end">
                      <span className="text-forest-600 font-medium hover:underline">
                        Baca Selengkapnya
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-forest-600 to-forest-700 rounded-2xl p-8 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Siap Memulai Perjalanan Sehat Anda?
          </h3>
          <p className="text-forest-100 mb-6 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan orang yang telah meningkatkan kesehatan
            dan mood mereka melalui pendekatan nutrisi yang tepat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/recommendations/assessment"
              className="bg-white text-forest-700 px-8 py-3 rounded-xl font-semibold hover:bg-forest-50 transition-colors"
            >
              Mulai Analisis Nutrisi
            </Link>
            <Link
              href="/auth/signup"
              className="border-2 border-forest-200 text-white px-8 py-3 rounded-xl font-semibold hover:bg-forest-500 transition-colors"
            >
              Daftar Gratis Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
