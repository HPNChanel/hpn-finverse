const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("--- Contract Verification Script ---\n");

  // Try to read contract addresses from contracts.json
  const contractsPath = path.join(__dirname, "..", "contracts.json");
  
  if (!fs.existsSync(contractsPath)) {
    console.error("❌ contracts.json not found. Please run deployment script first.");
    process.exit(1);
  }

  const contractsData = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
  const tokenAddress = contractsData.contracts.MockERC20.address;
  const stakeVaultAddress = contractsData.contracts.StakeVault.address;

  console.log("Verifying contracts deployed at:");
  console.log("Token:", tokenAddress);
  console.log("StakeVault:", stakeVaultAddress);

  // Get contract instances
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const StakeVault = await ethers.getContractFactory("StakeVault");
  
  const token = MockERC20.attach(tokenAddress);
  const stakeVault = StakeVault.attach(stakeVaultAddress);

  // Verify token contract
  console.log("\n--- MockERC20 Verification ---");
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    
    console.log("✅ Token Name:", name);
    console.log("✅ Token Symbol:", symbol);
    console.log("✅ Decimals:", decimals);
    console.log("✅ Total Supply:", ethers.formatEther(totalSupply), "tokens");
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
  }

  // Verify stake vault contract
  console.log("\n--- StakeVault Verification ---");
  try {
    const stakingToken = await stakeVault.stakingToken();
    const lockPeriod = await stakeVault.LOCK_PERIOD();
    const apyPercentage = await stakeVault.APY_PERCENTAGE();
    const totalStaked = await stakeVault.totalStakedAmount();
    
    console.log("✅ Staking Token:", stakingToken);
    console.log("✅ Lock Period:", Number(lockPeriod) / (24 * 60 * 60), "days");
    console.log("✅ APY Percentage:", Number(apyPercentage), "%");
    console.log("✅ Total Staked:", ethers.formatEther(totalStaked), "tokens");
    console.log("✅ Token Address Match:", stakingToken === tokenAddress);
  } catch (error) {
    console.error("❌ StakeVault verification failed:", error.message);
  }

  // Check contract balances
  console.log("\n--- Contract Balances ---");
  try {
    const vaultBalance = await token.balanceOf(stakeVaultAddress);
    console.log("✅ StakeVault Token Balance:", ethers.formatEther(vaultBalance), "tokens");
  } catch (error) {
    console.error("❌ Balance check failed:", error.message);
  }

  console.log("\n✅ Verification completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
