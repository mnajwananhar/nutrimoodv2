from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import tensorflow as tf
import joblib
import pickle
import pandas as pd
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics.pairwise import cosine_similarity

# ===== HELPER FUNCTIONS =====
def decode_mood_prediction(encoder, pred_class):
    """Helper function to decode mood prediction"""
    # Mapping mood index to string (sesuai dengan training)
    mood_mapping = {
        0: "energizing",
        1: "focusing", 
        2: "multi_category",
        3: "relaxing",
        4: "uncategorized"
    }
    
    # Try to use encoder first
    try:
        num_classes = len(mood_mapping)
        one_hot = np.zeros((1, num_classes))
        one_hot[0, pred_class] = 1
        mood_label = encoder.inverse_transform(one_hot)[0][0]
        return str(mood_label)
    except:
        # Fallback to direct mapping
        return mood_mapping.get(pred_class, "uncategorized")

# ===== DEFINISI CLASS FOODRECOMMENDER =====
class FoodRecommender:
    def __init__(self):
        self.food_df = None
        self.mood_mapping = {
            'energizing': 0,
            'relaxing': 1,
            'focusing': 2,
            'multi_category': 3,
            'uncategorized': 4
        }
        self.health_mapping = {
            'diabetes': {'calorie_category': 'low', 'carb_category': 'low'},
            'hipertensi': {'calorie_category': 'low', 'fat_category': 'low'},
            'kolesterol': {'fat_category': 'low'},
            'obesitas': {'calorie_category': 'low', 'fat_category': 'low'},
            'alergi_gluten': {'nutrient_balance': 'balanced'},
            'vegetarian': {'primary_mood': ['relaxing', 'energizing']}
        }
        self.feature_weights = {
            'calories': 1.0,
            'proteins': 1.0,
            'fat': 1.0,
            'carbohydrate': 1.0,
            'calorie_category': 2.0,
            'protein_category': 1.5,
            'fat_category': 1.5,
            'carb_category': 1.5,
            'primary_mood': 3.0
        }

    def load_data(self, food_data_path):
        """Memuat dataset makanan dan mempersiapkannya untuk rekomendasi"""
        self.food_df = pd.read_csv(food_data_path)
        
        # Pastikan kolom penting ada
        required_cols = ['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood']
        for col in required_cols:
            if col not in self.food_df.columns:
                raise ValueError(f"Kolom {col} tidak ditemukan dalam dataset makanan")
        
        print(f"Data makanan dimuat dengan sukses: {self.food_df.shape[0]} item")
        return self.food_df

    def get_food_similarity(self, user_profile, food_items):
        """Menghitung kesamaan antara profil pengguna dan makanan"""
        # Fitur yang akan digunakan untuk similarity
        feature_cols = ['calories', 'proteins', 'fat', 'carbohydrate']
        
        # Ekstrak fitur dari makanan
        food_features = food_items[feature_cols].values
        
        # Buat vektor fitur pengguna
        user_features = np.array([[
            user_profile.get('calories', 0),
            user_profile.get('proteins', 0),
            user_profile.get('fat', 0),
            user_profile.get('carbohydrate', 0)
        ]])
        
        # Hitung cosine similarity
        similarities = cosine_similarity(user_features, food_features)[0]
        
        return similarities

    def recommend_for_mood(self, mood, top_n=5, health_conditions=None):
        """Merekomendasikan makanan berdasarkan mood dan kondisi kesehatan"""
        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat!")
        
        # Filter makanan berdasarkan mood
        if mood in ['energizing', 'relaxing', 'focusing']:
            mood_filtered = self.food_df[self.food_df['primary_mood'] == mood].copy()
        else:
            # Jika mood tidak spesifik, gunakan semua makanan
            mood_filtered = self.food_df.copy()
        
        # Jika ada kondisi kesehatan, terapkan filter tambahan
        if health_conditions:
            for condition in health_conditions:
                if condition in self.health_mapping:
                    for feature, value in self.health_mapping[condition].items():
                        if feature in mood_filtered.columns:
                            if isinstance(value, str):
                                # Map kategori ke nilai yang sesuai di dataset
                                if feature == 'calorie_category' and value == 'low':
                                    mood_filtered = mood_filtered[mood_filtered['calories'] < 200]
                                elif feature == 'carb_category' and value == 'low':
                                    mood_filtered = mood_filtered[mood_filtered['carbohydrate'] < 30]
                                elif feature == 'fat_category' and value == 'low':
                                    mood_filtered = mood_filtered[mood_filtered['fat'] < 10]
        
        # Jika tidak ada makanan yang cocok, kembali ke dataset awal
        if len(mood_filtered) == 0:
            print("Tidak ada makanan yang cocok dengan filter. Menggunakan semua makanan.")
            mood_filtered = self.food_df[self.food_df['primary_mood'] == mood].copy()
        
        # Hitung similarity score berdasarkan profil mood
        # Buat profil pengguna berdasarkan mood
        if mood == 'energizing':
            user_profile = {'calories': 300, 'proteins': 10, 'fat': 10, 'carbohydrate': 50}
        elif mood == 'relaxing':
            user_profile = {'calories': 100, 'proteins': 3, 'fat': 5, 'carbohydrate': 15}
        elif mood == 'focusing':
            user_profile = {'calories': 200, 'proteins': 20, 'fat': 10, 'carbohydrate': 5}
        else:
            user_profile = {'calories': 200, 'proteins': 10, 'fat': 10, 'carbohydrate': 30}
        
        # Hitung similarity
        similarities = self.get_food_similarity(user_profile, mood_filtered)
        mood_filtered['similarity_score'] = similarities
        
        # Urutkan berdasarkan similarity score
        recommendations = mood_filtered.sort_values('similarity_score', ascending=False).head(top_n)
        
        return recommendations

