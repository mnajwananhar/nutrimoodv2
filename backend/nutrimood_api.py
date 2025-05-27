from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
import pickle
import traceback
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware

# ===== HELPER FUNCTIONS =====
def recommend_foods_by_mood(mood, top_n=10, health_conditions=None):
    """Recommend foods based on mood and health conditions using real data from pickle"""
    try:
        if food_recommender is None:
            return []
        
        # Get the actual food DataFrame from the loaded recommender
        food_df = None
        if hasattr(food_recommender, 'food_df') and food_recommender.food_df is not None:
            food_df = food_recommender.food_df.copy()
        elif hasattr(food_recommender, 'df') and food_recommender.df is not None:
            food_df = food_recommender.df.copy()
        else:
            return []
        
        if food_df.empty:
            return []
        
        # Filter berdasarkan mood
        if mood and mood != "neutral":
            filtered_df = food_df[food_df['primary_mood'] == mood]
            
            if filtered_df.empty:
                mood_col = f'mood_{mood}'
                if mood_col in food_df.columns:
                    filtered_df = food_df[food_df[mood_col] == True]
                
                if filtered_df.empty:
                    filtered_df = food_df[food_df['primary_mood'] == 'neutral']
                    
                    if filtered_df.empty:
                        filtered_df = food_df
        else:
            filtered_df = food_df.copy()
        
        # Apply health condition filters dengan percentile (PERBAIKAN UTAMA)
        if health_conditions:
            for condition in health_conditions:
                original_count = len(filtered_df)
                
                if condition == "diabetes":
                    # Gunakan percentile 40% untuk kalori dan 35% untuk karbohidrat
                    calorie_threshold = filtered_df['calories'].quantile(0.4)
                    carb_threshold = filtered_df['carbohydrate'].quantile(0.35)
                    
                    temp_filtered = filtered_df[
                        (filtered_df['calories'] <= calorie_threshold) & 
                        (filtered_df['carbohydrate'] <= carb_threshold)
                    ]
                    
                    # Jika hasil terlalu sedikit, gunakan threshold yang lebih longgar
                    if len(temp_filtered) < top_n:
                        calorie_threshold = filtered_df['calories'].quantile(0.6)
                        carb_threshold = filtered_df['carbohydrate'].quantile(0.5)
                        temp_filtered = filtered_df[
                            (filtered_df['calories'] <= calorie_threshold) & 
                            (filtered_df['carbohydrate'] <= carb_threshold)
                        ]
                    
                    filtered_df = temp_filtered if len(temp_filtered) > 0 else filtered_df
                    
                elif condition == "hipertensi":
                    calorie_threshold = filtered_df['calories'].quantile(0.35)
                    fat_threshold = filtered_df['fat'].quantile(0.3)
                    
                    temp_filtered = filtered_df[
                        (filtered_df['calories'] <= calorie_threshold) & 
                        (filtered_df['fat'] <= fat_threshold)
                    ]
                    
                    if len(temp_filtered) < top_n:
                        calorie_threshold = filtered_df['calories'].quantile(0.6)
                        fat_threshold = filtered_df['fat'].quantile(0.5)
                        temp_filtered = filtered_df[
                            (filtered_df['calories'] <= calorie_threshold) & 
                            (filtered_df['fat'] <= fat_threshold)
                        ]
                    
                    filtered_df = temp_filtered if len(temp_filtered) > 0 else filtered_df
                    
                elif condition == "kolesterol":
                    fat_threshold = filtered_df['fat'].quantile(0.25)
                    temp_filtered = filtered_df[filtered_df['fat'] <= fat_threshold]
                    
                    if len(temp_filtered) < top_n:
                        fat_threshold = filtered_df['fat'].quantile(0.5)
                        temp_filtered = filtered_df[filtered_df['fat'] <= fat_threshold]
                    
                    filtered_df = temp_filtered if len(temp_filtered) > 0 else filtered_df
                    
                elif condition == "obesitas":
                    calorie_threshold = filtered_df['calories'].quantile(0.2)
                    fat_threshold = filtered_df['fat'].quantile(0.25)
                    
                    temp_filtered = filtered_df[
                        (filtered_df['calories'] <= calorie_threshold) & 
                        (filtered_df['fat'] <= fat_threshold)
                    ]
                    
                    if len(temp_filtered) < top_n:
                        calorie_threshold = filtered_df['calories'].quantile(0.4)
                        fat_threshold = filtered_df['fat'].quantile(0.4)
                        temp_filtered = filtered_df[
                            (filtered_df['calories'] <= calorie_threshold) & 
                            (filtered_df['fat'] <= fat_threshold)
                        ]
                    
                    filtered_df = temp_filtered if len(temp_filtered) > 0 else filtered_df
        
        # Smart fallback jika masih kosong
        if filtered_df.empty:
            if mood and mood != "neutral":
                filtered_df = food_df[food_df['primary_mood'] == mood]
            if filtered_df.empty:
                filtered_df = food_df.nsmallest(top_n, 'calories')
        
        # Smart sorting berdasarkan health conditions
        if health_conditions:
            if any(cond in ['diabetes', 'obesitas'] for cond in health_conditions):
                # Sort by calories ascending untuk weight management
                filtered_df = filtered_df.sort_values(['calories', 'carbohydrate']).head(top_n)
            elif any(cond in ['kolesterol', 'hipertensi'] for cond in health_conditions):
                # Sort by fat ascending untuk heart health
                filtered_df = filtered_df.sort_values(['fat', 'calories']).head(top_n)
            else:
                filtered_df = filtered_df.sort_values('calories').head(top_n)
        else:
            # No health conditions, sort by mood preference
            if mood == 'energizing':
                filtered_df = filtered_df.sort_values('carbohydrate', ascending=False).head(top_n)
            elif mood == 'focusing':
                filtered_df = filtered_df.sort_values('proteins', ascending=False).head(top_n)
            else:
                filtered_df = filtered_df.sort_values('calories').head(top_n)
        
        # Calculate proper similarity score
        filtered_df = filtered_df.copy()
        base_score = 0.7
        for idx, row in filtered_df.iterrows():
            score = base_score
            
            # Mood match bonus
            if row['primary_mood'] == mood:
                score += 0.2
            
            # Health condition compatibility bonus
            if health_conditions:
                for condition in health_conditions:
                    if condition == 'diabetes' and row['carbohydrate'] < 20:
                        score += 0.05
                    elif condition == 'hipertensi' and row['fat'] < 8:
                        score += 0.05
                    elif condition == 'kolesterol' and row['fat'] < 5:
                        score += 0.05
                    elif condition == 'obesitas' and row['calories'] < 100:
                        score += 0.05
            
            filtered_df.at[idx, 'similarity_score'] = min(score, 1.0)
        
        return filtered_df
        
    except Exception as e:
        print(f"Error in recommend_foods_by_mood: {e}")
        return []

