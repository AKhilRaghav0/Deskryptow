#!/bin/bash

################################################################################
# 🔄 RESTART SCRIPT
# Freelance Escrow Platform - Restart all services
################################################################################

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🔄 Restarting Freelance Escrow Platform 🔄               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Stop services
echo -e "${BLUE}Stopping services...${NC}"
./stop.sh

echo ""
echo -e "${BLUE}Waiting 2 seconds...${NC}"
sleep 2
echo ""

# Start services
echo -e "${BLUE}Starting services...${NC}"
./start.sh "$@"

exit 0
