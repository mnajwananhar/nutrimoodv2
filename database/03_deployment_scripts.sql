-- =====================================================
-- NutriMood Database Deployment Scripts
-- Comprehensive deployment and migration scripts for Supabase
-- =====================================================

-- =====================================================
-- PRE-DEPLOYMENT CHECKLIST
-- Run these commands before deploying the database
-- =====================================================

-- 1. Verify Supabase project is created and accessible
-- 2. Ensure you have proper admin access to the project
-- 3. Backup any existing data if this is an update
-- 4. Test connection to Supabase project

-- =====================================================
-- DEPLOYMENT SCRIPT 1: CLEAN SLATE DEPLOYMENT
-- Use this for new projects or complete database reset
-- =====================================================

-- WARNING: This will drop all existing tables and data
-- Only use for initial deployment or complete reset

DO $$
DECLARE
    table_name TEXT;
BEGIN
    -- Drop all tables in reverse dependency order
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(table_name) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', table_name;
    END LOOP;
END $$;

-- =====================================================
-- DEPLOYMENT SCRIPT 2: SAFE MIGRATION
-- Use this for updating existing database
-- =====================================================

-- Check if tables exist and create migration plan
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Existing database detected. Use migration scripts below.';
    ELSE
        RAISE NOTICE 'No existing tables found. Safe to proceed with full deployment.';
    END IF;
END $$;

-- =====================================================
-- MIGRATION HELPERS
-- Utility functions for safe migrations
-- =====================================================

-- Function to safely add columns
CREATE OR REPLACE FUNCTION safe_add_column(
    table_name TEXT,
    column_name TEXT,
    column_type TEXT,
    column_default TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = table_name 
        AND column_name = column_name
    ) THEN
        IF column_default IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s DEFAULT %s', 
                         table_name, column_name, column_type, column_default);
        ELSE
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                         table_name, column_name, column_type);
        END IF;
        RAISE NOTICE 'Added column % to table %', column_name, table_name;
    ELSE
        RAISE NOTICE 'Column % already exists in table %', column_name, table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to safely add indexes
CREATE OR REPLACE FUNCTION safe_create_index(
    index_name TEXT,
    table_name TEXT,
    columns TEXT
)
RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = index_name
    ) THEN
        EXECUTE format('CREATE INDEX %I ON %I (%s)', index_name, table_name, columns);
        RAISE NOTICE 'Created index %', index_name;
    ELSE
        RAISE NOTICE 'Index % already exists', index_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATA MIGRATION FUNCTIONS
-- Functions to migrate existing data safely
-- =====================================================

-- Function to migrate user data from auth.users to profiles
CREATE OR REPLACE FUNCTION migrate_user_profiles()
RETURNS VOID AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, created_at)
    SELECT 
        id,
        email,
        COALESCE(raw_user_meta_data->>'full_name', email),
        created_at
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM profiles)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Migrated % user profiles', (SELECT COUNT(*) FROM profiles);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROLLBACK SCRIPTS
-- Scripts to safely rollback changes if needed
-- =====================================================

-- Function to backup critical data before migration
CREATE OR REPLACE FUNCTION backup_critical_data()
RETURNS VOID AS $$
BEGIN
    -- Create backup tables
    DROP TABLE IF EXISTS profiles_backup;
    DROP TABLE IF EXISTS nutrition_assessments_backup;
    DROP TABLE IF EXISTS community_posts_backup;
    
    -- Backup profiles
    CREATE TABLE profiles_backup AS SELECT * FROM profiles;
    
    -- Backup assessments if exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'nutrition_assessments') THEN
        CREATE TABLE nutrition_assessments_backup AS SELECT * FROM nutrition_assessments;
    END IF;
    
    -- Backup community posts if exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_posts') THEN
        CREATE TABLE community_posts_backup AS SELECT * FROM community_posts;
    END IF;
    
    RAISE NOTICE 'Critical data backed up successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to restore from backup
CREATE OR REPLACE FUNCTION restore_from_backup()
RETURNS VOID AS $$
BEGIN
    -- Restore profiles
    TRUNCATE TABLE profiles;
    INSERT INTO profiles SELECT * FROM profiles_backup;
    
    -- Restore assessments if backup exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'nutrition_assessments_backup') THEN
        TRUNCATE TABLE nutrition_assessments;
        INSERT INTO nutrition_assessments SELECT * FROM nutrition_assessments_backup;
    END IF;
    
    -- Restore community posts if backup exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'community_posts_backup') THEN
        TRUNCATE TABLE community_posts;
        INSERT INTO community_posts SELECT * FROM community_posts_backup;
    END IF;
    
    RAISE NOTICE 'Data restored from backup successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HEALTH CHECK FUNCTIONS
