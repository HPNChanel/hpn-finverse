# ETH-Only Staking Contract Deployment Guide

## 🎯 Overview
This deployment script has been refactored to focus exclusively on ETH staking, removing all ERC20 token dependencies and complexity.

## ✅ What Was Removed
- ❌ MockERC20 token deployment
- ❌ ERC20 token approval/transfer logic  
- ❌ FVT token staking pools
- ❌ Token minting and distribution
- ❌ Complex multi-token configuration

## ✅ What Remains (ETH-Only)
- ✅ StakeVault contract deployment
- ✅ Default ETH staking pools (created in constructor)
- ✅ ETH staking test flow
- ✅ Clean logging and contract address saving
- ✅ Frontend integration (contracts.json)

## 🚀 Deployment Commands

### 1. Compile Contracts
```bash
npx hardhat compile
```

### 2. Deploy to Local Network
```bash
# Start Hardhat node (in separate terminal)
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Deploy to Hardhat Network (for testing)
```bash
npx hardhat run scripts/deploy.js --network hardhat
```

## 📋 Default Staking Pools

The StakeVault contract automatically creates two ETH staking pools:

| Pool ID | Name | Min Stake | Max Stake | APY |
|---------|------|-----------|-----------|-----|
| 0 | ETH Flexible Pool | 1.0 ETH | 1000 ETH | 8% |
| 1 | ETH Premium Pool | 5.0 ETH | 5000 ETH | 12% |

## 📄 Contract Structure

### StakeVault.sol
- **Purpose**: ETH-only staking with multiple pools
- **Features**:
  - Multiple staking pools with different APY rates
  - Configurable min/max stake amounts per pool
  - 30-day lock period
  - Automatic reward calculation
  - Pool-based staking system

## 🔧 Output Files

### contracts.json
Generated automatically and contains:
- Contract addresses
- Pool configurations  
- Test account information
- Network details

**Locations**:
- `blockchain/contracts.json` (main)
- `finverse_ui/public/contracts.json` (frontend)
- `finverse_ui/public/contracts/contracts.json` (frontend backup)

## 🧪 Test Flow

The deploy script automatically:
1. ✅ Deploys StakeVault contract
2. ✅ Verifies default pools were created
3. ✅ Tests ETH staking with test user (if available)
4. ✅ Saves contract addresses for frontend integration

## 📊 Expected Output

```
🚀 Starting ETH-only Staking Contract Deployment
============================================================
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployer balance: 10000.0 ETH
Test user: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

📄 Deploying StakeVault (ETH Staking Contract)...
✅ StakeVault deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🏊 Verifying Default Staking Pools...
Total pools available: 2
📋 Pool 0: ETH Flexible Pool
   • Min Stake: 1.0 ETH
   • Max Stake: 1000.0 ETH
   • APY: 8%
   • Active: true
📋 Pool 1: ETH Premium Pool
   • Min Stake: 5.0 ETH
   • Max Stake: 5000.0 ETH
   • APY: 12%
   • Active: true

🧪 Testing ETH Staking Flow...
Test user ETH balance: 10000.0 ETH
Attempting to stake 1.0 ETH to pool 0...
✅ Successfully staked 1.0 ETH!
   • User now has 1 stake(s)
   • Total user staked: 1.0 ETH

💾 Saving Contract Addresses...
✅ Contract addresses saved to contracts.json
✅ Contract addresses copied to frontend

🎉 Deployment Summary
============================================================
✅ StakeVault: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
✅ Network: hardhat
✅ Total Pools: 2
============================================================
🚀 Deployment completed successfully!
```

## 🔑 Test Accounts

For local testing, use these Hardhat default accounts:

**Deployer Account:**
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Test User Account:**
- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

## 🔧 MetaMask Setup

1. **Add Hardhat Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account:**
   - Use the test user private key above
   - Account will have 10,000 ETH for testing

## ✅ Integration

The frontend will automatically pick up the contract addresses from:
- `/contracts.json` (root)
- `/contracts/contracts.json` (backup)

No additional configuration needed for ETH-only staking integration.

## 🚨 Troubleshooting

### "Cannot connect to localhost"
- Ensure `npx hardhat node` is running in a separate terminal
- Check that port 8545 is available

### "StakeVault deployed but pools missing" 
- Pools are created in the constructor
- Check contract deployment logs for errors

### "Frontend can't find contracts"
- Verify `contracts.json` exists in `finverse_ui/public/`
- Check file permissions and content format 