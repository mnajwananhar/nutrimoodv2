-- =====================================================
-- NutriMood Database Maintenance Queries
-- Useful queries for database monitoring and maintenance
-- =====================================================

-- =====================================================
-- USER AND ENGAGEMENT ANALYTICS
-- =====================================================

-- Daily active users (last 7 days)
SELECT 
    DATE(last_active) as date,
    COUNT(DISTINCT id) as active_users
FROM profiles 
WHERE last_active >= NOW() - INTERVAL '7 days'
GROUP BY DATE(last_active)
ORDER BY date DESC;

-- User engagement summary
SELECT 
    p.username,
    p.joined_at,
    COUNT(DISTINCT na.id) as assessments_count,
    COUNT(DISTINCT cp.id) as posts_count,
    COUNT(DISTINCT c.id) as comments_count,
    COUNT(DISTINCT pl.id) as likes_given,
    MAX(na.created_at) as last_assessment,
    MAX(cp.created_at) as last_post
FROM profiles p
LEFT JOIN nutrition_assessments na ON p.id = na.user_id
LEFT JOIN community_posts cp ON p.id = cp.user_id
LEFT JOIN comments c ON p.id = c.user_id
LEFT JOIN post_likes pl ON p.id = pl.user_id
GROUP BY p.id, p.username, p.joined_at
ORDER BY assessments_count DESC;

-- New user registration trends (last 30 days)
SELECT 
    DATE(joined_at) as date,
    COUNT(*) as new_users
FROM profiles 
WHERE joined_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(joined_at)
ORDER BY date DESC;

-- =====================================================
-- NUTRITION ASSESSMENT ANALYTICS
-- =====================================================

-- Mood distribution analysis
SELECT 
    predicted_mood,
    COUNT(*) as count,
    ROUND(AVG(confidence_score), 3) as avg_confidence,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM nutrition_assessments
GROUP BY predicted_mood
ORDER BY count DESC;

-- Nutrition level patterns by mood
SELECT 
    predicted_mood,
    ROUND(AVG(calorie_level), 2) as avg_calories,
    ROUND(AVG(protein_level), 2) as avg_protein,
    ROUND(AVG(fat_level), 2) as avg_fat,
    ROUND(AVG(carb_level), 2) as avg_carbs,
    ROUND(AVG(fiber_level), 2) as avg_fiber,
    ROUND(AVG(vitamin_level), 2) as avg_vitamins,
    ROUND(AVG(mineral_level), 2) as avg_minerals
FROM nutrition_assessments
GROUP BY predicted_mood
ORDER BY COUNT(*) DESC;

-- Assessment frequency by user
SELECT 
    p.username,
    COUNT(na.id) as total_assessments,
    MIN(na.created_at) as first_assessment,
    MAX(na.created_at) as latest_assessment,
    EXTRACT(DAYS FROM (MAX(na.created_at) - MIN(na.created_at))) as days_active,
    CASE 
        WHEN COUNT(na.id) > 0 AND EXTRACT(DAYS FROM (MAX(na.created_at) - MIN(na.created_at))) > 0
        THEN ROUND(COUNT(na.id)::DECIMAL / EXTRACT(DAYS FROM (MAX(na.created_at) - MIN(na.created_at))), 2)
        ELSE 0
    END as assessments_per_day
FROM profiles p
LEFT JOIN nutrition_assessments na ON p.id = na.user_id
GROUP BY p.id, p.username
HAVING COUNT(na.id) > 0
ORDER BY total_assessments DESC;

-- High confidence predictions
SELECT 
    na.predicted_mood,
    na.confidence_score,
    p.username,
    na.created_at
FROM nutrition_assessments na
JOIN profiles p ON na.user_id = p.id
WHERE na.confidence_score > 0.9
ORDER BY na.confidence_score DESC, na.created_at DESC;

-- =====================================================
-- COMMUNITY ANALYTICS
-- =====================================================

-- Most popular community posts
SELECT 
    cp.title,
    p.username as author,
    cp.created_at,
    COUNT(DISTINCT pl.id) as likes_count,
    COUNT(DISTINCT c.id) as comments_count,
    cp.mood_tag,
    cp.tags
