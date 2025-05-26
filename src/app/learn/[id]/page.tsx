"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, ImageOff } from "lucide-react";
import { articles } from "../data";
import Image from "next/image";
import { LearnSkeleton } from "@/components/Skeleton";

export default function ArticleDetailPage() {
  const params = useParams();
  const { id } = params;
  const article = articles.find((a) => a.id === Number(id));
  // Add state for image error tracking
  const [imageError, setImageError] = useState(false);

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
        <LearnSkeleton />
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
        </div>{" "}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-sage-200">
          <div className="relative w-full h-64 mb-6">
            {!article.image || article.image.trim() === "" || imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-forest-400 to-sage-500 rounded-xl">
                <ImageOff className="w-20 h-20 text-sage-200" />
              </div>
            ) : (
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover rounded-xl"
                sizes="(max-width: 768px) 100vw, 700px"
                style={{ objectFit: "cover" }}
                onError={() => setImageError(true)}
              />
            )}
          </div>
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
          <h1 className="text-3xl font-bold text-forest-900 mb-4">
            {article.title}
          </h1>
          <div className="text-sage-700 whitespace-pre-line text-lg">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  );
}
