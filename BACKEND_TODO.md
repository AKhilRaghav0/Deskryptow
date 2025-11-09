# Backend Blockchain Integration - TODO List

## 🎯 Current Status

### ✅ What's Already Implemented
- **Blockchain Service** (`backend/app/services/blockchain.py`)
  - Web3 connection to Polygon Amoy testnet
  - Contract ABI definitions
  - Transaction building and sending functions
  - Job creation, acceptance, submission, approval, cancellation methods
  - Event parsing and job status retrieval

- **API Endpoints** (`backend/app/api/v1/jobs.py`)
  - `/jobs/blockchain/create` - Build transaction for job creation
  - `/jobs/blockchain/submit-tx` - Submit signed transactions
  - `/jobs/{job_id}/blockchain/accept` - Build accept transaction
  - `/jobs/{job_id}/blockchain/submit` - Build submit work transaction
  - `/jobs/{job_id}/blockchain/approve` - Build approve transaction
  - `/jobs/{job_id}/blockchain/cancel` - Build cancel transaction
  - `/jobs/blockchain/status/{tx_hash}` - Get transaction status

- **Database Models**
  - Jobs table with `blockchain_job_id` field
  - Users, Proposals, Notifications tables

### ❌ What's Missing
- Contract deployment to Polygon Amoy
- IPFS integration for job details/deliverables
- Frontend transaction signing integration
- Blockchain event listening/syncing
- Dispute resolution endpoints
- Error handling and fallbacks

---

## 📋 TODO List (Priority Order)

### 🔴 **CRITICAL - Must Do First**

#### 1. **Deploy Smart Contract to Polygon Amoy Testnet**
- **Status**: ⏳ Pending
- **What**: Deploy `FreelanceEscrow.sol` to Polygon Amoy testnet
- **How**:
  ```bash
  cd blockchain
  # Set up .env with:
  # DEPLOYER_PRIVATE_KEY=your_private_key
  # POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
  npx hardhat run scripts/deploy.js --network amoy
  ```
- **Output**: Contract address (e.g., `0x1234...`)
- **Next**: Update `ESCROW_CONTRACT_ADDRESS` in backend config

#### 2. **Get Testnet MATIC Tokens (Faucet)**
- **Status**: ⏳ Pending
- **What**: Get free MATIC tokens for Polygon Amoy testnet
- **Faucets**:
  - **Official Polygon Faucet**: https://faucet.polygon.technology/
  - **Alchemy Faucet**: https://www.alchemy.com/faucets/polygon-amoy
  - **QuickNode Faucet**: https://faucet.quicknode.com/polygon/amoy
- **How**:
  1. Connect MetaMask to Polygon Amoy network
  2. Copy your wallet address
  3. Request tokens from faucet (usually 0.1-1 MATIC)
  4. Wait 1-2 minutes for tokens to arrive
- **Note**: You'll need MATIC for:
  - Deploying contract (~0.01 MATIC)
  - Creating jobs (job amount + gas)
  - All transactions (gas fees ~0.001-0.01 MATIC per tx)

#### 3. **Update Backend Configuration**
- **Status**: ⏳ Pending
- **File**: `backend/app/config.py` or `.env`
- **What**: Set contract address after deployment
  ```python
  ESCROW_CONTRACT_ADDRESS = "0x..." # Your deployed contract address
  ```
- **Test**: Verify connection with `/jobs/blockchain/{job_id}` endpoint

---

### 🟠 **HIGH PRIORITY - Core Functionality**

#### 4. **Implement IPFS Integration**
- **Status**: ⏳ Pending
- **What**: Store job details and deliverables on IPFS
- **Options**:
  - **Pinata** (Recommended - Free tier available)
    - Sign up: https://pinata.cloud
    - Get API key
    - Upload JSON/files, get IPFS hash
  - **Infura IPFS** (Free tier)
    - Sign up: https://infura.io
    - Get IPFS endpoint and API key
  - **Web3.Storage** (Free tier)
    - Sign up: https://web3.storage
- **Implementation**:
  - Create `backend/app/services/ipfs.py`
  - Functions: `upload_to_ipfs()`, `get_from_ipfs()`
  - Use for: Job descriptions, deliverables, dispute evidence

