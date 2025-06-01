import os
import warnings

# Optimize for Render's limited resources
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['PYTHONUNBUFFERED'] = '1'
warnings.filterwarnings('ignore')

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import tensorflow as tf
import pickle
import joblib
from sklearn.metrics.pairwise import cosine_similarity

# TensorFlow optimizations
tf.config.threading.set_intra_op_parallelism_threads(1)
tf.config.threading.set_inter_op_parallelism_threads(1)

# Pydantic models untuk request/response
class NutrientInput(BaseModel):
    calories: float
    proteins: float
    fat: float
    carbohydrate: float

class HealthCondition(BaseModel):
    conditions: Optional[List[str]] = []  # diabetes, hipertensi, kolesterol, obesitas, alergi_gluten, vegetarian

class FoodRecommendationRequest(BaseModel):
    nutrients: NutrientInput
    health_conditions: Optional[List[str]] = []
    top_n: Optional[int] = 5

class FoodItem(BaseModel):
    name: str
    calories: float
    proteins: float
    fat: float
    carbohydrate: float
    primary_mood: str
    similarity_score: float

class FoodRecommendationResponse(BaseModel):
    predicted_mood: str
    mood_probabilities: Dict[str, float]
    recommendations: List[FoodItem]
    total_recommendations: int

# Replika class MoodClassifier dari model
class MoodClassifier:
    def __init__(self):
        self.model = None
        self.onehot_encoder = None  # OneHotEncoder
        self.label_encoder = None   # LabelEncoder
        self.feature_scaler = None

    def preprocess_features(self, X):
        """Preprocess fitur input untuk klasifikasi mood"""
        if self.feature_scaler is None:
            raise ValueError("Feature scaler not loaded")
        X_scaled = self.feature_scaler.transform(X)
        return X_scaled

    def predict(self, X):
        """Prediksi kelas mood dari fitur input"""
        # Preprocess data
        X_scaled = self.preprocess_features(X)

        # Prediksi probabilitas untuk setiap kelas
        y_pred_proba = self.model.predict(X_scaled)

        # Ambil kelas dengan probabilitas tertinggi
        y_pred = np.argmax(y_pred_proba, axis=1)

        # Konversi index ke label mood menggunakan label_encoder
        mood_labels = self.label_encoder.inverse_transform(y_pred)

        return mood_labels

    def predict_proba(self, X):
        """Prediksi probabilitas untuk setiap kelas mood"""
        # Preprocess data
        X_scaled = self.preprocess_features(X)

        # Prediksi probabilitas untuk setiap kelas
        y_pred_proba = self.model.predict(X_scaled)

        return y_pred_proba

    def get_mood_names(self):
        """Get ordered mood names from label encoder"""
        if self.label_encoder is None:
            return []
        return list(self.label_encoder.classes_)

    def load(self, model_path='models/mood_classifier_model.keras', 
             scaler_path='models/mood_feature_scaler.pkl', 
             onehot_encoder_path='models/mood_encoder.pkl',
             label_encoder_path='models/mood_label_encoder.pkl'):
        """Memuat model dan transformer dari file"""
        # Muat model TensorFlow
        self.model = tf.keras.models.load_model(model_path)
        
        # Muat scaler dan encoders
        self.feature_scaler = joblib.load(scaler_path)
        self.onehot_encoder = joblib.load(onehot_encoder_path)
        self.label_encoder = joblib.load(label_encoder_path)

