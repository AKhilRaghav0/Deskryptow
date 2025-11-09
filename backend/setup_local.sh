#!/bin/bash

# Local Development Setup Script for Deskryptow Backend

set -e

echo "🚀 Setting up Deskryptow Backend for local development..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python found: $(python3 --version)${NC}"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip3 is not installed. Please install pip.${NC}"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}🔌 Activating virtual environment...${NC}"
source venv/bin/activate

# Upgrade pip
echo -e "${YELLOW}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip

# Install dependencies
echo -e "${YELLOW}📥 Installing Python dependencies...${NC}"
pip install -r requirements.txt

# Check if Docker is installed (for PostgreSQL and Redis)
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker found${NC}"
    echo -e "${YELLOW}🐳 Starting PostgreSQL and Redis with Docker...${NC}"
    
    # Start Docker containers
    docker-compose up -d
    
    echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
    sleep 5
    
    # Wait for PostgreSQL
    until docker exec deskryptow-postgres pg_isready -U postgres > /dev/null 2>&1; do
        echo -e "${YELLOW}   Waiting for PostgreSQL...${NC}"
        sleep 2
    done
    
    # Wait for Redis
    until docker exec deskryptow-redis redis-cli ping > /dev/null 2>&1; do
        echo -e "${YELLOW}   Waiting for Redis...${NC}"
        sleep 2
    done
    
    echo -e "${GREEN}✅ Databases are ready!${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found. Please install Docker and Docker Compose, or set up PostgreSQL and Redis manually.${NC}"
    echo -e "${YELLOW}   PostgreSQL should be running on localhost:5432${NC}"
    echo -e "${YELLOW}   Redis should be running on localhost:6379${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << EOF
# Environment
ENVIRONMENT=development
DEBUG=True

# API
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=deskryptow

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Blockchain
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_ID=80002
CHAIN_NAME=Polygon Amoy
BLOCK_EXPLORER=https://amoy.polygonscan.com
ESCROW_CONTRACT_ADDRESS=

# Security
JWT_SECRET_KEY=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
if command -v alembic &> /dev/null || [ -f "venv/bin/alembic" ]; then
    alembic upgrade head || echo -e "${YELLOW}⚠️  Alembic not configured yet. Tables will be created on first run.${NC}"
else
    echo -e "${YELLOW}⚠️  Alembic not found. Database tables will be created automatically on first run.${NC}"
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}📋 Next steps:${NC}"
echo -e "   1. Make sure PostgreSQL and Redis are running"
echo -e "   2. Activate virtual environment: ${YELLOW}source venv/bin/activate${NC}"
echo -e "   3. Run the backend: ${YELLOW}uvicorn app.main:app --reload${NC}"
echo -e "   4. API will be available at: ${YELLOW}http://localhost:8000${NC}"
echo -e "   5. API docs at: ${YELLOW}http://localhost:8000/docs${NC}"
echo ""

