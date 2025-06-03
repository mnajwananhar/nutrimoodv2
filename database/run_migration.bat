@echo off
echo =====================================================
echo RUNNING MIGRATION: Mood-First Flow Schema Update
echo =====================================================
echo.

REM Check if Supabase CLI is available
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Supabase CLI not found. Please install it first.
    echo https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

echo Applying safe migration script...
echo.

REM Run the safe migration script
supabase db push --file 06_safe_migration.sql

if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo Please check the error messages above.
    pause
    exit /b 1
) else (
    echo.
    echo SUCCESS: Migration completed successfully!
    echo.
    echo Changes applied:
    echo - Added selected_mood column
    echo - Made nutrition levels optional with defaults
    echo - Added constraints and indexes
    echo - Updated backward compatibility
    echo.
)

pause
