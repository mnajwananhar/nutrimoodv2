@echo off
echo =====================================================
echo QUICK FIX: Resolving constraint violation error
echo =====================================================
echo.

echo Please provide your Supabase database connection details:
echo.
set /p DB_HOST="Database Host (e.g., db.xxx.supabase.co): "
set /p DB_NAME="Database Name (usually 'postgres'): "
set /p DB_USER="Database User (usually 'postgres'): "
set /p DB_PASSWORD="Database Password: "
set /p DB_PORT="Database Port (usually 5432): "

echo.
echo Applying quick fix for constraint violations...
echo.

REM Run the quick fix script
psql "postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%" -f 06_quick_fix.sql

if errorlevel 1 (
    echo.
    echo ERROR: Quick fix failed!
    echo Please check the error messages above.
    pause
    exit /b 1
) else (
    echo.
    echo SUCCESS: Constraint violations fixed!
    echo You can now run the full migration safely.
    echo.
)

pause
