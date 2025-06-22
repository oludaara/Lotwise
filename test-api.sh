#!/bin/bash

# 🧪 Lotwise API Quick Test Script
# Tests all major endpoints to verify API functionality

echo "🚀 Testing Lotwise API Endpoints..."
echo "=================================="

BASE_URL="http://localhost:3001"
USER_ADDRESS="0x1234567890abcdef1234567890abcdef12345678"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4

    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ PASS${NC} ($response)"
    else
        echo -e "${RED}❌ FAIL${NC} ($response)"
    fi
}

echo "📊 Core Endpoints:"
test_endpoint "GET" "/health" "Health Check"
test_endpoint "GET" "/api/properties" "Properties List"
test_endpoint "GET" "/api/properties/PROP-001" "Property Details"
test_endpoint "GET" "/api/users/$USER_ADDRESS" "User Profile"
test_endpoint "GET" "/api/users/$USER_ADDRESS/portfolio" "User Portfolio"

echo ""
echo "🏦 Aave Integration:"
test_endpoint "GET" "/api/aave/position/$USER_ADDRESS" "Aave Position"

echo ""
echo "💰 Yield & Marketplace:"
test_endpoint "GET" "/api/yield/PROP-001" "Property Yield"
test_endpoint "GET" "/api/yield/PROP-001/$USER_ADDRESS" "User Claimable Yield"
test_endpoint "GET" "/api/marketplace" "Marketplace Listings"

echo ""
echo "🌐 Cross-Chain & Analytics:"
test_endpoint "GET" "/api/crosschain/supported" "Supported Networks"
test_endpoint "GET" "/api/analytics/platform" "Platform Analytics"
test_endpoint "GET" "/api/prices/current" "Current Prices"

echo ""
echo "🧪 Testing with actual API responses:"
echo "======================================"

echo -e "${YELLOW}Health Status:${NC}"
curl -s "$BASE_URL/health" | jq .

echo ""
echo -e "${YELLOW}Total Properties:${NC}"
curl -s "$BASE_URL/api/properties" | jq '.total'

echo ""
echo -e "${YELLOW}Property PROP-001 Value:${NC}"
curl -s "$BASE_URL/api/properties/PROP-001" | jq '.totalValue'

echo ""
echo -e "${YELLOW}Current ETH Price:${NC}"
curl -s "$BASE_URL/api/prices/current" | jq '.ETH.usd'

echo ""
echo "✨ API Testing Complete! Use Postman for detailed testing."