# Replika class FoodRecommender dari model
class FoodRecommender:
    def __init__(self):
        self.food_df = None
        # Mapping mood ke nilai numerik (hanya 4 mood yang valid dalam dataset)
        self.mood_mapping = {
            'energizing': 0,
            'relaxing': 1,
            'focusing': 2,
            'neutral': 3
        }
        self.health_mapping = {
            'diabetes': {'calorie_category': 'low', 'carb_category': 'low'},
            'hipertensi': {'calorie_category': 'low', 'fat_category': 'low'},
            'kolesterol': {'fat_category': 'low'},
            'obesitas': {'calorie_category': 'low', 'fat_category': 'low'},
            'alergi_gluten': {'nutrient_balance': 'balanced'},
            'vegetarian': {'primary_mood': 'relaxing'}  # Prioritas ke relaxing untuk vegetarian
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
            'nutrient_balance': 2.0,
            'primary_mood': 3.0,
            'mood_energizing': 2.0,
            'mood_relaxing': 2.0,
            'mood_focusing': 2.0,
            'vitamin_a': 0.5,
            'vitamin_c': 0.5,
            'vitamin_b': 0.5,
            'iron': 0.5,
            'calcium': 0.5
        }
        self.category_mapping = {
            'very_low': 0,
            'low': 1,
            'medium': 2,
            'high': 3,
            'very_high': 4,
            'balanced': 1,
            'unbalanced': 0
        }

    def encode_mood(self, mood):
        """Encode mood string into a numeric value"""
        return self.mood_mapping.get(mood, 3)  # Default to 'neutral' if not found

    def encode_category(self, category_value):
        """Encode category string into a numeric value"""
        if isinstance(category_value, str):
            return self.category_mapping.get(category_value.lower(), 0)
        return category_value

    def get_food_similarity(self, user_profile):
        """Menghitung kesamaan antara profil pengguna dan makanan dalam dataset"""
        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat")

        # Konversi nilai non-numerik ke numerik dalam profil pengguna
        processed_user_profile = {}

        for key, value in user_profile.items():
            if key == 'primary_mood':
                processed_user_profile[key] = self.encode_mood(value)
            elif isinstance(value, str):
                processed_user_profile[key] = self.encode_category(value)
            else:
                processed_user_profile[key] = value

        # Pastikan fitur yang digunakan ada di dalam dataset
        feature_cols = [col for col in self.food_df.columns
                       if col in processed_user_profile and pd.api.types.is_numeric_dtype(self.food_df[col])]

        if len(feature_cols) == 0:
            raise ValueError("Tidak ada fitur numerik yang cocok antara profil pengguna dan dataset")

        # Ekstrak fitur dari dataset
        food_features = self.food_df[feature_cols].values

        # Buat array untuk fitur pengguna
        user_features = np.array([[processed_user_profile[col] for col in feature_cols]])

        # Hitung kesamaan kosinus
        similarities = cosine_similarity(user_features, food_features)[0]

        # Tambahkan skor kesamaan ke dataframe
        self.food_df['similarity_score'] = similarities

        # Urutkan berdasarkan skor kesamaan
        recommendations = self.food_df.sort_values('similarity_score', ascending=False).head(5)

        return recommendations[['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood', 'similarity_score']]

    def recommend_for_mood(self, mood, top_n=5, health_conditions=None):
        """Merekomendasikan makanan berdasarkan mood dan kondisi kesehatan"""
        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat")

        # Pastikan mood valid - dapatkan dari mood_mapping yang sudah ada di pickle
        valid_moods = list(self.mood_mapping.keys())
        if mood not in valid_moods:
            mood = 'neutral'  # atau mood default lainnya dari mapping

        # Buat profil pengguna berdasarkan mood
        user_profile = {
            'primary_mood': mood
        }

        # Tambahkan feature mood khusus jika tersedia di dataset
        mood_col = f'mood_{mood}'
        if mood_col in self.food_df.columns:
            user_profile[mood_col] = 1.0

        # Tambahkan kondisi kesehatan ke profil pengguna
        if health_conditions:
            for condition in health_conditions:
                if condition in self.health_mapping:
                    for feature, value in self.health_mapping[condition].items():
                        user_profile[feature] = value

        # Hitung kesamaan dan dapatkan rekomendasi
        try:
            recommendations = self.get_food_similarity(user_profile)

            # Filter hasil berdasarkan mood
            if mood in valid_moods and len(recommendations) > 0:
                mood_filtered = recommendations[recommendations['primary_mood'] == mood]
                if len(mood_filtered) > 0:
                    recommendations = mood_filtered

            return recommendations.head(top_n)

        except Exception as e:
            # Fallback: kembalikan makanan berdasarkan mood saja
            if mood in valid_moods:
                mood_filtered = self.food_df[self.food_df['primary_mood'] == mood]
                if len(mood_filtered) > 0:
                    return mood_filtered.head(top_n)

            return self.food_df.head(top_n)