# ===== INISIALISASI APLIKASI =====
app = FastAPI(title="NutriMood API", version="1.0.0")

# Tambahkan CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== LOAD MODEL DAN DATA =====
model = None
scaler = None
encoder = None
recommender = None

try:
    print("Loading models...")
    
    # Load mood classifier
    model = tf.keras.models.load_model('mood_classifier_model.keras')
    scaler = joblib.load('mood_feature_scaler.pkl')
    encoder = joblib.load('mood_encoder.pkl')
    
    # Load food recommender
    print("Loading food recommender...")
    try:
        with open('food_recommender.pkl', 'rb') as f:
            loaded_data = pickle.load(f)
            
            # Check if loaded data is a DataFrame or FoodRecommender instance
            if isinstance(loaded_data, pd.DataFrame):
                print("Loaded DataFrame from pickle, creating FoodRecommender...")
                recommender = FoodRecommender()
                recommender.food_df = loaded_data
                print(f"Food data loaded: {len(loaded_data)} items")
            elif isinstance(loaded_data, FoodRecommender):
                print("Loaded FoodRecommender instance")
                recommender = loaded_data
            else:
                print(f"Unexpected data type in pickle: {type(loaded_data)}")
                raise ValueError("Invalid data in food_recommender.pkl")
                
    except FileNotFoundError:
        print("food_recommender.pkl not found, creating new recommender...")
        recommender = FoodRecommender()
        
        # Try to load data from CSV files
        csv_files = ['nutrimood_combined_dataset.csv', 'nutrimood_preprocessed_cat.csv', 'nutrimood_full_cat.csv']
        data_loaded = False
        
        for csv_file in csv_files:
            try:
                recommender.load_data(csv_file)
                data_loaded = True
                print(f"Successfully loaded data from {csv_file}")
                break
            except Exception as e:
                print(f"Failed to load {csv_file}: {str(e)}")
                continue
        
        if not data_loaded:
            print("Warning: Could not load food data from any CSV file")
            recommender = None
    except Exception as e:
        print(f"Error loading food recommender: {str(e)}")
        recommender = None
    
    print("✅ All models loaded successfully")
    
except Exception as e:
    print(f"❌ Error loading models: {e}")
    model = None
    scaler = None
    encoder = None
    recommender = None