-- Functions to verify database integrity after deployment
-- =====================================================

-- Function to check database health
CREATE OR REPLACE FUNCTION check_database_health()
RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if all required tables exist
    RETURN QUERY
    SELECT 
        'Required Tables'::TEXT as check_name,
        CASE 
            WHEN COUNT(*) = 7 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        format('%s/7 tables found', COUNT(*))::TEXT as details
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'profiles', 'nutrition_assessments', 'food_recommendations',
        'community_posts', 'comments', 'post_likes'
    );
    
    -- Check if RLS is enabled
    RETURN QUERY
    SELECT 
        'RLS Enabled'::TEXT as check_name,
        CASE 
            WHEN COUNT(*) > 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        format('%s tables have RLS enabled', COUNT(*))::TEXT as details
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND c.relrowsecurity = true;
    
    -- Check if indexes exist
    RETURN QUERY
    SELECT 
        'Performance Indexes'::TEXT as check_name,
        CASE 
            WHEN COUNT(*) >= 10 THEN 'PASS'
            ELSE 'WARN'
        END as status,
        format('%s indexes found', COUNT(*))::TEXT as details
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Check if triggers exist
    RETURN QUERY
    SELECT 
        'Update Triggers'::TEXT as check_name,
        CASE 
            WHEN COUNT(*) > 0 THEN 'PASS'
            ELSE 'WARN'
        END as status,
        format('%s update triggers found', COUNT(*))::TEXT as details
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
    AND t.tgname LIKE '%updated_at%';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEPLOYMENT VERIFICATION
-- Scripts to verify successful deployment
-- =====================================================

-- Function to test basic CRUD operations
CREATE OR REPLACE FUNCTION test_basic_operations()
RETURNS VOID AS $$
DECLARE
    test_user_id UUID;
    test_profile_id UUID;
    test_assessment_id UUID;
BEGIN
    -- Create a test user ID (simulate auth.users entry)
    test_user_id := uuid_generate_v4();
    
    -- Test profile creation
    INSERT INTO profiles (id, email, full_name)
    VALUES (test_user_id, 'test@nutrimood.com', 'Test User')
    RETURNING id INTO test_profile_id;
    
    -- Test assessment creation
    INSERT INTO nutrition_assessments (
        user_id, calorie_level, protein_level, fat_level, carb_level,
        fiber_level, vitamin_level, mineral_level, predicted_mood
    )
    VALUES (test_user_id, 1, 2, 1, 2, 1, 2, 1, 'energetic')
    RETURNING id INTO test_assessment_id;
    
    -- Test data retrieval
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = test_profile_id
    ) THEN
        RAISE EXCEPTION 'Profile creation test failed';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM nutrition_assessments WHERE id = test_assessment_id
    ) THEN
        RAISE EXCEPTION 'Assessment creation test failed';
    END IF;
    
    -- Clean up test data
    DELETE FROM nutrition_assessments WHERE id = test_assessment_id;
    DELETE FROM profiles WHERE id = test_profile_id;
    
    RAISE NOTICE 'Basic operations test passed successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MONITORING AND MAINTENANCE
-- Functions for ongoing database monitoring
-- =====================================================

-- Function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    size_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        (xpath('/row/cnt/text()', 
               query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I', 
                                 t.schemaname, t.tablename), false, true, ''))
        )[1]::TEXT::BIGINT as row_count,
        ROUND(
            (pg_total_relation_size(format('%I.%I', t.schemaname, t.tablename))::NUMERIC / 1024 / 1024), 
            2
        ) as size_mb
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    ORDER BY row_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXAMPLE DEPLOYMENT COMMANDS
-- Copy and run these commands in Supabase SQL Editor
-- =====================================================

/*
-- STEP 1: Initial deployment (run once)
\i 01_initial_schema.sql
\i 02_rls_policies.sql

-- STEP 2: Run health check
SELECT * FROM check_database_health();

-- STEP 3: Test basic operations
SELECT test_basic_operations();

-- STEP 4: Check database stats
SELECT * FROM get_database_stats();

-- STEP 5: If using existing auth.users, migrate profiles
SELECT migrate_user_profiles();

-- STEP 6: Final verification
SELECT * FROM check_database_health();
*/

-- =====================================================
-- CLEANUP
-- Remove deployment helper functions if desired
-- =====================================================

-- Uncomment to remove helper functions after deployment
/*
DROP FUNCTION IF EXISTS safe_add_column(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS safe_create_index(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS migrate_user_profiles();
DROP FUNCTION IF EXISTS backup_critical_data();
DROP FUNCTION IF EXISTS restore_from_backup();
DROP FUNCTION IF EXISTS test_basic_operations();
*/

-- Keep these functions for ongoing maintenance
-- check_database_health(), get_database_stats()
