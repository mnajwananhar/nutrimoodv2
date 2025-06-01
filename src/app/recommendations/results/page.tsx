"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  Heart,
  RefreshCw,
  BookOpen,
  Star,
  TrendingUp,
  Utensils,
  ArrowRight,
  Zap,
  Smile,
  Target,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { ResultsSkeleton } from "@/components/Skeleton";

interface HealthCondition {
  value: string;
  name: string;
  description: string;
  filter: string;
}

interface AssessmentData {
  input: {
    calorie_level: number;
    protein_level: number;
    fat_level: number;
    carb_level: number;
    health_condition?: HealthCondition[] | HealthCondition | null; // Support both formats for backwards compatibility
  };
  result: {
    mood_prediction: {
      mood: string;
      confidence: number;
    };
    food_recommendations: Array<{
      food_name: string;
      calories: number;
      proteins: number;
      fats: number;
      carbohydrates: number;
      similarity_score: number;
      mood_category: string;
    }>;
  };
  timestamp: string;
}

function getMoodIcon(mood: string) {
  switch (mood) {
    case "energizing":
      return Zap;
    case "relaxing":
      return Smile;
    case "focusing":
      return Target;
    case "uncategorized":
      return HelpCircle;
    default:
      return HelpCircle;
  }
}

function getMoodColor(mood: string) {
  switch (mood) {
    case "energizing":
      return "bg-orange-100 text-orange-700";
    case "relaxing":
      return "bg-blue-100 text-blue-700";
    case "focusing":
      return "bg-green-100 text-green-700";
    case "uncategorized":
      return "bg-sage-100 text-sage-700";
    default:
      return "bg-sage-100 text-sage-700";
  }
}

// Fungsi utilitas untuk menampilkan confidence/accuracy
function formatConfidence(val: number): string {
  if (val <= 1) {
    return (val * 100).toFixed(1) + "%";
  }
  return val.toFixed(1) + "%";
}

