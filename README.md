# 🚀 Deskryptow

> **Decentralized Freelance Escrow Platform** - Upwork meets Web3

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-purple.svg)](https://amoy.polygonscan.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-orange.svg)](https://soliditylang.org/)

**Built for hackCBS 8.0 Hackathon** 🏆

---

## 📸 Project Screenshots

| | | |
|:---:|:---:|:---:|
| ![Screenshot 1](projectphotos/screenshot-1.png) | ![Screenshot 10](projectphotos/screenshot-10.png) | ![Screenshot 11](projectphotos/screenshot-11.png) |
| Feature 1 | Feature 10 | Feature 11 |
| ![Screenshot 12](projectphotos/screenshot-12.png) | ![Screenshot 13](projectphotos/screenshot-13.png) | ![Screenshot 14](projectphotos/screenshot-14.png) |
| Feature 12 | Feature 13 | Feature 14 |

---

## 👥 Team & Collaboration

This project is a collaborative effort by:

- **[@AKhilRaghav0](https://github.com/AKhilRaghav0)** - Co-owner & Collaborator
- **[@realpxd](https://github.com/realpxd)** - Co-owner & Collaborator

**Hackathon:** hackCBS 8.0

---

## 🎯 Our Goal

To revolutionize the freelance marketplace by eliminating intermediaries and creating a trustless, decentralized platform where:

- **Freelancers** get paid fairly and instantly (90% fee reduction)
- **Clients** have guaranteed quality with escrow protection
- **Everyone** benefits from transparent, blockchain-powered transactions
- **No geographic barriers** - work from anywhere, get paid in crypto

We aim to make freelance work more accessible, affordable, and fair for everyone, especially in regions where traditional payment systems are unreliable or unavailable.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [What We Built](#-what-we-built)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Architecture](#-architecture)
- [Setup & Installation](#-setup--installation)
- [Project Structure](#-project-structure)
- [Smart Contract](#-smart-contract)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔴 Problem Statement

Traditional freelance platforms like Upwork and Fiverr face several critical issues:

### High Platform Fees
- Platforms charge **15-20% commission** on every transaction
- Significantly reduces freelancer earnings
- Example: $1000 job → Freelancer gets only $800-850

### Trust Issues
- **Clients risk** paying for substandard work with no guarantee of quality
- **Freelancers risk** not getting paid after completing work
- No automated escrow protection

### Payment Delays
- Traditional platforms hold payments for **14+ days**
- Causes cash flow problems for freelancers
- Delayed access to earned money

### Geographic Barriers
- Requires bank accounts and traditional payment methods
- Payment processing unavailable or unreliable in many countries
- High transaction fees for international transfers
- Currency conversion issues

### Biased Dispute Resolution
- Disputes are often resolved in favor of the platform
- Lack of transparency in the resolution process
- Limited recourse for users

These issues create barriers for both clients and freelancers, limiting the growth of the global freelance economy.

---

## ✨ Our Solution

**Deskryptow** is a blockchain-based freelance marketplace that solves these problems through decentralization and smart contracts:

### Core Value Propositions

- **🔒 Smart Contract Escrow:** Funds are held securely in smart contracts, automatically released upon work approval
- **💰 Low Fees:** Only **2% platform fee** (vs 20% on traditional platforms) - **90% reduction in fees**
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

---

## 🏗️ What We Built

### Complete Full-Stack Application

#### **Frontend (React + TypeScript)**
- ✅ Modern, responsive UI with TailwindCSS
- ✅ MetaMask wallet integration
- ✅ Real-time job browsing and search
- ✅ Proposal submission and management
- ✅ Chat system with file sharing
- ✅ Notification system
- ✅ User profiles and dashboards
- ✅ Escrow dashboard for payment management
- ✅ Saved jobs functionality
- ✅ Pagination and sorting

#### **Backend (FastAPI + Python)**
- ✅ RESTful API with FastAPI
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ Redis for caching and search indexing
- ✅ Blockchain integration (Web3.py)
- ✅ IPFS integration (Pinata) for decentralized storage
- ✅ JWT authentication
- ✅ Real-time notifications
- ✅ Chat system with file uploads
- ✅ Advanced search with Redis

#### **Blockchain (Solidity + Hardhat)**
- ✅ Smart contract escrow system
- ✅ Automated payment release
- ✅ Job lifecycle management
- ✅ Dispute resolution framework
- ✅ Platform fee collection (2%)
- ✅ Deployed on Polygon Amoy Testnet

---

## 🎨 Key Features

### For Clients
- ✅ **Post Jobs:** Create detailed job listings with markdown descriptions, tags, and budgets
- ✅ **Browse Proposals:** Review freelancer proposals with cover letters and timelines
- ✅ **Accept Freelancers:** Choose the best freelancer for your project
- ✅ **Review Work:** Approve or request revisions on submitted deliverables
- ✅ **Instant Payment Release:** Approve work and payment is automatically released
- ✅ **Chat:** Real-time messaging with freelancers
- ✅ **Dashboard:** Track all your jobs, proposals, and payments

### For Freelancers
- ✅ **Browse Jobs:** Search and filter available jobs
- ✅ **Submit Proposals:** Apply with cover letters, timelines, and portfolio links
- ✅ **Accept Jobs:** Start working on accepted projects
- ✅ **Submit Work:** Upload deliverables with descriptions and files
- ✅ **Get Paid Instantly:** Receive payment immediately upon client approval
- ✅ **Chat:** Communicate with clients in real-time
- ✅ **Dashboard:** Track proposals, active jobs, and earnings

### For Escrow (Payment Managers)
- ✅ **Escrow Dashboard:** Manage all escrow payments
- ✅ **Check Status:** Verify blockchain payment status
- ✅ **Release Payments:** Release funds when both parties confirm
- ✅ **Revert Payments:** Return funds to client if needed
- ✅ **Payment History:** See when payments were released

### Platform Features
- ✅ **Wallet Connection:** Seamless MetaMask integration
- ✅ **Smart Contract Integration:** All transactions on blockchain
- ✅ **IPFS Storage:** Decentralized storage for job details and deliverables
- ✅ **Real-time Notifications:** Get notified about proposals, job updates, and messages
- ✅ **Advanced Search:** Redis-powered search with real-time indexing
- ✅ **Saved Jobs:** Save favorite jobs for later
- ✅ **User Profiles:** Customizable profiles with portfolio links
- ✅ **Responsive Design:** Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** TailwindCSS 4.x
- **Build Tool:** Vite
- **Web3 Integration:** Ethers.js v6
- **Routing:** React Router v6
- **State Management:** React Context API
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
- **IPFS:** Pinata API
- **File Upload:** Python Multipart
- **Image Processing:** Pillow

### Blockchain
- **Network:** Polygon Amoy Testnet
- **Language:** Solidity 0.8.20
- **Development:** Hardhat
- **Testing:** Hardhat Test Suite
- **Wallet Integration:** MetaMask
- **Contract Address:** `0x5fB9f0A1b7eED0B1292a566aD9F436BF2eA02cC0`

### Infrastructure
- **Database:** PostgreSQL (Docker)
- **Cache:** Redis (Docker)
- **File Storage:** IPFS (Pinata) + Local filesystem (chat attachments)
- **Network:** Exposed on local network (0.0.0.0)

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│         (React + TypeScript + TailwindCSS)              │
│              MetaMask Wallet Integration                 │
└───────────────────┬─────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌─────────┐  ┌──────────┐  ┌──────────────┐
│ FastAPI │  │PostgreSQL│  │    Redis     │
│ Backend │  │ Database │  │  Cache/Search │
└────┬────┘  └──────────┘  └──────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│      Polygon Amoy Testnet           │
│   Smart Contract (Escrow)           │
│   Contract: 0x5fB9f0A1b7e...        │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│         IPFS (Pinata)                │
│   Decentralized File Storage         │
└─────────────────────────────────────┘
```

### Data Flow

1. **Client posts job** → Backend stores in PostgreSQL → Smart contract holds funds in escrow
2. **Freelancer submits proposal** → Stored in database → Client receives notification
3. **Client accepts proposal** → Job assigned → Smart contract updated
4. **Freelancer submits work** → Uploaded to IPFS → Smart contract status updated
5. **Both parties confirm** → Smart contract releases payment → Freelancer receives funds

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Docker** and Docker Compose (for PostgreSQL and Redis)
- **MetaMask** browser extension
- **Git**

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/AKhilRaghav0/Deskryptow.git
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

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/deskryptow
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here-change-this
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
ESCROW_CONTRACT_ADDRESS=0x5fB9f0A1b7eED0B1292a566aD9F436BF2eA02cC0
DESIGNATED_ESCROW_ADDRESS=0xac654e9fec92194800a79f4fa479c7045c107b2a
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
EOF

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

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:8000
VITE_BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
VITE_CHAIN_ID=80002
VITE_BLOCK_EXPLORER=https://amoy.polygonscan.com
EOF

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

# Deploy smart contracts to Polygon Amoy
# Make sure you have testnet MATIC in your wallet
npm run deploy:amoy

# Or use the deployment script
cd ..
export DEPLOYER_PRIVATE_KEY=your-private-key
./deploy_contract.sh
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

## 📁 Project Structure

```
Deskryptow/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/v1/      # API endpoints
│   │   │   ├── jobs.py
│   │   │   ├── proposals.py
│   │   │   ├── users.py
│   │   │   ├── chat.py
│   │   │   ├── notifications.py
│   │   │   └── search.py
│   │   ├── services/     # Business logic
│   │   │   ├── blockchain.py
│   │   │   ├── ipfs.py
│   │   │   ├── notification.py
│   │   │   └── search.py
│   │   ├── database.py   # Database models
│   │   ├── config.py     # Configuration
│   │   └── main.py       # FastAPI app
│   ├── alembic/          # Database migrations
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── FloatingDock.tsx
│   │   │   ├── SubmitWorkModal.tsx
│   │   │   ├── SubmitProposalModal.tsx
│   │   │   └── ...
│   │   ├── pages/        # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Jobs.tsx
│   │   │   ├── JobDetail.tsx
│   │   │   ├── EscrowDashboard.tsx
│   │   │   └── ...
│   │   ├── contexts/      # React contexts
│   │   │   └── WalletContext.tsx
│   │   ├── utils/        # Utility functions
│   │   │   ├── blockchain.ts
│   │   │   └── wallet.ts
│   │   └── config.ts     # Configuration
│   └── package.json
├── blockchain/           # Smart contracts
│   ├── contracts/        # Solidity contracts
│   │   └── FreelanceEscrow.sol
│   ├── scripts/          # Deployment scripts
│   │   ├── deploy.js
│   │   └── checkBalance.js
│   └── hardhat.config.js
├── deploy_contract.sh    # Contract deployment script
├── YOUR_ADDRESSES.md     # Wallet addresses
└── README.md
```

---

## 🔐 Smart Contract

### Contract Details

- **Network:** Polygon Amoy Testnet
- **Contract Address:** `0x5fB9f0A1b7eED0B1292a566aD9F436BF2eA02cC0`
- **Language:** Solidity 0.8.20
- **Platform Fee:** 2%

### Key Functions

```solidity
// Create a new job with escrow
function createJob(string memory _title, string memory _ipfsHash, uint256 _deadline) external payable

// Freelancer accepts a job
function acceptJob(uint256 _jobId) external

// Freelancer submits completed work
function submitWork(uint256 _jobId, string memory _deliverableHash) external

// Client approves work and releases payment
function approveWork(uint256 _jobId) external

// Cancel job and refund client
function cancelJob(uint256 _jobId) external
```

### Security Features

- ✅ Reentrancy protection (OpenZeppelin)
- ✅ Pausable for emergencies
- ✅ Access control modifiers
- ✅ Safe math operations
- ✅ Event logging for transparency

---

## 📚 API Documentation

### Endpoints

#### Jobs
- `GET /api/v1/jobs` - List all jobs
- `POST /api/v1/jobs` - Create a new job
- `GET /api/v1/jobs/{job_id}` - Get job details
- `POST /api/v1/jobs/blockchain/create` - Create job on blockchain
- `POST /api/v1/jobs/{job_id}/blockchain/submit` - Submit work on blockchain
- `GET /api/v1/jobs/escrow/pending` - Get escrow jobs

#### Proposals
- `POST /api/v1/proposals` - Submit a proposal
- `PUT /api/v1/proposals/{proposal_id}/accept` - Accept a proposal
- `GET /api/v1/proposals/job/{job_id}` - Get job proposals

#### Chat
- `GET /api/v1/chat/conversations` - Get conversations
- `POST /api/v1/chat/messages` - Send a message
- `GET /api/v1/chat/messages/{conversation_id}` - Get messages

#### Notifications
- `GET /api/v1/notifications` - Get notifications
- `PUT /api/v1/notifications/{notification_id}/read` - Mark as read

Full API documentation available at: http://localhost:8000/docs

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd blockchain
npm test
```

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing Workflow

1. **Client posts a job** with budget
2. **Funds are locked in escrow** via smart contract
3. **Freelancer submits proposal** with timeline
4. **Client accepts freelancer** and work begins
5. **Freelancer submits deliverables** for review
6. **Client approves work** → Payment automatically released to freelancer

---

## 🚢 Deployment

### Backend Deployment

1. Set up PostgreSQL and Redis on your server
2. Configure environment variables
3. Run migrations: `alembic upgrade head`
4. Start with: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend Deployment

1. Build: `npm run build`
2. Serve with nginx or similar
3. Configure API URL in environment variables

### Smart Contract Deployment

1. Configure Hardhat with your network settings
2. Deploy: `npm run deploy:amoy`
3. Update contract address in backend and frontend configs

---

## 🤝 Contributing

This project was built for **hackCBS 8.0 Hackathon** by:
- **[@AKhilRaghav0](https://github.com/AKhilRaghav0)**
- **[@realpxd](https://github.com/realpxd)**

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

- **Polygon** for the testnet infrastructure
- **Pinata** for IPFS storage
- **OpenZeppelin** for secure smart contract libraries
- **FastAPI** and **React** communities for amazing frameworks
- **hackCBS 8.0** for the opportunity to build and showcase this project

---

## 📞 Contact

- **GitHub:** [@AKhilRaghav0](https://github.com/AKhilRaghav0) | [@realpxd](https://github.com/realpxd)
- **Project Repository:** https://github.com/AKhilRaghav0/Deskryptow

---

**Built with ❤️ for hackCBS 8.0 Hackathon**

*Decentralizing the future of freelance work, one smart contract at a time.* 🚀
