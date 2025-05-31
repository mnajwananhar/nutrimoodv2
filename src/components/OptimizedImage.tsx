"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  fallbackIcon?: boolean;
  onError?: () => void;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  fill = false,
  className = "",
  sizes,
  priority = false,
  loading = "lazy",
  fallbackIcon = true,
  onError,
  onLoad,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleError = () => {
    if (retryCount < maxRetries) {
      // Retry loading the image
      setRetryCount((prev) => prev + 1);
      setImageError(false);
      setIsLoading(true);
    } else {
      setImageError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setImageError(false);
    setRetryCount(0);
    onLoad?.();
  };

  useEffect(() => {
    if (retryCount > 0) {
      // Add a small delay before retry
      const timer = setTimeout(() => {
        setIsLoading(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCount]);
  if (!src || src.trim() === "" || imageError) {
    return fallbackIcon ? (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-forest-400 to-sage-500 ${className}`}
      >
        <ImageOff className="w-16 h-16 text-sage-200" />
      </div>
    ) : null;
  }

  // Create base props
  const baseProps = {
    src: retryCount > 0 ? `${src}?retry=${retryCount}` : src,
    alt,
    className: `${className} ${
      isLoading ? "opacity-0" : "opacity-100"
    } transition-opacity duration-300`,
    sizes,
    placeholder: "blur" as const,
    blurDataURL:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7XTvtd0zu2GZuLhOF64wdFRVySwqXq5rb3tz",
    onError: handleError,
    onLoad: handleLoad,
  };

  // Add priority or loading based on priority prop
  const imageProps = priority
    ? { ...baseProps, priority: true }
    : { ...baseProps, loading: loading || "lazy" };
  return fill ? (
    <Image {...imageProps} fill alt={alt} />
  ) : (
    <Image {...imageProps} width={400} height={300} alt={alt} />
  );
}
