# 🚀 Setup Guide - Freelance Escrow Platform

Complete step-by-step guide to get the project running.

---

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.10+** - [Download](https://python.org/)
- **MetaMask** - [Install Extension](https://metamask.io/)
- **GCP Account** with credits - [Sign up](https://cloud.google.com/)
- **Git** - [Download](https://git-scm.com/)

---

## 🎯 Part 1: Initial Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd freelance-escrow-platform
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your values:
- `GCP_PROJECT_ID` - Your GCP project ID
- `DEPLOYER_PRIVATE_KEY` - MetaMask wallet private key (testnet only!)
- `PLATFORM_WALLET_ADDRESS` - Wallet to receive platform fees

---

## 🔗 Part 2: Blockchain Setup

### 1. Install Dependencies

```bash
cd blockchain
npm install
```

### 2. Get Test MATIC

1. Create/use a MetaMask wallet
2. Add Polygon Mumbai testnet:
   - Network Name: `Polygon Mumbai`
   - RPC URL: `https://rpc-mumbai.maticvigil.com`
   - Chain ID: `80001`
   - Currency: `MATIC`
   - Explorer: `https://mumbai.polygonscan.com`

3. Get free test MATIC from faucets:
   - https://faucet.polygon.technology/
   - https://mumbaifaucet.com/
   - (Enter your wallet address, wait 30 seconds)

### 3. Compile Contracts

```bash
npm run compile
```

Expected output: `Compiled 1 Solidity file successfully`

### 4. Run Tests

```bash
npm test
```

All tests should pass ✅

### 5. Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

**Save the contract address!** You'll need it later.

Example output:
```
✅ FreelanceEscrow deployed to: 0x1234...5678
```

### 6. Verify Contract (Optional but Recommended)

```bash
# Update .env with contract address first
npm run verify:mumbai
```

View your verified contract on:
`https://mumbai.polygonscan.com/address/<your-contract-address>`

---

## ☁️ Part 3: GCP Setup

### 1. Create GCP Project

```bash
# Install gcloud CLI if you haven't
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud projects create your-project-id
gcloud config set project your-project-id
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  firestore.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com
```

### 3. Create Firestore Database

```bash
# Go to: https://console.cloud.google.com/firestore
# Click "Create Database"
# Select "Native mode"
# Choose region (e.g., us-central1)
```

### 4. Create Cloud Storage Bucket

```bash
gsutil mb -l us-central1 gs://your-bucket-name
gsutil iam ch allUsers:objectViewer gs://your-bucket-name
```

### 5. Update .env File

```bash
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
```

---

## 🐍 Part 4: Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or use virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Setup GCP Credentials

```bash
# Download service account key from GCP Console
# IAM & Admin > Service Accounts > Create Key (JSON)

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

### 3. Update .env

Add the contract address you got from blockchain deployment:
```bash
ESCROW_CONTRACT_ADDRESS=0x1234...5678
```

### 4. Run Backend

```bash
uvicorn app.main:app --reload
```

Backend should be running at: `http://localhost:8000`

Test it: Open `http://localhost:8000/docs` for API documentation

---

## ⚛️ Part 5: Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Update .env

Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:8000
VITE_CHAIN_ID=80001
VITE_CHAIN_NAME=Polygon Mumbai
VITE_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_ESCROW_CONTRACT_ADDRESS=0x1234...5678  # Your deployed contract
VITE_BLOCK_EXPLORER=https://mumbai.polygonscan.com
```

### 3. Run Frontend

```bash
npm run dev
```

Frontend should be running at: `http://localhost:3000`

---

## 🧪 Part 6: Testing Complete Flow

### 1. Create Two Wallets in MetaMask

- **Wallet 1 (Client)**: Will post jobs
- **Wallet 2 (Freelancer)**: Will accept jobs

Get test MATIC for both wallets from faucets.

### 2. Test User Flow

**As Client (Wallet 1):**
1. Open `http://localhost:3000`
2. Click "Connect Wallet" → Connect Wallet 1
3. Click "Post Job"
4. Fill job details:
   - Title: "Design landing page"
   - Budget: 0.1 MATIC
   - Deadline: Tomorrow
5. Click "Create & Deposit"
6. Approve MetaMask transaction
7. Wait for confirmation

**As Freelancer (Wallet 2):**
1. Switch to Wallet 2 in MetaMask
2. Refresh page
3. Browse jobs → Find "Design landing page"
4. Click "Submit Proposal"
5. Write cover letter
6. Submit proposal

**Back to Client (Wallet 1):**
1. Switch to Wallet 1
2. Go to Dashboard
3. View proposals
4. Accept Freelancer's proposal
5. Approve MetaMask transaction

**As Freelancer (Wallet 2):**
1. Switch to Wallet 2
2. Go to Dashboard
3. Upload deliverable file
4. Click "Submit Work"

**Back to Client (Wallet 1):**
1. Review deliverable
2. Click "Approve & Release Payment"
3. Approve MetaMask transaction
4. Payment sent to Freelancer! ✅

### 3. Verify on Blockchain

Open: `https://mumbai.polygonscan.com/address/<contract-address>`

You should see all transactions!

---

## 🚀 Part 7: Deploy to Production

### Deploy Backend to Cloud Run

```bash
cd backend

# Build and deploy
gcloud run deploy freelance-escrow-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Note the URL: https://freelance-escrow-api-xxx.run.app
```

### Deploy Frontend to Cloud Run

```bash
cd frontend

# Update .env.local with production API URL
VITE_API_URL=https://freelance-escrow-api-xxx.run.app

# Build
npm run build

# Create Dockerfile for frontend
cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

# Deploy
gcloud run deploy freelance-escrow-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🎬 Part 8: Demo Preparation

### 1. Seed Test Data

```bash
# Run from backend directory
python scripts/seed_data.py
```

This creates:
- 5 sample jobs
- 10 sample proposals
- 2 sample disputes

### 2. Record Backup Video

Use OBS Studio or Loom to record:
1. Landing page walkthrough
2. Connect wallet
3. Post job flow
4. Accept job flow
5. Submit work flow
6. Approve & payment flow
7. Show blockchain transaction

### 3. Prepare Pitch Deck

Include slides for:
- Problem statement
- Solution overview
- Architecture diagram
- Tech stack
- Live demo
- Business model
- Team
- Q&A

---

## 🐛 Troubleshooting

### MetaMask Not Connecting

```bash
# Clear MetaMask cache:
# Settings > Advanced > Reset Account
```

### Backend CORS Error

```bash
# Update backend/app/config.py
CORS_ORIGINS = ["http://localhost:3000", "https://your-frontend-url.app"]
```

### Contract Deployment Failed

```bash
# Check you have enough test MATIC
# Check private key is correct in .env
# Try again after a few minutes
```

### Firestore Permission Denied

```bash
# Update Firestore rules in GCP Console:
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  # For hackathon only!
    }
  }
}
```

### Transaction Failing

```bash
# Check:
# 1. Contract address is correct in .env
# 2. Wallet has enough MATIC for gas
# 3. Mumbai testnet is selected in MetaMask
# 4. Transaction gas limit is sufficient
```

---

## 📞 Need Help?

- Check contract on Mumbai scan
- View backend logs: `gcloud logging read`
- Check browser console for frontend errors
- Verify .env files are correct

---

## ✅ Pre-Demo Checklist

Before the hackathon demo:

- [ ] Both frontend and backend are deployed
- [ ] Contract is deployed and verified
- [ ] Test wallets have test MATIC
- [ ] Sample data is seeded
- [ ] MetaMask is configured correctly
- [ ] Backup video is recorded
- [ ] Pitch deck is ready
- [ ] Team knows their parts
- [ ] Internet connection is stable
- [ ] Laptop is fully charged

---

## 🎉 You're Ready!

Your decentralized freelance escrow platform is now live on:
- ✅ Polygon Mumbai testnet (blockchain)
- ✅ Google Cloud Platform (backend & frontend)
- ✅ MetaMask integration (wallet connect)

**Let's win this hackathon!** 🏆
