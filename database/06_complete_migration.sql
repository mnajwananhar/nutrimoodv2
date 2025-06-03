-- =====================================================
-- COMPLETE MIGRATION: Mood-First Flow Schema Update
-- Copy-paste this entire file to Supabase SQL Editor
-- =====================================================

-- Step 1: Add new columns for mood-first flow
ALTER TABLE nutrition_assessments 
ADD COLUMN IF NOT EXISTS selected_mood TEXT;

-- Step 2: Make nutrition levels optional (since they're now derived from food recommendations)
ALTER TABLE nutrition_assessments 
ALTER COLUMN calorie_level DROP NOT NULL,
ALTER COLUMN protein_level DROP NOT NULL,
ALTER COLUMN fat_level DROP NOT NULL,
ALTER COLUMN carb_level DROP NOT NULL;

-- Step 3: Set default values for nutrition levels
ALTER TABLE nutrition_assessments 
ALTER COLUMN calorie_level SET DEFAULT 2,
ALTER COLUMN protein_level SET DEFAULT 2,
ALTER COLUMN fat_level SET DEFAULT 2,
ALTER COLUMN carb_level SET DEFAULT 2;

-- Step 4: Add index for selected_mood
CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_selected_mood ON nutrition_assessments(selected_mood);

-- Step 5: Fix existing data - set selected_mood from predicted_mood
UPDATE nutrition_assessments 
SET selected_mood = CASE 
    WHEN predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN predicted_mood
    WHEN predicted_mood = 'multi_category' THEN 'neutral'
    ELSE 'neutral'
END
WHERE selected_mood IS NULL;

-- Step 6: Clean up predicted_mood values
UPDATE nutrition_assessments 
SET predicted_mood = CASE 
    WHEN predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN predicted_mood
    WHEN predicted_mood = 'multi_category' THEN 'neutral'
    ELSE 'neutral'
END
WHERE predicted_mood NOT IN ('energizing', 'relaxing', 'focusing', 'neutral') OR predicted_mood IS NULL;

-- Step 7: Add constraints safely
ALTER TABLE nutrition_assessments 
DROP CONSTRAINT IF EXISTS check_selected_mood;

ALTER TABLE nutrition_assessments 
ADD CONSTRAINT check_selected_mood 
CHECK (selected_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') OR selected_mood IS NULL);

ALTER TABLE nutrition_assessments 
DROP CONSTRAINT IF EXISTS check_predicted_mood;

ALTER TABLE nutrition_assessments 
ADD CONSTRAINT check_predicted_mood 
CHECK (predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') OR predicted_mood IS NULL);

-- Step 8: Update comments
COMMENT ON COLUMN nutrition_assessments.selected_mood IS 'User-selected mood: energizing, relaxing, focusing, neutral';
COMMENT ON COLUMN nutrition_assessments.predicted_mood IS 'For backward compatibility - same as selected_mood in new flow';
COMMENT ON COLUMN nutrition_assessments.calorie_level IS 'Derived from food recommendations (optional, default: 2=medium)';
COMMENT ON COLUMN nutrition_assessments.protein_level IS 'Derived from food recommendations (optional, default: 2=medium)';
COMMENT ON COLUMN nutrition_assessments.fat_level IS 'Derived from food recommendations (optional, default: 2=medium)';
COMMENT ON COLUMN nutrition_assessments.carb_level IS 'Derived from food recommendations (optional, default: 2=medium)';

COMMENT ON TABLE nutrition_assessments IS 'User mood selections and derived nutrition data from food recommendations';

-- Step 9: Verify migration success
SELECT 
    'Migration Complete!' as status,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN selected_mood IS NOT NULL THEN 1 END) as has_selected_mood,
    COUNT(CASE WHEN selected_mood NOT IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN 1 END) as invalid_selected_mood
FROM nutrition_assessments;
