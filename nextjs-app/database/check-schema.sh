#!/bin/bash

# Script to check current database schema
# Usage: ./check-schema.sh

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="shooting_club"
DB_USER="dbuser"
DB_PASS="dbpassword"

echo "🔍 Checking Database Schema..."
echo "================================"
echo ""

echo "📊 Users table structure:"
echo "-------------------------"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
"

echo ""
echo "👥 Current users:"
echo "-----------------"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    id, 
    username, 
    email, 
    CASE 
        WHEN is_admin IS NOT NULL THEN is_admin::text 
        ELSE 'column missing'
    END as is_admin,
    CASE 
        WHEN is_linked IS NOT NULL THEN is_linked::text 
        ELSE 'column missing'
    END as is_linked,
    CASE 
        WHEN shooter_id IS NOT NULL THEN shooter_id 
        ELSE 'column missing'
    END as shooter_id
FROM users;
" 2>&1

echo ""
echo "✅ Done!"

