# NutriMood Database Setup Guide

## Overview

This guide provides step-by-step instructions for deploying the NutriMood database schema to Supabase, including schema creation, security policies, and initial data seeding.

## Database Files Structure

```
database/
├── 01_initial_schema.sql      # Core database schema
├── 02_rls_policies.sql        # Row Level Security policies
├── 03_deployment_scripts.sql  # Deployment utilities
├── 04_seed_data.sql          # Sample data for development
└── README.md                 # This file
```

## Prerequisites

1. **Supabase Project**: Create a new Supabase project at [supabase.com](https://supabase.com)
2. **Database Access**: Admin access to your Supabase project
3. **SQL Editor**: Access to Supabase SQL Editor or PostgreSQL client

## Architecture Overview

NutriMood uses a **hybrid data architecture**:

### Database (Supabase)

- **User data**: profiles, assessments, recommendations history
- **Community data**: posts, comments, likes, interactions
- **Application state**: user sessions, preferences

### File-based Data (CSV/Pickle)

- **Food reference data**: 1348 Indonesian foods (`/Ml Model/indonesia_food_mood_categorized.csv`)
- **ML models**: trained food recommender and mood classifier (`/backend/*.pkl`, `*.keras`)

This separation allows:

- ✅ Fast ML inference from optimized file formats
- ✅ Scalable user data management in Supabase
- ✅ Easier ML model updates without database migrations
- ✅ Better separation of concerns

## Deployment Instructions

### Step 1: Initial Schema Deployment

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query and copy the contents of `01_initial_schema.sql`
4. Execute the query to create all tables, indexes, and triggers

```sql
-- Copy and paste the entire content of 01_initial_schema.sql
-- This creates:
-- - 6 main tables (profiles, nutrition_assessments, food_recommendations, community_posts, comments, post_likes)
-- - Foreign key relationships
-- - Performance indexes
-- - Update triggers
```

### Step 2: Security Policies Setup

1. In SQL Editor, create a new query
2. Copy the contents of `02_rls_policies.sql`
3. Execute to enable Row Level Security and create policies

```sql
-- Copy and paste the entire content of 02_rls_policies.sql
-- This enables:
-- - Row Level Security on all tables
-- - User isolation for private data
-- - Public access for community features
-- - Performance optimizations
```

### Step 3: Verify Deployment

1. Copy and paste this verification script in SQL Editor:

```sql
-- Run health check
SELECT * FROM check_database_health();

-- Test basic operations
SELECT test_basic_operations();

-- Check database statistics
SELECT * FROM get_database_stats();
```

Expected results:

- ✅ All health checks should return "PASS"
- ✅ Basic operations test should complete without errors
- ✅ Database stats should show 7 tables

### Step 4: Seed Data (Development Only)

For development and testing, load sample data:

1. Copy contents of `04_seed_data.sql`
2. Execute in SQL Editor
3. This adds:
   - Sample user profiles
   - Demo assessments and recommendations
   - Community posts and interactions

Note: Food data is stored in CSV files (`/Ml Model/indonesia_food_mood_categorized.csv`), not in the database.

```sql
-- Verify seed data
SELECT username, full_name FROM profiles;
SELECT COUNT(*) as assessments FROM nutrition_assessments;
```

## Authentication Integration

### Automatic Profile Creation

The database automatically creates user profiles when users sign up through Supabase Auth:

```sql
-- This trigger runs automatically on auth.users inserts
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Profile Updates

Users can update their profiles through the application, and the changes are automatically tracked with timestamps.

## Security Features

### Row Level Security (RLS)

- **Private Data**: Nutrition assessments and recommendations are only accessible by the user who created them
- **Community Data**: Posts, comments, and likes are publicly readable but users can only modify their own content
- **Profile Data**: Users can read all profiles but only update their own

### Data Validation

- Input validation through database constraints
- Mood and nutrition level enums with valid ranges
- Foreign key integrity enforcement
- Automatic timestamp management

## Performance Optimizations

### Indexes

Key indexes are created for:

- User lookups (`profiles.username`, `profiles.email`)
- Time-based queries (`created_at`, `updated_at` fields)
- Foreign key relationships
- Community features (posts, comments, likes)

### Query Patterns

The schema is optimized for common application queries:

- User dashboard data retrieval
- Assessment history and trends
- Community feed generation
- Recommendation lookups

## Maintenance

### Regular Health Checks

Run periodic health checks to monitor database performance:

```sql
-- Monthly health check
SELECT * FROM check_database_health();

-- Check table sizes and growth
SELECT * FROM get_database_stats();
```

### Backup Recommendations

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Manual Backups**: Use the backup functions before major updates
3. **Critical Data**: Focus on user profiles, assessments, and community content

### Monitoring

Key metrics to monitor:

- Table growth rates (especially `nutrition_assessments` and `community_posts`)
- Query performance on indexed columns
- RLS policy effectiveness
- User engagement patterns

## Troubleshooting

### Common Issues

1. **RLS Policies Not Working**

   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = true;
   ```

2. **Slow Queries**

   ```sql
   -- Check if indexes exist
   SELECT schemaname, tablename, indexname
   FROM pg_indexes WHERE schemaname = 'public';
   ```

3. **Trigger Issues**
   ```sql
   -- Verify triggers are active
   SELECT trigger_name, table_name, action_timing, event_manipulation
   FROM information_schema.triggers
   WHERE trigger_schema = 'public';
   ```

### Rollback Procedures

If issues occur during deployment:

```sql
-- Backup current data
SELECT backup_critical_data();

-- If needed, restore from backup
SELECT restore_from_backup();
```

## Environment-Specific Notes

### Development

- Use seed data for testing
- Enable verbose logging
- Keep backup functions available

### Staging

- Use production-like data volumes
- Test RLS policies thoroughly
- Verify performance under load

### Production

- Remove seed data and helper functions
- Monitor query performance
- Set up alerting for critical metrics
- Regular backup verification

## API Integration

The database schema supports the NutriMood application's API endpoints:

- **Authentication**: `/auth/*` - Automatic profile creation
- **Assessments**: `/api/assessment` - Store nutrition assessments
- **Recommendations**: `/api/recommendations` - Generate and store food recommendations
- **Community**: `/api/community/*` - Posts, comments, likes
- **Dashboard**: `/api/dashboard` - User metrics and history

## Support

For issues with database deployment or configuration:

1. Check Supabase project logs
2. Verify SQL syntax in editor
3. Run health check functions
4. Review RLS policy documentation
5. Check application-database integration

## Version History

- **v1.0**: Initial schema with core tables
- **v1.1**: Added RLS policies and security
- **v1.2**: Performance optimizations and indexes
- **v1.3**: Deployment scripts and utilities
- **v1.4**: Seed data and documentation

---

For more information about Supabase features, visit the [official documentation](https://supabase.com/docs).
