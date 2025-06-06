# FinVerse Blockchain - Staking Platform

This project demonstrates a DeFi staking platform built with Hardhat. It includes a MockERC20 token (FinVerse Token - FVT) and a StakeVault contract that allows users to stake tokens and earn 10% APY rewards with a 30-day lock period.

## Features

- **MockERC20 Token**: FinVerse Token (FVT) with minting capabilities
- **StakeVault Contract**: Staking with 10% APY and 30-day lock period
- **Comprehensive Tests**: Full test coverage for all functionality
- **Deployment Scripts**: Automated deployment with environment file generation

## Configuration

- **Solidity Version**: 0.8.20
- **Optimizer**: Enabled with 200 runs
- **Networks**: Localhost (127.0.0.1:8545) and Hardhat
- **Test Timeout**: 60 seconds

## Quick Start

```shell
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Run specific tests
npm run test:stake
npm run test:lock

# Start local node
npm run node

# Deploy to localhost (in another terminal)
npm run deploy:localhost

# Verify deployed contracts
npm run verify

# Clean artifacts
npm run clean
```

## Deployment

### Local Development
```shell
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:localhost
```

### Using Ignition
```shell
npm run deploy:ignition
```

## Contract Addresses

After deployment, contract addresses are saved to:
- `.env` file (for frontend integration)
- `contracts.json` file (for programmatic access)

## Testing

Run comprehensive tests covering:
- Contract deployment
- Token staking and unstaking
- Reward calculations
- Access controls
- Edge cases and error handling

```shell
# All tests
npm test

# With gas reporting
REPORT_GAS=true npm test

# Specific test files
npm run test:stake
npm run test:lock
```

## Smart Contracts

### MockERC20
- Standard ERC20 token with additional testing features
- Minting and burning capabilities
- Batch operations for testing

### StakeVault
- Stake ERC20 tokens for rewards
- 30-day lock period
- 10% APY reward calculation
- Claim rewards independently from unstaking
- Emergency functions for contract owner

## Environment Variables

Create a `.env` file with:
```env
# Generated automatically by deployment script
REACT_APP_TOKEN_ADDRESS=0x...
REACT_APP_STAKE_VAULT_ADDRESS=0x...
DEPLOYER_ADDRESS=0x...
```

## Gas Optimization

The contracts are optimized with:
- Solidity 0.8.20 with optimizer enabled (200 runs)
- Efficient data structures and algorithms
- ReentrancyGuard for security
- Minimal external calls

## Security Features

- OpenZeppelin contracts for security
- ReentrancyGuard protection
- Access control with Ownable
- Input validation and error handling
- Comprehensive test coverage
