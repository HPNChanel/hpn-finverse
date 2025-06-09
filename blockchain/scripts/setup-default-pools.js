/**
 * Setup Default Staking Pools
 * 
 * This script creates default staking pools if the StakeVault contract
 * exists but has zero pools (which causes frontend getPoolCount() to revert)
 * 
 * Usage: npx hardhat run scripts/setup-default-pools.js --network localhost
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Setting up default staking pools...");

  // Get deployed contract addresses
  let contractsData;
  try {
    contractsData = require('../contracts.json');
    console.log("📄 Loaded contracts.json");
  } catch (error) {
    console.error("❌ contracts.json not found. Please deploy contracts first.");
    console.log("💡 Run: npx hardhat run scripts/deploy.js --network localhost");
    process.exit(1);
  }

  const stakeVaultAddress = contractsData.contracts?.StakeVault?.address;
  const mockERC20Address = contractsData.contracts?.MockERC20?.address;

  if (!stakeVaultAddress || !mockERC20Address) {
    console.error("❌ Contract addresses not found in contracts.json");
    process.exit(1);
  }

  console.log(`📋 Using StakeVault at: ${stakeVaultAddress}`);
  console.log(`📋 Using MockERC20 at: ${mockERC20Address}`);

  // Get contract instances
  const StakeVault = await hre.ethers.getContractAt("StakeVault", stakeVaultAddress);
  const MockERC20 = await hre.ethers.getContractAt("MockERC20", mockERC20Address);

  // Check current pool count
  try {
    const poolCount = await StakeVault.poolCount();
    console.log(`📊 Current pool count: ${poolCount}`);

    if (poolCount > 0) {
      console.log("✅ Pools already exist, no action needed");
      console.log("🔍 Listing existing pools:");
      
      for (let i = 0; i < poolCount; i++) {
        try {
          const poolInfo = await StakeVault.getPoolInfo(i);
          console.log(`  Pool ${i}: ${poolInfo[5]} (${poolInfo[0] === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20'}) - APY: ${poolInfo[3]}%`);
        } catch (error) {
          console.log(`  Pool ${i}: Error reading info`);
        }
      }
      return;
    }

    console.log("🚨 No pools found! Creating default pools...");
    
    // Pool configurations
    const pools = [
      {
        name: "ETH Flexible Pool",
        tokenAddress: "0x0000000000000000000000000000000000000000", // ETH
        minStake: hre.ethers.parseEther("0.01"),
        maxStake: hre.ethers.parseEther("100"),
        apy: 8,
        isActive: true
      },
      {
        name: "ETH Premium Pool", 
        tokenAddress: "0x0000000000000000000000000000000000000000", // ETH
        minStake: hre.ethers.parseEther("5"),
        maxStake: hre.ethers.parseEther("5000"),
        apy: 12,
        isActive: true
      },
      {
        name: "FVT Standard Pool",
        tokenAddress: mockERC20Address,
        minStake: hre.ethers.parseEther("1"),
        maxStake: hre.ethers.parseEther("10000"),
        apy: 10,
        isActive: true
      },
      {
        name: "FVT Premium Pool",
        tokenAddress: mockERC20Address,
        minStake: hre.ethers.parseEther("10"),
        maxStake: hre.ethers.parseEther("50000"),
        apy: 15,
        isActive: true
      }
    ];

    // Create pools
    console.log("🏗️ Creating pools...");
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      try {
        console.log(`  Creating: ${pool.name}...`);
        const tx = await StakeVault.createPool(
          pool.tokenAddress,
          pool.minStake,
          pool.maxStake,
          pool.apy,
          pool.isActive,
          pool.name
        );
        await tx.wait();
        console.log(`  ✅ Created pool ${i}: ${pool.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${pool.name}:`, error.message);
      }
    }

    // Verify pools were created
    const finalPoolCount = await StakeVault.poolCount();
    console.log(`\n🎯 Final pool count: ${finalPoolCount}`);
    console.log("✅ Default pools setup complete!");
    
    console.log("\n💡 Pool IDs for frontend reference:");
    for (let i = 0; i < finalPoolCount; i++) {
      try {
        const poolInfo = await StakeVault.getPoolInfo(i);
        const tokenSymbol = poolInfo[0] === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'FVT';
        console.log(`  Pool ${i}: ${poolInfo[5]} (${tokenSymbol}) - APY: ${poolInfo[3]}%`);
      } catch (error) {
        console.log(`  Pool ${i}: Error reading info`);
      }
    }

  } catch (error) {
    console.error("❌ Failed to setup pools:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Make sure Hardhat network is running: npx hardhat node");
    console.log("2. Make sure contracts are deployed: npx hardhat run scripts/deploy.js --network localhost");
    console.log("3. Check if you're on the correct network");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 