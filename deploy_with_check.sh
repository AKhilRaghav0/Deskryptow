#!/bin/bash

export DEPLOYER_PRIVATE_KEY=0x71e3832790005f7064b22ec368431243f445c196a98343fc111d5c115ac24d35
export HARDHAT_TELEMETRY_DISABLED=1

echo "🚀 Contract Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd blockchain

echo "📊 Checking account balance..."
if ! npx hardhat run scripts/checkBalance.js --network amoy; then
  echo ""
  echo "⚠️  Please get more MATIC from the faucet first!"
  exit 1
fi

echo ""
echo "⏳ Deploying contract..."
npx hardhat run scripts/deploy.js --network amoy
