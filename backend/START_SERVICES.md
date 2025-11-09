# Starting Services Locally

## Quick Start

If you have Docker installed:
```bash
cd backend
docker compose up -d
```

## Manual Setup

### PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb deskryptow
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb deskryptow
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install and create database `deskryptow`

### Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
- Download from https://redis.io/download
- Or use WSL2

## Verify Services

```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Check Redis
redis-cli ping
# Should return: PONG
```

## Start Backend

```bash
cd backend
source venv/bin/activate  # or: venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

