# Quick Start - Multi-Device Workflow

## 🖥️ Your Setup

- **Mac**: `0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF` (has money) → **Deployer + Client**
- **Linux Profile 1**: `0xb32D080e919F2749E8155Ab24E25c676076d8397` (has money) → **Freelancer**
- **Linux Profile 2**: `0xac654e9fec92194800a79f4fa479c7045c107b2a` (no money) → **Escrow**

---

## ⚡ Quick Steps

### 1️⃣ Deploy Contract (Mac Only)

```bash
# Get Mac's private key from MetaMask
# MetaMask → Account → Account Details → Export Private Key

export DEPLOYER_PRIVATE_KEY=0x...
./deploy_contract.sh

# Copy contract address from output
export ESCROW_CONTRACT_ADDRESS=0x...
echo "VITE_ESCROW_CONTRACT_ADDRESS=0x..." >> .env
```

### 2️⃣ Start Services (Mac)

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Mac access**: `http://localhost:5173`  
**Linux access**: `http://192.168.0.33:5173` (use Mac's IP)

### 3️⃣ Workflow

| Step | Device | Account | Action |
|------|--------|---------|--------|
| 1 | Mac | Deployer | Deploy contract |
| 2 | Mac | Client | Post job (0.1 MATIC, set Linux2 as escrow) |
| 3 | Linux1 | Freelancer | Submit proposal |
| 4 | Mac | Client | Accept proposal |
| 5 | Linux1 | Freelancer | Submit work |
| 6 | Mac + Linux1 | Both | Confirm completion |
| 7 | Linux2 | Escrow | Release payment → Linux1 |

---

## 🔍 Find Your Mac's IP

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Use this IP on Linux to access the app.

---

## 📱 MetaMask Setup

**All devices must:**
1. Be on Polygon Amoy network
2. Have test MATIC (get from https://faucet.polygon.technology/)
3. Be connected to the app

---

## 🆘 Troubleshooting

**Linux can't access app?**
- Check Mac's IP: `ifconfig`
- Use `http://<mac-ip>:5173` on Linux
- Ensure both devices on same network

**Backend not accessible?**
- Backend must use `--host 0.0.0.0`
- Check firewall settings

**Transaction fails?**
- Verify contract address is set
- Check MetaMask is on Polygon Amoy
- Ensure account has MATIC for gas

