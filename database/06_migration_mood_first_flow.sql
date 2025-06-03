-- =====================================================
-- MIGRATION: Update Schema for Mood-First Flow
-- FROM: Nutrition Input → Mood Prediction → Food Recommendation
-- TO: Mood Selection → Food Recommendation (with nutrition)
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

-- Step 4: Update column comments to reflect new flow
COMMENT ON COLUMN nutrition_assessments.selected_mood IS 'User-selected mood: energizing, relaxing, focusing, neutral';
COMMENT ON COLUMN nutrition_assessments.predicted_mood IS 'For backward compatibility - same as selected_mood in new flow';
COMMENT ON COLUMN nutrition_assessments.calorie_level IS 'Derived from food recommendations (optional, default: 2=medium)';
COMMENT ON COLUMN nutrition_assessments.protein_level IS 'Derived from food recommendations (optional, default: 2=medium)';
COMMENT ON COLUMN nutrition_assessments.fat_level IS 'Derived from food recommendations (optional, default: 2=medium)';
COMMENT ON COLUMN nutrition_assessments.carb_level IS 'Derived from food recommendations (optional, default: 2=medium)';

-- Step 5: Add index for selected_mood
CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_selected_mood ON nutrition_assessments(selected_mood);

-- Step 6: Update table comment
COMMENT ON TABLE nutrition_assessments IS 'User mood selections and derived nutrition data from food recommendations';

-- =====================================================
-- BACKWARD COMPATIBILITY
-- =====================================================

-- For existing records, set selected_mood = predicted_mood if selected_mood is null
UPDATE nutrition_assessments 
SET selected_mood = CASE 
    WHEN predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') THEN predicted_mood
    ELSE 'neutral'  -- Default fallback for any unexpected mood values
END
WHERE selected_mood IS NULL AND predicted_mood IS NOT NULL;

-- For records where both are null, set to neutral
UPDATE nutrition_assessments 
SET selected_mood = 'neutral'
WHERE selected_mood IS NULL AND predicted_mood IS NULL;

-- =====================================================
-- VALIDATION CONSTRAINTS
-- =====================================================

-- Add check constraint for selected_mood values (allowing NULL for flexibility)
ALTER TABLE nutrition_assessments 
ADD CONSTRAINT check_selected_mood 
CHECK (selected_mood IN ('energizing', 'relaxing', 'focusing', 'neutral') OR selected_mood IS NULL);

-- Add check constraint for predicted_mood values (maintain existing)
ALTER TABLE nutrition_assessments 
ADD CONSTRAINT check_predicted_mood 
CHECK (predicted_mood IN ('energizing', 'relaxing', 'focusing', 'neutral', 'multi_category'));
