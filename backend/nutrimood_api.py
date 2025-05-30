from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import tensorflow as tf
import pickle
import joblib
import os
import warnings
import uvicorn
from datetime import datetime

warnings.filterwarnings('ignore')

# Pydantic models for request/response
class HealthData(BaseModel):
    calorie_category: str = Field(..., description="Kategori kalori: very_low, low, medium, high")
    protein_category: str = Field(..., description="Kategori protein: very_low, low, medium, high")
    fat_category: str = Field(..., description="Kategori lemak: very_low, low, medium, high")
    carb_category: str = Field(..., description="Kategori karbohidrat: very_low, low, medium, high")

class PredictRequest(BaseModel):
    health_data: HealthData

class RecommendRequest(BaseModel):
    mood: str = Field(..., description="Mood untuk rekomendasi")
    health_conditions: Optional[List[str]] = Field(default=[], description="Kondisi kesehatan")
    top_n: Optional[int] = Field(default=5, description="Jumlah rekomendasi")

class PredictAndRecommendRequest(BaseModel):
    health_data: HealthData
    health_conditions: Optional[List[str]] = Field(default=[], description="Kondisi kesehatan")
    top_n: Optional[int] = Field(default=5, description="Jumlah rekomendasi")

class BatchPredictRequest(BaseModel):
    batch_data: List[HealthData]

class MoodPrediction(BaseModel):
    predicted_mood: str
    confidence: float
    mood_probabilities: Dict[str, float]

class FoodRecommendation(BaseModel):
    name: str
    calories: float
    proteins: float
    fat: float
    carbohydrate: float
    primary_mood: str
    similarity_score: float

class RecommendationResponse(BaseModel):
    mood: str
    recommendations: List[FoodRecommendation]
    total_recommendations: int

class PredictAndRecommendResponse(BaseModel):
    predicted_mood: str
    confidence: float
    mood_probabilities: Dict[str, float]
    recommendations: List[FoodRecommendation]
    total_recommendations: int

class BatchPredictResponse(BaseModel):
    predictions: List[MoodPrediction]
    total_processed: int

# FoodRecommender Class (diperlukan untuk unpickle)
class FoodRecommender:
    def __init__(self):
        self.food_df = None
        self.mood_mapping = {
            'energizing': 0,
            'relaxing': 1,
            'focusing': 2,
            'multi_category': 3,
            'neutral': 4
        }
        self.health_mapping = {
            'diabetes': {'calorie_category': 'low', 'carb_category': 'low'},
            'hipertensi': {'calorie_category': 'low', 'fat_category': 'low'},
            'kolesterol': {'fat_category': 'low'},
            'obesitas': {'calorie_category': 'low', 'fat_category': 'low'},
            'alergi_gluten': {'nutrient_balance': 'balanced'},
            'vegetarian': {'primary_mood': ['relaxing', 'energizing']}
        }

    def recommend_for_mood(self, mood, top_n=5, health_conditions=None):
        """Dummy implementation - akan menggunakan data hardcoded dari model"""
        # Data makanan hardcoded sebagai fallback
        sample_foods = [
            {
                'name': 'Nasi Putih',
                'calories': 130,
                'proteins': 2.7,
                'fat': 0.3,
                'carbohydrate': 28.0,
                'primary_mood': 'energizing',
                'similarity_score': 0.95
            },
            {
                'name': 'Ayam Panggang',
                'calories': 165,
                'proteins': 31.0,
                'fat': 3.6,
                'carbohydrate': 0.0,
                'primary_mood': 'focusing',
                'similarity_score': 0.90
            },
            {
                'name': 'Sayur Bayam',
                'calories': 23,
                'proteins': 2.9,
                'fat': 0.4,
                'carbohydrate': 3.6,
                'primary_mood': 'relaxing',
                'similarity_score': 0.85
            },
            {
                'name': 'Tempe Goreng',
                'calories': 193,
                'proteins': 20.8,
                'fat': 8.8,
                'carbohydrate': 9.4,
                'primary_mood': 'energizing',
                'similarity_score': 0.88
            },
            {
                'name': 'Ikan Bakar',
                'calories': 206,
                'proteins': 41.9,
                'fat': 4.5,
                'carbohydrate': 0.0,
                'primary_mood': 'focusing',
                'similarity_score': 0.92
            },
            {
                'name': 'Tahu Rebus',
                'calories': 70,
                'proteins': 8.1,
                'fat': 4.2,
                'carbohydrate': 2.3,
                'primary_mood': 'relaxing',
                'similarity_score': 0.80
            },
            {
                'name': 'Kentang Rebus',
                'calories': 87,
                'proteins': 1.9,
                'fat': 0.1,
                'carbohydrate': 20.1,
                'primary_mood': 'energizing',
                'similarity_score': 0.75
            },
            {
                'name': 'Dada Ayam Kukus',
                'calories': 165,
                'proteins': 31.0,
                'fat': 3.6,
                'carbohydrate': 0.0,
                'primary_mood': 'focusing',
                'similarity_score': 0.93
            }
        ]
        
        # Filter berdasarkan mood jika diminta
        filtered_foods = sample_foods
        if mood != 'neutral':
            filtered_foods = [food for food in sample_foods if food['primary_mood'] == mood]
            
        # Jika tidak ada yang cocok dengan mood, ambil semua
        if not filtered_foods:
            filtered_foods = sample_foods
            
        # Filter berdasarkan kondisi kesehatan
        if health_conditions:
            for condition in health_conditions:
                if condition == 'diabetes':
                    # Prioritas rendah karbohidrat dan kalori
                    filtered_foods = sorted(filtered_foods, key=lambda x: (x['carbohydrate'], x['calories']))
                elif condition == 'hipertensi':
                    # Prioritas rendah lemak dan natrium
                    filtered_foods = sorted(filtered_foods, key=lambda x: x['fat'])
                elif condition == 'kolesterol':
                    # Prioritas rendah lemak
                    filtered_foods = sorted(filtered_foods, key=lambda x: x['fat'])
                elif condition == 'obesitas':
                    # Prioritas rendah kalori dan lemak
                    filtered_foods = sorted(filtered_foods, key=lambda x: (x['calories'], x['fat']))
        
        # Batasi hasil sesuai top_n
        result_foods = filtered_foods[:top_n]
        
        # Convert to DataFrame format
        df_foods = pd.DataFrame(result_foods)
        return df_foods

