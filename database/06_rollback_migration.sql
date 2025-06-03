-- =====================================================
-- ROLLBACK MIGRATION: Mood-First Flow Schema Update
-- Use this script if you need to revert the changes
-- =====================================================

-- Step 1: Drop constraints
ALTER TABLE nutrition_assessments 
DROP CONSTRAINT IF EXISTS check_selected_mood;

ALTER TABLE nutrition_assessments 
DROP CONSTRAINT IF EXISTS check_predicted_mood;

-- Step 2: Drop index
DROP INDEX IF EXISTS idx_nutrition_assessments_selected_mood;

-- Step 3: Make nutrition levels required again (restore original schema)
ALTER TABLE nutrition_assessments 
ALTER COLUMN calorie_level SET NOT NULL,
ALTER COLUMN protein_level SET NOT NULL,
ALTER COLUMN fat_level SET NOT NULL,
ALTER COLUMN carb_level SET NOT NULL;

-- Step 4: Remove default values
ALTER TABLE nutrition_assessments 
ALTER COLUMN calorie_level DROP DEFAULT,
ALTER COLUMN protein_level DROP DEFAULT,
ALTER COLUMN fat_level DROP DEFAULT,
ALTER COLUMN carb_level DROP DEFAULT;

-- Step 5: Drop new column
ALTER TABLE nutrition_assessments 
DROP COLUMN IF EXISTS selected_mood;

-- Step 6: Restore original table comment
COMMENT ON TABLE nutrition_assessments IS 'User nutrition assessments and mood predictions';

-- Step 7: Restore original column comments
COMMENT ON COLUMN nutrition_assessments.predicted_mood IS 'ML-predicted mood based on nutrition levels';
COMMENT ON COLUMN nutrition_assessments.calorie_level IS 'User input calorie level (required: 0-3 scale)';
COMMENT ON COLUMN nutrition_assessments.protein_level IS 'User input protein level (required: 0-3 scale)';
COMMENT ON COLUMN nutrition_assessments.fat_level IS 'User input fat level (required: 0-3 scale)';
COMMENT ON COLUMN nutrition_assessments.carb_level IS 'User input carb level (required: 0-3 scale)';

COMMENT ON COLUMN nutrition_assessments.calorie_level IS 'User input calorie level (required: 0-3 scale)';
COMMENT ON COLUMN nutrition_assessments.protein_level IS 'User input protein level (required: 0-3 scale)';
COMMENT ON COLUMN nutrition_assessments.fat_level IS 'User input fat level (required: 0-3 scale)';
COMMENT ON COLUMN nutrition_assessments.carb_level IS 'User input carb level (required: 0-3 scale)';

-- =====================================================
-- NOTE: After running this rollback:
-- 1. Update your frontend code to use nutrition-first flow
-- 2. Ensure all nutrition level fields are properly populated
-- 3. Test the application thoroughly
-- =====================================================
