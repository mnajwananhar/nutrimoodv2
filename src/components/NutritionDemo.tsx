"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Utensils,
  Zap,
  Target,
  Loader2,
  User,
  Smile,
  HelpCircle,
  Flame,
  Beef,
  Droplets,
  Wheat,
  Check,
  Moon,
  Minus,
} from "lucide-react";
import { api } from "@/lib/api";

interface HealthCondition {
  value: string;
  name: string;
  description: string;
  filter: string;
}

interface MoodOption {
  value: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface AnalysisResult {
  food_recommendations: Array<{
    food_name: string;
    calories: number;
    proteins: number;
    fat: number;
    carbohydrate: number;
    primary_mood: string;
    similarity_score?: number;
  }>;
  mood: string;
  message: string;
}

export default function NutritionDemo() {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedHealthConditions, setSelectedHealthConditions] = useState<
    HealthCondition[]
  >([]);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Define mood options
  const moodOptions: MoodOption[] = [
    {
      value: "energizing",
      name: "Energizing",
      description: "Ingin merasa berenergi dan aktif",
      icon: <Zap className="w-6 h-6" />,
      color: "text-yellow-700",
      bgColor: "bg-yellow-100 border-yellow-300",
    },
    {
      value: "relaxing",
      name: "Relaxing",
      description: "Ingin merasa tenang dan santai",
      icon: <Moon className="w-6 h-6" />,
      color: "text-blue-700",
      bgColor: "bg-blue-100 border-blue-300",
    },
    {
      value: "focusing",
      name: "Focusing",
      description: "Ingin meningkatkan fokus dan konsentrasi",
      icon: <Target className="w-6 h-6" />,
      color: "text-purple-700",
      bgColor: "bg-purple-100 border-purple-300",
    },
    {
      value: "neutral",
      name: "Neutral",
      description: "Mood seimbang, tidak ada preferensi khusus",
      icon: <Minus className="w-6 h-6" />,
      color: "text-gray-700",
      bgColor: "bg-gray-100 border-gray-300",
    },
  ];

  // Fetch health conditions on component mount
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

  const getMoodDescription = (mood: string) => {
    const descriptions: Record<string, string> = {
      energizing:
        "Mood energizing - cocok untuk aktivitas fisik dan produktivitas tinggi",
      relaxing: "Mood relaxing - cocok untuk istirahat dan relaksasi",
      focusing:
        "Mood focusing - cocok untuk aktivitas yang membutuhkan konsentrasi",
      neutral: "Mood netral - kondisi mood seimbang",
    };
    return descriptions[mood] || "Mood tidak dikenali";
  };

