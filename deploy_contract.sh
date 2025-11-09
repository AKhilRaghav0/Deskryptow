#!/bin/bash

# Deployment script for FreelanceEscrow contract
# This script helps deploy the contract to Polygon Amoy testnet

echo "🚀 FreelanceEscrow Contract Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if DEPLOYER_PRIVATE_KEY is set
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "❌ DEPLOYER_PRIVATE_KEY not set!"
    echo ""
    echo "Please set your deployer private key:"
    echo "  export DEPLOYER_PRIVATE_KEY=0x..."
    echo ""
    echo "⚠️  IMPORTANT: Use a test account with test MATIC only!"
    echo "   Never use your main account private key!"
    echo ""
    exit 1
fi

# Check if account has MATIC
echo "📋 Checking deployer account..."
cd blockchain

# Deploy contract
echo ""
echo "⏳ Deploying contract to Polygon Amoy..."
echo ""

npx hardhat run scripts/deploy.js --network amoy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the contract address from above"
    echo "2. Set environment variables:"
    echo "   export ESCROW_CONTRACT_ADDRESS=<contract_address>"
    echo "   # For frontend, add to .env file:"
    echo "   VITE_ESCROW_CONTRACT_ADDRESS=<contract_address>"
    echo ""
    echo "3. Restart backend and frontend"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error message above."
    exit 1
fi