export default function ResultsPage() {
  const router = useRouter();
  const { error } = useToast();
  const { user, isAuthLoading } = useAuth();
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(
    null
  );
  const [likedFoods, setLikedFoods] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadAssessmentData = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Ambil assessment terbaru dari Supabase dengan health conditions
          const { data: assessment, error: err1 } = await supabase
            .from("nutrition_assessments")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (err1 || !assessment)
            throw err1 || new Error("Assessment tidak ditemukan");

          // Ambil food recommendations
          const { data: foods, error: err2 } = await supabase
            .from("food_recommendations")
            .select("*")
            .eq("assessment_id", assessment.id);
          if (err2) throw err2;

          // Transform health conditions from TEXT[] array to HealthCondition objects
          const healthConditions =
            assessment.health_conditions
              ?.filter(
                (condition: string) => condition && condition !== "tidak_ada"
              )
              ?.map((condition: string) => ({
                value: condition,
                name: condition,
                description: condition,
                filter: condition,
              })) || [];

          setAssessmentData({
            input: {
              calorie_level: assessment.calorie_level,
              protein_level: assessment.protein_level,
              fat_level: assessment.fat_level,
              carb_level: assessment.carb_level,
              health_condition:
                healthConditions.length > 0 ? healthConditions : null,
            },
            result: {
              mood_prediction: {
                mood: assessment.predicted_mood,
                confidence: assessment.confidence_score,
              },
              food_recommendations: (foods || []).map(
                (food: Record<string, unknown>) => ({
                  food_name: food.food_name as string,
                  calories: food.calories as number,
                  proteins: food.proteins as number,
                  fats: food.fats as number,
                  carbohydrates: food.carbohydrates as number,
                  similarity_score: food.similarity_score as number,
                  mood_category: food.mood_category as string,
                })
              ),
            },
            timestamp: assessment.created_at,
          });
        } else {
          // Guest: ambil dari sessionStorage
          const stored = sessionStorage.getItem("nutrition_assessment");
          if (stored) {
            const data = JSON.parse(stored) as AssessmentData;
            setAssessmentData(data);
          } else {
            router.push("/recommendations/assessment");
            return;
          }
        }
      } catch (err) {
        console.error("Error loading assessment data:", err);
        error("Data Tidak Ditemukan", "Silakan lakukan penilaian ulang.");
        router.push("/recommendations/assessment");
      } finally {
        setIsLoading(false);
      }
    };
    loadAssessmentData();
  }, [router, error, user]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  const handleLikeFood = async (foodName: string) => {
    setLikedFoods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(foodName)) {
        newSet.delete(foodName);
      } else {
        newSet.add(foodName);
      }
      return newSet;
    });

    // Simpan ke database jika user login dan assessmentData ada
    if (user && assessmentData) {
      try {
        // Ambil assessment terbaru dari Supabase (agar dapat id assessment)
        const { data: assessment, error: err1 } = await supabase
          .from("nutrition_assessments")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (err1 || !assessment) return;

        // Cari food_recommendation yang sesuai
        const { data: foodRec } = await supabase
          .from("food_recommendations")
          .select("id, is_liked")
          .eq("user_id", user.id)
          .eq("assessment_id", assessment.id)
          .eq("food_name", foodName)
          .single();

        if (foodRec) {
          const { error: updateError } = await supabase
            .from("food_recommendations")
            .update({ is_liked: !foodRec.is_liked })
            .eq("id", foodRec.id);
          if (updateError) {
            error("Gagal update favorit", updateError.message);
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          error("Gagal update favorit", e.message);
        } else {
          error("Gagal update favorit", "Terjadi error tidak diketahui");
        }
      }
    }
  };
  const handleNewAssessment = () => {
    sessionStorage.removeItem("nutrition_assessment");
    router.push("/recommendations/assessment");
  };

  if (isAuthLoading) return <ResultsSkeleton />;
  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
        <ResultsSkeleton />
      </div>
    );
  }

  if (!assessmentData) {
    return null; // Will redirect to assessment
  }

  const { input, result, timestamp } = assessmentData;
  const levelLabels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi"];

  // Health condition value-to-label mapping
  const healthConditionLabels: Record<string, string> = {
    diabetes: "Diabetes",
    hipertensi: "Hipertensi",
    kolesterol: "Kolesterol Tinggi",
    obesitas: "Obesitas",
    alergi_gluten: "Alergi Gluten",
    vegetarian: "Vegetarian",
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-3 sm:mb-4">
            <Brain className="w-4 h-4 mr-2" />
            Hasil Analisis
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-forest-900 mb-3 sm:mb-4 px-4">
            Rekomendasi Personal Anda
          </h1>
          <p className="text-base sm:text-lg text-sage-700 px-4">
            Berdasarkan analisis pola nutrisi pada{" "}
            {new Date(timestamp).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Mood & Summary */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Mood Prediction Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-earth border border-sage-200 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white">
                {(() => {
                  const IconComponent = getMoodIcon(
                    result.mood_prediction.mood
                  );
                  return <IconComponent className="w-8 h-8 sm:w-10 sm:h-10" />;
                })()}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2">
                Mood Anda Hari Ini
              </h2>
              <div
                className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${getMoodColor(
                  result.mood_prediction.mood
                )}`}
              >
                {result.mood_prediction.mood}
              </div>
              <div className="text-sage-600 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Confidence Score</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-forest-700">
                  {formatConfidence(result.mood_prediction.confidence)}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-sage-600 leading-relaxed">
                Berdasarkan pola nutrisi Anda, AI kami memprediksi mood ini
                dengan tingkat kepercayaan yang tinggi.
              </p>
            </div>
            {/* Input Summary */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-earth border border-sage-200">
              <h3 className="font-semibold text-forest-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                Ringkasan Input Anda
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sage-600 text-sm sm:text-base">
                    Kalori:
                  </span>
                  <span className="font-medium text-forest-700 text-sm sm:text-base">
                    {levelLabels[input.calorie_level]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sage-600 text-sm sm:text-base">
                    Protein:
                  </span>
                  <span className="font-medium text-forest-700 text-sm sm:text-base">
                    {" "}
                    {levelLabels[input.protein_level]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sage-600 text-sm sm:text-base">
                    Lemak:
                  </span>
                  <span className="font-medium text-forest-700 text-sm sm:text-base">
                    {levelLabels[input.fat_level]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sage-600 text-sm sm:text-base">
                    Karbohidrat:
                  </span>
                  <span className="font-medium text-forest-700 text-sm sm:text-base">
                    {levelLabels[input.carb_level]}
                  </span>
                </div>
                {/* Health Condition */}
                {input.health_condition &&
                  Array.isArray(input.health_condition) &&
                  input.health_condition.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                      <span className="text-sage-600 text-sm sm:text-base">
                        Kondisi Kesehatan:
                      </span>
                      <div className="text-left sm:text-right">
                        {input.health_condition.map((condition, index) => (
                          <span
                            key={condition.value}
                            className="font-medium text-forest-700 text-sm sm:text-base break-words"
                          >
                            {healthConditionLabels[condition.value] ||
                              condition.value}
                            {index <
                              (input.health_condition as HealthCondition[])
                                .length -
                                1 && ", "}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {input.health_condition &&
                  !Array.isArray(input.health_condition) && (
                    <div className="flex justify-between items-center">
                      <span className="text-sage-600 text-sm sm:text-base">
                        Kondisi Kesehatan:
                      </span>
                      <span className="font-medium text-forest-700 text-sm sm:text-base break-words">
                        {healthConditionLabels[input.health_condition.value] ||
                          input.health_condition.value}
                      </span>
                    </div>
                  )}
                {(!input.health_condition ||
                  (Array.isArray(input.health_condition) &&
                    input.health_condition.length === 0)) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sage-600 text-sm sm:text-base">
                      Kondisi Kesehatan:
                    </span>
                    <span className="font-medium text-gray-700 text-sm sm:text-base">
                      Tidak Ada
                    </span>
                  </div>
                )}
              </div>
            </div>{" "}
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleNewAssessment}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Analisis Ulang</span>
                <span className="sm:hidden">Analisis Lagi</span>
              </button>
            </div>
          </div>{" "}
          {/* Right Column - Food Recommendations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-earth border border-sage-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-sage-200">
                <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-2">
                  Rekomendasi Makanan Indonesia
                </h2>
                <p className="text-sage-700 text-sm sm:text-base">
                  Makanan yang sesuai dengan mood dan kebutuhan nutrisi Anda
                  hari ini
                </p>
              </div>

              <div className="p-4 sm:p-6">
                {result.food_recommendations &&
                result.food_recommendations.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {result.food_recommendations.map((food, index) => (
                      <div
                        key={index}
                        className="bg-sage-50 rounded-xl p-4 sm:p-6 border border-sage-200 hover:border-sage-300 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-forest-900 mb-2 break-words">
                              {food.food_name}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                              <div className="bg-forest-100 text-forest-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
                                Match:{" "}
                                {(food.similarity_score * 100).toFixed(0)}%
                              </div>
                              <div
                                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${getMoodColor(
                                  food.mood_category
                                )}`}
                              >
                                {food.mood_category}
                              </div>
                            </div>
                          </div>{" "}
                          <div className="flex gap-2 self-start sm:self-auto">
                            <button
                              onClick={() => handleLikeFood(food.food_name)}
                              className={`p-2 rounded-lg transition-colors ${
                                likedFoods.has(food.food_name)
                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                  : "bg-sage-100 text-sage-600 hover:bg-sage-200"
                              }`}
                              title={
                                likedFoods.has(food.food_name)
                                  ? "Hapus dari favorit"
                                  : "Tambah ke favorit"
                              }
                            >
                              <Heart
                                className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                  likedFoods.has(food.food_name)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                            <div className="text-orange-600 font-semibold text-base sm:text-lg">
                              {food.calories.toFixed(0)}
                            </div>
                            <div className="text-sage-600 text-xs sm:text-sm">
                              Kalori
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                            <div className="text-blue-600 font-semibold text-base sm:text-lg">
                              {food.proteins.toFixed(1)}g
                            </div>
                            <div className="text-sage-600 text-xs sm:text-sm">
                              Protein
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                            <div className="text-red-600 font-semibold text-base sm:text-lg">
                              {food.fats.toFixed(1)}g
                            </div>
                            <div className="text-sage-600 text-xs sm:text-sm">
                              Lemak
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                            <div className="text-green-600 font-semibold text-base sm:text-lg">
                              {food.carbohydrates.toFixed(1)}g
                            </div>
                            <div className="text-sage-600 text-xs sm:text-sm">
                              Karbo
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Utensils className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-sage-400 mb-4" />
                    <h3 className="text-xl font-semibold text-sage-600 mb-2">
                      Tidak Ada Rekomendasi
                    </h3>
                    <p className="text-sage-500">
                      Maaf, tidak ada rekomendasi makanan yang sesuai saat ini.
                    </p>
                  </div>
                )}
              </div>
            </div>{" "}
            {/* Next Steps */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Link
                href="/learn"
                className="group bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-sage-200 hover:shadow-earth hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-forest-900 text-sm sm:text-base break-words">
                      <span className="hidden sm:inline">
                        Pelajari Lebih Lanjut
                      </span>
                      <span className="sm:hidden">Pelajari Lebih</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-sage-600">
                      Edukasi nutrisi & mood
                    </p>
                  </div>
                </div>
                <p className="text-sage-700 mb-3 text-sm sm:text-base break-words">
                  Pahami lebih dalam hubungan antara nutrisi dan mood untuk
                  hidup yang lebih sehat.
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all text-sm sm:text-base">
                  <span>Mulai Belajar</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href={user ? "/community" : "/auth/signup"}
                className="group bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-sage-200 hover:shadow-earth hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-forest-900 text-sm sm:text-base break-words">
                      {user ? (
                        <>
                          <span className="hidden sm:inline">
                            Bergabung Komunitas
                          </span>
                          <span className="sm:hidden">Komunitas</span>
                        </>
                      ) : (
                        "Daftar Gratis"
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-sage-600">
                      {user ? "Berbagi pengalaman" : "Akses fitur lengkap"}
                    </p>
                  </div>
                </div>
                <p className="text-sage-700 mb-3 text-sm sm:text-base break-words">
                  {user
                    ? "Berbagi resep, tips, dan pengalaman dengan komunitas NutriMood."
                    : "Simpan riwayat, akses komunitas, dan nikmati fitur lengkap gratis."}
                </p>
                <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all text-sm sm:text-base">
                  <span>
                    {user ? (
                      <>
                        <span className="hidden sm:inline">
                          Lihat Komunitas
                        </span>
                        <span className="sm:hidden">Lihat</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          Daftar Sekarang
                        </span>
                        <span className="sm:hidden">Daftar</span>
                      </>
                    )}
                  </span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>{" "}
        {/* Bottom CTA */}
        {!user && (
          <div className="mt-8 sm:mt-12 bg-gradient-to-r from-forest-600 to-forest-700 rounded-2xl p-6 sm:p-8 text-center text-white">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 px-2">
              <span className="hidden sm:inline">
                Suka dengan rekomendasi ini?
              </span>
              <span className="sm:hidden">Suka rekomendasinya?</span>
            </h3>
            <p className="text-forest-100 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base px-2 break-words">
              <span className="hidden sm:inline">
                Daftar gratis untuk menyimpan riwayat analisis, bergabung dengan
                komunitas, dan mendapatkan rekomendasi yang lebih personal!
              </span>
              <span className="sm:hidden">
                Daftar gratis untuk menyimpan riwayat dan bergabung komunitas!
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              <Link
                href="/auth/signup"
                className="bg-white text-forest-700 px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-forest-50 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Daftar Gratis Sekarang</span>
                <span className="sm:hidden">Daftar Gratis</span>
              </Link>
              <Link
                href="/learn"
                className="border-2 border-forest-200 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:bg-forest-500 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Pelajari Lebih Lanjut</span>
                <span className="sm:hidden">Pelajari</span>
              </Link>
            </div>
          </div>
        )}{" "}
        {/* Tips Section */}
        <div className="mt-8 sm:mt-12 bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-sage-200">
          <h3 className="text-xl sm:text-2xl font-bold text-forest-900 mb-4 sm:mb-6 text-center px-2 break-words">
            <span className="hidden sm:inline">
              Tips Untuk Mood{" "}
              {result.mood_prediction.mood.charAt(0).toUpperCase() +
                result.mood_prediction.mood.slice(1)}
            </span>
            <span className="sm:hidden">
              Tips Mood{" "}
              {result.mood_prediction.mood.charAt(0).toUpperCase() +
                result.mood_prediction.mood.slice(1)}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Utensils className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="font-semibold text-forest-900 mb-2 text-sm sm:text-base">
                Waktu Makan
              </h4>
              <p className="text-sage-700 text-xs sm:text-sm break-words px-2">
                {result.mood_prediction.mood === "energizing"
                  ? "Makan makanan berenergi di pagi atau siang hari untuk hasil optimal."
                  : result.mood_prediction.mood === "relaxing"
                  ? "Konsumsi makanan menenangkan di sore atau malam hari."
                  : "Pilih waktu makan yang sesuai dengan aktivitas Anda."}
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="font-semibold text-forest-900 mb-2 text-sm sm:text-base">
                Porsi Seimbang
              </h4>
              <p className="text-sage-700 text-xs sm:text-sm break-words px-2">
                Perhatikan porsi makanan agar nutrisi seimbang dan mood tetap
                stabil sepanjang hari.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h4 className="font-semibold text-forest-900 mb-2 text-sm sm:text-base">
                Konsistensi
              </h4>
              <p className="text-sage-700 text-xs sm:text-sm break-words px-2">
                Lakukan analisis rutin untuk memahami pola nutrisi dan mood Anda
                dengan lebih baik.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
