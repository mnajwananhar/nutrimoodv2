# NutriMood API

NutriMood adalah API berbasis FastAPI yang menyediakan rekomendasi makanan berdasarkan analisis nutrisi dan prediksi mood menggunakan machine learning. API ini menggunakan TensorFlow untuk klasifikasi mood dan algoritma machine learning untuk memberikan rekomendasi makanan yang sesuai dengan kondisi kesehatan pengguna.

## Fitur Utama

- **Prediksi Mood**: Menganalisis input nutrisi (kalori, protein, lemak, karbohidrat) untuk memprediksi mood (energizing, relaxing, focusing, neutral)
- **Rekomendasi Makanan**: Memberikan rekomendasi makanan berdasarkan mood yang diprediksi
- **Filter Kesehatan**: Mendukung filter berdasarkan kondisi kesehatan seperti diabetes, hipertensi, kolesterol, obesitas, alergi gluten, dan vegetarian
- **Optimisasi untuk Deployment**: Dioptimalkan untuk deployment di platform cloud dengan resource terbatas

## Teknologi yang Digunakan

- **FastAPI**: Framework web modern untuk membangun API
- **TensorFlow**: Library untuk model machine learning dan deep learning
- **Scikit-learn**: Library untuk preprocessing dan algoritma machine learning
- **Pandas & NumPy**: Library untuk manipulasi dan analisis data
- **Uvicorn**: Server ASGI untuk menjalankan aplikasi FastAPI
- **Gunicorn**: WSGI server untuk production deployment

## Struktur Project

```
backend/
├── main.py                     # File utama aplikasi FastAPI
├── requirements.txt            # Dependencies Python
├── render.yaml                # Konfigurasi deployment Render
├── README.md                  # Dokumentasi project
└── models/                    # Folder model machine learning
    ├── mood_classifier_model.keras      # Model klasifikasi mood (TensorFlow)
    ├── mood_feature_scaler.pkl          # Scaler untuk preprocessing fitur
    ├── mood_encoder.pkl                 # OneHot encoder untuk mood
    ├── mood_label_encoder.pkl           # Label encoder untuk mood
    └── food_recommender.pkl             # Model rekomendasi makanan
```

## Instalasi dan Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Pastikan Model Files Tersedia
Pastikan semua file model berada di folder `models/`:
- `mood_classifier_model.keras`
- `mood_feature_scaler.pkl`
- `mood_encoder.pkl`
- `mood_label_encoder.pkl`
- `food_recommender.pkl`

### 4. Jalankan Aplikasi

#### Development
```bash
python main.py
```

#### Production (dengan Gunicorn)
```bash
gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Aplikasi akan berjalan di `http://localhost:8000`

## API Endpoints

### 1. Root Endpoint
```
GET /
```
Menampilkan informasi dasar API dan daftar endpoint yang tersedia.

**Response:**
```json
{
  "message": "Welcome to NutriMood API",
  "endpoints": {
    "/recommend": "POST - Get food recommendations based on nutrients and health conditions",
    "/health": "GET - Check API health status"
  }
}
```

### 2. Health Check
```
GET /health
```
Mengecek status kesehatan API dan apakah model telah dimuat dengan benar.

**Response:**
```json
{
  "status": "healthy",
  "mood_classifier_loaded": true,
  "food_recommender_loaded": true,
  "message": "All models loaded"
}
```

### 3. Rekomendasi Makanan
```
POST /recommend
```
Mendapatkan rekomendasi makanan berdasarkan input nutrisi dan kondisi kesehatan.

**Request Body:**
```json
{
  "nutrients": {
    "calories": 500.0,
    "proteins": 25.0,
    "fat": 15.0,
    "carbohydrate": 45.0
  },
  "health_conditions": ["diabetes", "hipertensi"],
  "top_n": 5
}
```

**Response:**
```json
{
  "predicted_mood": "energizing",
  "mood_probabilities": {
    "energizing": 0.65,
    "relaxing": 0.20,
    "focusing": 0.10,
    "neutral": 0.05
  },
  "recommendations": [
    {
      "name": "Oatmeal dengan Buah",
      "calories": 320.0,
      "proteins": 12.0,
      "fat": 6.0,
      "carbohydrate": 58.0,
      "primary_mood": "energizing",
      "similarity_score": 0.87
    }
  ],
  "total_recommendations": 5
}
```

## Parameter Request

### Nutrients (Required)
- `calories`: Jumlah kalori (float)
- `proteins`: Jumlah protein dalam gram (float)
- `fat`: Jumlah lemak dalam gram (float)
- `carbohydrate`: Jumlah karbohidrat dalam gram (float)

### Health Conditions (Optional)
Array string yang berisi kondisi kesehatan:
- `"diabetes"`: Untuk penderita diabetes
- `"hipertensi"`: Untuk penderita tekanan darah tinggi
- `"kolesterol"`: Untuk penderita kolesterol tinggi
- `"obesitas"`: Untuk penderita obesitas
- `"alergi_gluten"`: Untuk yang memiliki alergi gluten
- `"vegetarian"`: Untuk vegetarian

### Top N (Optional)
- `top_n`: Jumlah rekomendasi yang diinginkan (default: 5)

## Mood Categories

API ini dapat memprediksi 4 kategori mood:
- **Energizing**: Mood yang memberikan energi dan semangat
- **Relaxing**: Mood yang menenangkan dan rileks
- **Focusing**: Mood yang membantu konsentrasi dan fokus
- **Neutral**: Mood netral/normal

## Deployment

### Render.com
Project ini dikonfigurasi untuk deployment di Render.com dengan konfigurasi di `render.yaml`:

```yaml
services:
  - type: web
    name: nutrimood-api
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 300 --max-requests 1000 --max-requests-jitter 100
```

### Environment Variables
- `PYTHON_VERSION`: 3.10.0
- `TF_CPP_MIN_LOG_LEVEL`: 2 (untuk mengurangi log TensorFlow)
- `PORT`: Port untuk aplikasi (default: 8000)

## Optimisasi Performa

API ini telah dioptimalkan untuk deployment dengan resource terbatas:

1. **TensorFlow Optimizations**:
   - Threading configuration untuk single worker
   - Minimal logging level
   
2. **Gunicorn Configuration**:
   - Single worker untuk menghindari memory issues
   - Request timeout dan limits
   - UvicornWorker untuk async support

3. **Memory Management**:
   - Model loading pada startup
   - Graceful degradation jika model tidak tersedia

## Error Handling

API menangani berbagai jenis error:
- **503 Service Unavailable**: Jika model belum dimuat
- **500 Internal Server Error**: Untuk error processing
- **422 Validation Error**: Untuk input yang tidak valid

## Pengembangan

### Menambah Model Baru
1. Simpan model di folder `models/`
2. Update loading logic di `startup_event()`
3. Tambahkan preprocessing yang diperlukan

### Menambah Health Condition
1. Update `health_mapping` di class `FoodRecommender`
2. Tambahkan logic filtering di model

### Testing
```bash
# Install development dependencies
pip install pytest httpx

# Run tests
pytest
```

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

## Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini atau hubungi tim pengembang.
