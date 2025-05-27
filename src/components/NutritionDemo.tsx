"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Utensils,
  Zap,
  Heart,
  Target,
  Loader2,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

interface NutritionLevels {
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
}

interface HealthCondition {
  value: string;
  name: string;
  description: string;
  filter: string;
}

interface AnalysisResult {
  mood_analysis: {
    predicted_mood: string;
    confidence: number;
    confidence_percentage: string;
    all_probabilities: Record<string, number>;
    rule_based_mood: string;
    nutrient_categories: {
      calories: string;
      proteins: string;
      fat: string;
      carbohydrate: string;
    };
    input_values: NutritionLevels;
  };
  food_recommendations: Array<{
    food_name: string;
    calories: number;
    proteins: number;
    fat: number;
    carbohydrate: number;
    primary_mood: string;
  }>;
  nutritional_advice: string[];
  mood_description: string;
  is_balanced: boolean;
}

export default function NutritionDemo() {
  const [nutritionLevels, setNutritionLevels] = useState<NutritionLevels>({
    calories: 0,
    proteins: 0,
    fat: 0,
    carbohydrate: 0,
  });

  const [healthCondition, setHealthCondition] =
    useState<HealthCondition | null>(null);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch health conditions on component mount
  useEffect(() => {
    const fetchHealthConditions = async () => {
      try {
        const data = await api.getHealthConditions();
        setHealthConditions(data.conditions || []);
      } catch (error) {
        console.error("Failed to fetch health conditions:", error);
      }
    };
    fetchHealthConditions();
  }, []);

  const levelLabels = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi"];
  const levelColors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-yellow-100 text-yellow-700 border-yellow-200",
    "bg-green-100 text-green-700 border-green-200",
    "bg-blue-100 text-blue-700 border-blue-200",
  ];

  const getMoodDescription = (mood: string) => {
    const descriptions: Record<string, string> = {
      energizing:
        "Mood energizing - cocok untuk aktivitas fisik dan produktivitas tinggi",
      relaxing: "Mood relaxing - cocok untuk istirahat dan relaksasi",
      focusing:
        "Mood focusing - cocok untuk aktivitas yang membutuhkan konsentrasi",
      multi_category: "Mood multi kategori - seimbang untuk berbagai aktivitas",
      neutral: "Mood netral - kondisi mood seimbang",
    };
    return descriptions[mood] || "Mood tidak dikenali";
  };

  const generateNutritionalAdvice = (
    mood: string,
    nutrientCategories: Record<string, string>,
    selectedHealthCondition?: HealthCondition | null
  ) => {
    const advice: string[] = [];

    // Health condition specific advice
    if (selectedHealthCondition) {
      advice.push(
        `🏥 Kondisi kesehatan: ${selectedHealthCondition.name} - ${selectedHealthCondition.description}`
      );
      advice.push(
        `📋 Filter makanan yang diterapkan: ${selectedHealthCondition.filter}`
      );
    }

    // Mood-based advice
    switch (mood) {
      case "energizing":
        advice.push(
          "Untuk mempertahankan mood energizing, pastikan asupan karbohidrat kompleks dan protein cukup"
        );
        advice.push(
          "Konsumsi makanan tinggi vitamin B untuk mendukung produksi energi"
        );
        break;
      case "relaxing":
        advice.push(
          "Mood relaxing cocok untuk makanan kaya magnesium dan triptofan"
        );
        advice.push(
          "Hindari konsumsi kafein berlebihan untuk mempertahankan ketenangan"
        );
        break;
      case "focusing":
        advice.push(
          "Untuk mood focusing, konsumsi omega-3 dan antioksidan untuk kesehatan otak"
        );
        advice.push(
          "Pertahankan kadar gula darah stabil dengan makanan rendah indeks glikemik"
        );
        break;
      case "multi_category":
        advice.push(
          "Mood seimbang menunjukkan pola makan yang baik, pertahankan variasi nutrisi"
        );
        break;
    }

    // Nutrient-specific advice
    const calorieLevel = parseInt(nutrientCategories.calories);
    const proteinLevel = parseInt(nutrientCategories.proteins);
    const fatLevel = parseInt(nutrientCategories.fat);
    const carbLevel = parseInt(nutrientCategories.carbohydrate);

    if (calorieLevel === 0) {
      advice.push(
        "Asupan kalori sangat rendah - pertimbangkan untuk menambah porsi makan"
      );
    } else if (calorieLevel === 3) {
      advice.push(
        "Asupan kalori tinggi - pastikan seimbang dengan aktivitas fisik"
      );
    }

    if (proteinLevel === 0) {
      advice.push(
        "Tingkatkan asupan protein dari sumber seperti daging, ikan, telur, atau kacang-kacangan"
      );
    } else if (proteinLevel === 3) {
      advice.push(
        "Asupan protein sudah baik - pastikan distribusi merata sepanjang hari"
      );
    }

    if (fatLevel === 0) {
      advice.push(
        "Tambahkan lemak sehat dari alpukat, kacang-kacangan, atau minyak zaitun"
      );
    } else if (fatLevel === 3) {
      advice.push(
        "Asupan lemak tinggi - fokus pada lemak tak jenuh dan batasi lemak jenuh"
      );
    }

    if (carbLevel === 0) {
      advice.push(
        "Asupan karbohidrat rendah - pertimbangkan menambah karbohidrat kompleks"
      );
    } else if (carbLevel === 3) {
      advice.push(
        "Asupan karbohidrat tinggi - pilih karbohidrat kompleks dan batasi gula sederhana"
      );
    }

    // Balance check
    const levels = [calorieLevel, proteinLevel, fatLevel, carbLevel];
    const isBalanced = levels.every((level) => level >= 1 && level <= 2);

    if (isBalanced) {
      advice.push(
        "Pola makan Anda terlihat seimbang! Pertahankan variasi dan porsi yang tepat"
      );
    } else {
      advice.push(
        "Pertimbangkan untuk menyeimbangkan asupan nutrisi agar mood lebih optimal"
      );
    }

    return advice;
  };

  const validateNutritionLevels = () => {
    const totalCalories = nutritionLevels.calories;
    const totalProtein = nutritionLevels.proteins;
    const totalFat = nutritionLevels.fat;
    const totalCarbs = nutritionLevels.carbohydrate;

    if (
      totalCalories === 0 &&
      totalProtein === 0 &&
      totalFat === 0 &&
      totalCarbs === 0
    ) {
      return "Pilih setidaknya satu tingkat nutrisi untuk mendapatkan analisis";
    }

    return null;
  };

  const getNutrientValue = (level: number, nutrient: keyof NutritionLevels) => {
    switch (nutrient) {
      case "calories":
        return level === 0 ? 50 : level === 1 ? 150 : level === 2 ? 300 : 500;
      case "proteins":
        return level === 0 ? 2 : level === 1 ? 10 : level === 2 ? 20 : 40;
      case "fat":
        return level === 0 ? 2 : level === 1 ? 10 : level === 2 ? 20 : 40;
      case "carbohydrate":
        return level === 0 ? 10 : level === 1 ? 25 : level === 2 ? 40 : 60;
      default:
        return 0;
    }
  };

  const handleLevelChange = (
    nutrient: keyof NutritionLevels,
    level: number
  ) => {
    setNutritionLevels((prev) => ({
      ...prev,
      [nutrient]: getNutrientValue(level, nutrient),
    }));
    setResult(null);
    setError(null);
  };

  const handleHealthConditionChange = (condition: HealthCondition | null) => {
    setHealthCondition(condition);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    // Validate input
    const validationError = validateNutritionLevels();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Mapping kategori ke angka (0-3)
      const getLevelIndex = (
        value: number,
        nutrient: keyof NutritionLevels
      ) => {
        switch (nutrient) {
          case "calories":
            if (value <= 50) return 0;
            if (value <= 150) return 1;
            if (value <= 300) return 2;
            return 3;
          case "proteins":
          case "fat":
            if (value <= 2) return 0;
            if (value <= 10) return 1;
            if (value <= 20) return 2;
            return 3;
          case "carbohydrate":
            if (value <= 10) return 0;
            if (value <= 25) return 1;
            if (value <= 40) return 2;
            return 3;
          default:
            return 0;
        }
      };

      const nutrientCategories = {
        calories: getLevelIndex(
          nutritionLevels.calories,
          "calories"
        ).toString(),
        proteins: getLevelIndex(
          nutritionLevels.proteins,
          "proteins"
        ).toString(),
        fat: getLevelIndex(nutritionLevels.fat, "fat").toString(),
        carbohydrate: getLevelIndex(
          nutritionLevels.carbohydrate,
          "carbohydrate"
        ).toString(),
      };

      // 1. Prediksi mood ke backend
      const moodData = await api.predict({
        calorie_category: parseInt(nutrientCategories.calories),
        protein_category: parseInt(nutrientCategories.proteins),
        fat_category: parseInt(nutrientCategories.fat),
        carb_category: parseInt(nutrientCategories.carbohydrate),
      });

      // 2. Rekomendasi makanan ke backend dengan health condition
      const healthConditions = healthCondition ? [healthCondition.value] : [];
      const foodData = await api.recommend({
        mood: moodData.mood,
        top_n: 5,
        health_conditions: healthConditions,
      });

      // 3. Generate nutritional advice
      const nutritionalAdvice = generateNutritionalAdvice(
        moodData.mood,
        nutrientCategories,
        healthCondition
      );

      // 4. Check if nutrition is balanced
      const levels = Object.values(nutrientCategories).map((cat) =>
        parseInt(cat)
      );
      const isBalanced = levels.every((level) => level >= 1 && level <= 2); // 5. Set hasil ke state dengan format yang sesuai backend API
      setResult({
        mood_analysis: {
          predicted_mood: moodData.mood,
          confidence: moodData.confidence,
          confidence_percentage: (moodData.confidence * 100).toFixed(2),
          all_probabilities: moodData.mood_probabilities || {},
          rule_based_mood: moodData.mood,
          nutrient_categories: nutrientCategories,
          input_values: nutritionLevels,
        },
        food_recommendations: Array.isArray(foodData)
          ? foodData.map((food: Record<string, unknown>) => ({
              food_name: food.name as string,
              calories: food.calories as number,
              proteins: food.proteins as number,
              fat: food.fat as number,
              carbohydrate: food.carbohydrate as number,
              primary_mood: food.primary_mood as string,
            }))
          : [],
        nutritional_advice: nutritionalAdvice,
        mood_description: getMoodDescription(moodData.mood),
        is_balanced: isBalanced,
      });
    } catch (err: unknown) {
      console.error("Error in handlePredict:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses data. Pastikan backend server berjalan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderNutrientSelector = (
    nutrient: keyof NutritionLevels,
    label: string,
    icon: React.ReactNode,
    description: string
  ) => {
    const currentLevel = nutritionLevels[nutrient];
    const selectedLevel =
      currentLevel <= getNutrientValue(0, nutrient)
        ? 0
        : currentLevel <= getNutrientValue(1, nutrient)
        ? 1
        : currentLevel <= getNutrientValue(2, nutrient)
        ? 2
        : 3;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-sage-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center text-forest-600">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-forest-900">{label}</h3>
            <p className="text-sm text-sage-600">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => handleLevelChange(nutrient, level)}
              className={`
                p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200
                ${
                  selectedLevel === level
                    ? levelColors[level] + " scale-105 shadow-md"
                    : "bg-gray-50 text-sage-900 border-gray-200 hover:bg-gray-100"
                }
              `}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderHealthConditionSelector = () => {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-sage-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-forest-100 rounded-lg flex items-center justify-center text-forest-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-forest-900">Kondisi Kesehatan</h3>
            <p className="text-sm text-sage-600">
              Pilih kondisi kesehatan khusus (opsional)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleHealthConditionChange(null)}
            className={`w-full p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left ${
              !healthCondition
                ? "bg-green-100 text-green-700 border-green-200 scale-105 shadow-md"
                : "bg-gray-50 text-sage-900 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <div className="font-medium">Tidak Ada Kondisi Khusus</div>
            <div className="text-xs text-sage-600 mt-1">
              Semua makanan akan direkomendasikan
            </div>
          </button>

          {healthConditions.map((condition) => (
            <button
              key={condition.value}
              onClick={() => handleHealthConditionChange(condition)}
              className={`w-full p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left ${
                healthCondition?.value === condition.value
                  ? "bg-blue-100 text-blue-700 border-blue-200 scale-105 shadow-md"
                  : "bg-gray-50 text-sage-900 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className="font-medium">{condition.name}</div>
              <div className="text-xs text-sage-600 mt-1">
                {condition.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-earth border border-sage-200">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-forest-900 mb-3">
            Analisis Nutrisi
          </h3>
          <p className="text-sage-700">
            Pilih tingkat konsumsi nutrisi dan kondisi kesehatan untuk
            mendapatkan prediksi mood dan rekomendasi makanan yang sesuai
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {renderNutrientSelector(
            "calories",
            "Kalori",
            <Zap className="w-5 h-5" />,
            "Total energi yang dikonsumsi"
          )}

          {renderNutrientSelector(
            "proteins",
            "Protein",
            <Target className="w-5 h-5" />,
            "Pembangun dan perbaikan otot"
          )}

          {renderNutrientSelector(
            "fat",
            "Lemak",
            <Heart className="w-5 h-5" />,
            "Sumber energi dan vitamin"
          )}

          {renderNutrientSelector(
            "carbohydrate",
            "Karbohidrat",
            <Utensils className="w-5 h-5" />,
            "Sumber energi utama tubuh"
          )}
        </div>

        {/* Health Condition Selector */}
        <div className="mb-8">{renderHealthConditionSelector()}</div>

        <div className="text-center">
          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="group bg-gradient-to-r from-forest-600 to-forest-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center mx-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Menganalisis...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Dapatkan Rekomendasi Makanan
              </>
            )}
          </button>

          {!isLoading && (
            <div className="text-sm text-sage-600 mt-3 space-y-1">
              <p>
                Pastikan memilih setidaknya satu tingkat nutrisi untuk analisis
              </p>
              {healthCondition && (
                <p className="text-blue-600 font-medium">
                  Kondisi kesehatan: {healthCondition.name} -{" "}
                  {healthCondition.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600">⚠️</span>
            </div>
            <div>
              <h4 className="font-semibold text-red-900">Terjadi Kesalahan</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6 animate-fade-in">
          {/* Mood Prediction */}
          <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white">
                <span className="text-2xl">
                  {result.mood_analysis.predicted_mood === "energizing"
                    ? "⚡"
                    : result.mood_analysis.predicted_mood === "relaxing"
                    ? "😌"
                    : result.mood_analysis.predicted_mood === "focusing"
                    ? "🎯"
                    : result.mood_analysis.predicted_mood === "multi_category"
                    ? "🔄"
                    : "🤔"}
                </span>
              </div>
              <h4 className="text-2xl font-bold text-forest-900 mb-2">
                Mood Anda:{" "}
                <span className="text-orange-600 capitalize">
                  {result.mood_analysis.predicted_mood}
                </span>
              </h4>
              <p className="text-sage-700">
                Confidence: {result.mood_analysis.confidence_percentage}%
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 text-orange-800 mb-6">
              {result.mood_description}
            </div>

            {/* Health Condition Display */}
            {healthCondition && (
              <div className="bg-blue-50 rounded-lg p-4 text-blue-800 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">
                    Kondisi Kesehatan: {healthCondition.name}
                  </span>
                </div>
                <p className="text-sm">{healthCondition.description}</p>
                <p className="text-xs mt-1 text-blue-600">
                  Filter: {healthCondition.filter}
                </p>
              </div>
            )}

            {/* Mood Probabilities */}
            {Object.keys(result.mood_analysis.all_probabilities).length > 0 && (
              <div>
                <h5 className="font-semibold text-forest-900 mb-3 text-center">
                  Detail Probabilitas Mood:
                </h5>
                <div className="space-y-2">
                  {Object.entries(result.mood_analysis.all_probabilities)
                    .sort(([, a], [, b]) => b - a)
                    .map(([mood, probability]) => (
                      <div
                        key={mood}
                        className="flex items-center justify-between bg-sage-50 rounded-lg p-3"
                      >
                        <span className="capitalize text-sage-700 font-medium">
                          {mood.replace("_", " ")}
                          {mood === result.mood_analysis.predicted_mood && (
                            <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                              Terprediksi
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                mood === result.mood_analysis.predicted_mood
                                  ? "bg-orange-500"
                                  : "bg-sage-400"
                              }`}
                              style={{ width: `${probability * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-forest-700 min-w-[3rem]">
                            {(probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Food Recommendations */}
          <div className="bg-white rounded-2xl p-8 shadow-earth border border-sage-200">
            <h4 className="text-2xl font-bold text-forest-900 mb-6 text-center">
              Rekomendasi Makanan
            </h4>

            {result.food_recommendations &&
            result.food_recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-sage-600">
                    Makanan yang direkomendasikan untuk mood{" "}
                    <span className="font-semibold text-orange-600 capitalize">
                      {result.mood_analysis.predicted_mood}
                    </span>
                    {healthCondition && (
                      <>
                        {" "}
                        dengan filter untuk kondisi{" "}
                        <span className="font-semibold text-blue-600">
                          {healthCondition.name}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="grid gap-4">
                  {result.food_recommendations.map((food, index) => (
                    <div
                      key={index}
                      className="bg-sage-50 rounded-xl p-6 border border-sage-200 hover:shadow-md transition-all duration-200 hover:border-forest-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h5 className="font-semibold text-forest-900 text-lg">
                              {food.food_name}
                            </h5>
                            <div className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                              {food.primary_mood.replace("_", " ")}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sage-600 flex items-center gap-2">
                                🔥 Kalori
                              </span>
                              <span className="font-semibold text-forest-700">
                                {food.calories.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sage-600 flex items-center gap-2">
                                🥩 Protein
                              </span>
                              <span className="font-semibold text-forest-700">
                                {food.proteins.toFixed(1)}g
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sage-600 flex items-center gap-2">
                                🥑 Lemak
                              </span>
                              <span className="font-semibold text-forest-700">
                                {food.fat.toFixed(1)}g
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-white rounded-lg p-3">
                              <span className="text-sage-600 flex items-center gap-2">
                                🍞 Karbo
                              </span>
                              <span className="font-semibold text-forest-700">
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
              <div className="text-center text-sage-600 py-8">
                <Utensils className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada rekomendasi makanan tersedia</p>
                <p className="text-sm mt-2">
                  {healthCondition
                    ? "Mungkin tidak ada makanan yang sesuai dengan kondisi kesehatan yang dipilih"
                    : "Pastikan backend server berjalan dengan benar"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
