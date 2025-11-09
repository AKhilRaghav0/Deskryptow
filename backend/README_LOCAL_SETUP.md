# Local Development Setup Guide

This guide will help you set up the Deskryptow backend for local development.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- PostgreSQL 12+ (or use Docker)
- Redis 6+ (or use Docker)
- Docker and Docker Compose (optional, but recommended)

## Quick Setup (Automated)

Run the setup script:

```bash
cd backend
chmod +x setup_local.sh
./setup_local.sh
```

This script will:
- Create a Python virtual environment
- Install all dependencies
- Start PostgreSQL and Redis using Docker (if Docker is installed)
- Create a `.env` file with default configuration
- Set up the database

## Manual Setup

### 1. Install Python Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Up PostgreSQL

**Option A: Using Docker (Recommended)**

```bash
docker-compose up -d
```

**Option B: Install PostgreSQL Locally**

- Install PostgreSQL from https://www.postgresql.org/download/
- Create a database:
  ```bash
  createdb deskryptow
  ```

### 3. Set Up Redis

**Option A: Using Docker**

```bash
docker-compose up -d redis
```

**Option B: Install Redis Locally**

- macOS: `brew install redis` then `brew services start redis`
- Linux: `sudo apt-get install redis-server` then `sudo systemctl start redis`
- Windows: Download from https://redis.io/download

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
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

# Blockchain - Polygon Amoy Testnet
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_ID=80002
CHAIN_NAME=Polygon Amoy
BLOCK_EXPLORER=https://amoy.polygonscan.com
ESCROW_CONTRACT_ADDRESS=

# Security
JWT_SECRET_KEY=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 5. Initialize Database

The database tables will be created automatically on first run. Alternatively, you can use Alembic:

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Run the Backend

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run the server
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Verify Setup

1. **Check PostgreSQL:**
   ```bash
   psql -U postgres -d deskryptow -c "SELECT version();"
   ```

2. **Check Redis:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Check API Health:**
   ```bash
   curl http://localhost:8000/health
   ```

## Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Troubleshooting

### PostgreSQL Connection Error

- Make sure PostgreSQL is running: `pg_isready` or `docker ps`
- Check credentials in `.env` file
- Verify port 5432 is not blocked

### Redis Connection Error

- Make sure Redis is running: `redis-cli ping` or `docker ps`
- Check Redis is listening on port 6379
- Try: `redis-cli -h localhost -p 6379 ping`

### Port Already in Use

- Change `API_PORT` in `.env` file
- Or stop the service using the port

### Database Migration Issues

- Drop and recreate database: `dropdb deskryptow && createdb deskryptow`
- Or reset with Docker: `docker-compose down -v && docker-compose up -d`

## Development Workflow

1. Make code changes
2. The server will auto-reload (if using `--reload` flag)
3. Check API docs at http://localhost:8000/docs
4. Test endpoints using the interactive docs

## Next Steps

- Set up the frontend (see frontend README)
- Configure blockchain contract address
- Set up IPFS for file storage (optional)
- Configure production secrets

