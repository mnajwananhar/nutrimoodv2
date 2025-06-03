"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Zap,
  Target,
  Heart,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
  Smile,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";

interface HealthCondition {
  value: string;
  name: string;
  description: string;
  filter: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const { user, isAuthLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedHealthConditions, setSelectedHealthConditions] = useState<
    HealthCondition[]
  >([]);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  // Define available moods
  const moods = [
    {
      value: "energizing",
      name: "Energizing",
      description: "Saya ingin merasa berenergi dan bersemangat",
      icon: <Zap className="w-8 h-8" />,
      color: "from-orange-500 to-orange-600",
      info: "Mood energizing cocok untuk aktivitas fisik, olahraga, atau ketika Anda butuh dorongan semangat ekstra.",
    },
    {
      value: "relaxing",
      name: "Relaxing",
      description: "Saya ingin merasa tenang dan rileks",
      icon: <Smile className="w-8 h-8" />,
      color: "from-blue-500 to-blue-600",
      info: "Mood relaxing membantu menenangkan pikiran, mengurangi stres, dan memberikan rasa damai.",
    },
    {
      value: "focusing",
      name: "Focusing",
      description: "Saya ingin meningkatkan konsentrasi dan fokus",
      icon: <Target className="w-8 h-8" />,
      color: "from-green-500 to-green-600",
      info: "Mood focusing membantu meningkatkan konsentrasi untuk bekerja, belajar, atau aktivitas yang membutuhkan fokus tinggi.",
    },
    {
      value: "neutral",
      name: "Neutral",
      description: "Saya ingin menjaga keseimbangan mood",
      icon: <Heart className="w-8 h-8" />,
      color: "from-sage-500 to-sage-600",
      info: "Mood neutral membantu menjaga keseimbangan emosi dan cocok untuk aktivitas sehari-hari.",
    },
  ];

  const steps = [
    {
      key: "mood_selection",
      title: "Pilih Mood yang Diinginkan",
      description: "Bagaimana mood yang ingin Anda rasakan hari ini?",
      icon: <Brain className="w-8 h-8" />,
      color: "from-forest-500 to-forest-600",
      info: "Pilih mood yang sesuai dengan aktivitas atau perasaan yang ingin Anda capai. Setiap mood akan memberikan rekomendasi makanan yang berbeda.",
      examples: [
        "Energizing: Untuk aktivitas fisik dan produktivitas",
        "Relaxing: Untuk ketenangan dan relaksasi",
        "Focusing: Untuk konsentrasi dan fokus",
        "Neutral: Untuk keseimbangan mood harian",
      ],
    },
    {
      key: "health_condition",
      title: "Kondisi Kesehatan",
      description:
        "Pilih kondisi kesehatan yang Anda miliki (bisa lebih dari satu)",
      icon: <Heart className="w-8 h-8" />,
      color: "from-forest-500 to-forest-600",
      info: "Kondisi kesehatan tertentu memerlukan perhatian khusus dalam pemilihan makanan. Anda dapat memilih lebih dari satu kondisi untuk mendapatkan rekomendasi yang lebih tepat.",
      examples: [
        "Tidak Ada: Semua makanan akan direkomendasikan",
        "Diabetes: Fokus pada makanan rendah gula dan karbohidrat",
        "Hipertensi: Fokus pada makanan rendah sodium",
        "Kolesterol: Fokus pada makanan rendah lemak jenuh",
      ],
    },
  ];

