-- Skema utama NutriMood

-- Tabel user profile
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP
);

-- Tabel assessment nutrisi
CREATE TABLE IF NOT EXISTS nutrition_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    calorie_level INT,
    protein_level INT,
    fat_level INT,
    carb_level INT,
    predicted_mood VARCHAR(30),
    confidence_score FLOAT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel rekomendasi makanan per assessment
CREATE TABLE IF NOT EXISTS food_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES nutrition_assessments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    food_name VARCHAR(100),
    calories FLOAT,
    proteins FLOAT,
    fats FLOAT,
    carbohydrates FLOAT,
    similarity_score FLOAT,
    mood_category VARCHAR(30),
    is_liked BOOLEAN DEFAULT FALSE,
    is_consumed BOOLEAN DEFAULT FALSE,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel komunitas: postingan
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_avatar_url TEXT,
    type VARCHAR(20),
    title VARCHAR(200),
    content TEXT,
    images TEXT[],
    tags TEXT[],
    food_name VARCHAR(100),
    rating INT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel komunitas: gambar per post (untuk multi-image)
CREATE TABLE IF NOT EXISTS community_post_images (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES community_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel komunitas: like
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Tabel komunitas: komentar
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    parent_id INT REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk komentar balasan
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Tabel komunitas: notifikasi (opsional)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 