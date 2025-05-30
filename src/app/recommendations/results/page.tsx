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
  Clock,
  TrendingUp,
  Utensils,
  ArrowRight,
  Share2,
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
  const { success, error } = useToast();
  const { user, isAuthLoading } = useAuth();

  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(
    null
  );
  const [likedFoods, setLikedFoods] = useState<Set<string>>(new Set());
  const [consumedFoods, setConsumedFoods] = useState<Set<string>>(new Set());
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

  const handleMarkConsumed = (foodName: string) => {
    setConsumedFoods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(foodName)) {
        newSet.delete(foodName);
      } else {
        newSet.add(foodName);
        success("Dicatat!", `${foodName} telah ditandai sudah dimakan.`);
      }
      return newSet;
    });

    // TODO: Save to database if user is logged in
    if (user) {
      // API call to save consumption status
    }
  };

  const handleNewAssessment = () => {
    sessionStorage.removeItem("nutrition_assessment");
    router.push("/recommendations/assessment");
  };

  const handleShareResults = async () => {
    if (navigator.share && assessmentData) {
      try {
        await navigator.share({
          title: "Hasil Analisis NutriMood Saya",
          text: `Mood saya hari ini: ${assessmentData.result.mood_prediction.mood}. Coba analisis nutrisi di NutriMood!`,
          url: window.location.origin,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.origin);
      success("Link Disalin!", "Link NutriMood telah disalin ke clipboard.");
    }
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
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-4">
            <Brain className="w-4 h-4 mr-2" />
            Hasil Analisis
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-forest-900 mb-4">
            Rekomendasi Personal Anda
          </h1>
          <p className="text-lg text-sage-700">
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Mood & Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mood Prediction Card */}
            <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200 text-center">
              {" "}
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white">
                {(() => {
                  const IconComponent = getMoodIcon(
                    result.mood_prediction.mood
                  );
                  return <IconComponent className="w-10 h-10" />;
                })()}
              </div>
              <h2 className="text-2xl font-bold text-forest-900 mb-2">
                Mood Anda Hari Ini
              </h2>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold mb-4 ${getMoodColor(
                  result.mood_prediction.mood
                )}`}
              >
                {result.mood_prediction.mood}
              </div>
              <div className="text-sage-600 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Confidence Score</span>
                </div>
                <div className="text-2xl font-bold text-forest-700">
                  {formatConfidence(result.mood_prediction.confidence)}
                </div>
              </div>
              <p className="text-sm text-sage-600 leading-relaxed">
                Berdasarkan pola nutrisi Anda, AI kami memprediksi mood ini
                dengan tingkat kepercayaan yang tinggi.
              </p>
            </div>

            {/* Input Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-earth border border-sage-200">
              <h3 className="font-semibold text-forest-900 mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Ringkasan Input Anda
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sage-600">Kalori:</span>
                  <span className="font-medium text-forest-700">
                    {levelLabels[input.calorie_level]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sage-600">Protein:</span>
                  <span className="font-medium text-forest-700">
                    {levelLabels[input.protein_level]}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sage-600">Lemak:</span>
                  <span className="font-medium text-forest-700">
                    {levelLabels[input.fat_level]}
                  </span>
                </div>{" "}
                <div className="flex justify-between items-center">
                  <span className="text-sage-600">Karbohidrat:</span>
                  <span className="font-medium text-forest-700">
                    {levelLabels[input.carb_level]}
                  </span>
                </div>{" "}
                {/* Health Condition */}
                {input.health_condition &&
                  Array.isArray(input.health_condition) &&
                  input.health_condition.length > 0 && (
                    <div className="flex justify-between items-start">
                      <span className="text-sage-600">Kondisi Kesehatan:</span>
                      <div className="text-right">
                        {" "}
                        {input.health_condition.map((condition, index) => (
                          <span
                            key={condition.value}
                            className="font-medium text-forest-700"
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
                      <span className="text-sage-600">Kondisi Kesehatan:</span>
                      <span className="font-medium text-forest-700">
                        {healthConditionLabels[input.health_condition.value] ||
                          input.health_condition.value}
                      </span>
                    </div>
                  )}
                {(!input.health_condition ||
                  (Array.isArray(input.health_condition) &&
                    input.health_condition.length === 0)) && (
                  <div className="flex justify-between items-center">
                    <span className="text-sage-600">Kondisi Kesehatan:</span>
                    <span className="font-medium text-gray-700">Tidak Ada</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleNewAssessment}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5" />
                Analisis Ulang
              </button>

              <button
                onClick={handleShareResults}
                className="w-full flex items-center justify-center gap-2 border-2 border-sage-300 text-sage-700 px-6 py-3 rounded-xl font-semibold hover:bg-sage-50 transition-all duration-300"
              >
                <Share2 className="w-5 h-5" />
                Bagikan Hasil
              </button>
            </div>
          </div>

          {/* Right Column - Food Recommendations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-earth border border-sage-200 overflow-hidden">
              <div className="p-6 border-b border-sage-200">
                <h2 className="text-2xl font-bold text-forest-900 mb-2">
                  Rekomendasi Makanan Indonesia
                </h2>
                <p className="text-sage-700">
                  Makanan yang sesuai dengan mood dan kebutuhan nutrisi Anda
                  hari ini
                </p>
              </div>

              <div className="p-6">
                {result.food_recommendations &&
                result.food_recommendations.length > 0 ? (
                  <div className="space-y-6">
                    {result.food_recommendations.map((food, index) => (
                      <div
                        key={index}
                        className={`bg-sage-50 rounded-xl p-6 border transition-all duration-200 hover:shadow-md ${
                          consumedFoods.has(food.food_name)
                            ? "border-green-300 bg-green-50"
                            : "border-sage-200 hover:border-sage-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-forest-900 mb-2">
                              {food.food_name}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm font-medium">
                                Match:{" "}
                                {(food.similarity_score * 100).toFixed(0)}%
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(
                                  food.mood_category
                                )}`}
                              >
                                {food.mood_category}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
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
                                className={`w-5 h-5 ${
                                  likedFoods.has(food.food_name)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => handleMarkConsumed(food.food_name)}
                              className={`p-2 rounded-lg transition-colors ${
                                consumedFoods.has(food.food_name)
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-sage-100 text-sage-600 hover:bg-sage-200"
                              }`}
                              title={
                                consumedFoods.has(food.food_name)
                                  ? "Sudah dimakan"
                                  : "Tandai sudah dimakan"
                              }
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Nutrition Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-orange-600 font-semibold text-lg">
                              {food.calories.toFixed(0)}
                            </div>
                            <div className="text-sage-600">Kalori</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-blue-600 font-semibold text-lg">
                              {food.proteins.toFixed(1)}g
                            </div>
                            <div className="text-sage-600">Protein</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-red-600 font-semibold text-lg">
                              {food.fats.toFixed(1)}g
                            </div>
                            <div className="text-sage-600">Lemak</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center">
                            <div className="text-green-600 font-semibold text-lg">
                              {food.carbohydrates.toFixed(1)}g
                            </div>
                            <div className="text-sage-600">Karbo</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Utensils className="w-16 h-16 mx-auto text-sage-400 mb-4" />
                    <h3 className="text-xl font-semibold text-sage-600 mb-2">
                      Tidak Ada Rekomendasi
                    </h3>
                    <p className="text-sage-500">
                      Maaf, tidak ada rekomendasi makanan yang sesuai saat ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Link
                href="/learn"
                className="group bg-white rounded-xl p-6 shadow-sm border border-sage-200 hover:shadow-earth hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-900">
                      Pelajari Lebih Lanjut
                    </h3>
                    <p className="text-sm text-sage-600">
                      Edukasi nutrisi & mood
                    </p>
                  </div>
                </div>
                <p className="text-sage-700 mb-3">
                  Pahami lebih dalam hubungan antara nutrisi dan mood untuk
                  hidup yang lebih sehat.
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:gap-2 transition-all">
                  <span>Mulai Belajar</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href={user ? "/community" : "/auth/signup"}
                className="group bg-white rounded-xl p-6 shadow-sm border border-sage-200 hover:shadow-earth hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-900">
                      {user ? "Bergabung Komunitas" : "Daftar Gratis"}
                    </h3>
                    <p className="text-sm text-sage-600">
                      {user ? "Berbagi pengalaman" : "Akses fitur lengkap"}
                    </p>
                  </div>
                </div>
                <p className="text-sage-700 mb-3">
                  {user
                    ? "Berbagi resep, tips, dan pengalaman dengan komunitas NutriMood."
                    : "Simpan riwayat, akses komunitas, dan nikmati fitur lengkap gratis."}
                </p>
                <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
                  <span>{user ? "Lihat Komunitas" : "Daftar Sekarang"}</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        {!user && (
          <div className="mt-12 bg-gradient-to-r from-forest-600 to-forest-700 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">
              Suka dengan rekomendasi ini?
            </h3>
            <p className="text-forest-100 mb-6 max-w-2xl mx-auto">
              Daftar gratis untuk menyimpan riwayat analisis, bergabung dengan
              komunitas, dan mendapatkan rekomendasi yang lebih personal!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="bg-white text-forest-700 px-8 py-3 rounded-xl font-semibold hover:bg-forest-50 transition-colors"
              >
                Daftar Gratis Sekarang
              </Link>
              <Link
                href="/learn"
                className="border-2 border-forest-200 text-white px-8 py-3 rounded-xl font-semibold hover:bg-forest-500 transition-colors"
              >
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-sage-200">
          <h3 className="text-2xl font-bold text-forest-900 mb-6 text-center">
            Tips Untuk Mood{" "}
            {result.mood_prediction.mood.charAt(0).toUpperCase() +
              result.mood_prediction.mood.slice(1)}
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-forest-900 mb-2">
                Waktu Makan
              </h4>
              <p className="text-sage-700 text-sm">
                {result.mood_prediction.mood === "energizing"
                  ? "Makan makanan berenergi di pagi atau siang hari untuk hasil optimal."
                  : result.mood_prediction.mood === "relaxing"
                  ? "Konsumsi makanan menenangkan di sore atau malam hari."
                  : "Pilih waktu makan yang sesuai dengan aktivitas Anda."}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-forest-900 mb-2">
                Porsi Seimbang
              </h4>
              <p className="text-sage-700 text-sm">
                Perhatikan porsi makanan agar nutrisi seimbang dan mood tetap
                stabil sepanjang hari.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-forest-900 mb-2">
                Konsistensi
              </h4>
              <p className="text-sage-700 text-sm">
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
