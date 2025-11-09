# Quick Start Guide

## Step 1: Install Docker Desktop

**Option A: Using Homebrew (Recommended)**
```bash
brew install --cask docker
```

**Option B: Manual Download**
1. Visit https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Mac
3. Install the .dmg file
4. Open Docker Desktop from Applications

**After installation:**
- Open Docker Desktop (you'll see a whale icon in the menu bar)
- Wait until it says "Docker Desktop is running"

## Step 2: Start Services

Once Docker is running, execute:

```bash
cd backend
./start_services.sh
```

This will automatically:
- ✅ Check if Docker is installed and running
- ✅ Start PostgreSQL and Redis containers
- ✅ Wait for services to be ready
- ✅ Verify everything is working

## Step 3: Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

## Step 4: Start Frontend

In a new terminal:

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend will be available at: http://localhost:5173

## Troubleshooting

**Docker not starting?**
- Make sure Docker Desktop is open
- Check if you have enough disk space
- Try restarting Docker Desktop

**Services not connecting?**
- Check if containers are running: `docker compose ps`
- View logs: `docker compose logs`
- Restart services: `docker compose restart`

**Port already in use?**
- Stop other services using ports 5432 or 6379
- Or change ports in `docker-compose.yml`

