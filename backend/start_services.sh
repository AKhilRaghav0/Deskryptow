#!/bin/bash

# Start PostgreSQL and Redis services using Docker Compose

set -e

echo "🚀 Starting Deskryptow services..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo ""
    echo "Please install Docker Desktop:"
    echo "  1. Run: brew install --cask docker"
    echo "  2. Open Docker Desktop from Applications"
    echo "  3. Wait for Docker to start (whale icon in menu bar)"
    echo "  4. Run this script again"
    echo ""
    echo "Or see INSTALL_DOCKER.md for detailed instructions"
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker is installed but not running."
    echo "Please start Docker Desktop and wait for it to be ready, then run this script again."
    exit 1
fi

echo "✅ Docker is running"

# Navigate to backend directory
cd "$(dirname "$0")"

# Start services
echo "🐳 Starting PostgreSQL and Redis..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check PostgreSQL
echo "Checking PostgreSQL..."
until docker exec deskryptow-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Check Redis
echo "Checking Redis..."
until docker exec deskryptow-redis redis-cli ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

echo ""
echo "🎉 All services are running!"
echo ""
echo "Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
echo "To stop services: docker compose down"
echo "To view logs: docker compose logs -f"

