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
export interface FoodRecommendationRequest {
  mood: string; // Changed from nutrients to mood
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
  mood: string;
  health_conditions?: string[];
  recommendations: FoodItem[];
  message: string;
}

// Typed API methods
export const api = {
  // Get food recommendations based on mood and health conditions
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
} as const;
