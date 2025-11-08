# Deskryptow

> **Decentralized Freelance Escrow Platform** - Upwork meets Web3

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-purple.svg)](https://amoy.polygonscan.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

---

## Problem Statement

Traditional freelance platforms like Upwork and Fiverr face several critical issues:

- **High Platform Fees:** Platforms charge 15-20% commission on every transaction, significantly reducing freelancer earnings
- **Trust Issues:** 
  - Clients risk paying for substandard work with no guarantee of quality
  - Freelancers risk not getting paid after completing work
- **Payment Delays:** Traditional platforms hold payments for 14+ days, causing cash flow problems for freelancers
- **Geographic Barriers:** 
  - Requires bank accounts and traditional payment methods
  - Payment processing unavailable or unreliable in many countries
  - High transaction fees for international transfers
- **Biased Dispute Resolution:** 
  - Disputes are often resolved in favor of the platform
  - Lack of transparency in the resolution process
  - Limited recourse for users

These issues create barriers for both clients and freelancers, limiting the growth of the global freelance economy.

---

## Our Solution

**Deskryptow** is a blockchain-based freelance marketplace that solves these problems through decentralization and smart contracts:

### Key Features

- **🔒 Smart Contract Escrow:** Funds are held securely in smart contracts, automatically released upon work approval
- **💰 Low Fees:** Only 2% platform fee (vs 20% on traditional platforms) - 90% reduction in fees
- **⚡ Instant Payments:** Freelancers get paid immediately upon client approval, no waiting periods
- **🌍 Global Access:** 
  - No bank account required - works with MetaMask wallet
  - Accessible from anywhere in the world
  - Cryptocurrency payments eliminate geographic barriers
- **🤝 Trustless System:** 
  - Smart contracts enforce agreements automatically
  - No need to trust intermediaries
  - Transparent and immutable transaction history
- **💬 Real-time Communication:** Built-in chat system for seamless client-freelancer communication
- **🔍 Advanced Search:** Redis-powered search with real-time indexing for jobs, tags, and keywords
- **📱 Modern UI/UX:** Beautiful, responsive interface with smooth animations and intuitive design

### How It Works

1. **Client posts a job** with budget and requirements
2. **Funds are locked in escrow** via smart contract
3. **Freelancers submit proposals** with timeline and portfolio
4. **Client accepts a freelancer** and work begins
5. **Freelancer submits deliverables** for review
6. **Client approves work** → Payment automatically released to freelancer
7. **Dispute resolution** available if needed (community-based voting)

---

## Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** TailwindCSS 4.x
- **Build Tool:** Vite
- **Web3 Integration:** Ethers.js v6
- **Routing:** React Router v6
- **State Management:** React Context API + Zustand
- **UI Components:** Headless UI + Heroicons
- **Animations:** Lenis (smooth scrolling), Three.js (background effects)
- **Markdown:** react-markdown with remark-gfm
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

### Backend
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL 15
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Cache/Search:** Redis 7
- **Authentication:** JWT (JSON Web Tokens)
- **Web3:** Web3.py
- **File Upload:** Python Multipart
- **Image Processing:** Pillow

### Blockchain
- **Network:** Polygon Amoy Testnet
- **Language:** Solidity
- **Development:** Hardhat
- **Testing:** Hardhat Test Suite
- **Wallet Integration:** MetaMask

### Infrastructure
- **Database:** PostgreSQL (Docker)
- **Cache:** Redis (Docker)
- **File Storage:** Local filesystem (chat attachments)
- **Network:** Exposed on local network (0.0.0.0)

---

## Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Docker** and Docker Compose (for PostgreSQL and Redis)
- **MetaMask** browser extension
- **Git**

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Deskryptow
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d

# Wait for services to be ready (about 10 seconds)
sleep 10

# Run database migrations
alembic upgrade head

# Create .env file (copy from example if available)
# Required environment variables:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deskryptow
# REDIS_URL=redis://localhost:6379
# SECRET_KEY=your-secret-key-here
# BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
# CONTRACT_ADDRESS=your-contract-address

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:
- **Local:** http://localhost:8000
- **Network:** http://<your-ip>:8000
- **API Docs:** http://localhost:8000/docs

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file if needed
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

The frontend will be available at:
- **Local:** http://localhost:3000
- **Network:** http://<your-ip>:3000

#### 4. Blockchain Setup

```bash
# Navigate to blockchain directory
cd blockchain

# Install dependencies
npm install

# Configure Hardhat (edit hardhat.config.js with your network settings)

# Deploy smart contracts to Polygon Amoy
npm run deploy:amoy

# Note: Make sure you have testnet MATIC in your wallet
# Get free testnet tokens from: https://faucet.polygon.technology/
```

#### 5. MetaMask Configuration

1. Install MetaMask browser extension
2. Add Polygon Amoy Testnet:
   - **Network Name:** Polygon Amoy
   - **RPC URL:** https://rpc-amoy.polygon.technology
   - **Chain ID:** 80002
   - **Currency Symbol:** MATIC
   - **Block Explorer:** https://amoy.polygonscan.com
3. Get testnet MATIC from faucet: https://faucet.polygon.technology/

### Quick Start Scripts

If you have the setup scripts available:

```bash
# First-time setup (installs all dependencies)
./install.sh

# Start all services
./start.sh

# Check service status
./status.sh

# Stop all services
./stop.sh
```

### Verification

1. **Backend:** Visit http://localhost:8000/docs - you should see the API documentation
2. **Frontend:** Visit http://localhost:3000 - you should see the homepage
3. **Database:** Check if PostgreSQL is running: `docker ps | grep postgres`
4. **Redis:** Check if Redis is running: `docker ps | grep redis`

### Troubleshooting

- **Backend won't start:** Check if PostgreSQL and Redis are running (`docker ps`)
- **Database connection error:** Ensure Docker containers are up: `docker-compose up -d`
- **Frontend can't connect to backend:** Check CORS settings and API URL in `frontend/src/config.ts`
- **MetaMask connection issues:** Ensure you're on Polygon Amoy testnet and have testnet MATIC

---

## Project Structure

```
Deskryptow/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/v1/      # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── database.py   # Database models
│   │   └── main.py       # FastAPI app
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   └── config.ts     # Configuration
│   └── package.json
├── blockchain/           # Smart contracts
│   ├── contracts/        # Solidity contracts
│   ├── scripts/          # Deployment scripts
│   └── hardhat.config.js
└── README.md
```

---

## Features

- ✅ **Wallet Connection:** MetaMask integration with Polygon Amoy
- ✅ **Job Posting:** Create jobs with markdown descriptions, tags, and budgets
- ✅ **Job Browsing:** Search and filter jobs with real-time results
- ✅ **Proposals:** Submit proposals with cover letters and timelines
- ✅ **Chat System:** Real-time messaging with file/image sharing
- ✅ **Notifications:** Real-time notifications for proposals and job updates
- ✅ **User Profiles:** Customizable profiles with portfolio links
- ✅ **Saved Jobs:** Save favorite jobs for later
- ✅ **Dashboard:** Track active jobs, completed work, and proposals
- ✅ **Smart Contract Integration:** Escrow and payment automation

---

## License

MIT License - see [LICENSE](./LICENSE) file for details

---

## Contributing

This is an active development project. Contributions are welcome!

---

**Built with ❤️ using Web3 technology**
