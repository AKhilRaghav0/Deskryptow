# Blockchain Deployment Guide

## 🚀 Quick Start

### Step 1: Get Test MATIC Tokens

1. **Add Polygon Amoy to MetaMask:**
   - Network Name: `Polygon Amoy`
   - RPC URL: `https://rpc-amoy.polygon.technology`
   - Chain ID: `80002`
   - Currency Symbol: `MATIC`
   - Block Explorer: `https://amoy.polygonscan.com`

2. **Get Free Test MATIC:**
   - Go to: https://faucet.polygon.technology/
   - Select "Polygon Amoy"
   - Connect wallet or paste address
   - Request tokens (0.1-1 MATIC)
   - Wait 1-2 minutes

### Step 2: Deploy Smart Contract

```bash
cd blockchain

# Create .env file in project root (if not exists)
# Add your private key:
DEPLOYER_PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
PLATFORM_WALLET_ADDRESS=your_wallet_address

# Deploy contract
npx hardhat run scripts/deploy.js --network amoy
```

**Output will show:**
```
✅ FreelanceEscrow deployed to: 0x...
📋 Transaction hash: 0x...
```

### Step 3: Update Backend Configuration

After deployment, update your `.env` file or `backend/app/config.py`:

```python
ESCROW_CONTRACT_ADDRESS = "0x..." # Your deployed contract address
```

### Step 4: Set Up IPFS (Optional but Recommended)

**Option 1: Pinata (Recommended)**
1. Sign up at https://pinata.cloud (free tier available)
2. Get API Key and Secret Key
3. Add to `.env`:
   ```
   PINATA_API_KEY=your_api_key
   PINATA_SECRET_KEY=your_secret_key
   ```

**Option 2: Infura IPFS**
1. Sign up at https://infura.io
2. Create IPFS project
3. Get Project ID and Secret
4. Add to `.env`:
   ```
   INFURA_PROJECT_ID=your_project_id
   INFURA_SECRET=your_secret
   ```

### Step 5: Verify Contract (Optional)

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <PLATFORM_WALLET_ADDRESS>
```

### Step 6: Test the Integration

1. Start backend:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. Test endpoints:
   - Create job: `POST /api/v1/jobs/`
   - Build blockchain transaction: `POST /api/v1/jobs/blockchain/create`
   - Check transaction status: `GET /api/v1/jobs/blockchain/status/{tx_hash}`

---

## 📋 Environment Variables

Create a `.env` file in the project root:

```bash
# Blockchain
DEPLOYER_PRIVATE_KEY=your_private_key_here
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
ESCROW_CONTRACT_ADDRESS=0x... # After deployment
PLATFORM_WALLET_ADDRESS=your_wallet_address

# IPFS - Pinata (recommended)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# IPFS - Infura (alternative)
INFURA_PROJECT_ID=your_infura_project_id
INFURA_SECRET=your_infura_secret

# Backend
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=deskryptow
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🔍 Verification Checklist

- [ ] MetaMask connected to Polygon Amoy
- [ ] Have test MATIC tokens (check balance)
- [ ] Contract deployed successfully
- [ ] Contract address added to backend config
- [ ] IPFS configured (optional)
- [ ] Backend can connect to blockchain RPC
- [ ] Test job creation works
- [ ] Test blockchain transaction building works

---

## 🐛 Troubleshooting

### "Insufficient funds"
- Get more test MATIC from faucet
- Check balance: https://amoy.polygonscan.com/address/YOUR_ADDRESS

### "Contract not initialized"
- Check `ESCROW_CONTRACT_ADDRESS` is set
- Verify contract address is correct
- Check RPC connection: `POLYGON_RPC_URL`

### "IPFS upload failed"
- Check API keys are correct
- Verify network connection
- Try different IPFS provider

### "Transaction failed"
- Check gas price is sufficient
- Verify account has enough MATIC
- Check contract is deployed correctly

---

## 📚 Resources

- **Polygon Amoy Docs**: https://docs.polygon.technology/docs/develop/network-details/network/
- **Polygon Faucet**: https://faucet.polygon.technology/
- **Pinata**: https://pinata.cloud
- **PolygonScan Amoy**: https://amoy.polygonscan.com