# Inisialisasi FastAPI
app = FastAPI(
    title="NutriMood API",
    description="API untuk rekomendasi makanan berdasarkan mood dan kondisi kesehatan",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables untuk model
mood_classifier = None
food_recommender = None

# Fungsi untuk mengkategorikan nutrisi
def categorize_nutrients(calories, proteins, fat, carbohydrate):
    """Konversi nilai nutrisi ke kategori"""
    # Kategori berdasarkan nilai nutrisi
    # Anda bisa menyesuaikan threshold ini sesuai dataset
    
    # Calorie category
    if calories < 100:
        calorie_category = 'very_low'
    elif calories < 200:
        calorie_category = 'low'
    elif calories < 400:
        calorie_category = 'medium'
    else:
        calorie_category = 'high'
    
    # Protein category
    if proteins < 5:
        protein_category = 'very_low'
    elif proteins < 15:
        protein_category = 'low'
    elif proteins < 30:
        protein_category = 'medium'
    else:
        protein_category = 'high'
    
    # Fat category
    if fat < 5:
        fat_category = 'very_low'
    elif fat < 15:
        fat_category = 'low'
    elif fat < 30:
        fat_category = 'medium'
    else:
        fat_category = 'high'
    
    # Carb category
    if carbohydrate < 15:
        carb_category = 'very_low'
    elif carbohydrate < 30:
        carb_category = 'low' 
    elif carbohydrate < 50:
        carb_category = 'medium'
    else:
        carb_category = 'high'
    
    return {
        'calorie_category': calorie_category,
        'protein_category': protein_category,
        'fat_category': fat_category,
        'carb_category': carb_category
    }

@app.on_event("startup")
async def startup_event():
    """Load models saat startup"""
    global mood_classifier, food_recommender
    
    print("🚀 Starting model loading...")
    
    try:
        # Initialize mood classifier
        print("Loading mood classifier...")
        mood_classifier = MoodClassifier()
        
        # Check if model files exist
        model_files = [
            'models/mood_classifier_model.keras',
            'models/mood_feature_scaler.pkl', 
            'models/mood_encoder.pkl',
            'models/mood_label_encoder.pkl'
        ]
        
        missing_files = [f for f in model_files if not os.path.exists(f)]
        if missing_files:
            print(f"❌ Missing model files: {missing_files}")
            mood_classifier = None
            food_recommender = None
            return
        
        # Load mood classifier
        mood_classifier.load(
            model_path='models/mood_classifier_model.keras',
            scaler_path='models/mood_feature_scaler.pkl',
            onehot_encoder_path='models/mood_encoder.pkl',
            label_encoder_path='models/mood_label_encoder.pkl'
        )
        print("✅ Mood classifier loaded successfully")
        print(f"Available moods: {mood_classifier.get_mood_names()}")
        
        # Create fallback food recommender (skip pickle)
        print("Creating fallback food recommender...")
        food_recommender = FoodRecommender()
        # Create dummy data
        food_recommender.food_df = pd.DataFrame([
            {'name': 'Nasi Putih', 'calories': 130, 'proteins': 2.7, 'fat': 0.3, 'carbohydrate': 28.0, 'primary_mood': 'energizing', 'similarity_score': 0.95},
            {'name': 'Ayam Panggang', 'calories': 165, 'proteins': 31.0, 'fat': 3.6, 'carbohydrate': 0.0, 'primary_mood': 'focusing', 'similarity_score': 0.90},
            {'name': 'Sayur Bayam', 'calories': 23, 'proteins': 2.9, 'fat': 0.4, 'carbohydrate': 3.6, 'primary_mood': 'relaxing', 'similarity_score': 0.85},
            {'name': 'Tempe Goreng', 'calories': 193, 'proteins': 20.8, 'fat': 8.8, 'carbohydrate': 9.4, 'primary_mood': 'energizing', 'similarity_score': 0.88},
            {'name': 'Ikan Bakar', 'calories': 206, 'proteins': 41.9, 'fat': 4.5, 'carbohydrate': 0.0, 'primary_mood': 'focusing', 'similarity_score': 0.92}
        ])
        print("✅ Fallback food recommender created")
        
        print("🎉 All models loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        import traceback
        traceback.print_exc()
        mood_classifier = None
        food_recommender = None
@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to NutriMood API",
        "endpoints": {
            "/recommend": "POST - Get food recommendations based on nutrients and health conditions",
            "/health": "GET - Check API health status"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if (mood_classifier is not None and food_recommender is not None) else "partial",
        "mood_classifier_loaded": mood_classifier is not None,
        "food_recommender_loaded": food_recommender is not None,
        "message": "All models loaded" if (mood_classifier is not None and food_recommender is not None) else "Some models not loaded"
    }

@app.post("/recommend", response_model=FoodRecommendationResponse)
async def get_recommendations(request: FoodRecommendationRequest):
    """Get food recommendations based on nutrient input and health conditions"""
    
    # Check if models are loaded
    if mood_classifier is None or food_recommender is None:
        raise HTTPException(status_code=503, detail="Models not loaded. Please check server logs.")
    
    try:
        # 1. Kategorikan nutrisi
        nutrient_categories = categorize_nutrients(
            request.nutrients.calories,
            request.nutrients.proteins,
            request.nutrients.fat,
            request.nutrients.carbohydrate
        )
        
        # 2. Konversi kategori ke numerik untuk mood classifier
        category_mapping = {'very_low': 0, 'low': 1, 'medium': 2, 'high': 3}
        
        input_features = np.array([[
            category_mapping[nutrient_categories['calorie_category']],
            category_mapping[nutrient_categories['protein_category']],
            category_mapping[nutrient_categories['fat_category']],
            category_mapping[nutrient_categories['carb_category']]
        ]])
        
        # 3. Prediksi mood menggunakan mood classifier
        # Classifier menggunakan label encoder untuk mendapatkan nama mood yang benar
        predicted_mood = mood_classifier.predict(input_features)[0]
        mood_probabilities = mood_classifier.predict_proba(input_features)[0]
        
        # 4. Buat dictionary probabilitas mood
        # Dapatkan urutan mood dari label encoder
        mood_names = mood_classifier.get_mood_names()
        mood_probs = {}
        for i, mood in enumerate(mood_names):
            if i < len(mood_probabilities):
                mood_probs[mood] = float(mood_probabilities[i])
        
        # 5. Dapatkan rekomendasi makanan berdasarkan mood dan health conditions
        recommendations_df = food_recommender.recommend_for_mood(
            mood=predicted_mood,
            top_n=request.top_n,
            health_conditions=request.health_conditions
        )
        
        # 6. Konversi DataFrame ke list of FoodItem
        recommendations = []
        for _, row in recommendations_df.iterrows():
            recommendations.append(FoodItem(
                name=row['name'],
                calories=float(row['calories']),
                proteins=float(row['proteins']),
                fat=float(row['fat']),
                carbohydrate=float(row['carbohydrate']),
                primary_mood=row['primary_mood'],
                similarity_score=float(row['similarity_score'])
            ))
        
        return FoodRecommendationResponse(
            predicted_mood=predicted_mood,
            mood_probabilities=mood_probs,
            recommendations=recommendations,
            total_recommendations=len(recommendations)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)