#### 5. **Complete Job Creation Flow**
- **Status**: ⏳ Pending
- **What**: Connect database job creation with blockchain
- **Flow**:
  1. User creates job in DB (`POST /jobs/`)
  2. Upload job details to IPFS → get hash
  3. Build blockchain transaction (`POST /jobs/blockchain/create`)
  4. Frontend signs with MetaMask
  5. Submit signed tx (`POST /jobs/blockchain/submit-tx`)
  6. Update DB with `blockchain_job_id` from event
- **Files to modify**:
  - `backend/app/api/v1/jobs.py` - `create_job()` function
  - Add IPFS upload step
  - Link blockchain job ID to DB job

#### 6. **Implement Accept Job Flow**
- **Status**: ⏳ Pending
- **What**: When proposal is accepted, call `acceptJob` on blockchain
- **Flow**:
  1. Client accepts proposal (`POST /proposals/{id}/accept`)
  2. Build `acceptJob` transaction
  3. Frontend signs with MetaMask
  4. Submit transaction
  5. Update job status to `in_progress`
- **Files to modify**:
  - `backend/app/api/v1/proposals.py` - `accept_proposal()` function

#### 7. **Implement Submit Work Flow**
- **Status**: ⏳ Pending
- **What**: When freelancer submits work, call `submitWork` on blockchain
- **Flow**:
  1. Freelancer uploads deliverables
  2. Upload to IPFS → get hash
  3. Build `submitWork` transaction with IPFS hash
  4. Frontend signs with MetaMask
  5. Submit transaction
  6. Update job status to `submitted`
- **Files to modify**:
  - `backend/app/api/v1/jobs.py` - Add submit work endpoint

#### 8. **Implement Approve Work Flow**
- **Status**: ⏳ Pending
- **What**: When client approves, call `approveWork` to release funds
- **Flow**:
  1. Client approves work
  2. Build `approveWork` transaction
  3. Frontend signs with MetaMask
  4. Submit transaction
  5. Smart contract releases funds automatically
  6. Update job status to `completed`
- **Files to modify**:
  - `backend/app/api/v1/jobs.py` - `approve_work()` function

---

### 🟡 **MEDIUM PRIORITY - Enhancements**

#### 9. **Add Blockchain Sync Endpoint**
- **Status**: ⏳ Pending
- **What**: Periodically sync PostgreSQL jobs with blockchain state
- **Endpoint**: `POST /jobs/blockchain/sync/{job_id}`
- **Function**: Read job from blockchain, update DB if different
- **Use case**: If blockchain state changes, update DB accordingly

#### 10. **Implement Dispute Resolution**
- **Status**: ⏳ Pending
- **What**: Add endpoints for dispute management
- **Endpoints**:
  - `POST /jobs/{job_id}/disputes` - Raise dispute
  - `POST /disputes/{id}/vote` - Vote on dispute
  - `POST /disputes/{id}/resolve` - Resolve dispute
- **Files to create**:
  - `backend/app/api/v1/disputes.py`

#### 11. **Add Transaction Status Polling**
- **Status**: ⏳ Pending
- **What**: Poll transaction status and update job state
- **Implementation**:
  - Background task (Celery or asyncio)
  - Poll `/jobs/blockchain/status/{tx_hash}`
  - Update job when transaction confirms
- **Use case**: Handle pending transactions

#### 12. **Add Event Listening**
- **Status**: ⏳ Pending
- **What**: Listen to blockchain events and update DB
- **Events to listen**:
  - `JobCreated` → Create/update job in DB
  - `JobAccepted` → Update job status
  - `WorkSubmitted` → Update job status
  - `JobCompleted` → Update job status, mark funds released
- **Implementation**:
  - Background service using Web3 event filters
  - Update DB when events detected

---

### 🟢 **LOW PRIORITY - Nice to Have**

#### 13. **Error Handling & Fallbacks**
- **Status**: ⏳ Pending
- **What**: Graceful handling when blockchain unavailable
- **Implementation**:
  - Try blockchain operation
  - If fails, allow DB-only mode
  - Queue failed transactions for retry
  - Log all blockchain errors

