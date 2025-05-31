"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Search, ImageOff } from "lucide-react";
import { articles } from "./data";
import { LearnSkeleton } from "@/components/Skeleton";

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!articles || articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
        <LearnSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-3 sm:mb-4">
            <BookOpen className="w-4 h-4 mr-2" />
            Pusat Edukasi
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-forest-900 mb-3 sm:mb-4">
            Pusat Edukasi NutriMood
          </h1>
          <p className="text-lg sm:text-xl text-sage-700 max-w-3xl mx-auto leading-relaxed">
            Pelajari segala hal tentang nutrisi, mood, dan kesehatan melalui
            artikel yang telah dikurasi oleh para ahli.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sage-400 w-5 h-5" />{" "}
              <input
                type="text"
                placeholder="Cari artikel atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-sage-300 rounded-xl focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sage-900 placeholder-sage-400 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        {/* Featured Articles */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-forest-900">
              Artikel Edukasi
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredArticles.map((article) => (
              <Link key={article.id} href={`/learn/${article.id}`}>
                <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-sage-200 hover:shadow-earth hover:-translate-y-1 transition-all duration-300">
                  {" "}
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-forest-400 to-sage-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                    {article.image ? (
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={article.id <= 3}
                      />
                    ) : (
                      <ImageOff className="w-12 h-12 sm:w-16 sm:h-16 text-sage-200" />
                    )}
                  </div>
                  <div className="p-4 sm:p-6">
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
                    <h3 className="text-lg sm:text-xl font-semibold text-forest-900 mb-2 group-hover:text-forest-700 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sage-700 mb-4 leading-relaxed line-clamp-3 text-sm sm:text-base">
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
      </div>
    </div>
  );
}
