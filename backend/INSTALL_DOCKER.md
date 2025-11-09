# Installing Docker on macOS

## Quick Install

Run this command (you'll need to enter your password when prompted):

```bash
brew install --cask docker
```

After installation:

1. **Open Docker Desktop** from Applications
2. **Wait for Docker to start** (you'll see a whale icon in the menu bar)
3. **Verify it's running:**
   ```bash
   docker ps
   ```

## Alternative: Download Directly

1. Go to https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Mac (Apple Silicon or Intel)
3. Install the .dmg file
4. Open Docker Desktop from Applications
5. Wait for it to start

## After Installation

Once Docker is running, start the services:

```bash
cd backend
docker compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

## Verify Services

```bash
# Check if containers are running
docker compose ps

# Check PostgreSQL
docker exec deskryptow-postgres pg_isready -U postgres

# Check Redis
docker exec deskryptow-redis redis-cli ping
```

