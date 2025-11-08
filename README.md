# 🚀 Decentralized Freelance Escrow Platform

> Upwork meets Web3 - Trustless payments via smart contracts

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Polygon](https://img.shields.io/badge/Polygon-Mumbai-purple.svg)](https://mumbai.polygonscan.com)
[![GCP](https://img.shields.io/badge/GCP-Cloud%20Run-red.svg)](https://cloud.google.com)

## 🎯 Quick Start

### First Time Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd freelance-escrow-platform

# Run automated setup
./install.sh

# Edit environment variables
nano .env

# Deploy smart contracts
cd blockchain && npm run deploy:mumbai
```

### Daily Usage
```bash
# Start all services
./start.sh

# Check status
./status.sh

# Stop services
./stop.sh
```

### Manual Setup
See detailed instructions in [SETUP.md](./SETUP.md)

## 📚 Documentation

- **[PROJECT_PLAN.md](./PROJECT_PLAN.md)** - Complete project documentation
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Getting started overview
- **[SCRIPTS.md](./SCRIPTS.md)** - Project management scripts guide
- **[STRUCTURE.md](./STRUCTURE.md)** - Project structure
- **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** - GitHub repository setup

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Python FastAPI
- **Blockchain:** Solidity + Polygon Mumbai
- **Cloud:** Google Cloud Platform
- **Web3:** Ethers.js + MetaMask

## 🏗️ Project Structure

```
freelance-escrow-platform/
├── blockchain/          # Smart contracts (Solidity + Hardhat)
├── backend/            # FastAPI backend (Python)
├── frontend/           # React frontend (TypeScript)
├── docs/               # Documentation
├── install.sh          # 🆕 First-time setup script
├── start.sh            # 🆕 Start all services
├── stop.sh             # 🆕 Stop all services
├── restart.sh          # 🆕 Restart services
└── status.sh           # 🆕 Check service status
```

## ⚡ Management Scripts

We provide convenient scripts for project management:

| Script | Purpose |
|--------|---------|
| `./install.sh` | First-time setup - installs all dependencies |
| `./start.sh` | Start backend + frontend servers |
| `./stop.sh` | Stop all running services |
| `./restart.sh` | Restart all services |
| `./status.sh` | Check status of all services |

See [SCRIPTS.md](./SCRIPTS.md) for detailed documentation.

## 🤝 Contributing

This is a hackathon project. Team members, see PROJECT_PLAN.md for role assignments.

## 📄 License

MIT License - see LICENSE file

## 🏆 Hackathon

Built for [Hackathon Name] - November 2025