#### 14. **Gas Estimation Display**
- **Status**: ⏳ Pending
- **What**: Show estimated gas costs to users
- **Implementation**:
  - Add `estimated_gas` to transaction response
  - Calculate cost in MATIC/USD
  - Display in frontend before signing

#### 15. **Comprehensive Logging**
- **Status**: ⏳ Pending
- **What**: Log all blockchain operations
- **Implementation**:
  - Log transaction hashes
  - Log contract interactions
  - Log errors with context
  - Store in database for audit trail

#### 16. **Testing on Testnet**
- **Status**: ⏳ Pending
- **What**: Test all blockchain operations
- **Test cases**:
  - Create job with funds
  - Accept job
  - Submit work
  - Approve work (verify funds released)
  - Cancel job (verify refund)
  - Raise dispute
  - Vote on dispute
  - Resolve dispute

---

## 🌐 Testnet Setup Guide

### Polygon Amoy Testnet Configuration

#### 1. **Add Network to MetaMask**
- **Network Name**: Polygon Amoy
- **RPC URL**: `https://rpc-amoy.polygon.technology`
- **Chain ID**: `80002`
- **Currency Symbol**: `MATIC`
- **Block Explorer**: `https://amoy.polygonscan.com`

#### 2. **Get Test MATIC**
1. Go to https://faucet.polygon.technology/
2. Select "Polygon Amoy"
3. Connect wallet or paste address
4. Request tokens (0.1-1 MATIC)
5. Wait 1-2 minutes

#### 3. **Deploy Contract**
```bash
cd blockchain
# Create .env file:
# DEPLOYER_PRIVATE_KEY=your_private_key_here
# POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
# PLATFORM_WALLET_ADDRESS=your_wallet_address

npx hardhat run scripts/deploy.js --network amoy
```

#### 4. **Verify Contract** (Optional)
```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS> <PLATFORM_WALLET_ADDRESS>
```

#### 5. **Update Backend Config**
```python
# backend/app/config.py or .env
ESCROW_CONTRACT_ADDRESS = "0x..." # Your deployed address
POLYGON_RPC_URL = "https://rpc-amoy.polygon.technology"
CHAIN_ID = 80002
```

---

## ⚠️ Important Notes

### What's Possible on Testnet
✅ All smart contract operations (create, accept, submit, approve, cancel)  
✅ Real transactions (just using test MATIC)  
✅ Event listening  
✅ IPFS storage  
✅ Full escrow functionality  

### What's NOT Possible on Testnet
❌ Real money (testnet tokens have no value)  
❌ Production-ready (testnets can reset)  
❌ High transaction volume (rate limits)  

### Best Practices
1. **Always test on testnet first** before mainnet
2. **Keep test MATIC** - Request more when needed
3. **Monitor gas prices** - Testnet can be slow
4. **Use IPFS** for large data (job details, files)
5. **Handle errors gracefully** - Blockchain can fail
6. **Log everything** - Debugging blockchain issues is hard

---

## 🚀 Quick Start Checklist

- [ ] Deploy contract to Polygon Amoy
- [ ] Get test MATIC from faucet
- [ ] Update `ESCROW_CONTRACT_ADDRESS` in backend
- [ ] Set up IPFS (Pinata/Infura)
- [ ] Test job creation flow
- [ ] Test accept job flow
- [ ] Test submit work flow
- [ ] Test approve work flow
- [ ] Verify funds are released correctly
- [ ] Test cancel job flow
- [ ] Add error handling
- [ ] Add logging
- [ ] Test all flows end-to-end

---

## 📚 Resources

- **Polygon Amoy Docs**: https://docs.polygon.technology/docs/develop/network-details/network/
- **Web3.py Docs**: https://web3py.readthedocs.io/
- **IPFS Pinata**: https://docs.pinata.cloud/
- **Hardhat Docs**: https://hardhat.org/docs
- **PolygonScan Amoy**: https://amoy.polygonscan.com

---

**Last Updated**: 2024
**Status**: Ready for implementation

