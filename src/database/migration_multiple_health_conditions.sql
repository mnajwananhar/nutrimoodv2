-- Migration untuk mendukung multiple health conditions
-- Tanggal: 2024-12-19

-- 1. Tambah kolom health_conditions dengan tipe TEXT[] (array)
ALTER TABLE nutrition_assessments 
ADD COLUMN IF NOT EXISTS health_conditions TEXT[];

-- 2. Migrate data dari kolom health_condition yang lama ke health_conditions array
UPDATE nutrition_assessments 
SET health_conditions = 
  CASE 
    WHEN health_condition IS NULL OR health_condition = '' THEN ARRAY['tidak_ada']
    WHEN health_condition LIKE '%,%' THEN string_to_array(health_condition, ',')
    ELSE ARRAY[health_condition]
  END
WHERE health_conditions IS NULL;

-- 3. Hapus kolom health_condition yang lama (optional, bisa dilakukan nanti)
-- ALTER TABLE nutrition_assessments DROP COLUMN IF EXISTS health_condition;

-- 4. Buat index untuk performa pencarian array
CREATE INDEX IF NOT EXISTS idx_nutrition_assessments_health_conditions 
ON nutrition_assessments USING GIN (health_conditions);

-- Catatan: Kolom health_condition belum dihapus untuk backup. 
-- Hapus secara manual setelah memastikan migrasi berhasil:
-- ALTER TABLE nutrition_assessments DROP COLUMN health_condition;
