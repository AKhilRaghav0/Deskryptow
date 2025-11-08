# ⚡ Quick Start Guide

For team members who want to start immediately!

---

## 🎯 For Person 1: Blockchain + Backend

### Step 1: Get Test MATIC (5 minutes)
```bash
# 1. Install MetaMask browser extension
# 2. Create/import wallet
# 3. Add Mumbai testnet:
#    - Network: Polygon Mumbai
#    - RPC: https://rpc-mumbai.maticvigil.com
#    - Chain ID: 80001
# 4. Visit faucet: https://faucet.polygon.technology/
# 5. Enter your wallet address
# 6. Receive test MATIC (30 seconds)
```

### Step 2: Deploy Smart Contract (10 minutes)
```bash
cd blockchain
npm install

# Create .env file
echo "MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com" > ../.env
echo "DEPLOYER_PRIVATE_KEY=your_private_key_here" >> ../.env
echo "PLATFORM_WALLET_ADDRESS=your_wallet_address_here" >> ../.env

# Compile and test
npm run compile
npm test

# Deploy to Mumbai
npm run deploy:mumbai

# Save the contract address that's printed!
```

### Step 3: Setup GCP (15 minutes)
```bash
# 1. Go to: https://console.cloud.google.com
# 2. Create new project
# 3. Enable Firestore: console.cloud.google.com/firestore
#    - Click "Create Database"
#    - Select "Native mode"
#    - Choose "us-central1"
# 4. Create Cloud Storage bucket:
#    - console.cloud.google.com/storage
#    - Click "Create Bucket"
#    - Name: freelance-escrow-files
```

### Step 4: Run Backend (5 minutes)
```bash
cd backend
pip install -r requirements.txt

# Add to .env:
# GCP_PROJECT_ID=your-project-id
# ESCROW_CONTRACT_ADDRESS=0x... (from step 2)

# Run
uvicorn app.main:app --reload

# Test: Open http://localhost:8000/docs
```

---

## 🎨 For Person 2: Frontend

### Step 1: Setup Environment (5 minutes)
```bash
cd frontend
npm install

# Create .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:8000
VITE_CHAIN_ID=80001
VITE_CHAIN_NAME=Polygon Mumbai
VITE_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_ESCROW_CONTRACT_ADDRESS=0x...  # Get from Person 1
VITE_BLOCK_EXPLORER=https://mumbai.polygonscan.com
EOF
```

### Step 2: Create Missing Components
You need to create these files:

**Components:**
```bash
mkdir -p src/components
touch src/components/Layout.tsx
touch src/components/ConnectWallet.tsx
touch src/components/JobCard.tsx
touch src/components/Navbar.tsx
```

**Pages:**
```bash
mkdir -p src/pages
touch src/pages/Home.tsx
touch src/pages/Jobs.tsx
touch src/pages/JobDetail.tsx
touch src/pages/PostJob.tsx
touch src/pages/Dashboard.tsx
touch src/pages/Profile.tsx
```

**Hooks:**
```bash
mkdir -p src/hooks
touch src/hooks/useWallet.ts
touch src/hooks/useContract.ts
```

**Utils:**
```bash
mkdir -p src/utils
touch src/utils/web3.ts
touch src/utils/api.ts
```

### Step 3: Start Development (2 minutes)
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🧪 Testing Complete Flow (10 minutes)

### Create Two Wallets
1. Wallet 1 (Client): Get from MetaMask
2. Wallet 2 (Freelancer): Create another account in MetaMask
3. Get test MATIC for both

### Test Flow
```bash
# 1. As Client (Wallet 1):
- Connect wallet on frontend
- Post a job (Budget: 0.1 MATIC)
- Approve MetaMask transaction

# 2. As Freelancer (Wallet 2):
- Switch to Wallet 2 in MetaMask
- Browse jobs
- Submit proposal

# 3. Back to Client:
- View proposals
- Accept freelancer
- Approve transaction

# 4. As Freelancer:
- Submit work
- Transaction on blockchain

# 5. Back to Client:
- Approve work
- Payment released! ✅
```

---

## 📋 Minimum Viable Demo

If short on time, focus on these features:

### Must Have (Day 1):
- ✅ Smart contract deployed
- ✅ Connect wallet
- ✅ Post job
- ✅ View jobs
- ✅ Accept job
- ✅ Approve & pay

### Nice to Have (Day 2):
- 🔄 Proposals
- 🔄 File upload
- 🔄 User profiles
- 🔄 Dispute resolution

### Polish (Day 3):
- 🎨 Beautiful UI
- 🎨 Animations
- 🎨 Responsive design
- 🎨 Error handling

---

## 🚨 Common Issues & Quick Fixes

### Issue: MetaMask not connecting
```bash
# Fix: Reset MetaMask account
# Settings > Advanced > Reset Account
```

### Issue: Transaction failing
```bash
# Check:
1. Contract address is correct
2. Wallet has test MATIC
3. Mumbai network selected
4. Try increasing gas limit
```

### Issue: Backend error
```bash
# Check .env file has all values
# Check GCP credentials
# Restart: Ctrl+C and run again
```

### Issue: Frontend not loading
```bash
# Clear cache and restart
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 💡 Pro Tips

1. **Use two browser windows:** One for client, one for freelancer
2. **Keep Mumbai explorer open:** Track transactions in real-time
3. **Test incrementally:** Don't wait until the end
4. **Commit often:** `git add . && git commit -m "feat: xyz"`
5. **Deploy early:** Don't wait for perfection
6. **Record video backup:** In case live demo fails

---

## 🎯 30-Minute Quick Demo

If you only have 30 minutes before presenting:

1. **Deploy everything** (even if incomplete)
2. **Seed one job** manually in Firestore
3. **Pre-record transactions** on blockchain
4. **Show slides** for missing features
5. **Demo the UI** even if backend isn't connected

---

## 📞 Emergency Contacts

**Person 1 Help:**
- Hardhat errors: https://hardhat.org/errors
- GCP docs: https://cloud.google.com/docs

**Person 2 Help:**
- React errors: https://react.dev
- Ethers.js: https://docs.ethers.org/v6/

**Both:**
- Check PROJECT_PLAN.md for architecture
- Check SETUP.md for detailed steps
- Check error logs carefully

---

## ✅ Pre-Demo Checklist

**5 minutes before:**
- [ ] Backend running
- [ ] Frontend running
- [ ] Contract deployed
- [ ] Wallets have MATIC
- [ ] MetaMask unlocked
- [ ] Browser tabs ready
- [ ] Slides ready
- [ ] Water nearby 💧

---

## 🏆 Let's Win This!

Remember:
- **Working demo > Perfect code**
- **Clear story > Technical jargon**
- **Solve real problems > Cool tech**
- **Team synergy > Individual work**

**YOU GOT THIS! 🚀**
