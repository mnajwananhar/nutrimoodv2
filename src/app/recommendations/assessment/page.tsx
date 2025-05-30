"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Zap,
  Target,
  Heart,
  Utensils,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { AssessmentSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";

interface NutritionInput {
  calorie_level: number;
  protein_level: number;
  fat_level: number;
  carb_level: number;
}

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
  const [nutritionInput, setNutritionInput] = useState<NutritionInput>({
    calorie_level: 2, // Default ke medium
    protein_level: 2,
    fat_level: 1, // Default ke low
    carb_level: 2,
  });
  const [selectedHealthConditions, setSelectedHealthConditions] = useState<
    HealthCondition[]
  >([]);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      key: "calorie_level" as keyof NutritionInput,
      title: "Tingkat Kalori Hari Ini",
      description: "Seberapa banyak kalori yang sudah Anda konsumsi hari ini?",
      icon: <Zap className="w-8 h-8" />,
      color: "from-orange-500 to-orange-600",
      info: "Kalori adalah unit energi yang dibutuhkan tubuh untuk beraktivitas. Konsumsi kalori yang tepat mempengaruhi mood dan energi Anda.",
      examples: [
        "Sangat Rendah: < 800 kalori (puasa/diet ketat)",
        "Rendah: 800-1200 kalori (diet ringan)",
        "Sedang: 1200-1800 kalori (normal)",
        "Tinggi: > 1800 kalori (banyak makan)",
      ],
    },
    {
      key: "protein_level" as keyof NutritionInput,
      title: "Tingkat Protein Hari Ini",
      description: "Seberapa banyak protein yang sudah Anda konsumsi hari ini?",
      icon: <Target className="w-8 h-8" />,
      color: "from-forest-500 to-forest-600",
      info: "Protein adalah pembangun otot dan membantu menjaga mood stabil. Kekurangan protein dapat menyebabkan lelah dan mood menurun.",
      examples: [
        "Sangat Rendah: < 20g (hampir tidak ada protein)",
        "Rendah: 20-40g (sedikit daging/ikan)",
        "Sedang: 40-70g (porsi normal)",
        "Tinggi: > 70g (banyak daging/telur/kacang)",
      ],
    },
    {
      key: "fat_level" as keyof NutritionInput,
      title: "Tingkat Lemak Hari Ini",
      description: "Seberapa banyak lemak yang sudah Anda konsumsi hari ini?",
      icon: <Heart className="w-8 h-8" />,
      color: "from-sage-500 to-sage-600",
      info: "Lemak sehat diperlukan untuk fungsi otak dan penyerapan vitamin. Terlalu sedikit lemak dapat mempengaruhi mood dan konsentrasi.",
      examples: [
        "Sangat Rendah: < 20g (hampir bebas lemak)",
        "Rendah: 20-40g (sedikit minyak)",
        "Sedang: 40-70g (normal)",
        "Tinggi: > 70g (gorengan/santan/kacang)",
      ],
    },
    {
      key: "carb_level" as keyof NutritionInput,
      title: "Tingkat Karbohidrat Hari Ini",
      description:
        "Seberapa banyak karbohidrat yang sudah Anda konsumsi hari ini?",
      icon: <Utensils className="w-8 h-8" />,
      color: "from-beige-500 to-beige-600",
      info: "Karbohidrat adalah sumber energi utama otak. Konsumsi yang tepat membantu menjaga mood dan fokus sepanjang hari.",
      examples: [
        "Sangat Rendah: < 50g (keto/low-carb)",
        "Rendah: 50-100g (sedikit nasi/roti)",
        "Sedang: 100-200g (normal)",
        "Tinggi: > 200g (banyak nasi/pasta/gula)",
      ],
    },
  ];

  // Add health condition step
  const allSteps = [
    ...steps,
    {
      key: "health_condition" as const,
      title: "Kondisi Kesehatan",
      description:
        "Pilih kondisi kesehatan yang Anda miliki (bisa lebih dari satu)",
      icon: <Brain className="w-8 h-8" />,
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

  const levelLabels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi"];
  const levelColors = [
    "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
    "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
    "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  ];
  const handleLevelSelect = (level: number) => {
    const currentStepKey = allSteps[currentStep].key;
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
    } else {
      // For nutrition steps
      setNutritionInput((prev) => ({
        ...prev,
        [currentStepKey]: level,
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < allSteps.length - 1) {
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
      // Convert nutrition levels to actual values
      const nutrients = api.convertNutritionLevels(nutritionInput);

      // Call the unified recommend API
      const recommendationData = await api.recommend({
        nutrients,
        health_conditions: selectedHealthConditions.map((hc) => hc.value),
        top_n: 5,
      });

      // 3. Simpan ke Supabase jika user login
      let assessmentId = null;
      if (user) {
        // Prepare health conditions array
        const healthConditionsArray =
          selectedHealthConditions.length > 0
            ? selectedHealthConditions.map((condition) => condition.value)
            : ["tidak_ada"];

        // Insert assessment ke database with health conditions as TEXT[] array
        const { data: assessment, error: err1 } = await supabase
          .from("nutrition_assessments")
          .insert([
            {
              user_id: user.id,
              calorie_level: nutritionInput.calorie_level,
              protein_level: nutritionInput.protein_level,
              fat_level: nutritionInput.fat_level,
              carb_level: nutritionInput.carb_level,
              health_conditions: healthConditionsArray,
              predicted_mood: recommendationData.predicted_mood,
              confidence_score:
                Math.max(
                  ...Object.values(recommendationData.mood_probabilities)
                ) * 100,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();
        if (err1) throw err1;
        assessmentId = assessment.id;

        // Insert food recommendations
        for (const food of recommendationData.recommendations) {
          const { error: err2 } = await supabase
            .from("food_recommendations")
            .insert([
              {
                assessment_id: assessmentId,
                user_id: user.id,
                food_name: food.name,
                calories: food.calories,
                proteins: food.proteins,
                fats: food.fat,
                carbohydrates: food.carbohydrate,
                mood_category: food.primary_mood,
                similarity_score: food.similarity_score || 0,
                is_liked: false,
                is_consumed: false,
                created_at: new Date().toISOString(),
              },
            ]);
          if (err2) {
            console.error("Insert food_recommendations error:", err2);
          }
        }
      }

      // 4. Simpan hasil ke sessionStorage untuk halaman results
      sessionStorage.setItem(
        "nutrition_assessment",
        JSON.stringify({
          input: {
            ...nutritionInput,
            health_condition: selectedHealthConditions,
          },
          result: {
            mood_prediction: {
              mood: recommendationData.predicted_mood,
              confidence:
                Math.max(
                  ...Object.values(recommendationData.mood_probabilities)
                ) * 100,
              mood_probabilities: recommendationData.mood_probabilities,
            },
            food_recommendations: recommendationData.recommendations.map(
              (food) => ({
                food_name: food.name,
                calories: food.calories,
                proteins: food.proteins,
                fat: food.fat, // fix: gunakan 'fat' bukan 'fats'
                carbohydrate: food.carbohydrate, // fix: gunakan 'carbohydrate' bukan 'carbohydrates'
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
  const currentStepData = allSteps[currentStep];
  const currentValue =
    currentStepData.key === "health_condition"
      ? selectedHealthConditions.length === 0
        ? healthConditions.length // "Tidak Ada" option
        : -1 // Multiple selections, no single value
      : nutritionInput[currentStepData.key as keyof NutritionInput];
  const progress = ((currentStep + 1) / allSteps.length) * 100;
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
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-beige-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-4">
            <Brain className="w-4 h-4 mr-2" />
            Analisis Nutrisi & Mood
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-forest-900 mb-4">
            Penilaian Nutrisi Harian
          </h1>
          <p className="text-xl text-sage-700 max-w-2xl mx-auto">
            Jawab beberapa pertanyaan tentang konsumsi nutrisi Anda hari ini
            untuk mendapatkan rekomendasi makanan yang tepat.
          </p>
        </div>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-sage-600 mb-2">
            <span>
              Langkah {currentStep + 1} dari {allSteps.length}
            </span>
            <span>{Math.round(progress)}% selesai</span>
          </div>
          <div className="w-full bg-sage-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-forest-500 to-forest-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-earth border border-sage-200 overflow-hidden">
          {/* Step Header */}
          <div className="p-8 text-center border-b border-sage-200">
            <div
              className={`w-20 h-20 bg-gradient-to-r ${currentStepData.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-6`}
            >
              {currentStepData.icon}
            </div>
            <h2 className="text-3xl font-bold text-forest-900 mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-sage-700">
              {currentStepData.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="p-8">
            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Informasi:
                  </h4>
                  <p className="text-blue-800 mb-3">{currentStepData.info}</p>
                  <div className="space-y-1">
                    {currentStepData.examples.map((example, index) => (
                      <p key={index} className="text-sm text-blue-700">
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
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {" "}
                {/* "Tidak Ada" option */}
                <button
                  onClick={() => handleLevelSelect(healthConditions.length)}
                  className={`
                    p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105                    ${
                      selectedHealthConditions.length === 0
                        ? "bg-forest-100 text-forest-700 border-forest-300 hover:bg-forest-150 scale-105 shadow-lg ring-2 ring-offset-2 ring-forest-500"
                        : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`font-semibold text-lg mb-1 ${
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
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
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
                {/* Health condition options */}
                {healthConditions.map((condition, index) => {
                  const isSelected = selectedHealthConditions.some(
                    (hc) => hc.value === condition.value
                  );
                  return (
                    <button
                      key={condition.value}
                      onClick={() => handleLevelSelect(index)}
                      className={`
                        p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105                        ${
                          isSelected
                            ? "bg-forest-100 text-forest-700 border-forest-300 hover:bg-forest-150 scale-105 shadow-lg ring-2 ring-offset-2 ring-forest-500"
                            : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3
                            className={`font-semibold text-lg mb-1 ${
                              isSelected ? "" : "text-sage-900"
                            }`}
                          >
                            {condition.name}
                          </h3>
                          <p
                            className={`text-sm ${
                              isSelected ? "" : "text-sage-700"
                            }`}
                          >
                            {condition.description}
                          </p>
                        </div>{" "}
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                            isSelected
                              ? "border-forest-600 bg-forest-600"
                              : "border-sage-300"
                          }`}
                        >
                          {" "}
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              // Nutrition Level Selection
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {levelLabels.map((label, index) => (
                  <button
                    key={index}
                    onClick={() => handleLevelSelect(index)}
                    className={`
                      p-6 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105
                      ${
                        currentValue === index
                          ? levelColors[index] +
                            " scale-105 shadow-lg ring-2 ring-offset-2 ring-forest-500"
                          : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className={`font-semibold text-lg mb-1 ${
                            currentValue === index ? "" : "text-sage-900"
                          }`}
                        >
                          {label}
                        </h3>
                        <p
                          className={`text-sm ${
                            currentValue === index ? "" : "text-sage-700"
                          }`}
                        >
                          {currentStepData.examples[index].split(": ")[1]}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          currentValue === index
                            ? "border-current bg-current"
                            : "border-sage-300"
                        }`}
                      >
                        {currentValue === index && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 text-sage-600 hover:text-forest-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
                Sebelumnya
              </button>

              <div className="flex gap-2">
                {allSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
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
                className="flex items-center gap-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menganalisis...
                  </>
                ) : currentStep === allSteps.length - 1 ? (
                  <>
                    Dapatkan Rekomendasi
                    <Brain className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Selanjutnya
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>{" "}
        {/* Summary Card */}
        {currentStep > 0 && (
          <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-sage-200">
            <h3 className="font-semibold text-forest-900 mb-3">
              Ringkasan Input Anda:
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps
                .slice(0, Math.min(currentStep + 1, steps.length))
                .map((step) => (
                  <div key={step.key} className="text-center">
                    <div className="text-sm text-sage-600 mb-1">
                      {step.title.replace(" Hari Ini", "")}
                    </div>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        levelColors[nutritionInput[step.key]]
                      }`}
                    >
                      {levelLabels[nutritionInput[step.key]]}
                    </div>
                  </div>
                ))}
              {/* Show health condition if we're on or past that step */}{" "}
              {currentStep >= steps.length && (
                <div className="text-center">
                  {" "}
                  <div className="text-sm text-sage-600 mb-1">
                    Kondisi Kesehatan
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-forest-100 text-forest-700 border border-forest-200">
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
