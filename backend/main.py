# app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(
    title="NutriMood API",
    description="API rekomendasi makanan berdasarkan mood dan kondisi kesehatan",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RecommendationRequest(BaseModel):
    mood: str  # energizing, relaxing, focusing, neutral
    health_conditions: Optional[List[str]] = None  # diabetes, hipertensi, kolesterol, etc.
    top_n: int = 5

class FoodItem(BaseModel):
    name: str
    calories: float
    proteins: float
    fat: float
    carbohydrate: float
    primary_mood: str
    similarity_score: float

class RecommendationResponse(BaseModel):
    mood: str
    health_conditions: Optional[List[str]]
    recommendations: List[FoodItem]
    message: str

# FoodRecommender class
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
        # Sesuaikan health mapping dengan kode asli di Colab
        # Health mapping yang lebih spesifik dan akurat
        self.health_mapping = {
            'diabetes': {
                'calorie_category_num': 1,      # Kalori rendah
                'carb_category_num': 0,         # Karbohidrat sangat rendah
                'priority_nutrients': ['carbohydrate', 'calories']
            },
            'hipertensi': {
                'calorie_category_num': 1,      # Kalori rendah
                'fat_category_num': 0,          # Lemak sangat rendah
                'protein_category_num': 2,      # Protein sedang (untuk jantung)
                'priority_nutrients': ['fat', 'calories']
            },
            'kolesterol': {
                'fat_category_num': 0,          # Lemak sangat rendah
                'protein_category_num': 2,      # Protein sedang
                'priority_nutrients': ['fat']
            },
            'obesitas': {
                'calorie_category_num': 0,      # Kalori sangat rendah
                'fat_category_num': 1,          # Lemak rendah
                'carb_category_num': 1,         # Karbohidrat rendah
                'priority_nutrients': ['calories', 'fat', 'carbohydrate']
            },
            'alergi_gluten': {
                'nutrient_balance_num': 1.0,    # Balanced nutrition
                'protein_category_num': 2,      # Protein sedang untuk kompensasi
                'priority_nutrients': ['proteins']
            },
            'vegetarian': {
                'protein_category_num': 2,      # Protein sedang (penting untuk vegetarian)
                'nutrient_balance_num': 1.0,    # Nutrisi seimbang
                'priority_nutrients': ['proteins']
                # TIDAK mengubah primary_mood!
            }
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

    def load_data(self, food_data_path):
        """Memuat dataset makanan"""
        self.food_df = pd.read_csv(food_data_path)
        print(f"Data makanan dimuat: {self.food_df.shape[0]} item")
        return self.food_df

    def encode_mood(self, mood):
        """Encode mood string ke numeric"""
        return self.mood_mapping.get(mood, 4)

    def encode_category(self, category_value):
        """Encode category string ke numeric"""
        if isinstance(category_value, str):
            return self.category_mapping.get(category_value.lower(), 0)
        return category_value

    def get_food_similarity(self, user_profile):
        """Hitung kesamaan antara profil pengguna dan makanan - VERSI SEMPURNA"""
        import pandas as pd
        import numpy as np
        from sklearn.metrics.pairwise import cosine_similarity
        from sklearn.preprocessing import MinMaxScaler

        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat. Panggil load_data() terlebih dahulu.")

        print(f"=== PERFECT SIMILARITY CALCULATION ===")
        print(f"User profile input: {user_profile}")

        # Step 1: Filter makanan berdasarkan mood TERLEBIH DAHULU
        target_mood = user_profile.get('target_mood', 'energizing')  # Mood asli yang diminta
        
        if target_mood == 'energizing':
            filtered_foods = self.food_df[self.food_df['is_energizing'] == 1].copy()
        elif target_mood == 'relaxing':
            filtered_foods = self.food_df[self.food_df['is_relaxing'] == 1].copy()
        elif target_mood == 'focusing':
            filtered_foods = self.food_df[self.food_df['is_focusing'] == 1].copy()
        else:
            filtered_foods = self.food_df[self.food_df['primary_mood'] == 'neutral'].copy()

        print(f"Filtered foods by mood '{target_mood}': {len(filtered_foods)} items")

        if len(filtered_foods) == 0:
            print("No foods found for this mood, using all foods")
            filtered_foods = self.food_df.copy()

        # Step 2: Konversi dan normalisasi user profile - FIX FEATURE MAPPING
        processed_user_profile = {}
        for key, value in user_profile.items():
            if key in ['target_mood', 'health_conditions']:  # Skip metadata
                continue
            elif key == 'primary_mood':
                processed_user_profile['primary_mood_num'] = self.encode_mood(value)
            elif isinstance(value, str):
                # FIX: Map string categories ke numeric columns yang ada di dataset
                if key == 'calorie_category':
                    processed_user_profile['calorie_category_num'] = self.encode_category(value)
                elif key == 'carb_category':
                    processed_user_profile['carb_category_num'] = self.encode_category(value)
                elif key == 'fat_category':
                    processed_user_profile['fat_category_num'] = self.encode_category(value)
                elif key == 'protein_category':
                    processed_user_profile['protein_category_num'] = self.encode_category(value)
                elif key == 'nutrient_balance':
                    processed_user_profile['nutrient_balance_num'] = self.encode_category(value)
                else:
                    processed_user_profile[key] = self.encode_category(value)
            else:
                processed_user_profile[key] = value

        print(f"Processed user profile: {processed_user_profile}")

        # Step 3: Select features yang ada di dataset dan user profile - IMPROVED
        available_features = [
            'primary_mood_num', 'mood_energizing', 'mood_relaxing', 'mood_focusing',
            'calorie_category_num', 'protein_category_num', 'fat_category_num', 
            'carb_category_num', 'nutrient_balance_num'
        ]
        
        feature_cols = []
        for feature in available_features:
            if feature in filtered_foods.columns and feature in processed_user_profile:
                feature_cols.append(feature)

        print(f"Selected features: {feature_cols}")
        print(f"User profile values for selected features:")
        for feature in feature_cols:
            print(f"  {feature}: {processed_user_profile[feature]}")

        if len(feature_cols) == 0:
            print("No matching features, using basic sorting")
            return self._fallback_sorting(filtered_foods, target_mood)

        # Step 4: Ekstrak dan PROPER NORMALIZATION - FINAL FIX
        food_features_raw = filtered_foods[feature_cols].fillna(0)
        user_features_raw = np.array([[processed_user_profile[col] for col in feature_cols]])

        print(f"Before normalization:")
        print(f"User features: {user_features_raw[0]}")
        print(f"Food features sample (first 3 rows):")
        print(food_features_raw.head(3).values)

        # CONVERT BOOLEAN TO NUMERIC PROPERLY
        food_features_numeric = food_features_raw.copy()
        user_features_numeric = user_features_raw.copy()

        for i, col in enumerate(feature_cols):
            if food_features_raw[col].dtype == 'bool':
                # Convert boolean to 0/1
                food_features_numeric[col] = food_features_raw[col].astype(int)
                user_features_numeric[0, i] = int(user_features_numeric[0, i])

        # NOW NORMALIZE CORRECTLY - Handle edge cases
        food_features = food_features_numeric.values
        user_features = user_features_numeric

        # Manual normalization untuk handle edge cases
        normalized_user = []
        normalized_food = []

        for i, col in enumerate(feature_cols):
            food_col = food_features[:, i]
            user_val = user_features[0, i]
            
            col_min = food_col.min()
            col_max = food_col.max()
            
            if col_max == col_min:
                # Tidak ada variasi - set semua ke 0.5
                normalized_food_col = np.full_like(food_col, 0.5)
                normalized_user_val = 0.5
            else:
                # Normal MinMax scaling tapi clamp user value ke range [min, max]
                user_val_clamped = np.clip(user_val, col_min, col_max)
                
                normalized_food_col = (food_col - col_min) / (col_max - col_min)
                normalized_user_val = (user_val_clamped - col_min) / (col_max - col_min)
            
            normalized_food.append(normalized_food_col)
            normalized_user.append(normalized_user_val)
            
            print(f"Feature {col}: range [{col_min}, {col_max}], user: {user_val} -> {normalized_user_val}")

        food_features_scaled = np.column_stack(normalized_food)
        user_features_scaled = np.array([normalized_user])

        print(f"After proper normalization:")
        print(f"User features: {user_features_scaled[0]}")
        print(f"Food features range: min={food_features_scaled.min(axis=0)}, max={food_features_scaled.max(axis=0)}")

        # Step 5: Hitung weighted cosine similarity - FINAL FIX
        health_conditions = user_profile.get('health_conditions', [])
        feature_weights = self._calculate_feature_weights(feature_cols, health_conditions)
        
        print(f"Feature weights: {feature_weights[0]}")

        # Apply weights
        user_weighted = user_features_scaled * feature_weights
        food_weighted = food_features_scaled * feature_weights

        print(f"User weighted features: {user_weighted[0]}")

        # Hitung similarity - FIX untuk handle zero vectors
        similarities = []
        for i in range(len(food_weighted)):
            food_vec = food_weighted[i:i+1]
            
            # Check for zero vectors
            user_norm = np.linalg.norm(user_weighted)
            food_norm = np.linalg.norm(food_vec)
            
            if user_norm == 0 or food_norm == 0:
                # Fallback: use euclidean distance inverse
                distance = np.linalg.norm(user_features_scaled - food_features_scaled[i:i+1])
                similarity = 1.0 / (1.0 + distance)  # Convert distance to similarity
            else:
                # Normal cosine similarity
                similarity = cosine_similarity(user_weighted, food_vec)[0][0]
            
            similarities.append(similarity)
        
        similarities = np.array(similarities)
        print(f"Similarity range: {similarities.min():.4f} to {similarities.max():.4f}")
        print(f"Similarity mean: {similarities.mean():.4f}")

        # Step 6: Add penalty untuk makanan yang tidak sesuai kondisi kesehatan
        if health_conditions:
            similarities = self._apply_health_penalties(filtered_foods, similarities, health_conditions)

        # Step 7: Create result
        result_df = filtered_foods.copy()
        result_df['similarity_score'] = similarities

        # Sort berdasarkan similarity, kemudian criteria sekunder
        result_df = result_df.sort_values(['similarity_score', 'calories'], ascending=[False, target_mood != 'relaxing'])

        print(f"Top 3 final recommendations:")
        for i in range(min(3, len(result_df))):
            print(f"{i+1}. {result_df.iloc[i]['name']}: {result_df.iloc[i]['similarity_score']:.4f}")

        return result_df.head(10)[['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood', 'similarity_score']]

    def _calculate_feature_weights(self, feature_cols, health_conditions):
        """Calculate dynamic feature weights based on health conditions"""
        weights = np.ones(len(feature_cols))
        
        for i, feature in enumerate(feature_cols):
            base_weight = 1.0
            
            # Mood features always important
            if 'mood_' in feature:
                base_weight = 2.0
            
            # Health condition specific weights
            for condition in health_conditions:
                if condition in self.health_mapping:
                    priority_nutrients = self.health_mapping[condition].get('priority_nutrients', [])
                    
                    if feature == 'calorie_category_num' and 'calories' in priority_nutrients:
                        base_weight *= 2.0
                    elif feature == 'carb_category_num' and 'carbohydrate' in priority_nutrients:
                        base_weight *= 2.0
                    elif feature == 'fat_category_num' and 'fat' in priority_nutrients:
                        base_weight *= 2.0
                    elif feature == 'protein_category_num' and 'proteins' in priority_nutrients:
                        base_weight *= 1.5
            
            weights[i] = base_weight
        
        # Normalize weights
        weights = weights / np.sum(weights) * len(weights)
        return weights.reshape(1, -1)

    def _apply_health_penalties(self, foods_df, similarities, health_conditions):
        """Apply penalties untuk makanan yang tidak sesuai kondisi kesehatan"""
        penalties = np.zeros(len(similarities))
        
        for condition in health_conditions:
            if condition == 'diabetes':
                # Penalty untuk karbohidrat tinggi
                high_carb_mask = foods_df['carb_category_num'] >= 3
                penalties[high_carb_mask] += 0.1
                
            elif condition == 'hipertensi':
                # Penalty untuk lemak tinggi
                high_fat_mask = foods_df['fat_category_num'] >= 3
                penalties[high_fat_mask] += 0.1
                
            elif condition == 'kolesterol':
                # Penalty untuk lemak tinggi
                high_fat_mask = foods_df['fat_category_num'] >= 3
                penalties[high_fat_mask] += 0.15
                
            elif condition == 'obesitas':
                # Penalty untuk kalori tinggi
                high_cal_mask = foods_df['calorie_category_num'] >= 3
                penalties[high_cal_mask] += 0.1
        
        return similarities - penalties

    def _fallback_sorting(self, foods_df, mood):
        """Fallback sorting ketika tidak ada features yang cocok"""
        if mood == 'energizing':
            sorted_df = foods_df.sort_values('calories', ascending=False)
        elif mood == 'focusing':
            sorted_df = foods_df.sort_values('proteins', ascending=False)
        elif mood == 'relaxing':
            sorted_df = foods_df.sort_values('calories', ascending=True)
        else:
            sorted_df = foods_df.sort_values('calories', ascending=False)
        
        sorted_df = sorted_df.copy()
        sorted_df['similarity_score'] = 0.8  # Fixed score untuk fallback
        
        return sorted_df.head(10)[['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood', 'similarity_score']]

    def recommend_for_mood(self, mood, top_n=5, health_conditions=None):
        """PERFECT RECOMMENDATION SYSTEM - Versi Sempurna"""
        if self.food_df is None:
            raise ValueError("Dataset makanan belum dimuat. Panggil load_data() terlebih dahulu.")

        print(f"\n=== PERFECT RECOMMENDATION SYSTEM ===")
        print(f"Input -> Mood: {mood}, Health: {health_conditions}, Top N: {top_n}")

        # Validasi mood
        valid_moods = ['energizing', 'relaxing', 'focusing', 'neutral']
        if mood not in valid_moods:
            print(f"Invalid mood '{mood}', using 'neutral'")
            mood = 'neutral'

        # Step 1: Buat user profile yang comprehensive - FIX TARGET MOOD
        user_profile = {
            'target_mood': mood,  # Mood asli yang diminta - SELALU KONSISTEN
            'primary_mood_num': self.encode_mood(mood),  # Encode mood yang diminta
            'health_conditions': health_conditions or []
        }

        # Add mood boolean features berdasarkan mood yang diminta
        for m in ['energizing', 'relaxing', 'focusing']:
            user_profile[f'mood_{m}'] = 1.0 if m == mood else 0.0

        # Step 2: Add health condition constraints - FIX VEGETARIAN BUG
        if health_conditions:
            print(f"Processing health conditions: {health_conditions}")
            
            # Aggregate constraints from multiple conditions
            aggregated_constraints = {}
            
            for condition in health_conditions:
                if condition in self.health_mapping:
                    condition_constraints = self.health_mapping[condition].copy()
                    
                    # Remove priority_nutrients metadata
                    if 'priority_nutrients' in condition_constraints:
                        del condition_constraints['priority_nutrients']
                    
                    for feature, value in condition_constraints.items():
                        if feature in aggregated_constraints:
                            # Take the more restrictive constraint (lower value)
                            aggregated_constraints[feature] = min(aggregated_constraints[feature], value)
                        else:
                            aggregated_constraints[feature] = value
            
            # Add aggregated constraints to user profile
            user_profile.update(aggregated_constraints)
            print(f"Applied health constraints: {aggregated_constraints}")

        # Step 3: Get recommendations using perfect similarity calculation
        try:
            recommendations = self.get_food_similarity(user_profile)
            
            print(f"Successfully generated {len(recommendations)} recommendations")
            return recommendations.head(top_n)

        except Exception as e:
            print(f"Error in perfect recommendation: {str(e)}")
            # Ultimate fallback
            return self._ultimate_fallback(mood, top_n, health_conditions)

    def _ultimate_fallback(self, mood, top_n, health_conditions):
        """Ultimate fallback ketika semua gagal"""
        print("Using ultimate fallback recommendation")
        
        # Filter berdasarkan mood
        if mood == 'energizing' and 'is_energizing' in self.food_df.columns:
            filtered_df = self.food_df[self.food_df['is_energizing'] == 1]
        elif mood == 'relaxing' and 'is_relaxing' in self.food_df.columns:
            filtered_df = self.food_df[self.food_df['is_relaxing'] == 1]
        elif mood == 'focusing' and 'is_focusing' in self.food_df.columns:
            filtered_df = self.food_df[self.food_df['is_focusing'] == 1]
        else:
            filtered_df = self.food_df
        
        # Simple health filtering
        if health_conditions:
            if 'diabetes' in health_conditions:
                # Prioritas karbohidrat rendah
                filtered_df = filtered_df.sort_values(['carb_category_num', 'calories'])
            elif 'kolesterol' in health_conditions:
                # Prioritas lemak rendah
                filtered_df = filtered_df.sort_values(['fat_category_num', 'calories'])
            else:
                # Default sorting berdasarkan mood
                if mood == 'energizing':
                    filtered_df = filtered_df.sort_values('calories', ascending=False)
                elif mood == 'focusing':
                    filtered_df = filtered_df.sort_values('proteins', ascending=False)
                elif mood == 'relaxing':
                    filtered_df = filtered_df.sort_values('calories', ascending=True)
        else:
            # No health conditions - sort by mood preference
            if mood == 'energizing':
                filtered_df = filtered_df.sort_values('calories', ascending=False)
            elif mood == 'focusing':
                filtered_df = filtered_df.sort_values('proteins', ascending=False)
            elif mood == 'relaxing':
                filtered_df = filtered_df.sort_values('calories', ascending=True)
        
        result_df = filtered_df.copy()
        result_df['similarity_score'] = 0.5  # Fallback score
        
        return result_df.head(top_n)[['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood', 'similarity_score']]

# Inisialisasi FoodRecommender
food_recommender = FoodRecommender()

@app.on_event("startup")
async def startup_event():
    """Load data dan model saat startup"""
    try:
        # Load food recommender dari pickle
        if os.path.exists('food_recommender.pkl'):
            with open('food_recommender.pkl', 'rb') as f:
                global food_recommender
                food_recommender = pickle.load(f)
            print("Food recommender loaded dari pickle file")
        else:
            # Jika file pickle tidak ada, load dari CSV
            if os.path.exists('nutrimood_preprocessed.csv'):
                food_recommender.load_data('nutrimood_preprocessed.csv')
                print("Food recommender loaded dari CSV file")
            else:
                print("Warning: File dataset tidak ditemukan")
    except Exception as e:
        print(f"Error loading data: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "NutriMood API is running"}

@app.get("/health")
async def health_check():
    """Health check"""
    data_loaded = food_recommender.food_df is not None if food_recommender else False
    return {
        "status": "healthy" if data_loaded else "degraded",
        "data_loaded": data_loaded
    }

@app.get("/debug/food-details")
async def get_food_details(food_name: str):
    """Get details of a specific food"""
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(status_code=503, detail="Dataset belum dimuat")
    
    df = food_recommender.food_df
    
    # Find exact match first, then partial match
    exact_match = df[df['name'] == food_name]
    if exact_match.empty:
        partial_match = df[df['name'].str.contains(food_name, case=False, na=False)]
        food_data = partial_match
    else:
        food_data = exact_match
    
    features = ['name', 'calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood', 'is_energizing', 
               'calorie_category_num', 'carb_category_num', 'mood_energizing', 'primary_mood_num']
    
    return {
        "search_term": food_name,
        "matches_found": len(food_data),
        "food_details": food_data[features].to_dict('records') if not food_data.empty else [],
        "user_profile_diabetes_energizing": {
            'calorie_category_num': 1,
            'carb_category_num': 1, 
            'mood_energizing': 1.0,
            'primary_mood_num': 0
        }
    }
async def compare_foods(food1: str, food2: str):
    """Compare features between two foods"""
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(status_code=503, detail="Dataset belum dimuat")
    
    df = food_recommender.food_df
    
    # Find foods
    food1_data = df[df['name'].str.contains(food1, case=False, na=False)]
    food2_data = df[df['name'].str.contains(food2, case=False, na=False)]
    
    features = ['calories', 'proteins', 'fat', 'carbohydrate', 'primary_mood', 'is_energizing', 
               'calorie_category_num', 'carb_category_num', 'mood_energizing', 'primary_mood_num']
    
    result = {
        "food1_matches": food1_data[features].to_dict('records') if not food1_data.empty else [],
        "food2_matches": food2_data[features].to_dict('records') if not food2_data.empty else [],
        "user_profile_for_diabetes_energizing": {
            'calorie_category_num': 1,
            'carb_category_num': 1, 
            'mood_energizing': 1.0,
            'primary_mood_num': 0
        }
    }
    
    return result
async def debug_full_process(request: RecommendationRequest):
    """Debug lengkap untuk melihat seluruh proses"""
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(status_code=503, detail="Dataset belum dimuat")
    
    try:
        print(f"\n=== FULL DEBUG PROCESS ===")
        print(f"Request: {request}")
        
        # Step 1: Lihat makanan energizing dengan nama kacang
        df = food_recommender.food_df
        energizing_foods = df[df['is_energizing'] == 1]
        kacang_energizing = energizing_foods[energizing_foods['name'].str.contains('kacang', case=False, na=False)]
        
        print(f"Kacang energizing foods:")
        for _, row in kacang_energizing.iterrows():
            print(f"- {row['name']}: calories={row['calories']:.4f}")
        
        # Step 2: Build user profile seperti di Colab
        user_profile = {
            'primary_mood': request.mood,
            'primary_mood_num': food_recommender.encode_mood(request.mood)
        }
        
        # Add mood feature
        mood_col = f'mood_{request.mood}'
        if mood_col in df.columns:
            user_profile[mood_col] = 1.0
            
        # Add health conditions with correct column names
        if request.health_conditions:
            for condition in request.health_conditions:
                if condition == 'diabetes':
                    user_profile['calorie_category_num'] = 1  # low = 1
                    user_profile['carb_category_num'] = 1     # low = 1
                    
        print(f"User profile before processing: {user_profile}")
        
        # Step 3: Process user profile
        processed_profile = {}
        for key, value in user_profile.items():
            if key == 'primary_mood':
                processed_profile[key] = food_recommender.encode_mood(value)
            elif isinstance(value, str):
                processed_profile[key] = food_recommender.encode_category(value)
            else:
                processed_profile[key] = value
                
        print(f"Processed user profile: {processed_profile}")
        
        # Step 4: Find matching features
        feature_cols = [col for col in df.columns 
                       if col in processed_profile and pd.api.types.is_numeric_dtype(df[col])]
        print(f"Matching features: {feature_cols}")
        
        # Step 5: Check specific foods
        test_foods = ["Kacang merah /banda kering", "Jampang huma mentah", "Beef burger"]
        print(f"\nChecking specific foods:")
        for food_name in test_foods:
            food_row = df[df['name'] == food_name]
            if not food_row.empty:
                food_features = food_row[feature_cols].values[0] if feature_cols else []
                print(f"{food_name}:")
                print(f"  Features: {dict(zip(feature_cols, food_features))}")
                print(f"  is_energizing: {food_row['is_energizing'].values[0]}")
                print(f"  primary_mood: {food_row['primary_mood'].values[0]}")
        
        return {
            "user_profile": user_profile,
            "processed_profile": processed_profile,
            "matching_features": feature_cols,
            "kacang_energizing_count": len(kacang_energizing),
            "kacang_energizing_foods": kacang_energizing[['name', 'calories']].to_dict('records')[:3]
        }
        
    except Exception as e:
        print(f"Error in full debug: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
async def debug_energizing_foods():
    """Debug endpoint untuk melihat makanan energizing"""
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(status_code=503, detail="Dataset belum dimuat")
    
    df = food_recommender.food_df
    
    # Filter energizing foods
    energizing_foods = df[df['is_energizing'] == 1] if 'is_energizing' in df.columns else df[df['primary_mood'] == 'energizing']
    
    # Sort by calories descending
    top_energizing = energizing_foods.sort_values('calories', ascending=False).head(10)
    
    return {
        "total_energizing_foods": len(energizing_foods),
        "top_10_by_calories": top_energizing[['name', 'calories', 'proteins', 'fat', 'carbohydrate']].to_dict('records'),
        "search_kacang": df[df['name'].str.contains('kacang', case=False, na=False)][['name', 'calories', 'primary_mood', 'is_energizing']].to_dict('records') if 'is_energizing' in df.columns else []
    }
async def get_dataset_info():
    """Debug endpoint untuk melihat info dataset"""
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(status_code=503, detail="Dataset belum dimuat")
    
    df = food_recommender.food_df
    return {
        "total_foods": len(df),
        "columns": df.columns.tolist(),
        "mood_distribution": df['primary_mood'].value_counts().to_dict() if 'primary_mood' in df.columns else {},
        "sample_data": df.head(3).to_dict('records'),
        "data_types": df.dtypes.astype(str).to_dict()
    }

@app.post("/debug/recommend")
async def debug_recommend(request: RecommendationRequest):
    """Debug version of recommend endpoint with detailed logging"""
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(status_code=503, detail="Dataset belum dimuat")
    
    try:
        print(f"\n=== DEBUG RECOMMEND ===")
        print(f"Request: {request}")
        
        # Dapatkan rekomendasi dengan debug output
        recommendations_df = food_recommender.recommend_for_mood(
            mood=request.mood,
            top_n=request.top_n,
            health_conditions=request.health_conditions
        )
        
        return {
            "request": request.dict(),
            "recommendations": recommendations_df.to_dict('records'),
            "debug_info": "Check server console for detailed logs"
        }
        
    except Exception as e:
        print(f"Error in debug recommend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Endpoint utama untuk mendapatkan rekomendasi makanan"""
    
    # Validasi food_recommender
    if food_recommender is None or food_recommender.food_df is None:
        raise HTTPException(
            status_code=503,
            detail="Food recommender belum dimuat. Cek status server."
        )
    
    # Validasi mood
    valid_moods = ['energizing', 'relaxing', 'focusing', 'neutral', 'multi_category']
    if request.mood not in valid_moods:
        raise HTTPException(
            status_code=400,
            detail=f"Mood tidak valid. Pilih salah satu: {valid_moods}"
        )
    
    try:
        # Dapatkan rekomendasi
        recommendations_df = food_recommender.recommend_for_mood(
            mood=request.mood,
            top_n=request.top_n,
            health_conditions=request.health_conditions
        )
        
        # Convert ke FoodItem objects
        food_items = []
        for _, row in recommendations_df.iterrows():
            food_item = FoodItem(
                name=row.get('name', 'Unknown'),
                calories=float(row.get('calories', 0)),
                proteins=float(row.get('proteins', 0)),
                fat=float(row.get('fat', 0)),
                carbohydrate=float(row.get('carbohydrate', 0)),
                primary_mood=row.get('primary_mood', 'unknown'),
                similarity_score=float(row.get('similarity_score', 0))
            )
            food_items.append(food_item)
        
        # Buat response message
        message = f"Ditemukan {len(food_items)} rekomendasi makanan untuk mood '{request.mood}'"
        if request.health_conditions:
            message += f" dengan kondisi kesehatan: {', '.join(request.health_conditions)}"
        
        return RecommendationResponse(
            mood=request.mood,
            health_conditions=request.health_conditions,
            recommendations=food_items,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/moods")
async def get_available_moods():
    """Daftar mood yang tersedia"""
    return {
        "moods": ["energizing", "relaxing", "focusing", "neutral"],
        "description": {
            "energizing": "Makanan untuk meningkatkan energi",
            "relaxing": "Makanan untuk relaksasi", 
            "focusing": "Makanan untuk meningkatkan fokus",
            "neutral": "Makanan netral"
        }
    }

@app.get("/health-conditions")
async def get_available_health_conditions():
    """Daftar kondisi kesehatan yang tersedia"""
    return {
        "health_conditions": ["diabetes", "hipertensi", "kolesterol", "obesitas", "alergi_gluten", "vegetarian"],
        "description": {
            "diabetes": "Kondisi diabetes mellitus",
            "hipertensi": "Tekanan darah tinggi", 
            "kolesterol": "Kolesterol tinggi",
            "obesitas": "Kelebihan berat badan",
            "alergi_gluten": "Alergi terhadap gluten",
            "vegetarian": "Diet vegetarian"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)