FROM community_posts cp
JOIN profiles p ON cp.user_id = p.id
LEFT JOIN post_likes pl ON cp.id = pl.post_id
LEFT JOIN comments c ON cp.id = c.post_id
GROUP BY cp.id, cp.title, p.username, cp.created_at, cp.mood_tag, cp.tags
ORDER BY likes_count DESC, comments_count DESC
LIMIT 10;

-- Community engagement by mood tags
SELECT 
    mood_tag,
    COUNT(*) as posts_count,
    AVG(likes_per_post) as avg_likes,
    AVG(comments_per_post) as avg_comments
FROM (
    SELECT 
        cp.mood_tag,
        COUNT(DISTINCT pl.id) as likes_per_post,
        COUNT(DISTINCT c.id) as comments_per_post
    FROM community_posts cp
    LEFT JOIN post_likes pl ON cp.id = pl.post_id
    LEFT JOIN comments c ON cp.id = c.post_id
    GROUP BY cp.id, cp.mood_tag
) subquery
WHERE mood_tag IS NOT NULL
GROUP BY mood_tag
ORDER BY posts_count DESC;

-- Most active community members
SELECT 
    p.username,
    COUNT(DISTINCT cp.id) as posts_created,
    COUNT(DISTINCT c.id) as comments_made,
    COUNT(DISTINCT pl.id) as likes_given,
    (COUNT(DISTINCT cp.id) + COUNT(DISTINCT c.id) + COUNT(DISTINCT pl.id)) as total_activity
FROM profiles p
LEFT JOIN community_posts cp ON p.id = cp.user_id
LEFT JOIN comments c ON p.id = c.user_id
LEFT JOIN post_likes pl ON p.id = pl.user_id
GROUP BY p.id, p.username
HAVING COUNT(DISTINCT cp.id) + COUNT(DISTINCT c.id) + COUNT(DISTINCT pl.id) > 0
ORDER BY total_activity DESC;

-- =====================================================
-- FOOD RECOMMENDATION ANALYTICS
-- =====================================================

-- Most recommended foods
SELECT 
    food_name,
    COUNT(*) as recommendation_count,
    priority_levels
FROM (
    SELECT 
        jsonb_array_elements_text(recommended_foods) as food_name,
        priority_level,
        STRING_AGG(DISTINCT priority_level, ', ') OVER (PARTITION BY jsonb_array_elements_text(recommended_foods)) as priority_levels
    FROM food_recommendations
) subquery
GROUP BY food_name, priority_levels
ORDER BY recommendation_count DESC;

-- Recommendation success patterns
SELECT 
    fr.priority_level,
    COUNT(*) as total_recommendations,
    COUNT(DISTINCT fr.user_id) as users_with_recommendations,
    ROUND(AVG(na.confidence_score), 3) as avg_assessment_confidence
FROM food_recommendations fr
JOIN nutrition_assessments na ON fr.assessment_id = na.id
GROUP BY fr.priority_level
ORDER BY total_recommendations DESC;

-- User recommendation history
SELECT 
    p.username,
    COUNT(fr.id) as total_recommendations,
    COUNT(DISTINCT DATE(fr.created_at)) as recommendation_days,
    MAX(fr.created_at) as latest_recommendation,
    STRING_AGG(DISTINCT fr.priority_level, ', ') as priority_levels_received
FROM profiles p
JOIN food_recommendations fr ON p.id = fr.user_id
GROUP BY p.id, p.username
ORDER BY total_recommendations DESC;

-- =====================================================
-- SYSTEM PERFORMANCE QUERIES
-- =====================================================

-- Table size analysis
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Slow query identification (requires pg_stat_statements extension)
-- Enable with: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query ILIKE '%nutrition_assessments%' 
   OR query ILIKE '%community_posts%'
   OR query ILIKE '%food_recommendations%'
ORDER BY total_time DESC
LIMIT 10;
*/

-- =====================================================
-- DATA QUALITY CHECKS
-- =====================================================

-- Check for orphaned records
SELECT 'Assessments without users' as check_type, COUNT(*) as count
FROM nutrition_assessments na
LEFT JOIN profiles p ON na.user_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'Recommendations without assessments' as check_type, COUNT(*) as count
FROM food_recommendations fr
LEFT JOIN nutrition_assessments na ON fr.assessment_id = na.id
WHERE na.id IS NULL

UNION ALL

