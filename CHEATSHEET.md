# 🎯 Quick Command Cheatsheet

## First Time (Run Once)

```bash
./install.sh          # Install everything
nano .env             # Add your credentials
cd blockchain && npm run deploy:mumbai  # Deploy contracts
```

## Daily Development

```bash
./start.sh            # ▶️  Start services
./status.sh           # 📊 Check status
./stop.sh             # ⏹️  Stop services
./restart.sh          # 🔄 Restart services
```

## Logs

```bash
tail -f logs/backend.log   # Backend logs
tail -f logs/frontend.log  # Frontend logs
```

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Ports

- 3000 - Frontend (Vite)
- 8000 - Backend (FastAPI)

## Help

```bash
./start.sh --help     # Show start options
./install.sh --help   # Show install help
```

---

**That's it! Simple & fast! 🚀**