# ===== INISIALISASI APLIKASI =====
app = FastAPI(title="NutriMood API", version="1.0.0", description="API untuk prediksi mood dan rekomendasi makanan berdasarkan profil nutrisi")

# Tambahkan CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== LOAD MODEL =====
model = None
feature_scaler = None
label_encoder = None
mood_encoder = None
food_recommender = None

# Dummy class untuk load pickle file
class FoodRecommender:
    def __init__(self):
        self.food_df = None
        self.df = None
        self.mood_mapping = {}
        self.health_mapping = {}
        self.feature_weights = {}
        self.category_mapping = {}
    
    def recommend_for_mood(self, mood, top_n=5, health_conditions=None):
        return pd.DataFrame()

try:
    print("Loading NutriMood models...")
    
    print("1. Loading mood classifier model...")
    model = tf.keras.models.load_model('mood_classifier_model.keras')
    print("✅ Mood classifier model loaded")
    
    print("2. Loading feature scaler...")
    feature_scaler = joblib.load('mood_feature_scaler.pkl')
    print("✅ Feature scaler loaded")
    
    print("3. Loading label encoder...")
    label_encoder = joblib.load('mood_label_encoder.pkl')
    print("✅ Label encoder loaded")
    
    print("4. Loading mood encoder...")
    mood_encoder = joblib.load('mood_encoder.pkl')
    print("✅ Mood encoder loaded")
    
    print("5. Loading food recommender...")
    try:
        with open('food_recommender.pkl', 'rb') as f:
            food_recommender = pickle.load(f)
        print("✅ Food recommender loaded")
        if hasattr(food_recommender, 'food_df') and food_recommender.food_df is not None:
            print(f"   📊 Total foods in database: {len(food_recommender.food_df)}")
            mood_dist = food_recommender.food_df['primary_mood'].value_counts().to_dict() if 'primary_mood' in food_recommender.food_df.columns else {}
            print(f"   🎭 Mood distribution: {mood_dist}")
    except FileNotFoundError:
        print("⚠️  WARNING: File food_recommender.pkl tidak ditemukan!")
        food_recommender = None
    except Exception as e:
        print(f"⚠️  WARNING: Error loading food_recommender.pkl: {e}")
        food_recommender = None
    
    print("🎉 All models loaded successfully!")
    
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print(f"Traceback: {traceback.format_exc()}")

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
        "status": "NutriMood API is running",
        "version": "1.0.0",
        "description": "API untuk prediksi mood dan rekomendasi makanan berdasarkan profil nutrisi",
        "endpoints": {
            "/predict": "POST - Prediksi mood berdasarkan data kesehatan",
            "/recommend": "POST - Dapatkan rekomendasi makanan berdasarkan mood",
            "/predict-and-recommend": "POST - Prediksi mood dan rekomendasi sekaligus",
            "/moods": "GET - Daftar mood yang tersedia",
            "/health-conditions": "GET - Daftar kondisi kesehatan"
        },
        "model_status": {
            "mood_classifier": "loaded" if model is not None else "not loaded",
            "feature_scaler": "loaded" if feature_scaler is not None else "not loaded",
            "label_encoder": "loaded" if label_encoder is not None else "not loaded",
            "mood_encoder": "loaded" if mood_encoder is not None else "not loaded",
            "food_recommender": "loaded" if food_recommender is not None else "not loaded"
        }
    }

