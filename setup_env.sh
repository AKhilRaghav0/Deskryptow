#!/bin/bash
# Setup environment variables for Deskryptow

export PINATA_API_KEY=a4972ea8c1327e247c57
export PINATA_SECRET_KEY=8ad2323a3d0527ca5722dbd2412e60f8cb224bcab97525ea730676ba0c382414

# Blockchain - Polygon Amoy
export POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
export POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
export CHAIN_ID=80002

# Contract address (deployed to Polygon Amoy)
export ESCROW_CONTRACT_ADDRESS=0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF

echo "✅ Environment variables set!"
echo "   PINATA_API_KEY: ${PINATA_API_KEY:0:10}..."
echo "   PINATA_SECRET_KEY: ${PINATA_SECRET_KEY:0:10}..."

