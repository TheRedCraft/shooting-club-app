#!/bin/bash

# Script to test user registration via API
# Usage: ./test-register.sh

echo "🧪 Testing User Registration"
echo "============================"
echo ""

read -p "Username [testuser]: " USERNAME
USERNAME=${USERNAME:-testuser}

read -p "Email [test@example.com]: " EMAIL
EMAIL=${EMAIL:-test@example.com}

read -s -p "Password [test123]: " PASSWORD
echo ""
PASSWORD=${PASSWORD:-test123}

echo ""
echo "📤 Sending registration request..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "📥 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Registration test complete!"
echo ""
echo "🔍 Check database:"
echo "   psql -h localhost -U dbuser -d shooting_club"
echo "   SELECT id, username, email, is_admin, is_linked FROM users;"