  const handleLevelSelect = (level: number) => {
    const currentStepKey = steps[currentStep].key;
    if (currentStepKey === "health_condition") {
      // For health condition step, level represents the index in healthConditions array
      if (level < healthConditions.length) {
        const selectedCondition = healthConditions[level];
        setSelectedHealthConditions((prev) => {
          const isAlreadySelected = prev.some(
            (condition) => condition.value === selectedCondition.value
          );
          if (isAlreadySelected) {
            // Remove if already selected
            return prev.filter(
              (condition) => condition.value !== selectedCondition.value
            );
          } else {
            // Add if not selected
            return [...prev, selectedCondition];
          }
        });
      } else if (level === healthConditions.length) {
        // "Tidak Ada" option - clear all selections
        setSelectedHealthConditions([]);
      }
    } else if (currentStepKey === "mood_selection") {
      // For mood selection step, level represents the index in moods array
      if (level < moods.length) {
        setSelectedMood(moods[level].value);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!selectedMood) {
        throw new Error("Silakan pilih mood terlebih dahulu");
      } // Call the API with selected mood
      const recommendationData = await api.recommend({
        mood: selectedMood,
        health_conditions: selectedHealthConditions.map((hc) => hc.value),
        top_n: 5,
      }); // Simpan ke Supabase jika user login
      if (user) {
        // Insert assessment dengan mood sebagai input utama (NEW FLOW)
        const healthConditionsArray = selectedHealthConditions.map(
          (hc) => hc.value
        );

        const { data: assessment, error: err1 } = await supabase
          .from("nutrition_assessments")
          .insert([
            {
              user_id: user.id, // NEW FLOW: User selects mood directly
              selected_mood: selectedMood, // User-selected mood (primary input)
              predicted_mood: recommendationData.mood, // Same as selected for consistency
              confidence_score: 95, // High confidence since user directly chose mood
              health_conditions: healthConditionsArray,
              // Calculate nutrition levels from food recommendations
              ...(() => {
                const levels = calculateNutritionLevels(
                  recommendationData.recommendations
                );
                return {
                  calorie_level: levels.calorie,
                  protein_level: levels.protein,
                  fat_level: levels.fat,
                  carb_level: levels.carb,
                };
              })(),
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();
        if (err1) throw err1; // Insert food recommendations
        for (const food of recommendationData.recommendations) {
          const { error: err2 } = await supabase
            .from("food_recommendations")
            .insert([
              {
                assessment_id: assessment.id,
                user_id: user.id,
                food_name: food.name,
                calories: food.calories,
                proteins: food.proteins,
                fats: food.fat, // Backend returns 'fat', database expects 'fats'
                carbohydrates: food.carbohydrate, // Backend returns 'carbohydrate', database expects 'carbohydrates'
                mood_category: food.primary_mood,
                similarity_score: food.similarity_score || 0,
                is_liked: false,
                is_consumed: false,
                created_at: new Date().toISOString(),
              },
            ]);
          if (err2) {
            console.error("Insert food_recommendations error:", err2);
            // Don't throw here, just log the error and continue with other foods
          }
        }
      }

      // Simpan hasil ke sessionStorage
      sessionStorage.setItem(
        "nutrition_assessment",
        JSON.stringify({
          input: {
            selected_mood: selectedMood,
            health_condition: selectedHealthConditions,
            // Set default nutrition levels
            calorie_level: 2,
            protein_level: 2,
            fat_level: 2,
            carb_level: 2,
          },
          result: {
            mood_prediction: {
              mood: recommendationData.mood, // Fixed: use mood instead of predicted_mood
              confidence: 95, // Fixed: set default confidence since backend doesn't return probabilities
            },
            food_recommendations: recommendationData.recommendations.map(
              (food) => ({
                food_name: food.name,
                calories: food.calories,
                proteins: food.proteins,
                fats: food.fat, // Keep consistent with database field naming
                carbohydrates: food.carbohydrate, // Keep consistent with database field naming
                similarity_score: food.similarity_score || 0,
                mood_category: food.primary_mood,
              })
            ),
          },
          timestamp: new Date().toISOString(),
        })
      );

      success("Analisis Berhasil!", "Redirecting ke halaman hasil...");
      setTimeout(() => {
        router.push("/recommendations/results");
      }, 1000);
    } catch (err: unknown) {
      console.error("Assessment error:", err);
      error(
        "Gagal Menganalisis",
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses data Anda. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };
  const currentStepData = steps[currentStep];
  const currentValue =
    currentStepData.key === "health_condition"
      ? selectedHealthConditions.length === 0
        ? healthConditions.length // "Tidak Ada" option
        : -1 // Multiple selections, no single value
      : currentStepData.key === "mood_selection"
      ? selectedMood
        ? moods.findIndex((m) => m.value === selectedMood)
        : undefined
      : undefined;
  const progress = ((currentStep + 1) / steps.length) * 100;
  // Load health conditions
  useEffect(() => {
    const loadHealthConditions = () => {
      // Based on the backend health_mapping, these are the supported conditions
      const conditions: HealthCondition[] = [
        {
          value: "diabetes",
          name: "Diabetes",
          description: "Kondisi gula darah tinggi",
          filter: "low_carb",
        },
        {
          value: "hipertensi",
          name: "Hipertensi",
          description: "Tekanan darah tinggi",
          filter: "low_sodium",
        },
        {
          value: "kolesterol",
          name: "Kolesterol Tinggi",
          description: "Kadar kolesterol dalam darah tinggi",
          filter: "low_fat",
        },
        {
          value: "obesitas",
          name: "Obesitas",
          description: "Kelebihan berat badan",
          filter: "low_calorie",
        },
        {
          value: "alergi_gluten",
          name: "Alergi Gluten",
          description: "Tidak dapat mengonsumsi gluten",
          filter: "gluten_free",
        },
        {
          value: "vegetarian",
          name: "Vegetarian",
          description: "Tidak mengonsumsi daging",
          filter: "vegetarian",
        },
      ];
      setHealthConditions(conditions);
    };

    loadHealthConditions();
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) return <AssessmentSkeleton />;
  if (!user) return null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-3 sm:mb-4">
            <Brain className="w-4 h-4 mr-2" />
            Analisis Nutrisi & Mood
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-forest-900 mb-3 sm:mb-4 px-4">
            Penilaian Nutrisi Harian
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-sage-700 max-w-2xl mx-auto px-4">
            Jawab beberapa pertanyaan tentang konsumsi nutrisi Anda hari ini
            untuk mendapatkan rekomendasi makanan yang tepat.
          </p>
        </div>
        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between text-sm text-sage-600 mb-2">
            {" "}
            <span>
              Langkah {currentStep + 1} dari {steps.length}
            </span>
            <span>{Math.round(progress)}% selesai</span>
          </div>
          <div className="w-full bg-sage-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-forest-500 to-forest-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>{" "}
        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 overflow-hidden">
          {/* Step Header */}
          <div className="p-4 sm:p-6 lg:p-8 text-center border-b border-sage-200">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${currentStepData.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6`}
            >
              {currentStepData.icon}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-forest-900 mb-2 sm:mb-3 px-4">
              {currentStepData.title}
            </h2>
            <p className="text-base sm:text-lg text-sage-700 px-4">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {" "}
            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                    Informasi:
                  </h4>
                  <p className="text-blue-800 mb-3 text-sm sm:text-base">
                    {currentStepData.info}
                  </p>
                  <div className="space-y-1">
                    {currentStepData.examples.map((example, index) => (
                      <p
                        key={index}
                        className="text-xs sm:text-sm text-blue-700"
                      >
                        • {example}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* Level Selection */}
            {currentStepData.key === "health_condition" ? (
              // Health Condition Selection
              <div className="grid gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* "Tidak Ada" option */}
                <button
                  onClick={() => handleLevelSelect(healthConditions.length)}
                  className={`
                    p-4 sm:p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105                    ${
                      selectedHealthConditions.length === 0
                        ? "bg-forest-100 text-forest-700 border-forest-300 hover:bg-forest-150 scale-105 shadow-lg ring-2 ring-offset-2 ring-forest-500"
                        : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-semibold text-base sm:text-lg mb-1 ${
                          selectedHealthConditions.length === 0
                            ? ""
                            : "text-sage-900"
                        }`}
                      >
                        Tidak Ada
                      </h3>
                      <p
                        className={`text-sm ${
                          selectedHealthConditions.length === 0
                            ? ""
                            : "text-sage-700"
                        }`}
                      >
                        Tidak memiliki kondisi kesehatan khusus
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                        selectedHealthConditions.length === 0
                          ? "border-forest-600 bg-forest-600"
                          : "border-sage-300"
                      }`}
                    >
                      {selectedHealthConditions.length === 0 && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
                {/* Health condition options */}{" "}
                {healthConditions.map((condition, index) => {
                  const isSelected = selectedHealthConditions.some(
                    (hc) => hc.value === condition.value
                  );
                  return (
                    <button
                      key={condition.value}
                      onClick={() => handleLevelSelect(index)}
                      className={`
                        p-4 sm:p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105
                        ${
                          isSelected
                            ? "bg-forest-100 text-forest-700 border-forest-300 hover:bg-forest-150 scale-105 shadow-lg ring-2 ring-offset-2 ring-forest-500"
                            : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-semibold text-base sm:text-lg mb-1 ${
                              isSelected ? "" : "text-sage-900"
                            }`}
                          >
                            {condition.name}
                          </h3>
                          <p
                            className={`text-sm break-words ${
                              isSelected ? "" : "text-sage-700"
                            }`}
                          >
                            {condition.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                            isSelected
                              ? "border-forest-600 bg-forest-600"
                              : "border-sage-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          )}{" "}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Mood Selection
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {moods.map((mood, index) => (
                  <button
                    key={mood.value}
                    onClick={() => handleLevelSelect(index)}
                    className={`
                      p-4 sm:p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105
                      ${
                        currentValue === index
                          ? `bg-gradient-to-r ${mood.color} text-white border-transparent scale-105 shadow-lg ring-2 ring-offset-2 ring-forest-500`
                          : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={
                              currentValue === index
                                ? "text-white"
                                : "text-sage-600"
                            }
                          >
                            {mood.icon}
                          </div>
                          <h3
                            className={`font-semibold text-base sm:text-lg ${
                              currentValue === index
                                ? "text-white"
                                : "text-sage-900"
                            }`}
                          >
                            {mood.name}
                          </h3>
                        </div>
                        <p
                          className={`text-sm break-words ${
                            currentValue === index
                              ? "text-white/90"
                              : "text-sage-700"
                          }`}
                        >
                          {mood.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                          currentValue === index
                            ? "border-white bg-white"
                            : "border-sage-300"
                        }`}
                      >
                        {currentValue === index && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}{" "}
            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 sm:px-6 py-3 text-sage-600 hover:text-forest-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sebelumnya</span>
                <span className="sm:hidden">Kembali</span>
              </button>{" "}
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-forest-600"
                        : index < currentStep
                        ? "bg-forest-400"
                        : "bg-sage-300"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={currentValue === undefined || isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Menganalisis...</span>
                    <span className="sm:hidden">Loading...</span>
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>
                    <span className="hidden sm:inline">
                      Dapatkan Rekomendasi
                    </span>
                    <span className="sm:hidden">Analisis</span>
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <span className="sm:hidden">Lanjut</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>{" "}
        {/* Summary Card */}
        {currentStep > 0 && (
          <div className="mt-6 sm:mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-sage-200">
            <h3 className="font-semibold text-forest-900 mb-3 text-base sm:text-lg">
              Ringkasan Input Anda:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Show mood if selected */}
              {selectedMood && (
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-sage-600 mb-1">
                    Mood Yang Dipilih
                  </div>
                  <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-forest-100 text-forest-700 border border-forest-200">
                    {moods.find((m) => m.value === selectedMood)?.name ||
                      selectedMood}
                  </div>
                </div>
              )}
              {/* Show health condition if we're on or past that step */}
              {currentStep >= 1 && (
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-sage-600 mb-1">
                    Kondisi Kesehatan
                  </div>
                  <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-forest-100 text-forest-700 border border-forest-200 break-words">
                    {selectedHealthConditions.length > 0
                      ? selectedHealthConditions.map((hc) => hc.name).join(", ")
                      : "Tidak Ada"}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to calculate nutrition levels from food recommendations
const calculateNutritionLevels = (
  recommendations: Array<{
    calories?: number;
    proteins?: number;
    fat?: number;
    carbohydrate?: number;
  }>
) => {
  if (!recommendations || recommendations.length === 0) {
    return { calorie: 2, protein: 2, fat: 2, carb: 2 }; // default medium
  } // Calculate average nutrition values from recommendations
  const totals = recommendations.reduce(
    (acc, food) => ({
      calories: (acc.calories || 0) + (food.calories || 0),
      proteins: (acc.proteins || 0) + (food.proteins || 0),
      fat: (acc.fat || 0) + (food.fat || 0),
      carbohydrate: (acc.carbohydrate || 0) + (food.carbohydrate || 0),
    }),
    { calories: 0, proteins: 0, fat: 0, carbohydrate: 0 }
  );
  const avgCalories = (totals.calories || 0) / recommendations.length;
  const avgProteins = (totals.proteins || 0) / recommendations.length;
  const avgFats = (totals.fat || 0) / recommendations.length;
  const avgCarbs = (totals.carbohydrate || 0) / recommendations.length;

  // Convert to levels (0-3 scale)
  // These thresholds can be adjusted based on nutritional guidelines
  const calorieLevel =
    avgCalories < 200 ? 0 : avgCalories < 400 ? 1 : avgCalories < 600 ? 2 : 3;
  const proteinLevel =
    avgProteins < 10 ? 0 : avgProteins < 20 ? 1 : avgProteins < 30 ? 2 : 3;
  const fatLevel = avgFats < 5 ? 0 : avgFats < 15 ? 1 : avgFats < 25 ? 2 : 3;
  const carbLevel =
    avgCarbs < 30 ? 0 : avgCarbs < 60 ? 1 : avgCarbs < 90 ? 2 : 3;

  return {
    calorie: calorieLevel,
    protein: proteinLevel,
    fat: fatLevel,
    carb: carbLevel,
  };
};
