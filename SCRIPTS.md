# 🎮 Project Management Scripts

Quick reference for all project management scripts.

---

## 🚀 First-Time Setup

### `./install.sh`

**Purpose:** Install all dependencies and set up the project for the first time.

**What it does:**
- ✅ Checks prerequisites (Node.js, Python, npm, pip)
- ✅ Creates `.env` file from template
- ✅ Installs blockchain dependencies (npm)
- ✅ Creates Python virtual environment
- ✅ Installs backend dependencies (pip)
- ✅ Installs frontend dependencies (npm)
- ✅ Compiles smart contracts
- ✅ Runs contract tests
- ✅ Provides MetaMask setup instructions

**Usage:**
```bash
./install.sh
```

**First-Time Checklist:**
1. ✅ Install Node.js 18+ (https://nodejs.org/)
2. ✅ Install Python 3.10+ (https://python.org/)
3. ✅ Install MetaMask (https://metamask.io/)
4. ✅ Run `./install.sh`
5. ✅ Edit `.env` with your credentials
6. ✅ Deploy contracts: `cd blockchain && npm run deploy:mumbai`

---

## ▶️ Start Services

### `./start.sh`

**Purpose:** Start all services (backend + frontend).

**What it does:**
- ✅ Stops any existing services
- ✅ Starts FastAPI backend on port 8000
- ✅ Starts Vite frontend on port 3000
- ✅ Runs services in background
- ✅ Creates log files
- ✅ Saves PID files for easy stopping

**Usage:**
```bash
# Start all services
./start.sh

# Start only backend
./start.sh --backend-only

# Start only frontend
./start.sh --frontend-only

# Check status
./start.sh --check

# Help
./start.sh --help
```

**After starting:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Backend logs: `tail -f logs/backend.log`
- Frontend logs: `tail -f logs/frontend.log`

---

## ⏹️ Stop Services

### `./stop.sh`

**Purpose:** Stop all running services.

**What it does:**
- ✅ Stops backend server
- ✅ Stops frontend server
- ✅ Cleans up PID files
- ✅ Kills any stray processes on ports 8000 & 3000
- ✅ Graceful shutdown with force-kill fallback

**Usage:**
```bash
./stop.sh
```

---

## 🔄 Restart Services

### `./restart.sh`

**Purpose:** Stop and restart all services.

**What it does:**
- ✅ Runs `./stop.sh`
- ✅ Waits 2 seconds
- ✅ Runs `./start.sh`

**Usage:**
```bash
# Restart all services
./restart.sh

# Restart only backend
./restart.sh --backend-only

# Restart only frontend
./restart.sh --frontend-only
```

**When to restart:**
- After editing backend code
- After installing new dependencies
- After changing environment variables
- When services are acting weird

---

## 📊 Check Status

### `./status.sh`

**Purpose:** Check the status of all services.

**What it does:**
- ✅ Shows backend status (running/stopped)
- ✅ Shows frontend status (running/stopped)
- ✅ Checks port availability (8000, 3000)
- ✅ Verifies environment setup
- ✅ Shows PID information
- ✅ Displays useful URLs

**Usage:**
```bash
./status.sh
```

**Example output:**
```
━━━ Backend Status ━━━
✓ Running (PID: 12345)
  URL: http://localhost:8000
  API Docs: http://localhost:8000/docs
  ✓ Port 8000 is listening

━━━ Frontend Status ━━━
✓ Running (PID: 12346)
  URL: http://localhost:3000
  ✓ Port 3000 is listening
```

---

## 📋 Complete Workflow

### First Time Setup (Once)
```bash
# 1. Clone repository
git clone <repo-url>
cd freelance-escrow-platform

# 2. Run installation
./install.sh

# 3. Edit environment variables
nano .env

# 4. Deploy smart contracts
cd blockchain
npm run deploy:mumbai
cd ..

# 5. Start services
./start.sh
```

### Daily Development
```bash
# Morning: Start services
./start.sh

# Check if everything is running
./status.sh

# View logs (separate terminals)
tail -f logs/backend.log
tail -f logs/frontend.log

# After code changes: Restart
./restart.sh

# Evening: Stop services
./stop.sh
```

### Troubleshooting
```bash
# Check what's running
./status.sh

# Force stop everything
./stop.sh

# Clean start
./restart.sh

# If ports are stuck, find and kill processes
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

---

## 🗂️ Files Created by Scripts

### PID Files (process tracking)
- `.backend.pid` - Backend process ID
- `.frontend.pid` - Frontend process ID

### Log Files
- `logs/backend.log` - Backend server logs
- `logs/frontend.log` - Frontend server logs

### Environment Files
- `.env` - Your credentials (created from .env.example)

**Note:** All these files are gitignored automatically!

---

## ⚙️ Script Options

### Start Script Options
```bash
./start.sh                # Start all services
./start.sh --backend-only # Only backend
./start.sh --frontend-only # Only frontend
./start.sh --check        # Check status
./start.sh --help         # Show help
```

### Restart Script Options
```bash
./restart.sh              # Restart all
./restart.sh --backend-only # Only backend
./restart.sh --frontend-only # Only frontend
```

---

## 🐛 Common Issues

### Port Already in Use
```bash
# Check what's using the port
lsof -ti:8000  # Backend
lsof -ti:3000  # Frontend

# Kill the process
kill $(lsof -ti:8000)
kill $(lsof -ti:3000)

# Or use stop script
./stop.sh
```

### Services Won't Start
```bash
# Check logs
tail -f logs/backend.log
tail -f logs/frontend.log

# Verify dependencies
./status.sh

# Reinstall if needed
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd frontend && npm install
```

### Virtual Environment Issues
```bash
# Backend virtual environment
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Node Modules Issues
```bash
# Frontend dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..

# Blockchain dependencies
cd blockchain
rm -rf node_modules package-lock.json
npm install
cd ..
```

---

## 📝 Manual Commands (Alternative)

If scripts don't work, you can run manually:

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

### Blockchain
```bash
cd blockchain
npm run compile
npm test
npm run deploy:mumbai
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| First-time setup | `./install.sh` |
| Start everything | `./start.sh` |
| Stop everything | `./stop.sh` |
| Restart everything | `./restart.sh` |
| Check status | `./status.sh` |
| View backend logs | `tail -f logs/backend.log` |
| View frontend logs | `tail -f logs/frontend.log` |
| Deploy contracts | `cd blockchain && npm run deploy:mumbai` |

---

## 💡 Tips

1. **Always check status first:** `./status.sh`
2. **Keep logs open:** `tail -f logs/*.log` in separate terminal
3. **Restart after changes:** `./restart.sh` is faster than stop + start
4. **Use backend-only mode:** When working on contracts/backend
5. **Use frontend-only mode:** When working on UI

---

## 🚀 Ready to Develop!

```bash
# One command to get started
./start.sh

# Open in browser
# Frontend: http://localhost:3000
# Backend Docs: http://localhost:8000/docs
```

**Happy coding! 🎉**
