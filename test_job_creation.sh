#!/bin/bash

# Test Job Creation Flow
# This script helps test the job creation with blockchain integration

echo "🧪 Testing Job Creation Flow"
echo "============================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "\n1. Checking backend..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Start it with: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
    exit 1
fi

# Check if frontend is running
echo -e "\n2. Checking frontend..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is NOT running${NC}"
    echo "   Start it with: cd frontend && npm run dev"
fi

# Check contract address
echo -e "\n3. Checking contract configuration..."
cd backend
source venv/bin/activate
source ../setup_env.sh > /dev/null 2>&1
export ESCROW_CONTRACT_ADDRESS=0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF

python3 << 'PYTHON'
from app.config import settings
from app.services.blockchain import blockchain_service

print(f"   Contract Address: {settings.ESCROW_CONTRACT_ADDRESS}")
if blockchain_service.w3 and blockchain_service.w3.is_connected():
    print("   ✅ Blockchain RPC: Connected")
    if blockchain_service.contract:
        print("   ✅ Contract: Loaded")
    else:
        print("   ⚠️  Contract: Not loaded (check ABI)")
else:
    print("   ❌ Blockchain RPC: Not connected")
PYTHON

echo -e "\n============================================================"
echo -e "${GREEN}✅ Ready to test!${NC}"
echo "============================================================"
echo ""
echo "📋 Test Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Connect your MetaMask wallet (Polygon Amoy testnet)"
echo "3. Navigate to 'Post Job' page"
echo "4. Fill in job details:"
echo "   - Title: Test Job"
echo "   - Description: Testing blockchain integration"
echo "   - Budget: 0.01 (or less - you have 0.1 MATIC)"
echo "   - Category: Web Development"
echo "   - Deadline: Future date"
echo "5. Click 'Post Job'"
echo "6. Sign the transaction in MetaMask"
echo "7. Wait for confirmation"
echo "8. Check the transaction on PolygonScan"
echo ""
echo "🔍 To verify:"
echo "   - Check job appears in database"
echo "   - Check transaction on https://amoy.polygonscan.com"
echo "   - Verify funds are escrowed in contract"
echo ""

