// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ENDPOINTS: {
    PREDICT: "/predict",
    RECOMMEND: "/recommend",
    PREDICT_AND_RECOMMEND: "/predict-and-recommend",
    MOODS: "/moods",
    HEALTH_CONDITIONS: "/health-conditions",
    CATEGORIES: "/categories",
    PREDICT_BATCH: "/predict/batch",
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

// Typed API methods
export const api = {
  predict: async (data: {
    calorie_category: number;
    protein_category: number;
    fat_category: number;
    carb_category: number;
  }) => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PREDICT, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  recommend: async (data: {
    mood: string;
    health_conditions?: string[];
    top_n?: number;
  }) => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.RECOMMEND, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  predictAndRecommend: async (data: {
    calorie_category: number;
    protein_category: number;
    fat_category: number;
    carb_category: number;
    health_conditions?: string[];
  }) => {
    const response = await apiRequest(
      API_CONFIG.ENDPOINTS.PREDICT_AND_RECOMMEND,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    return response.json();
  },

  getMoods: async () => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.MOODS);
    return response.json();
  },

  getHealthConditions: async () => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.HEALTH_CONDITIONS);
    return response.json();
  },

  getDebugStatus: async () => {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.DEBUG_STATUS);
    return response.json();
  },
} as const;
