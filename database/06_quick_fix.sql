-- =====================================================
-- QUICK FIX: Resolve constraint violation error
-- Run this if you're getting constraint violation errors
-- =====================================================

-- Fix existing records that might have invalid mood values
UPDATE nutrition_assessments 
SET selected_mood = CASE 
    WHEN predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN predicted_mood
    WHEN predicted_mood = 'multi_category' THEN 'neutral'
    WHEN predicted_mood IS NULL THEN 'neutral'
    ELSE 'neutral'
END
WHERE selected_mood IS NULL OR selected_mood NOT IN ('energizing', 'relaxing', 'focusing', 'neutral');

-- Clean up predicted_mood values as well
UPDATE nutrition_assessments 
SET predicted_mood = CASE 
    WHEN predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN predicted_mood
    WHEN predicted_mood = 'multi_category' THEN 'neutral'
    WHEN predicted_mood IS NULL THEN selected_mood
    ELSE 'neutral'
END
WHERE predicted_mood IS NULL OR predicted_mood NOT IN ('energizing', 'relaxing', 'focusing', 'neutral', 'multi_category');

-- Now safely add the constraints
ALTER TABLE nutrition_assessments 
DROP CONSTRAINT IF EXISTS check_selected_mood;

ALTER TABLE nutrition_assessments 
ADD CONSTRAINT check_selected_mood 
CHECK (selected_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') OR selected_mood IS NULL);

-- Also fix predicted_mood constraint if it exists
ALTER TABLE nutrition_assessments 
DROP CONSTRAINT IF EXISTS check_predicted_mood;

ALTER TABLE nutrition_assessments 
ADD CONSTRAINT check_predicted_mood 
CHECK (predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') OR predicted_mood IS NULL);

-- Verify fix
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN selected_mood IS NOT NULL THEN 1 END) as has_selected_mood,
    COUNT(CASE WHEN selected_mood NOT IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN 1 END) as invalid_selected_mood
FROM nutrition_assessments;