# NutriMood Model Class
class NutriMoodModel:
    def __init__(self, 
                 model_path: str = 'mood_classifier_model.keras',
                 scaler_path: str = 'mood_feature_scaler.pkl',
                 encoder_path: str = 'mood_encoder.pkl',
                 recommender_path: str = 'food_recommender.pkl'):
        
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.encoder_path = encoder_path
        self.recommender_path = recommender_path
        
        # Initialize variables
        self.model = None
        self.feature_scaler = None
        self.encoder = None
        self.recommender = None
        
        # Mapping categories to numeric values
        self.category_mapping = {
            'very_low': 0, 
            'low': 1, 
            'medium': 2, 
            'high': 3
        }
        
        # Mood mapping
        self.mood_mapping = {
            'energizing': 0,
            'relaxing': 1,
            'focusing': 2,
            'multi_category': 3,
            'neutral': 4
        }
        
        # Health conditions mapping
        self.health_conditions_list = [
            'diabetes', 'hipertensi', 'kolesterol', 'obesitas', 
            'alergi_gluten', 'vegetarian', 'diet_rendah_garam'
        ]
        
        # Load all models
        self.load_models()
    
    def load_models(self):
        """Load semua model yang diperlukan"""
        try:
            # Load mood classifier
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print(f"✓ Mood classifier loaded from {self.model_path}")
            else:
                print(f"✗ Mood classifier not found at {self.model_path}")
            
            # Load feature scaler
            if os.path.exists(self.scaler_path):
                self.feature_scaler = joblib.load(self.scaler_path)
                print(f"✓ Feature scaler loaded from {self.scaler_path}")
            else:
                print(f"✗ Feature scaler not found at {self.scaler_path}")
            
            # Load encoder
            if os.path.exists(self.encoder_path):
                self.encoder = joblib.load(self.encoder_path)
                print(f"✓ Encoder loaded from {self.encoder_path}")
            else:
                print(f"✗ Encoder not found at {self.encoder_path}")
            
            # Load food recommender
            if os.path.exists(self.recommender_path):
                with open(self.recommender_path, 'rb') as f:
                    self.recommender = pickle.load(f)
                print(f"✓ Food recommender loaded from {self.recommender_path}")
            else:
                print(f"✗ Food recommender not found at {self.recommender_path}")
                
        except Exception as e:
            print(f"Error loading models: {str(e)}")
            raise e
    
    def predict_mood(self, health_data: Dict[str, str]) -> tuple:
        """Prediksi mood berdasarkan data kesehatan"""
        if not all([self.model, self.feature_scaler, self.encoder]):
            raise ValueError("Model mood classifier belum dimuat dengan benar")
        
        # Convert string categories to numeric values
        numeric_health_data = {}
        for key, value in health_data.items():
            if isinstance(value, str) and value in self.category_mapping:
                numeric_health_data[key] = self.category_mapping[value]
            else:
                numeric_health_data[key] = value
        
        # Prepare feature vector
        features = np.array([
            numeric_health_data.get('calorie_category', 1),
            numeric_health_data.get('protein_category', 1),
            numeric_health_data.get('fat_category', 1),
            numeric_health_data.get('carb_category', 1)
        ]).reshape(1, -1)
        
        # Preprocess data
        features_scaled = self.feature_scaler.transform(features)
        
        # Predict mood
        proba = self.model.predict(features_scaled, verbose=0)
        pred_class = np.argmax(proba, axis=1)[0]
        confidence = float(proba[0][pred_class])
        
        # Decode class to mood label
        mood_labels = self.encoder.inverse_transform(
            np.eye(proba.shape[1])[pred_class].reshape(1, -1)
        )[0][0]
        
        # Create probability dictionary
        mood_names = list(self.mood_mapping.keys())
        mood_probabilities = {}
        for i, mood in enumerate(mood_names):
            if i < len(proba[0]):
                mood_probabilities[mood] = float(proba[0][i])
        
        return mood_labels, confidence, mood_probabilities
    
    def get_recommendations(self, mood: str, health_conditions: List[str] = None, top_n: int = 5) -> pd.DataFrame:
        """Dapatkan rekomendasi makanan berdasarkan mood dan kondisi kesehatan"""
        if not self.recommender:
            raise ValueError("Food recommender belum dimuat dengan benar")
        
        return self.recommender.recommend_for_mood(mood, top_n, health_conditions)
    
    def check_models_status(self) -> Dict[str, bool]:
        """Cek status semua model"""
        return {
            'mood_classifier': self.model is not None,
            'feature_scaler': self.feature_scaler is not None,
            'encoder': self.encoder is not None,
            'food_recommender': self.recommender is not None
        }

