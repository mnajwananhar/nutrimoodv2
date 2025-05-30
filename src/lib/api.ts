// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ENDPOINTS: {
    RECOMMEND: "/recommend",
    HEALTH: "/health",
  },
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// API request helper with error handling
export const apiRequest = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const url = buildApiUrl(endpoint);

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error occurred");
  }
};

// Types for API requests and responses
export interface NutrientInput {
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
}

export interface FoodRecommendationRequest {
  nutrients: NutrientInput;
  health_conditions?: string[];
  top_n?: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  proteins: number;
  fat: number;
  carbohydrate: number;
  primary_mood: string;
  similarity_score: number;
}

export interface FoodRecommendationResponse {
  predicted_mood: string;
  mood_probabilities: Record<string, number>;
  recommendations: FoodItem[];
  total_recommendations: number;
}

// Typed API methods
export const api = {
  // Get food recommendations based on nutrients and health conditions
  recommend: async (
    data: FoodRecommendationRequest
  ): Promise<FoodRecommendationResponse> => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.RECOMMEND, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Health check endpoint
  healthCheck: async () => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HEALTH);
    return response.json();
  },

  // Utility function to convert nutrition levels (0-3) to actual values
  convertNutritionLevels: (levels: {
    calorie_level: number;
    protein_level: number;
    fat_level: number;
    carb_level: number;
  }): NutrientInput => {
    // Convert categorical levels to actual nutritional values
    // These ranges are based on typical daily intake values
    const calorieRanges = [500, 1200, 1800, 2500]; // very_low, low, medium, high
    const proteinRanges = [15, 40, 70, 120]; // very_low, low, medium, high
    const fatRanges = [15, 40, 70, 120]; // very_low, low, medium, high
    const carbRanges = [30, 100, 200, 350]; // very_low, low, medium, high

    return {
      calories: calorieRanges[levels.calorie_level] || calorieRanges[2],
      proteins: proteinRanges[levels.protein_level] || proteinRanges[2],
      fat: fatRanges[levels.fat_level] || fatRanges[2],
      carbohydrate: carbRanges[levels.carb_level] || carbRanges[2],
    };
  },
} as const;
