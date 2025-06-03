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
  Smile,
  HelpCircle,
  Check,
} from "lucide-react";
import { api } from "../lib/api";

interface HealthCondition {
  value: string;
  name: string;
  description: string;
  filter: string;
}

interface MoodAnalysisResult {
  predicted_mood: string;
  recommendations: Array<{
    name: string;
    calories: number;
    proteins: number;
    fat: number;
    carbohydrate: number;
    primary_mood: string;
    similarity_score: number;
  }>;
}

export default function MoodDemo() {
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedHealthConditions, setSelectedHealthConditions] = useState<
    HealthCondition[]
  >([]);
  const [healthConditions, setHealthConditions] = useState<HealthCondition[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Define available moods
  const moods = [
    {
      value: "energizing",
      name: "Energizing",
      description: "Saya ingin merasa berenergi dan bersemangat",
      icon: <Zap className="w-6 h-6" />,
      color: "from-orange-500 to-orange-600",
      info: "Mood energizing cocok untuk aktivitas fisik, olahraga, atau ketika Anda butuh dorongan semangat ekstra.",
    },
    {
      value: "relaxing",
      name: "Relaxing",
      description: "Saya ingin merasa tenang dan rileks",
      icon: <Smile className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      info: "Mood relaxing membantu menenangkan pikiran, mengurangi stres, dan memberikan rasa damai.",
    },
    {
      value: "focusing",
      name: "Focusing",
      description: "Saya ingin meningkatkan konsentrasi dan fokus",
      icon: <Target className="w-6 h-6" />,
      color: "from-green-500 to-green-600",
      info: "Mood focusing membantu meningkatkan konsentrasi untuk bekerja, belajar, atau aktivitas yang membutuhkan fokus tinggi.",
    },
    {
      value: "neutral",
      name: "Neutral",
      description: "Saya ingin menjaga keseimbangan mood",
      icon: <Heart className="w-6 h-6" />,
      color: "from-sage-500 to-sage-600",
      info: "Mood neutral membantu menjaga keseimbangan emosi dan cocok untuk aktivitas sehari-hari.",
    },
  ];

  // Fetch health conditions on component mount
  useEffect(() => {
    const loadHealthConditions = () => {
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

  const generateMoodAdvice = (
    mood: string,
    selectedHealthConditions?: HealthCondition[]
  ) => {
    const advice: string[] = [];

    // Health condition specific advice
    if (selectedHealthConditions && selectedHealthConditions.length > 0) {
      advice.push(
        `Kondisi kesehatan: ${selectedHealthConditions
          .map((hc) => hc.name)
          .join(", ")}`
      );
      selectedHealthConditions.forEach((condition) => {
        advice.push(
          `${condition.name}: ${condition.description} - Filter: ${condition.filter}`
        );
      });
    }

    // Mood-based advice
    switch (mood) {
      case "energizing":
        advice.push(
          "Untuk mencapai mood energizing, konsumsi makanan tinggi karbohidrat kompleks dan protein"
        );
        advice.push(
          "Konsumsi makanan tinggi vitamin B untuk mendukung produksi energi"
        );
        break;
      case "relaxing":
        advice.push(
          "Untuk mood relaxing, pilih makanan kaya magnesium dan triptofan"
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
      case "neutral":
        advice.push(
          "Untuk menjaga mood seimbang, konsumsi variasi nutrisi yang seimbang"
        );
        break;
    }

    return advice;
  };

  const validateInput = () => {
    if (!selectedMood) {
      return "Silakan pilih mood yang diinginkan untuk mendapatkan rekomendasi";
    }
    return null;
  };

  const handleHealthConditionToggle = (condition: HealthCondition) => {
    setSelectedHealthConditions((prev) => {
      const isAlreadySelected = prev.some((hc) => hc.value === condition.value);
      if (isAlreadySelected) {
        return prev.filter((hc) => hc.value !== condition.value);
      } else {
        return [...prev, condition];
      }
    });
  };

  const handleAnalyze = async () => {
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const recommendationData = await api.recommend({
        mood: selectedMood,
        health_conditions: selectedHealthConditions.map((hc) => hc.value),
        top_n: 5,
      });

      setResult({
        predicted_mood: recommendationData.mood, // map 'mood' to 'predicted_mood'
        recommendations: recommendationData.recommendations,
      });
    } catch (err) {
      console.error("Mood analysis error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menganalisis mood. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedMood("");
    setSelectedHealthConditions([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-earth border border-sage-200 p-6 lg:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center px-4 py-2 bg-forest-100 text-forest-700 rounded-full text-sm font-medium border border-forest-200 mb-4">
          <Brain className="w-4 h-4 mr-2" />
          Demo Analisis Mood
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-forest-900 mb-3">
          Coba Rekomendasi Makanan
        </h2>
        <p className="text-sage-700 lg:text-lg max-w-2xl mx-auto">
          Pilih mood yang ingin Anda rasakan dan kondisi kesehatan Anda untuk
          mendapatkan rekomendasi makanan yang tepat.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Mood Selection */}
          <div>
            <h3 className="text-lg font-semibold text-forest-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Pilih Mood yang Diinginkan
            </h3>
            <div className="grid gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 ${
                    selectedMood === mood.value
                      ? `bg-gradient-to-r ${mood.color} text-white border-transparent scale-105 shadow-lg`
                      : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={
                            selectedMood === mood.value
                              ? "text-white"
                              : "text-sage-600"
                          }
                        >
                          {mood.icon}
                        </div>
                        <h4
                          className={`font-semibold ${
                            selectedMood === mood.value
                              ? "text-white"
                              : "text-sage-900"
                          }`}
                        >
                          {mood.name}
                        </h4>
                      </div>
                      <p
                        className={`text-sm ${
                          selectedMood === mood.value
                            ? "text-white/90"
                            : "text-sage-700"
                        }`}
                      >
                        {mood.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                        selectedMood === mood.value
                          ? "border-white bg-white"
                          : "border-sage-300"
                      }`}
                    >
                      {selectedMood === mood.value && (
                        <div className="w-2 h-2 bg-current rounded-full" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Health Conditions */}
          <div>
            <h3 className="text-lg font-semibold text-forest-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Kondisi Kesehatan (Opsional)
            </h3>
            <div className="grid gap-2">
              {healthConditions.map((condition) => {
                const isSelected = selectedHealthConditions.some(
                  (hc) => hc.value === condition.value
                );
                return (
                  <button
                    key={condition.value}
                    onClick={() => handleHealthConditionToggle(condition)}
                    className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-forest-100 text-forest-700 border-forest-300"
                        : "border-sage-200 hover:border-sage-300 bg-white hover:bg-sage-50 text-sage-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{condition.name}</h4>
                        <p className="text-sm opacity-80">
                          {condition.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? "border-forest-600 bg-forest-600"
                            : "border-sage-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={isLoading || !selectedMood}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-3 rounded-xl font-semibold shadow-earth hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Dapatkan Rekomendasi
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 text-sage-600 hover:text-forest-700 font-medium transition-colors rounded-xl hover:bg-sage-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Mood Analysis */}
              <div className="bg-gradient-to-r from-forest-50 to-sage-50 border border-forest-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-forest-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Analisis Mood
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sage-700">Mood yang Diprediksi:</span>
                    <span className="font-semibold text-forest-900 capitalize">
                      {result.predicted_mood}
                    </span>
                  </div>
                </div>
              </div>

              {/* Food Recommendations */}
              <div>
                <h3 className="text-lg font-semibold text-forest-900 mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  Rekomendasi Makanan
                </h3>
                <div className="space-y-3">
                  {result.recommendations.slice(0, 3).map((food, index) => (
                    <div
                      key={index}
                      className="bg-white border border-sage-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-forest-900 capitalize">
                          {food.name}
                        </h4>
                        <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-full">
                          {food.similarity_score?.toFixed(2) || "N/A"}{" "}
                          similarity
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-sage-600">
                        <div>Kalori: {food.calories}</div>
                        <div>Protein: {food.proteins}g</div>
                        <div>Lemak: {food.fat}g</div>
                        <div>Karbo: {food.carbohydrate}g</div>
                      </div>
                      <div className="mt-2 text-xs text-sage-500 capitalize">
                        Mood Category: {food.primary_mood}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Saran untuk Anda
                </h4>
                <div className="space-y-1">
                  {generateMoodAdvice(
                    selectedMood,
                    selectedHealthConditions
                  ).map((advice, index) => (
                    <p key={index} className="text-blue-800 text-sm">
                      • {advice}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="bg-sage-50 border border-sage-200 rounded-xl p-8 text-center">
              <User className="w-12 h-12 text-sage-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-sage-700 mb-2">
                Siap untuk Analisis
              </h3>
              <p className="text-sage-600 text-sm">
                Pilih mood yang diinginkan dan klik &quot;Dapatkan
                Rekomendasi&quot; untuk melihat hasil analisis dan rekomendasi
                makanan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