# Initialize FastAPI app
app = FastAPI(
    title="NutriMood API",
    description="API untuk prediksi mood dan rekomendasi makanan berdasarkan data kesehatan",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NutriMood model
try:
    nutrimood_model = NutriMoodModel()
    print("NutriMood model initialized successfully")
except Exception as e:
    print(f"Error initializing NutriMood model: {str(e)}")
    nutrimood_model = None

# API Endpoints sesuai dengan requirement

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to NutriMood API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.post("/predict", response_model=MoodPrediction)
async def predict(request: PredictRequest):
    """Prediksi mood berdasarkan data kesehatan"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    try:
        # Convert HealthData to dict
        health_dict = request.health_data.dict()
        
        # Predict mood
        mood, confidence, probabilities = nutrimood_model.predict_mood(health_dict)
        
        return MoodPrediction(
            predicted_mood=mood,
            confidence=confidence,
            mood_probabilities=probabilities
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting mood: {str(e)}")

@app.post("/recommend", response_model=RecommendationResponse)
async def recommend(request: RecommendRequest):
    """Dapatkan rekomendasi makanan berdasarkan mood"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    try:
        # Get recommendations
        recommendations_df = nutrimood_model.get_recommendations(
            mood=request.mood,
            health_conditions=request.health_conditions,
            top_n=request.top_n
        )
        
        # Convert DataFrame to list of FoodRecommendation
        recommendations = []
        for _, row in recommendations_df.iterrows():
            recommendations.append(FoodRecommendation(
                name=row['name'],
                calories=float(row['calories']) if pd.notna(row['calories']) else 0.0,
                proteins=float(row['proteins']) if pd.notna(row['proteins']) else 0.0,
                fat=float(row['fat']) if pd.notna(row['fat']) else 0.0,
                carbohydrate=float(row['carbohydrate']) if pd.notna(row['carbohydrate']) else 0.0,
                primary_mood=str(row['primary_mood']) if pd.notna(row['primary_mood']) else '',
                similarity_score=float(row['similarity_score']) if 'similarity_score' in row and pd.notna(row['similarity_score']) else 0.0
            ))
        
        return RecommendationResponse(
            mood=request.mood,
            recommendations=recommendations,
            total_recommendations=len(recommendations)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@app.post("/predict-and-recommend", response_model=PredictAndRecommendResponse)
async def predict_and_recommend(request: PredictAndRecommendRequest):
    """Prediksi mood dan dapatkan rekomendasi makanan sekaligus"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    try:
        # Convert HealthData to dict
        health_dict = request.health_data.dict()
        
        # Predict mood
        mood, confidence, probabilities = nutrimood_model.predict_mood(health_dict)
        
        # Get recommendations based on predicted mood
        recommendations_df = nutrimood_model.get_recommendations(
            mood=mood,
            health_conditions=request.health_conditions,
            top_n=request.top_n
        )
        
        # Convert DataFrame to list of FoodRecommendation
        recommendations = []
        for _, row in recommendations_df.iterrows():
            recommendations.append(FoodRecommendation(
                name=row['name'],
                calories=float(row['calories']) if pd.notna(row['calories']) else 0.0,
                proteins=float(row['proteins']) if pd.notna(row['proteins']) else 0.0,
                fat=float(row['fat']) if pd.notna(row['fat']) else 0.0,
                carbohydrate=float(row['carbohydrate']) if pd.notna(row['carbohydrate']) else 0.0,
                primary_mood=str(row['primary_mood']) if pd.notna(row['primary_mood']) else '',
                similarity_score=float(row['similarity_score']) if 'similarity_score' in row and pd.notna(row['similarity_score']) else 0.0
            ))
        
        return PredictAndRecommendResponse(
            predicted_mood=mood,
            confidence=confidence,
            mood_probabilities=probabilities,
            recommendations=recommendations,
            total_recommendations=len(recommendations)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in predict and recommend: {str(e)}")

@app.get("/moods", response_model=List[str])
async def get_moods():
    """Dapatkan daftar mood yang tersedia"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    return list(nutrimood_model.mood_mapping.keys())

@app.get("/health-conditions", response_model=List[str])
async def get_health_conditions():
    """Dapatkan daftar kondisi kesehatan yang tersedia"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    return nutrimood_model.health_conditions_list

@app.get("/categories")
async def get_categories():
    """Dapatkan daftar kategori nutrisi yang tersedia"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    return {
        "calorie_category": list(nutrimood_model.category_mapping.keys()),
        "protein_category": list(nutrimood_model.category_mapping.keys()),
        "fat_category": list(nutrimood_model.category_mapping.keys()),
        "carb_category": list(nutrimood_model.category_mapping.keys())
    }

@app.post("/predict/batch", response_model=BatchPredictResponse)
async def predict_batch(request: BatchPredictRequest):
    """Prediksi mood untuk multiple data kesehatan sekaligus"""
    if nutrimood_model is None:
        raise HTTPException(status_code=500, detail="NutriMood model not initialized")
    
    try:
        predictions = []
        
        for health_data in request.batch_data:
            # Convert HealthData to dict
            health_dict = health_data.dict()
            
            # Predict mood
            mood, confidence, probabilities = nutrimood_model.predict_mood(health_dict)
            
            predictions.append(MoodPrediction(
                predicted_mood=mood,
                confidence=confidence,
                mood_probabilities=probabilities
            ))
        
        return BatchPredictResponse(
            predictions=predictions,
            total_processed=len(predictions)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch prediction: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if nutrimood_model is None:
        return {
            "status": "error",
            "message": "NutriMood model not initialized",
            "models_loaded": {},
            "timestamp": datetime.now()
        }
    
    models_status = nutrimood_model.check_models_status()
    all_loaded = all(models_status.values())
    
    return {
        "status": "healthy" if all_loaded else "partial",
        "message": "All models loaded" if all_loaded else "Some models not loaded",
        "models_loaded": models_status,
        "timestamp": datetime.now()
    }

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "detail": str(exc)}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {"error": "Internal server error", "detail": str(exc)}

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )