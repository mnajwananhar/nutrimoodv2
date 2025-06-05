"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  TrendingUp,
  Brain,
  Download,
  BarChart3,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp,
  User,
  Target,
  Zap,
  Award,
  Activity,
  Moon,
  Utensils,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ToastProvider";
import { HistorySkeleton } from "@/components/Skeleton";
import { useRouter } from "next/navigation";

interface NutritionAssessment {
  id: string;
  calorie_level: number;
  protein_level: number;
  fat_level: number;
  carb_level: number;
  predicted_mood: string;
  selected_mood: string;
  confidence_score: number;
  notes?: string;
  created_at: string;
  food_recommendations?: FoodRecommendation[];
  health_condition?: string;
}

interface FoodRecommendation {
  id: string;
  food_name: string;
  calories: number;
  proteins: number;
  fats: number;
  carbohydrates: number;
  similarity_score: number;
  is_liked: boolean;
  is_consumed: boolean;
  consumed_at?: string;
}

interface MoodStats {
  totalAssessments: number;
  averageConfidence: number;
  moodDistribution: { [key: string]: number };
  streakDays: number;
  favoriteTime: string;
}

const getMoodIcon = (mood: string) => {
  const moodIcons: {
    [key: string]: React.ComponentType<{ className?: string }>;
  } = {
    energizing: Zap,
    relaxing: Moon,
    focusing: Target,
    neutral: Heart,
  };
  return moodIcons[mood] || Utensils;
};

const healthConditionLabels: Record<string, string> = {
  diabetes: "Diabetes",
  hipertensi: "Hipertensi",
  kolesterol: "Kolesterol Tinggi",
  obesitas: "Obesitas",
  alergi_gluten: "Alergi Gluten",
  vegetarian: "Vegetarian",
};

// Fungsi utilitas untuk menampilkan confidence/accuracy
function formatConfidence(val: number): string {
  if (val <= 1) {
    return (val * 100).toFixed(1) + "%";
  }
  return val.toFixed(1) + "%";
}

