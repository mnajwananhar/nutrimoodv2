@echo off
echo =====================================================
echo RUNNING MIGRATION: Mood-First Flow Schema Update
echo Using direct PostgreSQL connection
echo =====================================================
echo.

REM Check if psql is available
psql --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PostgreSQL psql not found. Please install PostgreSQL or add it to PATH.
    pause
    exit /b 1
)

echo Please provide your Supabase database connection details:
echo.
set /p DB_HOST="Database Host (e.g., db.xxx.supabase.co): "
set /p DB_NAME="Database Name (usually 'postgres'): "
set /p DB_USER="Database User (usually 'postgres'): "
set /p DB_PASSWORD="Database Password: "
set /p DB_PORT="Database Port (usually 5432): "

echo.
echo Connecting to database and running safe migration...
echo.

REM Run the safe migration script
psql "postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%" -f 06_safe_migration.sql

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
