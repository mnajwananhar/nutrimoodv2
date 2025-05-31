#!/bin/bash

# NutriMood Database Deployment Script
# Automated deployment script for Supabase database setup

set -e  # Exit on any error

# Configuration
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_KEY=""
DATABASE_DIR="$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v psql &> /dev/null; then
        error "psql is required but not installed. Please install PostgreSQL client."
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed."
        exit 1
    fi
    
    log "Dependencies check passed."
}

# Load environment variables
load_config() {
    if [ -f "$DATABASE_DIR/.env" ]; then
        log "Loading configuration from .env file..."
        export $(cat "$DATABASE_DIR/.env" | grep -v '^#' | xargs)
    fi
    
    # Check if required variables are set
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
        error "Missing required environment variables:"
        error "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set"
        error "Either set them in environment or create a .env file"
        exit 1
    fi
}

# Extract database connection info from Supabase URL
get_db_connection() {
    # Extract connection details from Supabase URL
    # Format: https://[project-ref].supabase.co
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's/https:\/\///' | sed 's/\.supabase\.co.*//')
    DB_HOST="db.${PROJECT_REF}.supabase.co"
    DB_PORT="5432"
    DB_NAME="postgres"
    DB_USER="postgres"
    
    # Service key is used as password for postgres user
    DB_PASSWORD="$SUPABASE_SERVICE_KEY"
    
    log "Database connection configured for project: $PROJECT_REF"
}

# Test database connection
test_connection() {
    log "Testing database connection..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        log "Database connection successful."
    else
        error "Failed to connect to database. Please check your credentials."
        exit 1
    fi
}

# Execute SQL file
execute_sql_file() {
    local file_path="$1"
    local description="$2"
    
    if [ ! -f "$file_path" ]; then
        error "File not found: $file_path"
        return 1
    fi
    
    log "Executing $description..."
    log "File: $file_path"
    
    export PGPASSWORD="$DB_PASSWORD"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file_path" > /dev/null; then
        log "✓ $description completed successfully."
        return 0
    else
        error "✗ Failed to execute $description"
        return 1
    fi
}

# Run health check
run_health_check() {
    log "Running database health check..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local health_check_sql="
    DO \$\$
    DECLARE
        check_record RECORD;
        all_passed BOOLEAN := true;
    BEGIN
        FOR check_record IN 
            SELECT * FROM check_database_health()
        LOOP
            RAISE NOTICE 'Check: % - Status: % - Details: %', 
                check_record.check_name, 
                check_record.status, 
                check_record.details;
            
            IF check_record.status != 'PASS' THEN
                all_passed := false;
            END IF;
        END LOOP;
        
        IF all_passed THEN
            RAISE NOTICE 'All health checks passed!';
        ELSE
            RAISE WARNING 'Some health checks failed. Please review the output.';
        END IF;
    END
    \$\$;
    "
    
    echo "$health_check_sql" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
}

# Backup existing data
backup_data() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        warning "Skipping backup as requested."
        return 0
    fi
    
    log "Creating backup of existing data..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local backup_sql="SELECT backup_critical_data();"
    
    if echo "$backup_sql" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        log "✓ Backup completed successfully."
    else
        warning "Backup function not available or failed. Continuing..."
    fi
}

# Main deployment function
deploy_database() {
    log "Starting NutriMood database deployment..."
    
    # Step 1: Backup existing data (if any)
    backup_data
    
    # Step 2: Deploy initial schema
    if execute_sql_file "$DATABASE_DIR/01_initial_schema.sql" "initial schema deployment"; then
        log "✓ Schema deployment successful"
    else
        error "Schema deployment failed. Aborting."
        exit 1
    fi
    
    # Step 3: Deploy RLS policies
    if execute_sql_file "$DATABASE_DIR/02_rls_policies.sql" "Row Level Security policies"; then
        log "✓ RLS policies deployment successful"
    else
        error "RLS policies deployment failed. Aborting."
        exit 1
    fi
    
    # Step 4: Deploy utility functions
    if execute_sql_file "$DATABASE_DIR/03_deployment_scripts.sql" "deployment utilities"; then
        log "✓ Deployment utilities installed"
    else
        warning "Deployment utilities installation failed. Continuing..."
    fi
    
    # Step 5: Deploy seed data (if requested)
    if [ "$INCLUDE_SEED_DATA" = "true" ]; then
        if execute_sql_file "$DATABASE_DIR/04_seed_data.sql" "seed data"; then
            log "✓ Seed data deployment successful"
        else
            warning "Seed data deployment failed. Continuing..."
        fi
    else
        log "Skipping seed data deployment (not requested)"
    fi
    
    # Step 6: Run health check
    run_health_check
    
    log "Database deployment completed successfully!"
}

# Migration function for existing databases
migrate_database() {
    log "Starting database migration..."
    
    backup_data
    
    # Check if this is a fresh database or needs migration
    export PGPASSWORD="$DB_PASSWORD"
    
    local table_check="SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';"
    local table_exists=$(echo "$table_check" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t | xargs)
    
    if [ "$table_exists" = "0" ]; then
        log "Fresh database detected. Running full deployment..."
        deploy_database
    else
        log "Existing database detected. Running migration..."
        
        # Run migration-safe deployment
        if execute_sql_file "$DATABASE_DIR/03_deployment_scripts.sql" "migration utilities"; then
            log "✓ Migration utilities loaded"
        fi
        
        # Add any new columns or tables safely
        # This would include version-specific migration scripts
        
        log "Migration completed successfully!"
    fi
}

# Rollback function
rollback_database() {
    log "Starting database rollback..."
    
    export PGPASSWORD="$DB_PASSWORD"
    
    local rollback_sql="SELECT restore_from_backup();"
    
    if echo "$rollback_sql" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log "✓ Rollback completed successfully"
    else
        error "Rollback failed. Manual intervention may be required."
        exit 1
    fi
}

# Show usage information
show_usage() {
    cat << EOF
NutriMood Database Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    deploy     Deploy fresh database (default)
    migrate    Migrate existing database
    rollback   Rollback to backup
    test       Test database connection
    health     Run health check only

Options:
    --include-seed-data    Include sample data for development
    --skip-backup         Skip backup creation
    --help                Show this help message

Environment Variables:
    SUPABASE_URL          Your Supabase project URL
    SUPABASE_SERVICE_KEY  Your Supabase service role key

Example:
    export SUPABASE_URL="https://yourproject.supabase.co"
    export SUPABASE_SERVICE_KEY="your-service-key"
    $0 deploy --include-seed-data

    # Or create a .env file with the variables
    $0 migrate --skip-backup

EOF
}

# Parse command line arguments
COMMAND="deploy"
INCLUDE_SEED_DATA="false"
SKIP_BACKUP="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        deploy|migrate|rollback|test|health)
            COMMAND="$1"
            shift
            ;;
        --include-seed-data)
            INCLUDE_SEED_DATA="true"
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP="true"
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log "NutriMood Database Deployment Tool"
    log "Command: $COMMAND"
    
    check_dependencies
    load_config
    get_db_connection
    test_connection
    
    case $COMMAND in
        deploy)
            deploy_database
            ;;
        migrate)
            migrate_database
            ;;
        rollback)
            rollback_database
            ;;
        test)
            log "Database connection test completed successfully."
            ;;
        health)
            run_health_check
            ;;
        *)
            error "Unknown command: $COMMAND"
            show_usage
            exit 1
            ;;
    esac
    
    log "Operation completed successfully!"
}

# Run main function
main "$@"
