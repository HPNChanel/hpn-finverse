/**
 * Check Token Addresses in Pools
 * 
 * This script checks the exact token addresses in each pool
 * to debug the address mismatch issue
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking token addresses in pools...");

  // Load contracts.json to see what UI expects
  let contractsData;
  try {
    contractsData = require('../contracts.json');
    console.log("📄 Loaded contracts.json");
  } catch (error) {
    console.error("❌ contracts.json not found");
    process.exit(1);
  }

  const stakeVaultAddress = contractsData.contracts?.StakeVault?.address;
  const expectedTokenAddress = contractsData.contracts?.MockERC20?.address;

  console.log(`📋 UI expects StakeVault at: ${stakeVaultAddress}`);
  console.log(`📋 UI expects MockERC20 at: ${expectedTokenAddress}`);

  if (!stakeVaultAddress) {
    console.error("❌ StakeVault address not found in contracts.json");
    process.exit(1);
  }

  try {
    // Get contract instance
    const StakeVault = await hre.ethers.getContractAt("StakeVault", stakeVaultAddress);
    
    // Get pool count
    const poolCount = await StakeVault.poolCount();
    console.log(`📊 Pool count: ${poolCount}`);

    if (poolCount === 0) {
      console.log("⚠️ No pools found");
      return;
    }

    console.log("\n🔍 Checking each pool in detail:");
    for (let i = 0; i < poolCount; i++) {
      try {
        console.log(`\n📋 Pool ${i}:`);
        
        // Get pool info
        const poolInfo = await StakeVault.getPoolInfo(i);
        const [tokenAddress, minStake, maxStake, apy, isActive, name] = poolInfo;
        
        console.log(`  Name: ${name}`);
        console.log(`  Token Address: ${tokenAddress}`);
        console.log(`  Min Stake: ${hre.ethers.formatEther(minStake)} tokens`);
        console.log(`  Max Stake: ${hre.ethers.formatEther(maxStake)} tokens`);
        console.log(`  APY: ${apy}%`);
        console.log(`  Is Active: ${isActive}`);
        
        // Determine token type
        if (tokenAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`  Token Type: ETH (native)`);
        } else {
          console.log(`  Token Type: ERC20`);
          
          // Check if this matches UI expectation
          if (tokenAddress === expectedTokenAddress) {
            console.log(`  ✅ Token address matches UI expectation`);
          } else {
            console.log(`  ❌ Token address MISMATCH!`);
            console.log(`      UI expects: ${expectedTokenAddress}`);
            console.log(`      Contract has: ${tokenAddress}`);
          }
          
          // Try to get token info
          try {
            const TokenContract = await hre.ethers.getContractAt("MockERC20", tokenAddress);
            const tokenName = await TokenContract.name();
            const tokenSymbol = await TokenContract.symbol();
            console.log(`  Token Info: ${tokenName} (${tokenSymbol})`);
          } catch (tokenError) {
            console.log(`  ⚠️ Could not read token info: ${tokenError.message}`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error reading pool ${i}: ${error.message}`);
      }
    }

    // Check what tokens are actually deployed
    console.log("\n🔍 Checking all deployed contracts:");
    
    // Try different common addresses to see what's deployed
    const commonAddresses = [
      expectedTokenAddress,
      "0x0B306BF915C4d645ff596e518fAf3F9669b97016", // Address from error
      "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"  // From original contracts.json
    ];

    for (const address of commonAddresses) {
      if (address) {
        try {
          console.log(`\n📋 Checking ${address}:`);
          const TokenContract = await hre.ethers.getContractAt("MockERC20", address);
          const name = await TokenContract.name();
          const symbol = await TokenContract.symbol();
          const decimals = await TokenContract.decimals();
          console.log(`  ✅ ${name} (${symbol}) - ${decimals} decimals`);
        } catch (error) {
          console.log(`  ❌ Not a valid ERC20 contract: ${error.message}`);
        }
      }
    }

    // Final recommendation
    console.log("\n💡 SOLUTION:");
    console.log("1. Update contracts.json with the correct token addresses from the pools");
    console.log("2. Or redeploy contracts with consistent addresses");

  } catch (error) {
    console.error("❌ Failed to check token addresses:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 