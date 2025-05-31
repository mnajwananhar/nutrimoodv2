-- =====================================================
-- NutriMood Database Seed Data
-- Initial data for development and testing
-- =====================================================

-- =====================================================
-- FOOD DATA ARCHITECTURE NOTE
-- =====================================================
-- 
-- Food data is NOT stored in the database but loaded from CSV files.
-- The ML food recommendation system uses:
-- - /Ml Model/indonesia_food_mood_categorized.csv (1348 Indonesian foods)
-- - /backend/food_recommender.pkl (trained ML model)
-- 
-- This hybrid architecture separates:
-- - User data (assessments, recommendations, community) -> Supabase database
-- - Food reference data & ML models -> CSV/pickle files
-- =====================================================

-- =====================================================
-- SAMPLE USER PROFILES
-- Demo profiles for testing (only for development)
-- =====================================================

-- Note: These are sample UUIDs for development only
-- In production, these should be actual auth.users IDs

-- Sample Admin User
INSERT INTO profiles (id, username, full_name, email, avatar_url) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin_user', 'NutriMood Admin', 'admin@nutrimood.com', NULL),
('550e8400-e29b-41d4-a716-446655440001', 'john_doe', 'John Doe', 'john@example.com', NULL),
('550e8400-e29b-41d4-a716-446655440002', 'jane_smith', 'Jane Smith', 'jane@example.com', NULL),
('550e8400-e29b-41d4-a716-446655440003', 'health_enthusiast', 'Alex Johnson', 'alex@example.com', NULL);

-- =====================================================
-- SAMPLE NUTRITION ASSESSMENTS
-- Demo assessments for testing dashboard and history
-- =====================================================

INSERT INTO nutrition_assessments (
    user_id, calorie_level, protein_level, fat_level, carb_level,
    fiber_level, vitamin_level, mineral_level, predicted_mood,
    confidence_score, created_at
) VALUES
-- John's assessments (balanced nutrition)
('550e8400-e29b-41d4-a716-446655440001', 2, 2, 2, 2, 2, 2, 2, 'energetic', 0.85, NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440001', 3, 2, 1, 2, 1, 2, 2, 'happy', 0.78, NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440001', 2, 3, 2, 1, 2, 3, 2, 'focused', 0.92, NOW() - INTERVAL '1 day'),

-- Jane's assessments (various nutrition levels)
('550e8400-e29b-41d4-a716-446655440002', 1, 1, 3, 3, 0, 1, 1, 'sluggish', 0.67, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440002', 2, 2, 2, 2, 2, 2, 2, 'balanced', 0.81, NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440002', 3, 3, 1, 1, 3, 3, 3, 'vibrant', 0.94, NOW() - INTERVAL '1 day'),

-- Alex's assessments (health focused)
('550e8400-e29b-41d4-a716-446655440003', 2, 3, 1, 2, 3, 3, 2, 'energetic', 0.89, NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440003', 3, 3, 2, 1, 3, 3, 3, 'focused', 0.96, NOW() - INTERVAL '2 days');

-- =====================================================
-- SAMPLE FOOD RECOMMENDATIONS
-- Demo recommendations based on assessments
-- =====================================================

INSERT INTO food_recommendations (
    user_id, assessment_id, recommended_foods, reason, priority_level
) VALUES
-- Recommendations for John's latest assessment
('550e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM nutrition_assessments WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' ORDER BY created_at DESC LIMIT 1),
 '["Ikan Salmon Panggang", "Nasi Merah", "Sayur Bayam", "Alpukat"]',
 'Boost omega-3 and complete proteins for sustained focus',
 'high'),

-- Recommendations for Jane's latest assessment
('550e8400-e29b-41d4-a716-446655440002',
 (SELECT id FROM nutrition_assessments WHERE user_id = '550e8400-e29b-41d4-a716-446655440002' ORDER BY created_at DESC LIMIT 1),
 '["Buah Berry", "Yogurt Yunani", "Kacang Almond", "Ubi Jalar"]',
 'Antioxidants and steady energy sources to maintain vibrant mood',
 'medium'),

-- Recommendations for Alex's latest assessment
('550e8400-e29b-41d4-a716-446655440003',
 (SELECT id FROM nutrition_assessments WHERE user_id = '550e8400-e29b-41d4-a716-446655440003' ORDER BY created_at DESC LIMIT 1),
 '["Ayam Panggang", "Nasi Merah", "Brokoli", "Kacang Kenari"]',
 'High-quality proteins and complex carbs for enhanced focus',
 'high');

-- =====================================================
-- SAMPLE COMMUNITY POSTS
-- Demo posts for community feature testing
-- =====================================================

INSERT INTO community_posts (user_id, title, content, image_url, tags, mood_tag) VALUES
('550e8400-e29b-41d4-a716-446655440001', 
 'My Energy-Boosting Morning Routine',
 'Started my day with quinoa porridge topped with berries and almonds. The complex carbs gave me sustained energy throughout my morning workout! 💪',
 NULL,
 '["morning-routine", "energy", "quinoa", "berries"]',
 'energetic'),

('550e8400-e29b-41d4-a716-446655440002',
 'Mood Food Discovery: Dark Leafy Greens',
 'Never realized how much spinach and kale could impact my mood! Adding them to smoothies has been a game-changer for my afternoon energy dips.',
 NULL,
 '["greens", "smoothies", "mood-food", "afternoon-energy"]',
 'balanced'),

