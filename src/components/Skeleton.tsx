import React from "react";

export function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-sage-200 p-6 mb-6 flex items-center space-x-6 animate-pulse">
        <div className="w-24 h-24 rounded-full bg-sage-200" />
        <div className="flex-1 space-y-4">
          <div className="h-6 bg-sage-200 rounded w-1/3" />
          <div className="h-4 bg-sage-100 rounded w-1/4" />
          <div className="flex space-x-4 mt-2">
            <div className="h-4 bg-sage-100 rounded w-24" />
            <div className="h-4 bg-sage-100 rounded w-32" />
          </div>
        </div>
      </div>
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-sage-200 p-6 animate-pulse"
          >
            <div className="h-8 w-8 bg-sage-200 rounded-lg mb-4" />
            <div className="h-4 bg-sage-200 rounded w-1/2 mb-2" />
            <div className="h-6 bg-sage-100 rounded w-1/3" />
          </div>
        ))}
      </div>
      {/* Tabs Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-sage-200 animate-pulse">
        <div className="border-b border-sage-200 flex">
          <div className="h-12 w-32 bg-sage-100 rounded-t" />
          <div className="h-12 w-32 bg-sage-50 rounded-t ml-2" />
          <div className="h-12 w-32 bg-sage-50 rounded-t ml-2" />
        </div>
        <div className="p-6 space-y-4">
          <div className="h-6 bg-sage-200 rounded w-1/4" />
          <div className="h-4 bg-sage-100 rounded w-1/2" />
          <div className="h-4 bg-sage-100 rounded w-1/3" />
          <div className="h-4 bg-sage-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-4 mb-8 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-sage-200" />
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-sage-200 rounded w-1/3" />
          <div className="h-4 bg-sage-100 rounded w-1/2" />
        </div>
      </div>
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm p-6 animate-pulse"
          >
            <div className="h-12 w-12 bg-sage-200 rounded-lg mb-4" />
            <div className="h-6 bg-sage-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-sage-100 rounded w-1/2" />
          </div>
        ))}
      </div>
      {/* Mood & Progress Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200 animate-pulse"
          >
            <div className="h-6 bg-sage-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-sage-100 rounded w-1/2 mb-2" />
            <div className="h-4 bg-sage-100 rounded w-1/3" />
          </div>
        ))}
      </div>
      {/* Recent Activity Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-sage-200 animate-pulse">
        <div className="p-6 border-b border-sage-200">
          <div className="h-6 bg-sage-200 rounded w-1/4" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-start space-x-4 p-4 bg-sage-50 rounded-lg"
            >
              <div className="bg-white p-2 rounded-lg shadow-sm w-8 h-8 bg-sage-200" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 bg-sage-200 rounded w-1/3" />
                <div className="h-3 bg-sage-100 rounded w-1/2" />
                <div className="h-3 bg-sage-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="text-center mb-8 animate-pulse">
        <div className="h-8 bg-sage-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto mb-6" />
        <div className="h-10 w-40 bg-sage-200 rounded-xl mx-auto" />
      </div>
      {/* Filters Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-sage-100 rounded w-full" />
          </div>
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-sage-100 rounded" />
            ))}
          </div>
        </div>
      </div>
      {/* Posts Skeleton */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-sm p-6 animate-pulse"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-sage-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-sage-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-sage-100 rounded w-1/6" />
              </div>
            </div>
            <div className="h-6 bg-sage-200 rounded w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-sage-100 rounded" />
              <div className="h-4 bg-sage-100 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="text-center mb-12 animate-pulse">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-8 bg-sage-200 rounded-full" />
          <div className="h-8 bg-sage-200 rounded w-1/4" />
        </div>
        <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto" />
      </div>
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 animate-pulse"
          >
            <div className="h-8 w-8 bg-sage-200 rounded-lg mb-2" />
            <div className="h-6 bg-sage-200 rounded w-1/2 mb-2" />
            <div className="h-4 bg-sage-100 rounded w-1/3" />
          </div>
        ))}
      </div>
      {/* Tab Navigation Skeleton */}
      <div className="flex items-center justify-center mb-8 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-40 bg-sage-100 rounded-xl mx-2" />
        ))}
      </div>
      {/* Content Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 animate-pulse">
        <div className="h-6 bg-sage-200 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-sage-100 rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LearnSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="text-center mb-12 animate-pulse">
        <div className="h-8 bg-sage-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/3 mx-auto" />
      </div>
      {/* Search Skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-sage-200 mb-8 animate-pulse">
        <div className="h-10 bg-sage-100 rounded w-full" />
      </div>
      {/* Articles Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sage-200"
          >
            <div className="h-48 bg-sage-200" />
            <div className="p-6">
              <div className="h-4 bg-sage-100 rounded w-1/2 mb-2" />
              <div className="h-6 bg-sage-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-sage-100 rounded w-full mb-2" />
              <div className="h-4 bg-sage-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header Skeleton */}
      <div className="text-center mb-8 animate-pulse">
        <div className="h-8 bg-sage-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/3 mx-auto" />
      </div>
      {/* Progress Bar Skeleton */}
      <div className="mb-8 animate-pulse">
        <div className="h-4 bg-sage-200 rounded w-full mb-2" />
        <div className="h-2 bg-sage-100 rounded w-full" />
      </div>
      {/* Main Content Skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 overflow-hidden animate-pulse">
        <div className="p-8">
          <div className="h-8 bg-sage-200 rounded w-1/2 mx-auto mb-6" />
          <div className="h-6 bg-sage-100 rounded w-1/3 mx-auto mb-3" />
          <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto mb-3" />
          <div className="h-4 bg-sage-100 rounded w-1/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header Skeleton */}
      <div className="text-center mb-8 animate-pulse">
        <div className="h-8 bg-sage-200 rounded w-1/3 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto mb-4" />
        <div className="h-4 bg-sage-100 rounded w-1/3 mx-auto" />
      </div>
      {/* Main Content Skeleton */}
      <div className="grid lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
            <div className="w-20 h-20 mx-auto mb-6 bg-sage-200 rounded-2xl" />
            <div className="h-6 bg-sage-200 rounded w-1/2 mx-auto mb-2" />
            <div className="h-4 bg-sage-100 rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto mb-6" />
            <div className="h-4 bg-sage-100 rounded w-1/2 mx-auto" />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-earth border border-sage-200">
            <div className="h-6 bg-sage-200 rounded w-1/2 mb-4" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-sage-100 rounded w-1/2" />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-sage-200"
            >
              <div className="h-6 bg-sage-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-sage-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-sage-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8 animate-pulse">
        <div className="w-12 h-12 bg-sage-200 rounded-xl mx-auto mb-4" />
        <div className="h-6 bg-sage-200 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-sage-100 rounded w-1/3 mx-auto" />
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 p-8 animate-pulse">
        <div className="h-10 bg-sage-100 rounded w-full mb-6" />
        <div className="h-4 bg-sage-100 rounded w-1/2 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-sage-100 rounded w-full" />
          ))}
        </div>
        <div className="h-10 bg-sage-200 rounded w-full mt-6" />
      </div>
    </div>
  );
}
