#!/bin/bash

# Setup script for contract deployment using Mac address
# Address: 0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF

echo "🚀 Contract Deployment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Using Mac address as deployer: 0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF"
echo ""
echo "📝 To deploy the contract, you need:"
echo "1. Get your Mac wallet's private key from MetaMask"
echo "   MetaMask → Account → Account Details → Export Private Key"
echo ""
echo "2. Set the private key:"
echo "   export DEPLOYER_PRIVATE_KEY=0x...your_private_key_here"
echo ""
echo "3. Run the deployment:"
echo "   ./deploy_contract.sh"
echo ""
echo "⚠️  IMPORTANT: Only use a test account with test MATIC!"
echo "   Never use your main account private key!"
echo ""
