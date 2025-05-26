"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  User,
  TrendingUp,
  Heart,
  Target,
  Clock,
  ChefHat,
  Brain,
  Star,
  Award,
  Activity,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";

interface UserStats {
  assessments_count: number;
  recommendations_count: number;
  posts_count: number;
  likes_received: number;
  days_active: number;
  avg_mood_score: number;
  favorite_foods: string[];
  mood_trend: string;
}

interface RecentActivity {
  id: number;
  type: "assessment" | "recommendation" | "post" | "comment";
  title: string;
  description: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export default function DashboardPage() {
  const { user, userProfile, isAuthLoading } = useAuth();
  const { error } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserStats = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user statistics
      const [assessmentsRes, postsRes, likesRes, favFoodsRes] =
        await Promise.all([
          supabase
            .from("nutrition_assessments")
            .select("*")
            .eq("user_id", user.id),
          supabase.from("community_posts").select("*").eq("user_id", user.id),
          supabase
            .from("post_likes")
            .select("post_id, community_posts!inner(user_id)")
            .eq("community_posts.user_id", user.id),
          supabase
            .from("food_recommendations")
            .select("food_name")
            .eq("user_id", user.id)
            .eq("is_liked", true),
        ]);

      const assessments = assessmentsRes.data || [];
      const posts = postsRes.data || [];
      const likes = likesRes.data || [];
      const favFoods = favFoodsRes.data || [];

      // Calculate mood trend
      const recentAssessments = assessments
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);
      const avgMoodScore =
        recentAssessments.length > 0
          ? recentAssessments.reduce((sum, assessment) => {
              const moodScores = {
                sangat_bahagia: 5,
                bahagia: 4,
                netral: 3,
                sedih: 2,
                sangat_sedih: 1,
              };
              return (
                sum +
                (moodScores[
                  assessment.current_mood as keyof typeof moodScores
                ] || 3)
              );
            }, 0) / recentAssessments.length
          : null;
      const moodTrend =
        avgMoodScore === null
          ? "no_data"
          : avgMoodScore >= 4
          ? "improving"
          : avgMoodScore >= 3
          ? "stable"
          : "declining";

