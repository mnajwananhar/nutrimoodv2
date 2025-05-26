from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import tensorflow as tf
import joblib
import pickle
from typing import List, Optional, Dict
from fastapi.middleware.cors import CORSMiddleware

# ===== FOOD RECOMMENDER CLASS =====
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
            'diabetes': {'calorie_max': 200, 'carb_max': 30},
            'hipertensi': {'calorie_max': 200, 'fat_max': 10},
            'kolesterol': {'fat_max': 10},
            'obesitas': {'calorie_max': 150, 'fat_max': 10},
            'alergi_gluten': {'nutrient_balance': 'balanced'},
            'vegetarian': {'primary_mood': ['relaxing', 'energizing']}
        }
        self.category_mapping = {
            'very_low': 0,
            'low': 1,
            'medium': 2,
            'high': 3
        }

    def load_data(self, food_data_path):
        """Memuat dataset makanan dan mempersiapkannya untuk rekomendasi"""
        import pandas as pd
        self.food_df = pd.read_csv(food_data_path)
        
        # Pastikan kolom penting ada
        required_cols = ['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood']
        for col in required_cols:
            if col not in self.food_df.columns:
                raise ValueError(f"Kolom {col} tidak ditemukan dalam dataset makanan")
        
        # Bersihkan data yang mungkin bermasalah
        self.food_df = self.food_df.dropna(subset=required_cols)
        
        # Pastikan tipe data numerik
        numeric_cols = ['calories', 'proteins', 'fat', 'carbohydrate']
        for col in numeric_cols:
            self.food_df[col] = pd.to_numeric(self.food_df[col], errors='coerce')
        
        # Hapus baris dengan nilai numerik NaN
        self.food_df = self.food_df.dropna(subset=numeric_cols)
        
        print(f"Data makanan dimuat dengan sukses: {self.food_df.shape[0]} item")
        return self.food_df

    def encode_mood(self, mood):
        """Encode mood string into a numeric value"""
        return self.mood_mapping.get(mood, 4)  # Default to 'neutral' if not found

    def encode_category(self, category_value):
        """Encode category string into a numeric value"""
        if isinstance(category_value, str):
            return self.category_mapping.get(category_value.lower(), 0)
        return category_value

    def get_food_similarity(self, user_profile):
        """Menghitung kesamaan antara profil pengguna dan makanan dalam dataset"""
        from sklearn.metrics.pairwise import cosine_similarity
        import pandas as pd
        
        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat!")

        # Konversi nilai non-numerik ke numerik dalam profil pengguna
        processed_user_profile = {}
        
        for key, value in user_profile.items():
            if key == 'primary_mood':
                processed_user_profile[key] = self.encode_mood(value)
            elif isinstance(value, str):
                processed_user_profile[key] = self.encode_category(value)
            else:
                processed_user_profile[key] = value

        # Pastikan fitur yang digunakan ada di dataset
        feature_cols = [col for col in self.food_df.columns 
                       if col in processed_user_profile and pd.api.types.is_numeric_dtype(self.food_df[col])]
        
        if len(feature_cols) == 0:
            # Fallback ke fitur dasar nutrisi
            feature_cols = ['calories', 'proteins', 'fat', 'carbohydrate']
            # Buat profil dasar berdasarkan mood
            if user_profile.get('mood') == 'energizing':
                processed_user_profile = {'calories': 300, 'proteins': 10, 'fat': 10, 'carbohydrate': 50}
            elif user_profile.get('mood') == 'relaxing':
                processed_user_profile = {'calories': 100, 'proteins': 3, 'fat': 5, 'carbohydrate': 15}
            elif user_profile.get('mood') == 'focusing':
                processed_user_profile = {'calories': 200, 'proteins': 20, 'fat': 10, 'carbohydrate': 5}
            else:
                processed_user_profile = {'calories': 200, 'proteins': 10, 'fat': 10, 'carbohydrate': 30}

        # Ekstrak fitur dari dataset
        food_features = self.food_df[feature_cols].values
        
        # Buat array untuk fitur pengguna
        user_features = np.array([[processed_user_profile.get(col, 0) for col in feature_cols]])
        
        # Hitung kesamaan kosinus
        similarities = cosine_similarity(user_features, food_features)[0]
        
        return similarities, feature_cols

    def recommend_for_mood(self, mood, top_n=5, health_conditions=None):
        """Merekomendasikan makanan berdasarkan mood dan kondisi kesehatan"""
        import pandas as pd
        
        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat!")
        
        # Validasi mood
        valid_moods = list(self.mood_mapping.keys())
        if mood not in valid_moods:
            print(f"Mood {mood} tidak valid. Menggunakan 'neutral'.")
            mood = 'neutral'
        
        # Mulai dengan semua makanan
        filtered_df = self.food_df.copy()
        
        # Filter berdasarkan mood jika bukan neutral
        if mood != 'neutral':
            mood_filtered = filtered_df[filtered_df['primary_mood'] == mood]
            if len(mood_filtered) > 0:
                filtered_df = mood_filtered
            else:
                print(f"Tidak ada makanan dengan mood {mood}. Menggunakan semua makanan.")
        
        # Terapkan filter kondisi kesehatan
        if health_conditions:
            for condition in health_conditions:
                if condition in self.health_mapping:
                    condition_filter = self.health_mapping[condition]
                    
                    # Filter berdasarkan kalori maksimal
                    if 'calorie_max' in condition_filter:
                        filtered_df = filtered_df[filtered_df['calories'] <= condition_filter['calorie_max']]
                    
                    # Filter berdasarkan karbohidrat maksimal
                    if 'carb_max' in condition_filter:
                        filtered_df = filtered_df[filtered_df['carbohydrate'] <= condition_filter['carb_max']]
                    
                    # Filter berdasarkan lemak maksimal
                    if 'fat_max' in condition_filter:
                        filtered_df = filtered_df[filtered_df['fat'] <= condition_filter['fat_max']]
        
        # Jika tidak ada hasil setelah filter, kembali ke dataset awal
        if len(filtered_df) == 0:
            print("Tidak ada makanan yang memenuhi kriteria. Menggunakan dataset lengkap.")
            filtered_df = self.food_df.copy()
        
        # Buat profil pengguna untuk similarity
        user_profile = {'mood': mood}
        
        # Hitung similarity
        try:
            similarities, feature_cols = self.get_food_similarity(user_profile)
            filtered_df = filtered_df.copy()
            filtered_df['similarity_score'] = similarities[:len(filtered_df)]
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            # Fallback: random score
            filtered_df['similarity_score'] = np.random.random(len(filtered_df))
        
        # Urutkan berdasarkan similarity score dan ambil top N
        recommendations = filtered_df.sort_values('similarity_score', ascending=False).head(top_n)
        
        return recommendations