# ===== SCHEMAS =====
class HealthInput(BaseModel):
    calorie_category: int  # 0=very_low, 1=low, 2=medium, 3=high
    protein_category: int
    fat_category: int
    carb_category: int

class HealthInputWithConditions(BaseModel):
    calorie_category: int
    protein_category: int
    fat_category: int
    carb_category: int
    health_conditions: Optional[List[str]] = []

class MoodPrediction(BaseModel):
    mood: str
    confidence: float
    mood_probabilities: Dict[str, float]

class FoodRecommendation(BaseModel):
    name: str
    calories: float
    proteins: float
    fat: float
    carbohydrate: float
    primary_mood: str
    similarity_score: Optional[float] = 0.0

class RecommendationRequest(BaseModel):
    mood: Optional[str] = None
    health_conditions: Optional[List[str]] = []
    top_n: Optional[int] = 5

# ===== ENDPOINTS =====
@app.get("/")
def root():
    return {
        "status": "API is running",
        "endpoints": {
            "/predict": "POST - Predict mood from health data",
            "/recommend": "POST - Get food recommendations",
            "/moods": "GET - Get available moods",
            "/health-conditions": "GET - Get available health conditions"
        }
    }

@app.post("/predict", response_model=MoodPrediction)
async def predict_mood(input_data: HealthInput):
    """Predict mood based on health data (calorie, protein, fat, carb categories)"""
    try:
        if model is None or scaler is None or encoder is None:
            raise HTTPException(500, detail="Model not loaded. Please contact admin.")
        
        # Create input array
        input_array = np.array([
            input_data.calorie_category,
            input_data.protein_category,
            input_data.fat_category,
            input_data.carb_category
        ], dtype=np.float32).reshape(1, -1)
        
        # Scale input
        scaled_input = scaler.transform(input_array)
        
        # Predict
        predictions = model.predict(scaled_input, verbose=0)
        
        # Get predicted class
        pred_class = np.argmax(predictions, axis=1)[0]
        confidence = float(predictions[0][pred_class])
        
        # Get mood label using helper function
        mood_label = decode_mood_prediction(encoder, pred_class)
        
        # Create mood probabilities dictionary
        # Define mood names based on training order
        mood_names = ['energizing', 'focusing', 'multi_category', 'relaxing', 'uncategorized']
        
        mood_probs = {}
        for i, prob in enumerate(predictions[0]):
            if i < len(mood_names):
                mood_probs[mood_names[i]] = float(prob)
        
        return MoodPrediction(
            mood=mood_label,
            confidence=confidence,
            mood_probabilities=mood_probs
        )
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, detail=f"Prediction error: {str(e)}")

@app.post("/recommend", response_model=List[FoodRecommendation])
async def get_recommendations(request: RecommendationRequest):
    """Get food recommendations based on mood and health conditions"""
    try:
        # Validate recommender is ready
        if recommender is None:
            raise HTTPException(500, detail="Food recommender not initialized. Please contact admin.")
        
        if recommender.food_df is None or len(recommender.food_df) == 0:
            raise HTTPException(500, detail="Food data not loaded. Please contact admin.")
        
        mood = request.mood
        health_conditions = request.health_conditions if request.health_conditions else None
        top_n = request.top_n if request.top_n else 5
        
        # Validate mood
        valid_moods = ["energizing", "relaxing", "focusing", "multi_category", "uncategorized"]
        if mood and mood.lower() not in valid_moods:
            raise HTTPException(400, detail=f"Invalid mood. Must be one of: {valid_moods}")
        
        # Get recommendations
        if mood:
            recommendations = recommender.recommend_for_mood(
                mood.lower(), 
                top_n=top_n, 
                health_conditions=health_conditions
            )
        else:
            # If no mood specified, return random recommendations
            recommendations = recommender.food_df.sample(n=min(top_n, len(recommender.food_df)))
            recommendations['similarity_score'] = 0.0
        
        # Ensure we have recommendations
        if recommendations.empty:
            raise HTTPException(404, detail=f"No food recommendations found for mood: {mood}")
        
        # Convert to response format
        result = []
        for _, row in recommendations.iterrows():
            result.append(FoodRecommendation(
                name=str(row['name']),
                calories=float(row['calories']),
                proteins=float(row['proteins']),
                fat=float(row['fat']),
                carbohydrate=float(row['carbohydrate']),
                primary_mood=str(row['primary_mood']),
                similarity_score=float(row.get('similarity_score', 0.0))
            ))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Recommendation error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, detail=f"Recommendation error: {str(e)}")

@app.post("/predict-and-recommend")
async def predict_and_recommend(input_data: HealthInputWithConditions):
    """Predict mood and get recommendations in one call"""
    try:
        # First predict mood
        mood_prediction = await predict_mood(HealthInput(
            calorie_category=input_data.calorie_category,
            protein_category=input_data.protein_category,
            fat_category=input_data.fat_category,
            carb_category=input_data.carb_category
        ))
        
        # Then get recommendations based on predicted mood
        recommendation_request = RecommendationRequest(
            mood=mood_prediction.mood,
            health_conditions=input_data.health_conditions,
            top_n=5
        )
        
        recommendations = await get_recommendations(recommendation_request)
        
        return {
            "mood_prediction": mood_prediction,
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.get("/moods")
def get_available_moods():
    """Get list of available moods"""
    return {
        "moods": [
            {"value": "energizing", "description": "High carbohydrate, medium protein"},
            {"value": "relaxing", "description": "Low calorie, low protein"},
            {"value": "focusing", "description": "High protein, low carbohydrate"},
            {"value": "multi_category", "description": "Multiple mood categories"},
            {"value": "uncategorized", "description": "No specific mood category"}
        ]
    }

@app.get("/health-conditions")
def get_health_conditions():
    """Get list of available health conditions"""
    return {
        "conditions": [
            {"value": "diabetes", "description": "Low calorie, low carbohydrate"},
            {"value": "hipertensi", "description": "Low calorie, low fat"},
            {"value": "kolesterol", "description": "Low fat"},
            {"value": "obesitas", "description": "Low calorie, low fat"},
            {"value": "alergi_gluten", "description": "Balanced nutrition"},
            {"value": "vegetarian", "description": "Plant-based foods"}
        ]
    }

@app.get("/debug/status")
def debug_status():
    """Debug endpoint to check model and data status"""
    return {
        "model_status": {
            "mood_classifier": "loaded" if model is not None else "not loaded",
            "scaler": "loaded" if scaler is not None else "not loaded",
            "encoder": "loaded" if encoder is not None else "not loaded",
            "recommender": "loaded" if recommender is not None else "not loaded"
        },
        "data_status": {
            "food_data_loaded": "yes" if (recommender and recommender.food_df is not None) else "no",
            "food_count": len(recommender.food_df) if (recommender and recommender.food_df is not None) else 0,
            "columns": list(recommender.food_df.columns) if (recommender and recommender.food_df is not None) else []
        }
    }

@app.get("/stats")
def get_stats():
    """Get statistics about the food database"""
    if recommender is None or recommender.food_df is None:
        return {"error": "Food data not loaded"}
    
    df = recommender.food_df
    
    return {
        "total_foods": len(df),
        "mood_distribution": df['primary_mood'].value_counts().to_dict() if 'primary_mood' in df.columns else {},
        "nutrition_stats": {
            "calories": {
                "mean": float(df['calories'].mean()),
                "min": float(df['calories'].min()),
                "max": float(df['calories'].max())
            },
            "proteins": {
                "mean": float(df['proteins'].mean()),
                "min": float(df['proteins'].min()),
                "max": float(df['proteins'].max())
            },
            "fat": {
                "mean": float(df['fat'].mean()),
                "min": float(df['fat'].min()),
                "max": float(df['fat'].max())
            },
            "carbohydrate": {
                "mean": float(df['carbohydrate'].mean()),
                "min": float(df['carbohydrate'].min()),
                "max": float(df['carbohydrate'].max())
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)