      // Calculate days active
      const firstActivity = [...assessments, ...posts].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];

      const daysActive = firstActivity
        ? Math.ceil(
            (Date.now() - new Date(firstActivity.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      // Get favorite foods from food_recommendations (yang di-like user)
      const favoriteFoods = favFoods
        .map((f: { food_name: string }) => f.food_name)
        .slice(0, 3);

      setStats({
        assessments_count: assessments.length,
        recommendations_count: assessments.length, // Assuming each assessment gives recommendations
        posts_count: posts.length,
        likes_received: likes.length,
        days_active: daysActive,
        avg_mood_score: avgMoodScore ? Math.round(avgMoodScore * 10) / 10 : 0,
        favorite_foods: favoriteFoods,
        mood_trend: moodTrend,
      });
    } catch (err) {
      console.error("Error fetching user stats:", err);
      error("Gagal Memuat", "Tidak dapat memuat statistik pengguna");
    }
  }, [user, error]);

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;

    try {
      const activities: RecentActivity[] = [];

      // Get recent assessments
      const { data: assessments } = await supabase
        .from("nutrition_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      assessments?.forEach((assessment) => {
        activities.push({
          id: assessment.id,
          type: "assessment",
          title: "Analisis Nutrisi",
          description: `Mood: ${assessment.predicted_mood}`,
          created_at: assessment.created_at,
          metadata: assessment,
        });
      });

      // Get recent posts
      const { data: posts } = await supabase
        .from("community_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      posts?.forEach((post) => {
        activities.push({
          id: post.id,
          type: "post",
          title: post.title,
          description: `Posting ${post.type} | ${post.likes_count} likes`,
          created_at: post.created_at,
          metadata: post,
        });
      });

      // Sort by date and take latest 5
      const sortedActivities = activities
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 5);

      setRecentActivity(sortedActivities);
    } catch (err) {
      console.error("Error fetching recent activity:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchUserStats(), fetchRecentActivity()]);
    };

    initializeData();
  }, [user, fetchUserStats, fetchRecentActivity]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  const getMoodColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "text-green-600 bg-green-100";
      case "stable":
        return "text-blue-600 bg-blue-100";
      case "declining":
        return "text-red-600 bg-red-100";
      case "no_data":
        return "text-gray-500 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "assessment":
        return Brain;
      case "recommendation":
        return Target;
      case "post":
        return ChefHat;
      case "comment":
        return Heart;
      default:
        return Activity;
    }
  };

  if (isAuthLoading) {
    return <DashboardSkeleton />;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}{" "}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Image
              src={userProfile?.avatar_url || "/api/placeholder/80/80"}
              alt="Profile"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-forest-900">
                Selamat datang,{" "}
                {userProfile?.full_name || userProfile?.username || "Pengguna"}!
              </h1>
              <p className="text-sage-600">
                Berikut adalah ringkasan aktivitas nutrisi dan kesehatan Anda
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-6 animate-pulse"
              >
                <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-forest-900">
                    {stats?.assessments_count || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-forest-900 mb-1">
                  Analisis Nutrisi
                </h3>
                <p className="text-sm text-sage-600">
                  Total assessment yang dilakukan
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-forest-900">
                    {stats?.recommendations_count || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-forest-900 mb-1">
                  Rekomendasi
                </h3>
                <p className="text-sm text-sage-600">
                  Rekomendasi makanan diterima
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <ChefHat className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-2xl font-bold text-forest-900">
                    {stats?.posts_count || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-forest-900 mb-1">
                  Posting Komunitas
                </h3>
                <p className="text-sm text-sage-600">
                  Total posting yang dibuat
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-forest-900">
                    {stats?.likes_received || 0}
                  </span>
                </div>
                <h3 className="font-semibold text-forest-900 mb-1">
                  Total Likes
                </h3>
                <p className="text-sm text-sage-600">Likes yang diterima</p>
              </div>
            </div>

            {/* Mood & Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Mood Progress */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-forest-900">
                    Progress Mood
                  </h2>{" "}
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(
                      stats?.mood_trend || "no_data"
                    )}`}
                  >
                    {stats?.mood_trend === "improving"
                      ? "Membaik"
                      : stats?.mood_trend === "declining"
                      ? "Menurun"
                      : stats?.mood_trend === "stable"
                      ? "Stabil"
                      : "Belum Ada Data"}
                  </span>
                </div>{" "}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Skor Mood Rata-rata</span>
                    {stats?.mood_trend === "no_data" ? (
                      <span className="text-gray-500 italic">
                        Belum ada penilaian
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= (stats?.avg_mood_score || 0)
                                  ? "text-yellow-500 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-forest-900">
                          {stats?.avg_mood_score || 0}/5
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Hari Aktif</span>
                    <span className="font-semibold text-forest-900">
                      {stats?.days_active || 0} hari
                    </span>
                  </div>
                </div>
                <Link
                  href="/recommendations/assessment"
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-lg font-medium hover:from-forest-700 hover:to-forest-800 transition-all"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Analisis Mood Baru
                </Link>
              </div>

              {/* Favorite Foods */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-sage-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-forest-900">
                    Makanan Favorit
                  </h2>
                  <Award className="w-6 h-6 text-orange-500" />
                </div>

                {stats?.favorite_foods && stats.favorite_foods.length > 0 ? (
                  <div className="space-y-3">
                    {stats.favorite_foods.map((food, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-forest-900 font-medium capitalize">
                          {food.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChefHat className="w-12 h-12 text-sage-400 mx-auto mb-4" />
                    <p className="text-sage-600">
                      Belum ada data makanan favorit. Lakukan lebih banyak
                      analisis untuk melihat preferensi Anda!
                    </p>
                  </div>
                )}

                <Link
                  href="/history"
                  className="mt-6 w-full inline-flex items-center justify-center px-4 py-2 border border-forest-600 text-forest-600 rounded-lg font-medium hover:bg-forest-50 transition-all"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Lihat Riwayat Lengkap
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-sage-200">
              <div className="p-6 border-b border-sage-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-forest-900">
                    Aktivitas Terbaru
                  </h2>
                  <Link
                    href="/history"
                    className="text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
                  >
                    Lihat Semua
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div
                          key={`${activity.type}-${activity.id}`}
                          className="flex items-start space-x-4 p-4 bg-sage-50 rounded-lg"
                        >
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Icon className="w-5 h-5 text-forest-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-forest-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-sage-600">
                              {activity.description}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-sage-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(activity.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-sage-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-forest-900 mb-2">
                      Belum Ada Aktivitas
                    </h3>
                    <p className="text-sage-600 mb-6">
                      Mulai perjalanan kesehatan Anda dengan melakukan analisis
                      nutrisi pertama
                    </p>
                    <Link
                      href="/recommendations/assessment"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-forest-600 to-forest-700 text-white rounded-lg font-medium hover:from-forest-700 hover:to-forest-800 transition-all"
                    >
                      <Brain className="w-5 h-5 mr-2" />
                      Mulai Analisis
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/recommendations/assessment"
                className="group bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                <Brain className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">Analisis Baru</h3>
                <p className="text-blue-100">
                  Lakukan analisis nutrisi dan mood terbaru
                </p>
              </Link>

              <Link
                href="/community"
                className="group bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white hover:from-green-600 hover:to-green-700 transition-all"
              >
                <ChefHat className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">Bagikan Resep</h3>
                <p className="text-green-100">
                  Berbagi resep favorit di komunitas
                </p>
              </Link>

              <Link
                href="/learn"
                className="group bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                <Target className="w-8 h-8 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">Pelajari Nutrisi</h3>
                <p className="text-orange-100">
                  Baca artikel dan tips kesehatan terbaru
                </p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
