const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployer account
  const [deployer, testUser] = await ethers.getSigners();
  
  console.log("🚀 Starting ETH-only Staking Contract Deployment");
  console.log("=".repeat(60));
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  if (testUser) {
    console.log(`Test user: ${testUser.address}`);
    console.log(`Test user balance: ${ethers.formatEther(await ethers.provider.getBalance(testUser.address))} ETH`);
  }
  console.log("=".repeat(60));

  // Deploy StakeVault (ETH-only staking contract)
  console.log("\n📄 Deploying StakeVault (ETH Staking Contract)...");
  const StakeVault = await ethers.getContractFactory("StakeVault");
  
  const stakeVault = await StakeVault.deploy();
  await stakeVault.waitForDeployment();
  
  console.log(`✅ StakeVault deployed to: ${stakeVault.target}`);

  // Verify default pools were created by constructor
  console.log("\n🏊 Verifying Default Staking Pools...");
  const poolCount = await stakeVault.poolCount();
  console.log(`Total pools available: ${poolCount.toString()}`);
  
  // Display all available pools
  for (let i = 0; i < poolCount; i++) {
    const pool = await stakeVault.stakingPools(i);
    console.log(`📋 Pool ${i}: ${pool.name}`);
    console.log(`   • Min Stake: ${ethers.formatEther(pool.minStake)} ETH`);
    console.log(`   • Max Stake: ${ethers.formatEther(pool.maxStake)} ETH`);
    console.log(`   • APY: ${pool.apy}%`);
    console.log(`   • Active: ${pool.isActive}`);
  }

  // Test ETH staking if test user is available
  if (testUser) {
    console.log("\n🧪 Testing ETH Staking Flow...");
    
    // Check test user's balance
    const testUserBalance = await ethers.provider.getBalance(testUser.address);
    console.log(`Test user ETH balance: ${ethers.formatEther(testUserBalance)} ETH`);
    
    if (testUserBalance > ethers.parseEther("1")) {
      try {
        // Test stake to Pool 0 (ETH Flexible Pool)
        const poolId = 0;
        const stakeAmount = ethers.parseEther("1"); // 1 ETH stake
        
        console.log(`Attempting to stake ${ethers.formatEther(stakeAmount)} ETH to pool ${poolId}...`);
        
        // Connect as test user and stake
        const vaultAsUser = stakeVault.connect(testUser);
        const stakeTx = await vaultAsUser.stake(poolId, { value: stakeAmount });
        await stakeTx.wait();
        
        console.log(`✅ Successfully staked ${ethers.formatEther(stakeAmount)} ETH!`);
        
                 // Verify the stake
         const userStakes = await stakeVault.getUserStakes(testUser.address);
         console.log(`   • User now has ${userStakes.length} stake(s)`);
         
         const totalUserStaked = await stakeVault.getTotalStaked(testUser.address);
        console.log(`   • Total user staked: ${ethers.formatEther(totalUserStaked)} ETH`);
        
      } catch (error) {
        console.log(`⚠️ Test staking failed: ${error.message}`);
      }
    } else {
      console.log("⚠️ Test user has insufficient ETH balance for testing");
    }
  }

  // Save deployment information
  console.log("\n💾 Saving Contract Addresses...");
  await saveContractAddresses(stakeVault.target, deployer.address, testUser?.address);
  
  console.log("\n🎉 Deployment Summary");
  console.log("=".repeat(60));
  console.log(`✅ StakeVault: ${stakeVault.target}`);
  console.log(`✅ Deployer: ${deployer.address}`);
  console.log(`✅ Network: ${network.name}`);
  console.log(`✅ Total Pools: ${poolCount.toString()}`);
  console.log("=".repeat(60));
  console.log("🚀 Deployment completed successfully!");
}

/**
 * Save deployed contract addresses to contracts.json
 */
async function saveContractAddresses(stakeVaultAddress, deployerAddress, testUserAddress) {
  const contractsData = {
    timestamp: new Date().toISOString(),
    network: network.name,
    contracts: {
      StakeVault: {
        address: stakeVaultAddress,
        description: "ETH-only staking contract with multiple pools",
        lockPeriod: "30 days",
        defaultPools: [
          { id: 0, name: "ETH Flexible Pool", apy: "8%" },
          { id: 1, name: "ETH Premium Pool", apy: "12%" }
        ]
      }
    },
    deployer: deployerAddress,
    testUser: testUserAddress,
    testAccounts: {
      deployer: {
        address: deployerAddress,
        privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      },
      ...(testUserAddress && {
        testUser: {
          address: testUserAddress,
          privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        }
      })
    }
  };

  const contractsPath = path.join(__dirname, "..", "contracts.json");
  fs.writeFileSync(contractsPath, JSON.stringify(contractsData, null, 2));
  console.log(`✅ Contract addresses saved to ${contractsPath}`);

  // Copy to frontend public directory
  try {
    const frontendPublicDir = path.join(__dirname, "..", "..", "finverse_ui", "public");
    const frontendContractsDir = path.join(frontendPublicDir, "contracts");
    
    // Ensure the contracts directory exists
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
    }
    
    // Copy to both locations for compatibility
    const frontendContractsPath = path.join(frontendContractsDir, "contracts.json");
    const frontendRootPath = path.join(frontendPublicDir, "contracts.json");
    
    fs.writeFileSync(frontendContractsPath, JSON.stringify(contractsData, null, 2));
    fs.writeFileSync(frontendRootPath, JSON.stringify(contractsData, null, 2));
    
    console.log(`✅ Contract addresses copied to frontend`);
  } catch (copyError) {
    console.log(`⚠️ Could not copy to frontend: ${copyError.message}`);
  }
}

// Handle errors and run deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
