"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileText, ImageOff } from "lucide-react";
import { articles } from "../data";
import { LearnSkeleton } from "@/components/Skeleton";

export default function ArticleDetailPage() {
  const params = useParams();
  const { id } = params;
  const article = articles.find((a) => a.id === Number(id));
  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-6 sm:py-8">
        <LearnSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/learn"
            className="text-forest-600 hover:text-forest-800 flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <FileText className="w-4 h-4" />
            Kembali ke Artikel
          </Link>
        </div>{" "}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 border border-sage-200">
          <div className="relative w-full aspect-video mb-4 sm:mb-6 overflow-hidden rounded-xl">
            {article.image ? (
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 700px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-400 to-sage-500">
                <ImageOff className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-sage-200" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="bg-forest-100 text-forest-700 px-2 py-1 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-forest-900 mb-3 sm:mb-4 leading-tight">
            {article.title}
          </h1>
          <div className="text-sage-700 whitespace-pre-line text-sm sm:text-base lg:text-lg leading-relaxed">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  );
}
