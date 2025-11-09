# Your Wallet Addresses

## 📋 Account Assignments

### 1. Mac (Deployer + Client)
**Address**: `0x7710D4Dc6e1A8a6875c6ed91C3c0Bf9BbfEF9FeF`
- ✅ Has money
- 🎯 Role: Deploy contract, post jobs, fund escrow
- 💰 Needs: ~0.15 MATIC (deployment + job funding)

### 2. Linux1 (Freelancer)
**Address**: `0xb32D080e919F2749E8155Ab24E25c676076d8397`
- ✅ Has money
- 🎯 Role: Accept jobs, submit work, receive payments
- 💰 Needs: ~0.01 MATIC (gas for transactions)

### 3. Linux2 (Escrow)
**Address**: `0xac654e9fec92194800a79f4fa479c7045c107b2a`
- ❌ No money (perfect for escrow!)
- 🎯 Role: Manage payments, release/revert funds
- 💰 Needs: ~0.01 MATIC (gas for transactions)

---

## 🎯 Workflow

```
Mac (0x7710...9FeF)
  ↓ Deploy contract
  ↓ Post job (set Linux2 as escrow)
  ↓ Accept proposal
  ↓ Confirm completion
  ↓
Linux1 (0xb32D...8397)
  ↓ Submit proposal
  ↓ Submit work
  ↓ Confirm completion
  ↓
Linux2 (0xac65...b2a) - ESCROW
  ↓ Release payment
  ↓ → Linux1 receives funds
```

---

## ⚠️ Important Notes

1. **Linux1's address** (`0xb32D080e919F2749E8155Ab24E25c676076d8397`) was previously used as a placeholder contract address. This is actually a **wallet address**, not a contract address.

2. **Contract address**: `0x5fB9f0A1b7eED0B1292a566aD9F436BF2eA02cC0` ✅ Deployed!

3. **When posting jobs**, always set Linux2 (`0xac654e9fec92194800a79f4fa479c7045c107b2a`) as the escrow address.

4. **Linux2 needs some MATIC** for gas when releasing payments (~0.01 MATIC). You can send a small amount from Mac or Linux1.

5. **Interface Behavior:**
   - **Mac**: Shows normal client/freelancer interface (can post jobs, accept proposals, etc.)
   - **Linux1**: Shows normal client/freelancer interface (can submit proposals, accept jobs, etc.)
   - **Linux2**: Shows ONLY escrow dashboard (can only manage escrow payments)

6. **Payment Flow:**
   - Mac posts job → Money sent to Linux2 (escrow)
   - When both Mac and Linux1 approve → Linux2 releases payment → Money goes to Linux1
   - If not approved → Linux2 reverts payment → Money goes back to Mac (original wallet)

---

## 🔄 Quick Reference

| Action | Use This Account |
|--------|------------------|
| Deploy contract | Mac (`0x7710...9FeF`) |
| Post job | Mac (`0x7710...9FeF`) |
| Set escrow | Linux2 (`0xac65...b2a`) |
| Accept job | Linux1 (`0xb32D...8397`) |
| Submit work | Linux1 (`0xb32D...8397`) |
| Release payment | Linux2 (`0xac65...b2a`) |