('550e8400-e29b-41d4-a716-446655440003',
 'Weekly Meal Prep Success',
 'Prepped 5 days of balanced meals focusing on lean proteins and complex carbs. My mood has been so much more stable this week!',
 NULL,
 '["meal-prep", "planning", "stability", "protein"]',
 'focused'),

('550e8400-e29b-41d4-a716-446655440001',
 'Omega-3 Rich Salmon Recipe',
 'Pan-seared salmon with avocado salsa - not only delicious but amazing for brain health and mood regulation. Recipe in comments! 🐟',
 NULL,
 '["recipe", "salmon", "omega-3", "brain-health"]',
 'happy');

-- =====================================================
-- SAMPLE COMMENTS
-- Demo comments for community interaction
-- =====================================================

INSERT INTO comments (post_id, user_id, content) VALUES
-- Comments on the first post
((SELECT id FROM community_posts WHERE title = 'My Energy-Boosting Morning Routine'),
 '550e8400-e29b-41d4-a716-446655440002',
 'This sounds amazing! Do you add any protein powder to your quinoa porridge?'),

((SELECT id FROM community_posts WHERE title = 'My Energy-Boosting Morning Routine'),
 '550e8400-e29b-41d4-a716-446655440003',
 'Quinoa for breakfast is such a great idea. I usually stick to oats but this sounds more filling!'),

-- Comments on the greens post
((SELECT id FROM community_posts WHERE title = 'Mood Food Discovery: Dark Leafy Greens'),
 '550e8400-e29b-41d4-a716-446655440001',
 'Spinach smoothies are the best! I add banana and mango to mask the taste.'),

-- Comments on meal prep post
((SELECT id FROM community_posts WHERE title = 'Weekly Meal Prep Success'),
 '550e8400-e29b-41d4-a716-446655440002',
 'Meal prep is such a mood saver! What proteins do you usually go for?'),

-- Comments on salmon recipe
((SELECT id FROM community_posts WHERE title = 'Omega-3 Rich Salmon Recipe'),
 '550e8400-e29b-41d4-a716-446655440003',
 'Yes please share the recipe! I love salmon but always looking for new ways to prepare it.');

-- =====================================================
-- SAMPLE POST LIKES
-- Demo likes for community engagement
-- =====================================================

INSERT INTO post_likes (post_id, user_id) VALUES
-- Likes for morning routine post
((SELECT id FROM community_posts WHERE title = 'My Energy-Boosting Morning Routine'),
 '550e8400-e29b-41d4-a716-446655440002'),
((SELECT id FROM community_posts WHERE title = 'My Energy-Boosting Morning Routine'),
 '550e8400-e29b-41d4-a716-446655440003'),

-- Likes for greens post
((SELECT id FROM community_posts WHERE title = 'Mood Food Discovery: Dark Leafy Greens'),
 '550e8400-e29b-41d4-a716-446655440001'),
((SELECT id FROM community_posts WHERE title = 'Mood Food Discovery: Dark Leafy Greens'),
 '550e8400-e29b-41d4-a716-446655440003'),

-- Likes for meal prep post
((SELECT id FROM community_posts WHERE title = 'Weekly Meal Prep Success'),
 '550e8400-e29b-41d4-a716-446655440001'),
((SELECT id FROM community_posts WHERE title = 'Weekly Meal Prep Success'),
 '550e8400-e29b-41d4-a716-446655440002'),

-- Likes for salmon recipe
((SELECT id FROM community_posts WHERE title = 'Omega-3 Rich Salmon Recipe'),
 '550e8400-e29b-41d4-a716-446655440002'),
((SELECT id FROM community_posts WHERE title = 'Omega-3 Rich Salmon Recipe'),
 '550e8400-e29b-41d4-a716-446655440003');

-- =====================================================
-- DATA VERIFICATION QUERIES
-- Use these to verify seed data was inserted correctly
-- =====================================================

-- Check CSV food data (1348 Indonesian foods in /Ml Model/indonesia_food_mood_categorized.csv)

-- Check user profiles
-- SELECT username, full_name, email FROM profiles ORDER BY username;

-- Check assessments per user
-- SELECT p.username, COUNT(na.id) as assessment_count 
-- FROM profiles p 
-- LEFT JOIN nutrition_assessments na ON p.id = na.user_id 
-- GROUP BY p.username ORDER BY assessment_count DESC;

-- Check community engagement
-- SELECT 
--     p.username,
--     COUNT(DISTINCT cp.id) as posts_count,
--     COUNT(DISTINCT c.id) as comments_count,
--     COUNT(DISTINCT pl.id) as likes_count
-- FROM profiles p
-- LEFT JOIN community_posts cp ON p.id = cp.user_id
-- LEFT JOIN comments c ON p.id = c.user_id
-- LEFT JOIN post_likes pl ON p.id = pl.user_id
-- GROUP BY p.username
-- ORDER BY posts_count DESC;

-- =====================================================
-- CLEANUP SCRIPT
-- Use this to remove seed data if needed
-- =====================================================

/*
-- WARNING: This will remove all seed data
-- Only use in development environment

DELETE FROM post_likes;
DELETE FROM comments;
DELETE FROM community_posts;
DELETE FROM food_recommendations;
DELETE FROM nutrition_assessments;
DELETE FROM profiles WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
);
-- Food data is stored in CSV files, not database tables
*/
