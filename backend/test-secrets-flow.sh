#!/bin/bash

BASE_URL="http://localhost:3000/api/v1"
COOKIES_FILE="test-cookies.txt"

echo "=== Secrets Management End-to-End Test ==="
echo ""

# Step 1: Signup
echo "1. Creating test user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "secretuser",
    "email": "secretuser@example.com",
    "password": "Secret123!@#"
  }')
echo "Signup: $SIGNUP_RESPONSE"
echo ""

# Step 2: Login
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -c "$COOKIES_FILE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "secretuser",
    "password": "Secret123!@#"
  }')
echo "Login: $LOGIN_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 3: Create Secret
echo "3. Creating encrypted secret..."
CREATE_SECRET_RESPONSE=$(curl -s -X POST "$BASE_URL/secrets" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Database Password",
    "plaintext": "SuperSecretPassword123!"
  }')
echo "Create Secret: $CREATE_SECRET_RESPONSE"

# Extract secret ID
SECRET_ID=$(echo "$CREATE_SECRET_RESPONSE" | grep -o '"secretId":"[^"]*' | sed 's/"secretId":"//')
echo "Secret ID: $SECRET_ID"
echo ""

# Step 4: List Secrets
echo "4. Listing secrets (metadata only)..."
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/secrets" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "List Secrets: $LIST_RESPONSE"
echo ""

# Step 5: Get Secret Metadata
echo "5. Getting secret metadata..."
METADATA_RESPONSE=$(curl -s -X GET "$BASE_URL/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Metadata: $METADATA_RESPONSE"
echo ""

# Step 6: Reveal Secret
echo "6. Revealing secret (decrypting)..."
REVEAL_RESPONSE=$(curl -s -X POST "$BASE_URL/secrets/$SECRET_ID/reveal" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Revealed: $REVEAL_RESPONSE"
echo ""

# Step 7: Update Secret
echo "7. Updating secret..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Updated Database Password",
    "plaintext": "NewSuperSecretPassword456!"
  }')
echo "Update: $UPDATE_RESPONSE"
echo ""

# Step 8: Reveal Updated Secret
echo "8. Revealing updated secret..."
REVEAL_UPDATED_RESPONSE=$(curl -s -X POST "$BASE_URL/secrets/$SECRET_ID/reveal" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Revealed Updated: $REVEAL_UPDATED_RESPONSE"
echo ""

# Step 9: Search Secrets
echo "9. Searching secrets..."
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/secrets/search?q=Database" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Search Results: $SEARCH_RESPONSE"
echo ""

# Step 10: Delete Secret
echo "10. Deleting secret..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Delete: $DELETE_RESPONSE"
echo ""

# Step 11: Verify Deletion
echo "11. Verifying secret is deleted..."
VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/secrets/$SECRET_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Verify: $VERIFY_RESPONSE"
echo ""

# Cleanup
rm -f "$COOKIES_FILE"

echo "=== Test Complete ==="