  const validateMoodSelection = () => {
    if (!selectedMood) {
      return "Pilih mood yang diinginkan untuk mendapatkan rekomendasi makanan";
    }
    return null;
  };

  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
    setResult(null);
    setError(null);
  };

  const handleHealthConditionChange = (condition: HealthCondition) => {
    setSelectedHealthConditions((prev) => {
      const isAlreadySelected = prev.some((hc) => hc.value === condition.value);
      if (isAlreadySelected) {
        return prev.filter((hc) => hc.value !== condition.value);
      } else {
        return [...prev, condition];
      }
    });
    setResult(null);
    setError(null);
  };

  const handleClearHealthConditions = () => {
    setSelectedHealthConditions([]);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    const validationError = validateMoodSelection();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("DEBUG: Selected mood:", selectedMood);
      console.log(
        "DEBUG: Selected health conditions:",
        selectedHealthConditions
      );

      // Call the unified recommend API with mood
      const recommendationData = await api.recommend({
        mood: selectedMood,
        health_conditions: selectedHealthConditions.map((hc) => hc.value),
        top_n: 5,
      });

      console.log("DEBUG: Recommendation result:", recommendationData);

      // Set hasil ke state dengan format yang sesuai backend API
      setResult({
        mood: recommendationData.mood,
        message: recommendationData.message,
        food_recommendations: recommendationData.recommendations.map(
          (food) => ({
            food_name: food.name,
            calories: food.calories,
            proteins: food.proteins,
            fat: food.fat,
            carbohydrate: food.carbohydrate,
            primary_mood: food.primary_mood,
            similarity_score: food.similarity_score,
          })
        ),
      });
    } catch (err: unknown) {
      console.error("Error in handlePredict:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses data. Pastikan backend server berjalan.";
      if (/autentikasi|401|unauth/i.test(errorMsg)) {
        // Ignore authentication errors for the public demo
        setError(null);
        return;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMoodSelector = () => {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-sage-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-forest-100 rounded-lg flex items-center justify-center text-forest-600">
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-forest-900 text-sm sm:text-base">
              Pilih Mood yang Diinginkan
            </h3>
            <p className="text-xs sm:text-sm text-sage-600">
              Pilih mood yang ingin Anda capai hari ini
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodChange(mood.value)}
              className={`
                p-4 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left
                ${
                  selectedMood === mood.value
                    ? `${mood.bgColor} ${mood.color} scale-105 shadow-md`
                    : "bg-gray-50 text-sage-900 border-gray-200 hover:bg-gray-100"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${
                    selectedMood === mood.value
                      ? mood.bgColor.replace("100", "200")
                      : "bg-gray-200"
                  }
                `}
                >
                  {mood.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base">
                    {mood.name}
                  </div>
                  <div className="text-xs text-current opacity-75 mt-1">
                    {mood.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHealthConditions = () => {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-sage-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-forest-900 text-sm sm:text-base">
                Kondisi Kesehatan (Opsional)
              </h3>
              <p className="text-xs sm:text-sm text-sage-600">
                Pilih kondisi kesehatan yang Anda miliki
              </p>
            </div>
          </div>
          {selectedHealthConditions.length > 0 && (
            <button
              onClick={handleClearHealthConditions}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Hapus Semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {healthConditions.map((condition) => (
            <button
              key={condition.value}
              onClick={() => handleHealthConditionChange(condition)}
              className={`
                p-3 sm:p-4 rounded-lg border text-left transition-all duration-200 text-sm
                ${
                  selectedHealthConditions.some(
                    (hc) => hc.value === condition.value
                  )
                    ? "bg-blue-100 border-blue-300 text-blue-800"
                    : "bg-gray-50 border-gray-200 text-sage-900 hover:bg-gray-100"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm">
                    {condition.name}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {condition.description}
                  </div>
                </div>
                {selectedHealthConditions.some(
                  (hc) => hc.value === condition.value
                ) && <Check className="w-4 h-4 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderActionButton = () => {
    return (
      <div className="flex justify-center">
        <button
          onClick={handlePredict}
          disabled={isLoading || !selectedMood}
          className="bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">
                Menganalisis Mood Anda...
              </span>
              <span className="sm:hidden">Menganalisis...</span>
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              <span className="hidden sm:inline">
                Analisis Mood & Dapatkan Rekomendasi
              </span>
              <span className="sm:hidden">Analisis Mood</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Mood Result */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 sm:p-6 lg:p-8 border border-orange-200">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg">
              {result.mood === "energizing" ? (
                <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : result.mood === "relaxing" ? (
                <Moon className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : result.mood === "focusing" ? (
                <Target className="w-6 h-6 sm:w-8 sm:h-8" />
              ) : (
                <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg sm:text-2xl font-bold text-forest-900 mb-2">
                Mood yang Dipilih:{" "}
                <span className="text-orange-600 capitalize">
                  {result.mood}
                </span>
              </h4>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 sm:p-4 text-orange-800 mb-4 sm:mb-6 text-sm sm:text-base">
            {getMoodDescription(result.mood)}
          </div>

          {selectedHealthConditions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-blue-800 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  Kondisi Kesehatan:{" "}
                  {selectedHealthConditions.map((hc) => hc.name).join(", ")}
                </span>
              </div>
              <div className="space-y-2">
                {selectedHealthConditions.map((condition, index) => (
                  <div key={index}>
                    <p className="text-xs sm:text-sm">
                      {condition.description}
                    </p>
                    <p className="text-xs mt-1 text-blue-600">
                      Filter: {condition.filter}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Food Recommendations */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-earth border border-sage-200">
          <h4 className="text-lg sm:text-2xl font-bold text-forest-900 mb-4 sm:mb-6 text-center">
            Rekomendasi Makanan
          </h4>

          {result.food_recommendations &&
          result.food_recommendations.length > 0 ? (
            <div className="space-y-4">
              <div className="text-center mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-sage-600">
                  Makanan yang direkomendasikan untuk mood{" "}
                  <span className="font-semibold text-orange-600 capitalize">
                    {result.mood}
                  </span>
                  {selectedHealthConditions.length > 0 && (
                    <>
                      {" "}
                      dengan filter untuk kondisi{" "}
                      <span className="font-semibold text-blue-600">
                        {selectedHealthConditions
                          .map((hc) => hc.name)
                          .join(", ")}
                      </span>
                    </>
                  )}
                </p>
                {result.message && (
                  <p className="text-xs sm:text-sm text-sage-500 mt-2">
                    {result.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4">
                {result.food_recommendations.map((food, index) => (
                  <div
                    key={index}
                    className="bg-sage-50 rounded-xl p-4 sm:p-6 border border-sage-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3">
                          <h5 className="text-base sm:text-lg font-bold text-forest-900">
                            {food.food_name}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            <div className="bg-forest-100 text-forest-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium capitalize">
                              {food.primary_mood.replace("_", " ")}
                            </div>
                            {food.similarity_score && (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                Similarity:{" "}
                                {(food.similarity_score * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3">
                            <span className="text-sage-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Kalori</span>
                              <span className="sm:hidden">Kal</span>
                            </span>
                            <span className="font-semibold text-forest-700 text-xs sm:text-sm">
                              {food.calories.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3">
                            <span className="text-sage-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <Beef className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Protein</span>
                              <span className="sm:hidden">Prot</span>
                            </span>
                            <span className="font-semibold text-forest-700 text-xs sm:text-sm">
                              {food.proteins.toFixed(1)}g
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3">
                            <span className="text-sage-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <Droplets className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Lemak</span>
                              <span className="sm:hidden">Fat</span>
                            </span>
                            <span className="font-semibold text-forest-700 text-xs sm:text-sm">
                              {food.fat.toFixed(1)}g
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3">
                            <span className="text-sage-600 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                              <Wheat className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Karbo</span>
                              <span className="sm:hidden">Carb</span>
                            </span>
                            <span className="font-semibold text-forest-700 text-xs sm:text-sm">
                              {food.carbohydrate.toFixed(1)}g
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-sage-400" />
              </div>
              <p className="text-sage-600 text-sm sm:text-base">
                Tidak ada rekomendasi makanan yang ditemukan untuk mood dan
                kondisi kesehatan yang dipilih.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 mb-3 sm:mb-4">
          Demo Analisis Mood
        </h2>
        <p className="text-sage-700 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
          Pilih mood yang ingin Anda capai dan kondisi kesehatan (jika ada)
          untuk mendapatkan rekomendasi makanan yang sesuai.
        </p>
      </div>
      {/* Mood Selection */}
      {renderMoodSelector()}
      {/* Health Conditions */}
      {renderHealthConditions()}
      {/* Action Button */}
      {renderActionButton()} {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-center">
          <p className="font-medium text-sm sm:text-base">Terjadi Kesalahan</p>
          <p className="text-xs sm:text-sm mt-1">{error}</p>
        </div>
      )}
      {/* Results */}
      {renderResults()}
    </div>
  );
}
