# Deskryptow Workflow Guide - Multi-Device Setup

## 🖥️ Your Setup

- **Mac Laptop**: `0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF` (has money) - **Deployer + Client**
- **Linux Laptop - Profile 1**: `0xb32D080e919F2749E8155Ab24E25c676076d8397` (has money) - **Freelancer**
- **Linux Laptop - Profile 2**: `0xac654e9fec92194800a79f4fa479c7045c107b2a` (no money) - **Escrow**

---

## 🚀 Complete Workflow

### **STEP 1: Deploy Contract (Mac)**

1. **Get your Mac's wallet address:**
   - Open MetaMask on Mac
   - Copy your wallet address (starts with `0x7...`)
   - Note it down

2. **Get your Mac's private key:**
   - MetaMask → Account → Account Details → Export Private Key
   - ⚠️ **Keep this secret!** Only use for deployment

3. **Deploy contract:**
   ```bash
   # On Mac terminal
   cd /Users/batman/projects/Deskryptow
   export DEPLOYER_PRIVATE_KEY=0x...  # Your Mac's private key
   ./deploy_contract.sh
   ```

4. **Copy the contract address** from output (e.g., `0x1234...`)

5. **Set environment variables:**
   ```bash
   # Backend (Mac terminal)
   export ESCROW_CONTRACT_ADDRESS=0x...  # Contract address from step 4
   
   # Frontend (create .env file in project root)
   echo "VITE_ESCROW_CONTRACT_ADDRESS=0x..." >> .env
   ```

6. **Restart backend:**
   ```bash
   # Stop current backend (Ctrl+C)
   # Start again
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

---

### **STEP 2: Post Job (Mac)**

1. **Open app on Mac:**
   - Go to `http://localhost:5173` (or your network IP)
   - Connect MetaMask (Mac's account - `0x7...`)

2. **Post a job:**
   - Click "Post Job" in the dock
   - Fill in job details:
     - Title: "Test Job - Multi-Device"
     - Description: "Testing workflow between Mac and Linux"
     - Budget: `0.1` MATIC
     - Category: Any
     - Deadline: Future date
   - **IMPORTANT**: Add escrow address:
     - Escrow Address: `0xac654e9fec92194800a79f4fa479c7045c107b2a` (Linux2)
     - Check "Allow escrow to revert payment if no work is done"
   - Click "Post Job"

3. **Sign transaction in MetaMask:**
   - MetaMask popup will appear
   - Review transaction (should send 0.1 MATIC to contract)
   - Confirm transaction
   - Wait for confirmation

4. **Job created!** Note the Job ID

---

### **STEP 3: Accept Job (Linux - Profile 1)**

1. **Open app on Linux:**
   - Go to `http://<mac-ip>:5173` (Mac's IP address)
   - Connect MetaMask (Linux Profile 1: `0xb32D080e919F2749E8155Ab24E25c676076d8397`)

2. **Browse jobs:**
   - Go to "Jobs" page
   - Find the job you posted from Mac
   - Click on it to view details

3. **Submit proposal:**
   - Click "Submit Proposal"
   - Fill in:
     - Cover letter
     - Timeline
     - Portfolio links (optional)
   - Click "Submit"
   - Sign message in MetaMask

4. **Wait for acceptance** (you'll accept from Mac in next step)

---

### **STEP 4: Accept Proposal (Mac)**

1. **On Mac:**
   - Go to "Notifications" page
   - You should see a new proposal notification
   - Click "Accept"

2. **Sign transaction:**
   - MetaMask popup appears
   - This assigns the freelancer to the job
   - Confirm transaction

3. **Job status changes to "In Progress"**

---

### **STEP 5: Submit Work (Linux)**

1. **On Linux:**
   - Go to "My Jobs" or "Dashboard"
   - Find the accepted job
   - Click on it

2. **Submit work:**
   - Add deliverable URL or description
   - Click "Submit Work"
   - Sign transaction in MetaMask
   - Job status changes to "Submitted"

---

### **STEP 6: Approve & Pay (Mac + Linux1 + Linux2)**

1. **On Mac:**
   - Go to "My Jobs"
   - Find the job
   - Click on it

2. **Confirm completion (Mac):**
   - You'll see "Confirm Job Completion" section
   - Click "I Confirm Job is Complete" (Client)
   - Sign message

3. **Confirm completion (Linux1):**
   - On Linux1, go to the job details
   - Click "I Confirm Job is Complete" (Freelancer)
   - Sign message

4. **Release payment (Linux2 - Escrow):**
   - On Linux2, open the app at `http://192.168.0.33:5173`
   - Connect MetaMask (Linux2: `0xac654e9fec92194800a79f4fa479c7045c107b2a`)
   - Go to `/escrow` page (or click Escrow in dock)
   - You'll see the job where both parties confirmed
   - Click "Release Payment"
   - Sign transaction in MetaMask
   - Payment released to Linux1 (freelancer)

---

## 🔄 Escrow Workflow (Recommended)

Since you're using Linux2 as escrow:

1. **Post job with escrow** (Mac):
   - When posting, add Linux2's address: `0xac654e9fec92194800a79f4fa479c7045c107b2a`
   - Check "Allow escrow to revert payment if no work is done"

2. **Escrow manages payment** (Linux2):
   - Connect Linux2's MetaMask (`0xac654e9fec92194800a79f4fa479c7045c107b2a`)
   - Go to `/escrow` page (or click Escrow in dock)
   - See pending jobs where both parties confirmed
   - Click "Release Payment" to release funds to Linux1
   - Or "Revert Payment" if no work done (refunds to Mac)

---

## 📋 Quick Reference

| Step | Device | Account | Address | Action |
|------|--------|--------|---------|--------|
| 1 | Mac | Deployer | `0x7710...9FeF` | Deploy contract |
| 2 | Mac | Client | `0x7710...9FeF` | Post job (set Linux2 as escrow) |
| 3 | Linux1 | Freelancer | `0xb32D...8397` | Submit proposal |
| 4 | Mac | Client | `0x7710...9FeF` | Accept proposal |
| 5 | Linux1 | Freelancer | `0xb32D...8397` | Submit work |
| 6 | Mac | Client | `0x7710...9FeF` | Confirm completion |
| 6b | Linux1 | Freelancer | `0xb32D...8397` | Confirm completion |
| 7 | Linux2 | Escrow | `0xac65...b2a` | Release payment → Linux1 |

---

## ⚠️ Important Notes

1. **Contract address** must be set in both backend and frontend
2. **All devices** must be on the same network (or use Mac's IP)
3. **MetaMask** must be connected to Polygon Amoy on all devices
4. **Test MATIC** needed:
   - Mac: ~0.15 MATIC (deployment + job funding)
   - Linux Profile 1: ~0.01 MATIC (gas for transactions)
   - Linux Profile 2: No money needed (will receive payment)

---

## 🆘 Troubleshooting

**Can't see jobs from other device?**
- Check Mac's IP address: `ifconfig | grep inet`
- Use `http://<mac-ip>:5173` on Linux

**Transaction fails?**
- Check contract address is set correctly
- Ensure MetaMask is on Polygon Amoy network
- Check account has enough MATIC for gas

**Can't connect to backend?**
- Backend must be running on Mac
- Check CORS settings allow Linux's IP
- Use Mac's IP: `http://<mac-ip>:8000`

