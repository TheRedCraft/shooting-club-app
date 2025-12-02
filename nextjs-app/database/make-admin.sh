#!/bin/bash

# Script to update database schema and make a user admin
# Usage: ./make-admin.sh [email_or_username]

set -e

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="shooting_club"
DB_USER="vsgschuetzenadm"
DB_PASS="!M2%2PCpwE85xxZK"

echo "🔧 Shooting Club - Database Update & Admin Setup"
echo "================================================="
echo ""

# Step 1: Update Schema
echo "📊 Step 1: Updating database schema..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f update-schema.sql

echo "✅ Schema updated successfully!"
echo ""

# Step 2: Show all users
echo "👥 Step 2: Current users in database:"
echo "--------------------------------------"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    id, 
    username, 
    email, 
    is_admin, 
    is_linked, 
    status,
    shooter_id 
FROM users 
ORDER BY id;
"
echo ""

# Step 3: Make user admin
if [ -z "$1" ]; then
    echo "❓ Which user should be admin?"
    echo ""
    read -p "Enter email or username: " USER_INPUT
else
    USER_INPUT="$1"
fi

echo ""
echo "🔑 Step 3: Making '$USER_INPUT' an admin and approving user..."

# Try by email first, then by username
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
UPDATE users 
SET 
    is_admin = true,
    status = 'APPROVED'
WHERE email = '$USER_INPUT' OR username = '$USER_INPUT';
EOF

echo "✅ Admin rights granted and user approved!"
echo ""

# Step 4: Show admins
echo "👑 Step 4: Current admins:"
echo "-------------------------"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    id, 
    username, 
    email, 
    is_admin,
    status,
    is_linked
FROM users 
WHERE is_admin = true;
"

echo ""
echo "🎉 Done! You can now login and access the Admin Panel at:"
echo "   http://localhost:3000/admin"
echo ""

