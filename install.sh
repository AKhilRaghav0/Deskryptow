#!/bin/bash

################################################################################
# 🚀 FIRST-TIME SETUP SCRIPT
# Freelance Escrow Platform - Complete Installation
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🚀 Freelance Escrow Platform - First Time Setup 🚀      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

################################################################################
# STEP 1: CHECK PREREQUISITES
################################################################################

echo -e "${BLUE}[1/8] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js detected: $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm detected: $NPM_VERSION${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed!${NC}"
    echo "Please install Python 3.10+ from: https://python.org/"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ Python detected: $PYTHON_VERSION${NC}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip3 detected${NC}"

# Check MetaMask (informational)
echo -e "${YELLOW}⚠ Please ensure MetaMask browser extension is installed${NC}"
echo "   Install from: https://metamask.io/"

echo ""

################################################################################
# STEP 2: SETUP ENVIRONMENT FILES
################################################################################

echo -e "${BLUE}[2/8] Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ IMPORTANT: Edit .env file with your credentials!${NC}"
    echo "   - Add your MetaMask private key (testnet only!)"
    echo "   - Add your GCP project ID"
    echo "   - Add your wallet addresses"
else
    echo -e "${YELLOW}⚠ .env file already exists, skipping...${NC}"
fi

echo ""

################################################################################
# STEP 3: INSTALL BLOCKCHAIN DEPENDENCIES
################################################################################

echo -e "${BLUE}[3/8] Installing blockchain dependencies...${NC}"

cd blockchain
echo "Installing npm packages for smart contracts..."
npm install
echo -e "${GREEN}✓ Blockchain dependencies installed${NC}"
cd ..

echo ""

################################################################################
# STEP 4: INSTALL BACKEND DEPENDENCIES
################################################################################

echo -e "${BLUE}[4/8] Installing backend dependencies...${NC}"

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠ Virtual environment already exists${NC}"
fi

# Activate virtual environment and install packages
echo "Installing Python packages..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

cd ..

echo ""

################################################################################
# STEP 5: INSTALL FRONTEND DEPENDENCIES
################################################################################

echo -e "${BLUE}[5/8] Installing frontend dependencies...${NC}"

cd frontend
echo "Installing npm packages for React app..."
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

echo ""

################################################################################
# STEP 6: SETUP METAMASK TESTNET
################################################################################

echo -e "${BLUE}[6/8] MetaMask Setup Instructions${NC}"
echo ""
echo "Please configure MetaMask with Polygon Mumbai Testnet:"
echo ""
echo "  Network Name: Polygon Mumbai"
echo "  RPC URL: https://rpc-mumbai.maticvigil.com"
echo "  Chain ID: 80001"
echo "  Currency Symbol: MATIC"
echo "  Block Explorer: https://mumbai.polygonscan.com"
echo ""
echo "Get FREE test MATIC from:"
echo "  • https://faucet.polygon.technology/"
echo "  • https://mumbaifaucet.com/"
echo ""
read -p "Press Enter when MetaMask is configured..."

echo ""

################################################################################
# STEP 7: COMPILE SMART CONTRACTS
################################################################################

echo -e "${BLUE}[7/8] Compiling smart contracts...${NC}"

cd blockchain
echo "Compiling Solidity contracts..."
npm run compile

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Smart contracts compiled successfully${NC}"
else
    echo -e "${RED}❌ Contract compilation failed${NC}"
    echo "Please check your Hardhat configuration"
    exit 1
fi

cd ..

echo ""

################################################################################
# STEP 8: RUN TESTS
################################################################################

echo -e "${BLUE}[8/8] Running smart contract tests...${NC}"

cd blockchain
echo "Running test suite..."
npm test

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠ Some tests failed, but continuing...${NC}"
fi

cd ..

echo ""

################################################################################
# SETUP COMPLETE
################################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🎉 Setup Complete! 🎉                         ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"
echo ""
echo "📝 NEXT STEPS:"
echo ""
echo "1. Edit .env file with your credentials:"
echo "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. Get test MATIC from faucets (if you haven't already)"
echo ""
echo "3. Deploy smart contracts to Mumbai testnet:"
echo "   ${YELLOW}cd blockchain && npm run deploy:mumbai${NC}"
echo ""
echo "4. Start the project:"
echo "   ${YELLOW}./start.sh${NC}"
echo ""
echo "📚 Documentation:"
echo "   • SETUP.md - Detailed setup guide"
echo "   • QUICKSTART.md - Quick start for developers"
echo "   • PROJECT_PLAN.md - Complete project documentation"
echo ""
echo "🎬 To deploy contracts now, run:"
echo "   ${YELLOW}cd blockchain && npm run deploy:mumbai${NC}"
echo ""
echo "💡 Need help? Check the documentation or run:"
echo "   ${YELLOW}./start.sh --help${NC}"
echo ""

exit 0