@app.post("/predict", response_model=MoodPrediction)
async def predict_mood(input_data: HealthInput):
    """Prediksi mood berdasarkan data kesehatan"""
    try:
        if model is None or feature_scaler is None or label_encoder is None:
            raise HTTPException(500, detail="Model belum dimuat lengkap")
        
        for field_name, field_value in input_data.dict().items():
            if field_value < 0 or field_value > 3:
                raise HTTPException(400, detail=f"{field_name} harus dalam rentang 0-3")
        
        input_array = np.array([
            input_data.calorie_category,
            input_data.protein_category,
            input_data.fat_category,
            input_data.carb_category
        ], dtype=np.float32).reshape(1, -1)
        
        scaled_input = feature_scaler.transform(input_array)
        predictions = model.predict(scaled_input, verbose=0)
        
        pred_class = np.argmax(predictions, axis=1)[0]
        confidence = float(predictions[0][pred_class])
        
        mood_label = label_encoder.inverse_transform([pred_class])[0]
        
        mood_names = list(label_encoder.classes_)
        mood_probs = {}
        for i, prob in enumerate(predictions[0]):
            if i < len(mood_names):
                mood_probs[mood_names[i]] = float(prob)
        
        return MoodPrediction(
            mood=mood_label,
            confidence=confidence,
            mood_probabilities=mood_probs
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Error prediksi: {str(e)}")

@app.post("/recommend", response_model=List[FoodRecommendation])
async def get_recommendations(request: RecommendationRequest):
    """Dapatkan rekomendasi makanan berdasarkan mood dan kondisi kesehatan"""
    try:
        if food_recommender is None:
            raise HTTPException(500, detail="Food recommender belum dimuat")
        
        valid_moods = ["energizing", "relaxing", "focusing", "neutral"]
        if request.mood and request.mood.lower() not in valid_moods:
            raise HTTPException(400, detail=f"Mood tidak valid. Harus salah satu dari: {valid_moods}")
        
        valid_conditions = ["diabetes", "hipertensi", "kolesterol", "obesitas", "alergi_gluten", "vegetarian"]
        if request.health_conditions:
            filtered_conditions = [c for c in request.health_conditions if c and c.lower() not in ['none', '']]
            
            for condition in filtered_conditions:
                if condition not in valid_conditions:
                    raise HTTPException(400, detail=f"Kondisi kesehatan '{condition}' tidak valid")
            
            request.health_conditions = filtered_conditions
        
        top_n = max(1, min(request.top_n if request.top_n else 5, 20))
        
        mood = request.mood.lower() if request.mood else "neutral"
        health_conditions = request.health_conditions if request.health_conditions else None
        
        recommendations = recommend_foods_by_mood(
            mood=mood,
            top_n=top_n,
            health_conditions=health_conditions
        )
        
        result = []
        if hasattr(recommendations, 'iterrows'):
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
        raise HTTPException(500, detail=f"Error rekomendasi: {str(e)}")

@app.post("/predict-and-recommend")
async def predict_and_recommend(input_data: HealthInputWithConditions):
    """Prediksi mood dan dapatkan rekomendasi dalam satu panggilan"""
    try:
        mood_prediction = await predict_mood(HealthInput(
            calorie_category=input_data.calorie_category,
            protein_category=input_data.protein_category,
            fat_category=input_data.fat_category,
            carb_category=input_data.carb_category
        ))
        
        filtered_health_conditions = None
        if input_data.health_conditions:
            filtered_conditions = [c for c in input_data.health_conditions if c and c.lower() not in ['none', '']]
            filtered_health_conditions = filtered_conditions if filtered_conditions else None
        
        recommendation_request = RecommendationRequest(
            mood=mood_prediction.mood,
            health_conditions=filtered_health_conditions,
            top_n=5
        )
        
        recommendations = await get_recommendations(recommendation_request)
        
        return {
            "mood_prediction": mood_prediction,
            "recommendations": recommendations,
            "summary": {
                "predicted_mood": mood_prediction.mood,
                "confidence": mood_prediction.confidence,
                "total_recommendations": len(recommendations),
                "health_conditions_applied": filtered_health_conditions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Error prediksi dan rekomendasi: {str(e)}")

@app.get("/moods")
def get_available_moods():
    return {
        "moods": [
            {"value": "energizing", "name": "Energizing", "description": "Makanan untuk meningkatkan energi"},
            {"value": "relaxing", "name": "Relaxing", "description": "Makanan untuk relaksasi"},
            {"value": "focusing", "name": "Focusing", "description": "Makanan untuk meningkatkan fokus"},
            {"value": "neutral", "name": "Neutral", "description": "Makanan sehari-hari"}
        ]
    }

@app.get("/health-conditions")
def get_health_conditions():
    return {
        "conditions": [
            {"value": "diabetes", "name": "Diabetes", "description": "Kalori rendah, karbohidrat rendah"},
            {"value": "hipertensi", "name": "Hipertensi", "description": "Kalori rendah, lemak rendah"},
            {"value": "kolesterol", "name": "Kolesterol Tinggi", "description": "Lemak rendah"},
            {"value": "obesitas", "name": "Obesitas", "description": "Kalori sangat rendah"},
            {"value": "alergi_gluten", "name": "Alergi Gluten", "description": "Makanan bebas gluten"},
            {"value": "vegetarian", "name": "Vegetarian", "description": "Makanan nabati"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting NutriMood API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)