export default function HistoryPage() {
  const { user, isAuthLoading } = useAuth();
  const { error } = useToast();
  const router = useRouter();

  const [assessments, setAssessments] = useState<NutritionAssessment[]>([]);
  const [stats, setStats] = useState<MoodStats>({
    totalAssessments: 0,
    averageConfidence: 0,
    moodDistribution: {},
    streakDays: 0,
    favoriteTime: "",
  });
  const [loading, setLoading] = useState(true);

  type TabType = "assessments" | "analytics" | "foods";
  type TimeFilterType = "all" | "week" | "month" | "year";

  const [activeTab, setActiveTab] = useState<TabType>("assessments");
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>("all");
  const [moodFilter, setMoodFilter] = useState<string>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const loadHistoryData = useCallback(async () => {
    try {
      setLoading(true);

      // Build query based on filters
      let query = supabase
        .from("nutrition_assessments")
        .select(
          `
          *,
          food_recommendations (*)
        `
        )
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      // Apply time filter
      if (timeFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (timeFilter) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte("created_at", startDate.toISOString());
      } // Apply mood filter
      if (moodFilter !== "all") {
        query = query.or(
          `predicted_mood.eq.${moodFilter},selected_mood.eq.${moodFilter}`
        );
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to include health conditions as comma-separated string for backward compatibility
      const transformedData =
        (data?.map((assessment: Record<string, unknown>) => ({
          ...assessment,
          health_condition:
            (assessment.health_conditions as string[])
              ?.filter(
                (condition: string) => condition && condition !== "tidak_ada"
              )
              ?.join(",") || null,
        })) as NutritionAssessment[]) || [];

      setAssessments(transformedData);

      // Calculate statistics
      if (transformedData && transformedData.length > 0) {
        const totalAssessments = transformedData.length;
        // Normalisasi confidence_score ke 0-100 untuk rata-rata
        const averageConfidence =
          transformedData.reduce(
            (sum: number, item: NutritionAssessment) =>
              sum +
              (item.confidence_score <= 1
                ? item.confidence_score * 100
                : item.confidence_score),
            0
          ) / totalAssessments; // Calculate mood distribution
        const moodDistribution: { [key: string]: number } = {};
        transformedData.forEach((item: NutritionAssessment) => {
          const mood = item.selected_mood || item.predicted_mood;
          moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
        });

        // Calculate streak (simplified)
        const streakDays = calculateStreakDays(transformedData);

        // Find favorite time (simplified)
        const favoriteTime = findFavoriteTime(transformedData);

        setStats({
          totalAssessments,
          averageConfidence,
          moodDistribution,
          streakDays,
          favoriteTime,
        });
        setAssessments(transformedData);
      }
    } catch (err) {
      console.error("Error loading history:", err);
      error("Gagal memuat data riwayat");
    } finally {
      setLoading(false);
    }
  }, [user?.id, timeFilter, moodFilter, error]);

  const calculateStreakDays = (data: NutritionAssessment[]): number => {
    if (!data.length) return 0;

    const dates = data.map((item) => new Date(item.created_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort();

    let streak = 1;
    const today = new Date().toDateString();

    if (uniqueDates[0] !== today) return 0;

    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i - 1]);
      const next = new Date(uniqueDates[i]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const findFavoriteTime = (data: NutritionAssessment[]): string => {
    if (!data.length) return "";

    const timeSlots: { [key: string]: number } = {
      Pagi: 0,
      Siang: 0,
      Sore: 0,
      Malam: 0,
    };

    data.forEach((item) => {
      const hour = new Date(item.created_at).getHours();
      if (hour >= 5 && hour < 11) timeSlots["Pagi"]++;
      else if (hour >= 11 && hour < 15) timeSlots["Siang"]++;
      else if (hour >= 15 && hour < 19) timeSlots["Sore"]++;
      else timeSlots["Malam"]++;
    });

    return Object.entries(timeSlots).reduce((a, b) =>
      timeSlots[a[0]] > timeSlots[b[0]] ? a : b
    )[0];
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };
  const exportData = async () => {
    try {
      interface CsvRow {
        tanggal: string;
        mood_dipilih: string;
        kondisi_kesehatan: string;
        akurasi: string;
        catatan: string;
        nama_makanan: string;
        kalori_makanan: number | string;
        protein_makanan: string;
        lemak_makanan: string;
        karbohidrat_makanan: string;
        kecocokan: string;
        disukai: string;
      }

      const csvContent: CsvRow[] = [];

      assessments.forEach((assessment) => {
        const baseData = {
          tanggal: new Date(assessment.created_at).toLocaleDateString("id-ID"),
          mood_dipilih: assessment.selected_mood || assessment.predicted_mood,
          kondisi_kesehatan: assessment.health_condition || "Tidak Ada",
          akurasi: formatConfidence(assessment.confidence_score),
          catatan: assessment.notes || "",
        };

        if (
          assessment.food_recommendations &&
          assessment.food_recommendations.length > 0
        ) {
          // Untuk setiap makanan, buat baris terpisah
          assessment.food_recommendations.forEach((food) => {
            csvContent.push({
              ...baseData,
              nama_makanan: food.food_name,
              kalori_makanan: food.calories,
              protein_makanan: `${food.proteins}g`,
              lemak_makanan: `${food.fats}g`,
              karbohidrat_makanan: `${food.carbohydrates}g`,
              kecocokan: `${(food.similarity_score * 100).toFixed(1)}%`,
              disukai: food.is_liked ? "Ya" : "Tidak",
            });
          });
        } else {
          // Jika tidak ada rekomendasi makanan
          csvContent.push({
            ...baseData,
            nama_makanan: "Tidak Ada",
            kalori_makanan: "-",
            protein_makanan: "-",
            lemak_makanan: "-",
            karbohidrat_makanan: "-",
            kecocokan: "-",
            disukai: "-",
          });
        }
      });

      if (csvContent.length === 0) {
        error("Tidak ada data untuk di-export");
        return;
      }

      const csv = [
        Object.keys(csvContent[0]).join(","),
        ...csvContent.map((row) => Object.values(row).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nutrimood-history-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting data:", err);
      error("Gagal mengexport data");
    }
  };

  useEffect(() => {
    if (!isAuthLoading && !user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("intendedRoute", window.location.pathname);
      }
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user) {
      loadHistoryData();
    } else {
      setLoading(false);
    }
  }, [user, loadHistoryData]);

  if (isAuthLoading) return <HistorySkeleton />;
  if (!user) return null;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
        <HistorySkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-forest-600" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900">
              Riwayat Analisis
            </h1>
          </div>{" "}
          <p className="text-sage-600 text-base sm:text-lg">
            Pantau perkembangan mood dan kondisi kesehatan Anda dari waktu ke
            waktu
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-forest-600" />
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-sage-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-forest-900">
              {stats.totalAssessments}
            </div>
            <div className="text-sage-600 text-xs sm:text-sm">
              Total Analisis
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-sage-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-forest-900">
              {formatConfidence(stats.averageConfidence)}
            </div>
            <div className="text-sage-600 text-xs sm:text-sm">
              Rata-rata Akurasi
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-sage-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-forest-900">
              {stats.streakDays}
            </div>
            <div className="text-sage-600 text-xs sm:text-sm">
              Hari Berturut
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <Award className="w-4 h-4 sm:w-6 sm:h-6 text-sage-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-forest-900">
              {stats.favoriteTime || "-"}
            </div>
            <div className="text-sage-600 text-xs sm:text-sm">
              Waktu Favorit
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-sage-200 w-full max-w-none sm:max-w-max overflow-x-auto">
            <div className="flex min-w-max sm:min-w-0">
              {[
                {
                  key: "assessments",
                  label: "Riwayat Analisis",
                  shortLabel: "Riwayat",
                  icon: History,
                },
                {
                  key: "analytics",
                  label: "Analytics",
                  shortLabel: "Analytics",
                  icon: BarChart3,
                },
                {
                  key: "foods",
                  label: "Makanan Favorit",
                  shortLabel: "Favorit",
                  icon: Heart,
                },
              ].map(({ key, label, shortLabel, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === key
                      ? "bg-forest-600 text-white shadow-md"
                      : "text-sage-700 hover:bg-sage-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="sm:hidden text-sm">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-forest-900 mb-2">
                Periode Waktu
              </label>
              <select
                value={timeFilter}
                onChange={(e) =>
                  setTimeFilter(e.target.value as TimeFilterType)
                }
                className="w-full border border-sage-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm sm:text-base"
              >
                <option value="all">Semua Waktu</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">1 Bulan Terakhir</option>
                <option value="year">1 Tahun Terakhir</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-forest-900 mb-2">
                Filter Mood
              </label>{" "}
              <select
                value={moodFilter}
                onChange={(e) => setMoodFilter(e.target.value)}
                className="w-full border border-sage-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm sm:text-base"
              >
                <option value="all">Semua Mood</option>
                <option value="energizing">Energizing</option>
                <option value="relaxing">Relaxing</option>
                <option value="focusing">Focusing</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={exportData}
                disabled={assessments.length === 0}
                className="flex items-center gap-2 bg-forest-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4"></div>
            <p className="text-sage-600">Memuat data riwayat...</p>
          </div>
        ) : (
          <>
            {activeTab === "assessments" && (
              <div className="space-y-6">
                {assessments.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-sage-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-sage-600 mb-2">
                      Belum Ada Riwayat
                    </h3>
                    <p className="text-sage-500 mb-6">
                      Mulai analisis nutrisi pertama Anda untuk melihat riwayat
                      di sini
                    </p>
                    <Link
                      href="/recommendations/assessment"
                      className="bg-forest-600 text-white px-6 py-3 rounded-lg hover:bg-forest-700 transition-colors"
                    >
                      Mulai Analisis
                    </Link>
                  </div>
                ) : (
                  assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="bg-white rounded-2xl shadow-sm border border-sage-200 overflow-hidden"
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-forest-100 rounded-xl flex items-center justify-center">
                              {(() => {
                                const IconComponent = getMoodIcon(
                                  assessment.predicted_mood
                                );
                                return (
                                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-forest-600" />
                                );
                              })()}
                            </div>{" "}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-forest-900 capitalize text-sm sm:text-base">
                                {assessment.selected_mood ||
                                  assessment.predicted_mood}
                              </h3>
                              <p className="text-xs sm:text-sm text-sage-600 truncate">
                                {new Date(
                                  assessment.created_at
                                ).toLocaleDateString("id-ID", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="text-right">
                              <div className="text-xs sm:text-sm text-sage-600">
                                Akurasi
                              </div>
                              <div className="font-semibold text-forest-900 text-sm sm:text-base">
                                {formatConfidence(assessment.confidence_score)}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleExpanded(assessment.id)}
                              className="p-2 hover:bg-sage-50 rounded-lg transition-colors"
                            >
                              {expandedItems.has(assessment.id) ? (
                                <ChevronUp className="w-5 h-5 text-sage-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-sage-600" />
                              )}
                            </button>
                          </div>{" "}
                        </div>{" "}
                        {/* Mood and Health Condition Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div className="bg-forest-50 rounded-lg p-2 sm:p-3">
                            <div className="text-xs sm:text-sm text-forest-600 mb-1">
                              Mood yang Dipilih
                            </div>
                            <div className="font-semibold text-forest-800 text-xs sm:text-sm capitalize">
                              {assessment.selected_mood ||
                                assessment.predicted_mood}
                            </div>
                          </div>
                          {assessment.health_condition && (
                            <div className="bg-purple-50 rounded-lg p-2 sm:p-3">
                              <div className="text-xs sm:text-sm text-purple-600 mb-1">
                                Kondisi Kesehatan
                              </div>
                              <div className="font-semibold text-purple-800 text-xs sm:text-sm">
                                {assessment.health_condition
                                  .split(",")
                                  .map(
                                    (condition) =>
                                      healthConditionLabels[condition.trim()] ||
                                      condition.trim()
                                  )
                                  .join(", ")}
                              </div>
                            </div>
                          )}
                        </div>
                        {assessment.notes && (
                          <div className="bg-sage-50 rounded-lg p-3 mb-4">
                            <div className="text-sm text-sage-600 mb-1">
                              Catatan
                            </div>
                            <div className="text-sage-800">
                              {assessment.notes}
                            </div>
                          </div>
                        )}
                        {expandedItems.has(assessment.id) &&
                          assessment.food_recommendations && (
                            <div className="border-t border-sage-200 pt-4">
                              <h4 className="font-semibold text-forest-900 mb-3 text-sm sm:text-base">
                                Rekomendasi Makanan
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {assessment.food_recommendations.map((food) => (
                                  <div
                                    key={food.id}
                                    className="bg-sage-50 rounded-lg p-3 sm:p-4"
                                  >
                                    <div className="flex items-start sm:items-center justify-between mb-2 gap-2">
                                      <h5 className="font-medium text-forest-900 text-sm sm:text-base leading-tight flex-1 min-w-0">
                                        {food.food_name}
                                      </h5>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          onClick={async () => {
                                            try {
                                              const { error: updateError } =
                                                await supabase
                                                  .from("food_recommendations")
                                                  .update({
                                                    is_liked: !food.is_liked,
                                                  })
                                                  .eq("id", food.id);
                                              if (updateError) {
                                                error(
                                                  "Gagal update favorit",
                                                  updateError.message
                                                );
                                              } else {
                                                // Optimistic update UI
                                                setAssessments((prev) =>
                                                  prev.map((assess) =>
                                                    assess.id === assessment.id
                                                      ? {
                                                          ...assess,
                                                          food_recommendations:
                                                            assess.food_recommendations?.map(
                                                              (f) =>
                                                                f.id === food.id
                                                                  ? {
                                                                      ...f,
                                                                      is_liked:
                                                                        !food.is_liked,
                                                                    }
                                                                  : f
                                                            ),
                                                        }
                                                      : assess
                                                  )
                                                );
                                              }
                                            } catch (e: unknown) {
                                              if (e instanceof Error) {
                                                error(
                                                  "Gagal update favorit",
                                                  e.message
                                                );
                                              } else {
                                                error(
                                                  "Gagal update favorit",
                                                  "Terjadi error tidak diketahui"
                                                );
                                              }
                                            }
                                          }}
                                          className={`p-1 rounded-full transition-colors ${
                                            food.is_liked
                                              ? "bg-red-100 text-red-600"
                                              : "bg-sage-100 text-sage-600"
                                          }`}
                                          title={
                                            food.is_liked
                                              ? "Hapus dari favorit"
                                              : "Tambah ke favorit"
                                          }
                                        >
                                          <Heart
                                            className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                              food.is_liked
                                                ? "fill-current"
                                                : ""
                                            }`}
                                          />
                                        </button>
                                        {food.is_consumed && (
                                          <span className="text-green-600 text-sm">
                                            ✓
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-sage-600">
                                      <div>Kalori: {food.calories}</div>
                                      <div>Protein: {food.proteins}g</div>
                                      <div>Lemak: {food.fats}g</div>
                                      <div>Karbo: {food.carbohydrates}g</div>
                                    </div>
                                    <div className="mt-2 text-xs sm:text-sm text-sage-500">
                                      Kecocokan:{" "}
                                      {(food.similarity_score * 100).toFixed(1)}
                                      %
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200">
                <h3 className="text-lg sm:text-xl font-semibold text-forest-900 mb-4 sm:mb-6">
                  Distribusi Mood
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries(stats.moodDistribution)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([mood, count]) => (
                      <div
                        key={mood}
                        className="flex items-center gap-2 sm:gap-4"
                      >
                        <div className="w-16 sm:w-20 text-xs sm:text-sm font-medium text-forest-900 capitalize flex items-center gap-1 sm:gap-2">
                          {(() => {
                            const IconComponent = getMoodIcon(mood);
                            return (
                              <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                            );
                          })()}
                          <span className="truncate">{mood}</span>
                        </div>
                        <div className="flex-1 bg-sage-200 rounded-full h-2 sm:h-3">
                          <div
                            className="bg-forest-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                ((count as number) / stats.totalAssessments) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="w-8 sm:w-12 text-xs sm:text-sm text-sage-600 text-right">
                          {count as number}x
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "foods" && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-sage-200">
                {(() => {
                  // Ambil semua makanan favorit dari seluruh assessment
                  const favoriteFoods: string[] = [];
                  assessments.forEach((assessment) => {
                    assessment.food_recommendations?.forEach((food) => {
                      if (
                        food.is_liked &&
                        !favoriteFoods.includes(food.food_name)
                      ) {
                        favoriteFoods.push(food.food_name);
                      }
                    });
                  });
                  if (favoriteFoods.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-sage-400 mb-3 sm:mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-sage-600 mb-2 text-center">
                          Belum Ada Makanan Favorit
                        </h3>
                        <p className="text-sage-500 text-center text-sm sm:text-base px-4">
                          Tandai makanan favorit Anda di hasil analisis atau
                          riwayat!
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-forest-900 mb-4 sm:mb-6 text-center">
                        Makanan Favorit Anda
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {favoriteFoods.map((food, idx) => (
                          <div
                            key={idx}
                            className="bg-sage-50 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                          >
                            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
                            <span className="font-medium text-forest-900 text-sm sm:text-lg leading-tight">
                              {food}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
