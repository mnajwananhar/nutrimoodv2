-- =====================================================
-- NutriMood Database Schema
-- Complete database structure for Supabase deployment
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- =====================================================
-- 1. PROFILES TABLE
-- User profile information linked to auth.users
-- =====================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_profiles 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_joined_at ON profiles(joined_at);

-- =====================================================
-- 2. NUTRITION_ASSESSMENTS TABLE
-- User nutrition assessments and mood predictions
-- =====================================================

CREATE TABLE nutrition_assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Nutrition input levels (0-3: very_low, low, medium, high)
    calorie_level INTEGER NOT NULL CHECK (calorie_level >= 0 AND calorie_level <= 3),
    protein_level INTEGER NOT NULL CHECK (protein_level >= 0 AND protein_level <= 3),
    fat_level INTEGER NOT NULL CHECK (fat_level >= 0 AND fat_level <= 3),
    carb_level INTEGER NOT NULL CHECK (carb_level >= 0 AND carb_level <= 3),
    
    -- Health conditions as array
    health_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- AI prediction results
    predicted_mood TEXT NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Additional metadata
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_nutrition_assessments 
    BEFORE UPDATE ON nutrition_assessments 
    FOR EACH ROW 
    EXECUTE FUNCTION moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX idx_nutrition_assessments_user_id ON nutrition_assessments(user_id);
CREATE INDEX idx_nutrition_assessments_created_at ON nutrition_assessments(created_at);
CREATE INDEX idx_nutrition_assessments_predicted_mood ON nutrition_assessments(predicted_mood);
CREATE INDEX idx_nutrition_assessments_health_conditions ON nutrition_assessments USING GIN(health_conditions);

-- =====================================================
-- 3. FOOD_RECOMMENDATIONS TABLE
-- AI-generated food recommendations for users
-- =====================================================

CREATE TABLE food_recommendations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assessment_id UUID REFERENCES nutrition_assessments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Food details
    food_name TEXT NOT NULL,
    calories DECIMAL(8,2) NOT NULL CHECK (calories >= 0),
    proteins DECIMAL(8,2) NOT NULL CHECK (proteins >= 0),
    fats DECIMAL(8,2) NOT NULL CHECK (fats >= 0),
    carbohydrates DECIMAL(8,2) NOT NULL CHECK (carbohydrates >= 0),
    
    -- AI recommendation metadata
    mood_category TEXT NOT NULL,
    similarity_score DECIMAL(5,4) DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 1),
    
    -- User interaction
    is_liked BOOLEAN DEFAULT FALSE NOT NULL,
    is_consumed BOOLEAN DEFAULT FALSE NOT NULL,
    consumed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_food_recommendations 
    BEFORE UPDATE ON food_recommendations 
    FOR EACH ROW 
    EXECUTE FUNCTION moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX idx_food_recommendations_assessment_id ON food_recommendations(assessment_id);
CREATE INDEX idx_food_recommendations_user_id ON food_recommendations(user_id);
CREATE INDEX idx_food_recommendations_food_name ON food_recommendations(food_name);
CREATE INDEX idx_food_recommendations_mood_category ON food_recommendations(mood_category);
CREATE INDEX idx_food_recommendations_is_liked ON food_recommendations(is_liked);
CREATE INDEX idx_food_recommendations_is_consumed ON food_recommendations(is_consumed);

-- =====================================================
-- 4. COMMUNITY_POSTS TABLE
-- User-generated community content
-- =====================================================

CREATE TYPE post_type AS ENUM ('recipe', 'story', 'question', 'tip', 'review');

CREATE TABLE community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Post content
    type post_type NOT NULL DEFAULT 'story',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Food-specific fields (for recipes and reviews)
    food_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Engagement metrics
    likes_count INTEGER DEFAULT 0 NOT NULL CHECK (likes_count >= 0),
    comments_count INTEGER DEFAULT 0 NOT NULL CHECK (comments_count >= 0),
    
    -- Moderation
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- User avatar cache for performance
    user_avatar_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_community_posts 
    BEFORE UPDATE ON community_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_type ON community_posts(type);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX idx_community_posts_is_featured ON community_posts(is_featured);
CREATE INDEX idx_community_posts_is_published ON community_posts(is_published);
CREATE INDEX idx_community_posts_tags ON community_posts USING GIN(tags);
CREATE INDEX idx_community_posts_title_content ON community_posts USING GIN(to_tsvector('english', title || ' ' || content));

-- =====================================================
-- 5. COMMENTS TABLE
-- Comments and replies for community posts
-- =====================================================

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    
    -- Comment content
    content TEXT NOT NULL,
    
    -- Moderation
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_comments 
    BEFORE UPDATE ON comments 
    FOR EACH ROW 
    EXECUTE FUNCTION moddatetime(updated_at);

-- Create indexes for performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_is_published ON comments(is_published);

-- =====================================================
-- 6. POST_LIKES TABLE
-- Like tracking for community posts
-- =====================================================

CREATE TABLE post_likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique likes per user per post
    UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at);



-- =====================================================
-- COMMENTS AND NOTES
-- =====================================================

-- Add comments to tables
COMMENT ON TABLE profiles IS 'User profile information linked to Supabase auth.users';
COMMENT ON TABLE nutrition_assessments IS 'User nutrition assessments and AI mood predictions';
COMMENT ON TABLE food_recommendations IS 'AI-generated food recommendations for users';
COMMENT ON TABLE community_posts IS 'User-generated community content (recipes, stories, tips, etc.)';
COMMENT ON TABLE comments IS 'Comments and replies for community posts';
COMMENT ON TABLE post_likes IS 'Like tracking for community posts';

-- Add column comments for key fields
COMMENT ON COLUMN nutrition_assessments.health_conditions IS 'Array of health conditions: diabetes, hipertensi, kolesterol, obesitas, alergi_gluten, vegetarian';
COMMENT ON COLUMN food_recommendations.similarity_score IS 'AI similarity score between 0 and 1';
COMMENT ON COLUMN community_posts.type IS 'Post type: recipe, story, question, tip, review';
COMMENT ON COLUMN community_posts.rating IS 'Rating 1-5 for review posts only';
