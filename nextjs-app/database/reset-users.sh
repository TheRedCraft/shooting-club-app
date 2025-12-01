#!/bin/bash

# Script to reset all users and create a default admin
# Usage: ./reset-users.sh

set -e

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="shooting_club"
DB_USER="dbuser"
DB_PASS="dbpassword"

echo "🗑️  Shooting Club - Reset Users"
echo "================================"
echo ""
echo "⚠️  WARNING: This will delete ALL users!"
echo ""
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Aborted."
    exit 1
fi

echo ""
echo "🗑️  Step 1: Deleting all users..."

PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Delete all users
DELETE FROM users;

-- Reset the sequence
ALTER SEQUENCE users_id_seq RESTART WITH 1;
EOF

echo "✅ All users deleted!"
echo ""

echo "👤 Step 2: Creating default admin user..."
echo ""
read -p "Admin username [admin]: " ADMIN_USERNAME
ADMIN_USERNAME=${ADMIN_USERNAME:-admin}

read -p "Admin email [admin@shooting-club.local]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@shooting-club.local}

read -s -p "Admin password [admin123]: " ADMIN_PASSWORD
echo ""
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}

echo ""
echo "Creating admin user..."

# We need to hash the password with bcrypt
# For now, we'll use Node.js to hash it
cd /home/raspap/shooting-club-app/nextjs-app

HASHED_PASSWORD=$(node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => console.log(hash));
")

# Insert admin user
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    is_admin, 
    is_linked, 
    created_at, 
    updated_at
) VALUES (
    '$ADMIN_USERNAME',
    '$ADMIN_EMAIL',
    '$HASHED_PASSWORD',
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
EOF

echo ""
echo "✅ Admin user created successfully!"
echo ""
echo "📋 Admin Credentials:"
echo "   Username: $ADMIN_USERNAME"
echo "   Email:    $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "🎉 Done! You can now login at:"
echo "   http://localhost:3000/login"
echo ""