SELECT 'Posts without users' as check_type, COUNT(*) as count
FROM community_posts cp
LEFT JOIN profiles p ON cp.user_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 'Comments without posts' as check_type, COUNT(*) as count
FROM comments c
LEFT JOIN community_posts cp ON c.post_id = cp.id
WHERE cp.id IS NULL;

-- Check for invalid nutrition levels
SELECT 
    'Invalid nutrition levels' as check_type,
    COUNT(*) as count
FROM nutrition_assessments
WHERE calorie_level NOT BETWEEN 0 AND 3
   OR protein_level NOT BETWEEN 0 AND 3
   OR fat_level NOT BETWEEN 0 AND 3
   OR carb_level NOT BETWEEN 0 AND 3
   OR fiber_level NOT BETWEEN 0 AND 3
   OR vitamin_level NOT BETWEEN 0 AND 3
   OR mineral_level NOT BETWEEN 0 AND 3;

-- Check for missing required fields
SELECT 
    'Profiles missing email' as check_type,
    COUNT(*) as count
FROM profiles
WHERE email IS NULL OR email = ''

UNION ALL

SELECT 'Assessments missing mood prediction' as check_type, COUNT(*) as count
FROM nutrition_assessments
WHERE predicted_mood IS NULL OR predicted_mood = ''

UNION ALL

SELECT 'Posts missing title' as check_type, COUNT(*) as count
FROM community_posts
WHERE title IS NULL OR title = '';

-- =====================================================
-- CLEANUP QUERIES
-- Use these for maintenance and data cleanup
-- =====================================================

-- Remove old assessments (older than 1 year)
-- DELETE FROM nutrition_assessments 
-- WHERE created_at < NOW() - INTERVAL '1 year';

-- Remove inactive user profiles (no activity in 6 months)
-- DELETE FROM profiles 
-- WHERE last_active < NOW() - INTERVAL '6 months'
-- AND id NOT IN (
--     SELECT DISTINCT user_id FROM nutrition_assessments WHERE created_at > NOW() - INTERVAL '6 months'
--     UNION
--     SELECT DISTINCT user_id FROM community_posts WHERE created_at > NOW() - INTERVAL '6 months'
-- );

-- Archive old community posts (older than 2 years)
-- CREATE TABLE archived_community_posts AS 
-- SELECT * FROM community_posts 
-- WHERE created_at < NOW() - INTERVAL '2 years';

-- DELETE FROM community_posts 
-- WHERE created_at < NOW() - INTERVAL '2 years';

-- =====================================================
-- BACKUP VERIFICATION
-- =====================================================

-- Verify backup data completeness
SELECT 
    'profiles' as table_name,
    COUNT(*) as current_count,
    (SELECT COUNT(*) FROM profiles_backup) as backup_count,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM profiles_backup) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM profiles
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles_backup')

UNION ALL

SELECT 
    'nutrition_assessments' as table_name,
    COUNT(*) as current_count,
    COALESCE((SELECT COUNT(*) FROM nutrition_assessments_backup), 0) as backup_count,
    CASE 
        WHEN COUNT(*) = COALESCE((SELECT COUNT(*) FROM nutrition_assessments_backup), 0) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as status
FROM nutrition_assessments
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'nutrition_assessments_backup');

-- =====================================================
-- EXPORT QUERIES
-- Use these to export data for analysis
-- =====================================================

-- Export user engagement data (CSV format)
-- COPY (
--     SELECT 
--         p.username,
--         p.joined_at,
--         p.last_active,
--         COUNT(DISTINCT na.id) as assessments,
--         COUNT(DISTINCT cp.id) as posts,
--         COUNT(DISTINCT c.id) as comments
--     FROM profiles p
--     LEFT JOIN nutrition_assessments na ON p.id = na.user_id
--     LEFT JOIN community_posts cp ON p.id = cp.user_id
--     LEFT JOIN comments c ON p.id = c.user_id
--     GROUP BY p.id, p.username, p.joined_at, p.last_active
-- ) TO '/tmp/user_engagement.csv' WITH CSV HEADER;

-- Export mood prediction accuracy data
-- COPY (
--     SELECT 
--         predicted_mood,
--         confidence_score,
--         calorie_level,
--         protein_level,
--         fat_level,
--         carb_level,
--         created_at
--     FROM nutrition_assessments
--     WHERE created_at >= NOW() - INTERVAL '30 days'
-- ) TO '/tmp/mood_predictions.csv' WITH CSV HEADER;
