# Polygon Amoy Testnet Setup Guide

This project has been configured to use **Polygon Amoy Testnet**, the current active testnet for Polygon PoS (Proof of Stake).

## Why Amoy?

- **Mumbai testnet is deprecated** - Polygon Mumbai testnet was shut down
- **Amoy is the new testnet** - Anchored to Ethereum's Sepolia testnet
- **Free test tokens** - Get free MATIC tokens for testing
- **Full Polygon features** - All Polygon PoS features available

## Network Details

- **Network Name**: Polygon Amoy
- **Chain ID**: 80002
- **RPC URL**: `https://rpc-amoy.polygon.technology`
- **Block Explorer**: `https://amoy.polygonscan.com`
- **Currency Symbol**: MATIC
- **Currency Decimals**: 18

## Configuration Files Updated

### Backend (`backend/app/config.py`)
```python
POLYGON_RPC_URL: str = "https://rpc-amoy.polygon.technology"
CHAIN_ID: int = 80002
CHAIN_NAME: str = "Polygon Amoy"
BLOCK_EXPLORER: str = "https://amoy.polygonscan.com"
```

### Frontend (`frontend/src/config.ts`)
```typescript
chainId: 80002
chainName: 'Polygon Amoy'
rpcUrl: 'https://rpc-amoy.polygon.technology'
blockExplorer: 'https://amoy.polygonscan.com'
```

### Hardhat (`blockchain/hardhat.config.js`)
- Added `amoy` network configuration
- Chain ID: 80002
- Kept `mumbai` for backward compatibility (deprecated)

## Setting Up MetaMask

### Option 1: Automatic Network Switch
The app will automatically prompt you to switch to Polygon Amoy when you connect your wallet.

### Option 2: Manual Setup
1. Open MetaMask
2. Click the network dropdown
3. Click "Add Network" or "Add a network manually"
4. Enter the following details:
   - **Network Name**: Polygon Amoy
   - **New RPC URL**: `https://rpc-amoy.polygon.technology`
   - **Chain ID**: `80002`
   - **Currency Symbol**: `MATIC`
   - **Block Explorer URL**: `https://amoy.polygonscan.com`
5. Click "Save"

## Getting Test Tokens

### Polygon Faucet
Visit: https://faucet.polygon.technology/

1. Select "Amoy" network
2. Enter your wallet address
3. Request test MATIC tokens
4. Wait for confirmation (usually instant)

### Alternative Faucets
- Alchemy Faucet: https://www.alchemy.com/faucets/polygon-amoy
- QuickNode Faucet: https://faucet.quicknode.com/polygon/amoy

## Deploying Smart Contracts

### Deploy to Amoy Testnet
```bash
cd blockchain
npm run deploy:amoy
```

### Verify Contract
```bash
npm run verify:amoy
```

### View on Explorer
After deployment, view your contract at:
```
https://amoy.polygonscan.com/address/<contract-address>
```

## Environment Variables

### Backend `.env`
```env
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_ID=80002
CHAIN_NAME=Polygon Amoy
BLOCK_EXPLORER=https://amoy.polygonscan.com
ESCROW_CONTRACT_ADDRESS=<your-contract-address>
```

### Frontend `.env`
```env
VITE_CHAIN_ID=80002
VITE_CHAIN_NAME=Polygon Amoy
VITE_RPC_URL=https://rpc-amoy.polygon.technology
VITE_BLOCK_EXPLORER=https://amoy.polygonscan.com
VITE_ESCROW_CONTRACT_ADDRESS=<your-contract-address>
```

## Features

### Automatic Network Switching
- When users connect their wallet, the app checks if they're on the correct network
- If not, it automatically prompts to switch to Polygon Amoy
- Network is added to MetaMask if not already present

### Network Validation
- All blockchain operations validate the network before execution
- Users are prompted to switch if on wrong network
- Clear error messages guide users

## Testing

1. **Connect Wallet**: Click "Connect Wallet" - app will switch to Amoy automatically
2. **Get Test Tokens**: Use faucet to get free MATIC
3. **Deploy Contracts**: Use `npm run deploy:amoy`
4. **Test Transactions**: All transactions will use Amoy testnet
5. **View on Explorer**: Check transactions on Amoy PolygonScan

## Migration from Mumbai

If you were using Mumbai testnet:

1. **Update Environment Variables**: Change `MUMBAI_RPC_URL` to `POLYGON_RPC_URL`
2. **Update Chain ID**: Change from `80001` to `80002`
3. **Redeploy Contracts**: Deploy new contracts to Amoy
4. **Update Frontend**: Frontend config is already updated
5. **Get New Test Tokens**: Request tokens from Amoy faucet

## Resources

- **Polygon Docs**: https://docs.polygon.technology/
- **Amoy Testnet Info**: https://docs.polygon.technology/tools/gas/matic-faucet/
- **Block Explorer**: https://amoy.polygonscan.com
- **Faucet**: https://faucet.polygon.technology/

## Support

If you encounter issues:
1. Check you're on the correct network (Chain ID: 80002)
2. Ensure you have test MATIC tokens
3. Verify RPC URL is accessible
4. Check contract address is correct in `.env` files

