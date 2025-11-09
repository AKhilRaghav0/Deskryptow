#!/bin/bash

# Start Backend Server Script

set -e

echo "🚀 Starting Deskryptow Backend..."

cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.dependencies_installed" ]; then
    echo "📥 Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    touch venv/.dependencies_installed
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if ! docker exec deskryptow-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL container not running. Starting services..."
    docker compose up -d
    sleep 5
fi

# Check if Redis is running
echo "🔍 Checking Redis..."
if ! docker exec deskryptow-redis redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis container not running. Starting services..."
    docker compose up -d redis
    sleep 3
fi

# Initialize database tables
echo "🗄️  Initializing database..."
python3 -c "from app.database import init_db; init_db()" 2>&1 || echo "Database already initialized"

# Start the server
echo ""
echo "✅ Starting FastAPI server..."
echo "📡 API will be available at: http://localhost:8000"
echo "📚 API docs at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

