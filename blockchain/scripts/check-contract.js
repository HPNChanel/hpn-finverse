/**
 * Check Contract Status
 * 
 * This script checks the status of the specific contract address
 * that the frontend is trying to call
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking contract status...");

  // The address from the error message
  const frontendContractAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
  
  // The address we found pools on
  const alternateContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log(`📋 Frontend is calling: ${frontendContractAddress}`);
  console.log(`📋 Alternate address with pools: ${alternateContractAddress}`);

  async function checkContract(address, label) {
    console.log(`\n🔍 Checking ${label}: ${address}`);
    try {
      // Try to get contract instance
      const StakeVault = await hre.ethers.getContractAt("StakeVault", address);
      
      // Test basic contract calls
      const poolCount = await StakeVault.poolCount();
      console.log(`  ✅ Pool count: ${poolCount}`);

      if (poolCount > 0) {
        console.log(`  📊 Pools found:`);
        for (let i = 0; i < poolCount; i++) {
          try {
            const poolInfo = await StakeVault.getPoolInfo(i);
            const tokenSymbol = poolInfo[0] === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20';
            console.log(`    Pool ${i}: ${poolInfo[5]} (${tokenSymbol}) - APY: ${poolInfo[3]}%`);
          } catch (error) {
            console.log(`    Pool ${i}: Error reading info - ${error.message}`);
          }
        }
      } else {
        console.log(`  ⚠️ No pools found`);
      }

      // Test if contract is active
      try {
        const owner = await StakeVault.owner();
        console.log(`  👤 Owner: ${owner}`);
      } catch (error) {
        console.log(`  ❌ Could not get owner: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.log(`  ❌ Contract check failed: ${error.message}`);
      return false;
    }
  }

  // Check both addresses
  const frontendWorking = await checkContract(frontendContractAddress, "Frontend Contract");
  const alternateWorking = await checkContract(alternateContractAddress, "Alternate Contract");

  console.log("\n📊 Summary:");
  console.log(`Frontend contract (${frontendContractAddress}): ${frontendWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`Alternate contract (${alternateContractAddress}): ${alternateWorking ? '✅ Working' : '❌ Failed'}`);

  if (!frontendWorking && alternateWorking) {
    console.log("\n🚨 ISSUE FOUND:");
    console.log("The frontend is calling the wrong contract address!");
    console.log("\n💡 SOLUTION:");
    console.log("1. Update contracts.json files with the correct address");
    console.log("2. Or redeploy contracts to the expected address");
  } else if (!frontendWorking && !alternateWorking) {
    console.log("\n🚨 ISSUE FOUND:");
    console.log("Neither contract address is working!");
    console.log("\n💡 SOLUTION:");
    console.log("1. Make sure Hardhat node is running: npx hardhat node");
    console.log("2. Deploy contracts: npx hardhat run scripts/deploy.js --network localhost");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 