# ===== HELPER FUNCTIONS =====
def decode_mood_prediction(encoder, pred_class):
    """Helper function to decode mood prediction"""
    # Mapping mood index to string berdasarkan model asli
    mood_mapping = {
        0: "energizing",
        1: "relaxing",
        2: "focusing", 
        3: "multi_category",
        4: "neutral"
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
        return mood_mapping.get(pred_class, "neutral")

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

try:
    print("Loading NutriMood models...")
    
    # Load mood classifier model
    print("1. Loading mood classifier model...")
    model = tf.keras.models.load_model('mood_classifier_model.keras')
    print("✅ Mood classifier model loaded")
    
    # Load feature scaler
    print("2. Loading feature scaler...")
    feature_scaler = joblib.load('mood_feature_scaler.pkl')
    print("✅ Feature scaler loaded")
    
    # Load label encoder
    print("3. Loading label encoder...")
    label_encoder = joblib.load('mood_label_encoder.pkl')
    print("✅ Label encoder loaded")
    
    # Load mood encoder (OneHotEncoder)
    print("4. Loading mood encoder...")
    mood_encoder = joblib.load('mood_encoder.pkl')
    print("✅ Mood encoder loaded")
    
    # Load food recommender
    print("5. Loading food recommender...")
    try:
        with open('food_recommender.pkl', 'rb') as f:
            food_recommender = pickle.load(f)
        print("✅ Food recommender loaded")
    except Exception as e:
        print(f"⚠️  Warning: Error loading food recommender: {e}")
        print("Creating new FoodRecommender instance...")
        food_recommender = FoodRecommender()
        print("✅ New FoodRecommender created")
    
    print("🎉 All models loaded successfully!")
    
except Exception as e:
    print(f"❌ Error loading models: {e}")
    import traceback
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
            "/health-conditions": "GET - Daftar kondisi kesehatan",
            "/debug/status": "GET - Status debug sistem"
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
    """Prediksi mood berdasarkan data kesehatan (kategori kalori, protein, lemak, karbohidrat)"""
    try:
        # Validasi model loaded
        if model is None or feature_scaler is None or mood_encoder is None:
            raise HTTPException(500, detail="Model belum dimuat lengkap. Silakan hubungi admin.")
        
        # Validasi input
        for field_name, field_value in input_data.dict().items():
            if field_value < 0 or field_value > 3:
                raise HTTPException(400, detail=f"{field_name} harus dalam rentang 0-3")
        
        # Buat input array
        input_array = np.array([
            input_data.calorie_category,
            input_data.protein_category,
            input_data.fat_category,
            input_data.carb_category
        ], dtype=np.float32).reshape(1, -1)
        
        # Scale input menggunakan feature scaler
        scaled_input = feature_scaler.transform(input_array)
        
        # Prediksi menggunakan model
        predictions = model.predict(scaled_input, verbose=0)
        
        # Dapatkan kelas prediksi
        pred_class = np.argmax(predictions, axis=1)[0]
        confidence = float(predictions[0][pred_class])
        
        # Decode ke label mood menggunakan mood encoder (OneHotEncoder)
        mood_label = decode_mood_prediction(mood_encoder, pred_class)
        
        # Buat dictionary probabilitas mood (sesuai urutan model asli)
        mood_names = ['energizing', 'relaxing', 'focusing', 'multi_category', 'neutral']
        
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
        print(f"Prediction error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(500, detail=f"Error prediksi: {str(e)}")

@app.post("/recommend", response_model=List[FoodRecommendation])
async def get_recommendations(request: RecommendationRequest):
    """Dapatkan rekomendasi makanan berdasarkan mood dan kondisi kesehatan"""
    try:
        # Validasi food recommender siap
        if food_recommender is None:
            raise HTTPException(500, detail="Food recommender belum dimuat. Pastikan file food_recommender.pkl tersedia.")
        
        # Check if food_df is loaded
        if hasattr(food_recommender, 'food_df') and food_recommender.food_df is None:
            raise HTTPException(500, detail="Food data belum dimuat di recommender. Silakan hubungi admin.")
        
        if hasattr(food_recommender, 'food_df') and len(food_recommender.food_df) == 0:
            raise HTTPException(500, detail="Food database kosong. Silakan hubungi admin.")
        
        # Validasi mood
        valid_moods = ["energizing", "relaxing", "focusing", "multi_category", "neutral"]
        if request.mood and request.mood.lower() not in valid_moods:
            raise HTTPException(400, detail=f"Mood tidak valid. Harus salah satu dari: {valid_moods}")
        
        # Validasi health conditions
        valid_conditions = ["diabetes", "hipertensi", "kolesterol", "obesitas", "alergi_gluten", "vegetarian"]
        if request.health_conditions:
            for condition in request.health_conditions:
                if condition not in valid_conditions:
                    raise HTTPException(400, detail=f"Kondisi kesehatan '{condition}' tidak valid. Harus salah satu dari: {valid_conditions}")
        
        # Batasi top_n
        top_n = max(1, min(request.top_n if request.top_n else 5, 20))
        
        # Dapatkan rekomendasi dari food recommender
        mood = request.mood.lower() if request.mood else "neutral"
        health_conditions = request.health_conditions if request.health_conditions else None
        
        # Call recommender method
        recommendations = food_recommender.recommend_for_mood(
            mood=mood,
            top_n=top_n,
            health_conditions=health_conditions
        )
        
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
        raise HTTPException(500, detail=f"Error rekomendasi: {str(e)}")

@app.post("/predict-and-recommend")
async def predict_and_recommend(input_data: HealthInputWithConditions):
    """Prediksi mood dan dapatkan rekomendasi dalam satu panggilan"""
    try:
        # Pertama prediksi mood
        mood_prediction = await predict_mood(HealthInput(
            calorie_category=input_data.calorie_category,
            protein_category=input_data.protein_category,
            fat_category=input_data.fat_category,
            carb_category=input_data.carb_category
        ))
        
        # Kemudian dapatkan rekomendasi berdasarkan mood yang diprediksi
        recommendation_request = RecommendationRequest(
            mood=mood_prediction.mood,
            health_conditions=input_data.health_conditions,
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
                "health_conditions_applied": input_data.health_conditions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Error prediksi dan rekomendasi: {str(e)}")

@app.get("/moods")
def get_available_moods():
    """Daftar mood yang tersedia"""
    return {
        "moods": [
            {
                "value": "energizing", 
                "name": "Energizing",
                "description": "Makanan untuk meningkatkan energi (karbohidrat tinggi, protein sedang)",
                "criteria": "Karbohidrat >30g, Protein 5-15g"
            },
            {
                "value": "relaxing", 
                "name": "Relaxing",
                "description": "Makanan untuk relaksasi (kalori rendah, protein rendah)",
                "criteria": "Kalori <150, Protein <5g"
            },
            {
                "value": "focusing", 
                "name": "Focusing",
                "description": "Makanan untuk meningkatkan fokus (protein tinggi, karbohidrat rendah)",
                "criteria": "Protein >15g, Karbohidrat <10g"
            },
            {
                "value": "multi_category", 
                "name": "Multi Category",
                "description": "Makanan yang cocok untuk beberapa mood",
                "criteria": "Memenuhi kriteria beberapa mood"
            },
            {
                "value": "neutral", 
                "name": "Neutral",
                "description": "Makanan sehari-hari tanpa kategori mood khusus",
                "criteria": "Tidak memenuhi kriteria mood tertentu"
            }
        ]
    }

@app.get("/health-conditions")
def get_health_conditions():
    """Daftar kondisi kesehatan yang tersedia"""
    return {
        "conditions": [
            {
                "value": "diabetes", 
                "name": "Diabetes",
                "description": "Kalori rendah, karbohidrat rendah",
                "filter": "Kalori ≤200, Karbohidrat ≤30g"
            },
            {
                "value": "hipertensi", 
                "name": "Hipertensi",
                "description": "Kalori rendah, lemak rendah",
                "filter": "Kalori ≤200, Lemak ≤10g"
            },
            {
                "value": "kolesterol", 
                "name": "Kolesterol Tinggi",
                "description": "Lemak rendah",
                "filter": "Lemak ≤10g"
            },
            {
                "value": "obesitas", 
                "name": "Obesitas",
                "description": "Kalori sangat rendah, lemak rendah",
                "filter": "Kalori ≤150, Lemak ≤10g"
            },
            {
                "value": "alergi_gluten", 
                "name": "Alergi Gluten",
                "description": "Nutrisi seimbang",
                "filter": "Makanan bebas gluten"
            },
            {
                "value": "vegetarian", 
                "name": "Vegetarian",
                "description": "Makanan nabati",
                "filter": "Fokus pada makanan nabati"
            }
        ]
    }

@app.get("/debug/status")
def debug_status():
    """Endpoint debug untuk mengecek status model"""
    status = {
        "model_status": {
            "mood_classifier": "loaded" if model is not None else "not loaded",
            "feature_scaler": "loaded" if feature_scaler is not None else "not loaded", 
            "label_encoder": "loaded" if label_encoder is not None else "not loaded",
            "mood_encoder": "loaded" if mood_encoder is not None else "not loaded",
            "food_recommender": "loaded" if food_recommender is not None else "not loaded"
        }
    }
    
    # Add model info if available
    if model is not None:
        status["model_info"] = {
            "input_shape": str(model.input_shape),
            "output_shape": str(model.output_shape),
            "total_params": model.count_params()
        }
    
    # Add food recommender info if available
    if food_recommender is not None:
        try:
            if hasattr(food_recommender, 'food_df') and food_recommender.food_df is not None:
                status["food_data"] = {
                    "total_foods": len(food_recommender.food_df),
                    "columns": list(food_recommender.food_df.columns),
                    "mood_distribution": food_recommender.food_df['primary_mood'].value_counts().to_dict() if 'primary_mood' in food_recommender.food_df.columns else {}
                }
            else:
                status["food_data"] = {"status": "No food data in recommender"}
        except Exception as e:
            status["food_data"] = {"error": str(e)}
    
    return status

@app.get("/categories")
def get_categories():
    """Daftar kategori input yang tersedia"""
    return {
        "input_categories": {
            "calorie_category": {
                "0": {"name": "very_low", "description": "Sangat rendah kalori"},
                "1": {"name": "low", "description": "Rendah kalori"},
                "2": {"name": "medium", "description": "Sedang kalori"},
                "3": {"name": "high", "description": "Tinggi kalori"}
            },
            "protein_category": {
                "0": {"name": "very_low", "description": "Sangat rendah protein"},
                "1": {"name": "low", "description": "Rendah protein"},
                "2": {"name": "medium", "description": "Sedang protein"},
                "3": {"name": "high", "description": "Tinggi protein"}
            },
            "fat_category": {
                "0": {"name": "very_low", "description": "Sangat rendah lemak"},
                "1": {"name": "low", "description": "Rendah lemak"},
                "2": {"name": "medium", "description": "Sedang lemak"},
                "3": {"name": "high", "description": "Tinggi lemak"}
            },
            "carb_category": {
                "0": {"name": "very_low", "description": "Sangat rendah karbohidrat"},
                "1": {"name": "low", "description": "Rendah karbohidrat"},
                "2": {"name": "medium", "description": "Sedang karbohidrat"},
                "3": {"name": "high", "description": "Tinggi karbohidrat"}
            }
        }
    }

@app.get("/examples")
def get_examples():
    """Contoh input untuk testing"""
    return {
        "examples": [
            {
                "name": "Diet Rendah Kalori",
                "input": {
                    "calorie_category": 1,  # low
                    "protein_category": 2,  # medium
                    "fat_category": 1,      # low
                    "carb_category": 1      # low
                },
                "expected_mood": "focusing atau relaxing"
            },
            {
                "name": "Diet Tinggi Energi", 
                "input": {
                    "calorie_category": 3,  # high
                    "protein_category": 2,  # medium
                    "fat_category": 2,      # medium
                    "carb_category": 3      # high
                },
                "expected_mood": "energizing"
            },
            {
                "name": "Diet Seimbang",
                "input": {
                    "calorie_category": 2,  # medium
                    "protein_category": 2,  # medium
                    "fat_category": 2,      # medium
                    "carb_category": 2      # medium
                },
                "expected_mood": "neutral atau multi_category"
            },
            {
                "name": "Diet Protein Tinggi",
                "input": {
                    "calorie_category": 2,  # medium
                    "protein_category": 3,  # high
                    "fat_category": 1,      # low
                    "carb_category": 0      # very_low
                },
                "expected_mood": "focusing"
            }
        ]
    }

@app.post("/predict/batch", response_model=List[MoodPrediction])
async def predict_mood_batch(input_data: List[HealthInput]):
    """Prediksi mood untuk multiple input sekaligus"""
    try:
        if model is None or feature_scaler is None or mood_encoder is None:
            raise HTTPException(500, detail="Model belum dimuat lengkap. Silakan hubungi admin.")
        
        if len(input_data) > 100:
            raise HTTPException(400, detail="Maksimal 100 input per batch")
        
        results = []
        
        for single_input in input_data:
            # Validasi input
            for field_name, field_value in single_input.dict().items():
                if field_value < 0 or field_value > 3:
                    raise HTTPException(400, detail=f"{field_name} harus dalam rentang 0-3")
            
            # Buat input array
            input_array = np.array([
                single_input.calorie_category,
                single_input.protein_category, 
                single_input.fat_category,
                single_input.carb_category
            ], dtype=np.float32).reshape(1, -1)
            
            # Scale input
            scaled_input = feature_scaler.transform(input_array)
            
            # Prediksi
            predictions = model.predict(scaled_input, verbose=0)
            
            # Dapatkan kelas prediksi
            pred_class = np.argmax(predictions, axis=1)[0]
            confidence = float(predictions[0][pred_class])
            
            # Decode ke label mood
            mood_label = decode_mood_prediction(mood_encoder, pred_class)
            
            # Buat dictionary probabilitas mood
            mood_names = ['energizing', 'relaxing', 'focusing', 'multi_category', 'neutral']
            mood_probs = {}
            for i, prob in enumerate(predictions[0]):
                if i < len(mood_names):
                    mood_probs[mood_names[i]] = float(prob)
            
            results.append(MoodPrediction(
                mood=mood_label,
                confidence=confidence,
                mood_probabilities=mood_probs
            ))
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Batch prediction error: {str(e)}")
        raise HTTPException(500, detail=f"Error prediksi batch: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting NutriMood API Server...")
    print("📝 API Documentation: http://localhost:8000/docs")
    print("🔍 Debug Status: http://localhost:8000/debug/status")
    print("📊 Model Status: http://localhost:8000/")
    uvicorn.run(app, host="0.0.0.0", port=8000)