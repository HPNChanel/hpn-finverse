const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the deployer account and test user
  const [deployer, testUser] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Test user account:", testUser ? testUser.address : "No test user available");
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy MockERC20 token
  console.log("\n--- Deploying MockERC20 Token ---");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const tokenName = "FinVerse Token";
  const tokenSymbol = "FVT";
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  const decimals = 18;
  
  console.log(`Deploying ${tokenName} (${tokenSymbol})...`);
  const token = await MockERC20.deploy(tokenName, tokenSymbol, initialSupply, decimals);
  await token.waitForDeployment();
  
  console.log("MockERC20 deployed to:", token.target);
  console.log("Token Name:", tokenName);
  console.log("Token Symbol:", tokenSymbol);
  console.log("Initial Supply:", ethers.formatEther(initialSupply), "tokens");

  // Deploy StakeVault
  console.log("\n--- Deploying StakeVault ---");
  const StakeVault = await ethers.getContractFactory("StakeVault");
  
  console.log("Deploying StakeVault with token address:", token.target);
  const stakeVault = await StakeVault.deploy(token.target);
  await stakeVault.waitForDeployment();
  
  console.log("StakeVault deployed to:", stakeVault.target);

  // Verify deployment
  console.log("\n--- Verifying Deployment ---");
  const stakingTokenAddress = await stakeVault.stakingToken();
  console.log("StakeVault staking token address:", stakingTokenAddress);
  console.log("Token address matches:", stakingTokenAddress === token.target);

  // Check initial deployer balance (should have initial supply)
  console.log("\n--- Initial Token Distribution ---");
  const initialDeployerBalance = await token.balanceOf(deployer.address);
  console.log(`Initial deployer FVT balance: ${ethers.formatEther(initialDeployerBalance)} tokens`);

  // Transfer test amount to user wallet if available
  if (testUser) {
    console.log("\n--- Transferring Test Tokens to User ---");
    const transferAmount = ethers.parseEther("1000"); // 1K tokens for testing
    await token.transfer(testUser.address, transferAmount);
    console.log(`Transferred ${ethers.formatEther(transferAmount)} FVT tokens to test user`);
    
    // Verify user received the tokens
    const userBalance = await token.balanceOf(testUser.address);
    console.log(`Test user FVT balance: ${ethers.formatEther(userBalance)} tokens`);
    console.log(`Test user address: ${testUser.address}`);
    
    // Test user approves and stakes some tokens
    console.log("\n--- Test User Staking Operations ---");
    const stakeAmount = ethers.parseEther("100"); // 100 tokens for staking test
    
    // Connect to token contract as test user and approve
    const tokenAsUser = token.connect(testUser);
    await tokenAsUser.approve(stakeVault.target, stakeAmount);
    console.log(`User approved ${ethers.formatEther(stakeAmount)} FVT for staking`);
    
    // Connect to vault contract as test user and stake
    const vaultAsUser = stakeVault.connect(testUser);
    await vaultAsUser.stake(stakeAmount);
    console.log(`User staked ${ethers.formatEther(stakeAmount)} FVT tokens`);
    
    // Check updated balances
    const userBalanceAfterStake = await token.balanceOf(testUser.address);
    const userTotalStaked = await stakeVault.totalStaked(testUser.address);
    console.log(`User FVT balance after staking: ${ethers.formatEther(userBalanceAfterStake)} tokens`);
    console.log(`User total staked: ${ethers.formatEther(userTotalStaked)} tokens`);
    
  } else {
    console.log("\n--- No Test User Available ---");
    console.log("To test with a user wallet, make sure you have multiple accounts configured in Hardhat");
    console.log("You can manually transfer tokens using: await token.transfer(userAddress, ethers.parseEther('1000'))");
  }

  // Deposit some reward tokens to the vault (from deployer)
  console.log("\n--- Depositing Reward Tokens ---");
  const rewardAmount = ethers.parseEther("50000"); // 50k tokens for rewards
  await token.approve(stakeVault.target, rewardAmount);
  await stakeVault.depositRewards(rewardAmount);
  console.log(`Deposited ${ethers.formatEther(rewardAmount)} tokens as rewards`);

  // Final balance check
  console.log("\n--- Final Token Balances ---");
  const finalDeployerBalance = await token.balanceOf(deployer.address);
  console.log(`Deployer final balance: ${ethers.formatEther(finalDeployerBalance)} FVT`);
  
  if (testUser) {
    const finalUserBalance = await token.balanceOf(testUser.address);
    console.log(`Test user final balance: ${ethers.formatEther(finalUserBalance)} FVT`);
  }

  // Print deployment summary
  console.log("\n--- Deployment Summary ---");
  console.log("Deployer:", deployer.address);
  console.log("Test User:", testUser ? testUser.address : "Not available");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("MockERC20 Address:", token.target);
  console.log("StakeVault Address:", stakeVault.target);

  // Generate .env file for frontend
  console.log("\n--- Generating Environment File ---");
  await generateEnvFile(token.target, stakeVault.target, deployer.address);

  console.log("\n✅ Deployment completed successfully!");
  
  return {
    token: token.target,
    stakeVault: stakeVault.target,
    deployer: deployer.address,
    testUser: testUser ? testUser.address : null
  };
}

async function generateEnvFile(tokenAddress, stakeVaultAddress, deployerAddress) {
  const envContent = `# Contract Addresses - Generated by deployment script
# Network: ${(await ethers.provider.getNetwork()).name}
# Deployed at: ${new Date().toISOString()}

# MockERC20 Token Contract
REACT_APP_TOKEN_ADDRESS=${tokenAddress}
TOKEN_ADDRESS=${tokenAddress}

# StakeVault Contract
REACT_APP_STAKE_VAULT_ADDRESS=${stakeVaultAddress}
STAKE_VAULT_ADDRESS=${stakeVaultAddress}

# Deployer Address
DEPLOYER_ADDRESS=${deployerAddress}

# Token Details
TOKEN_NAME=FinVerse Token
TOKEN_SYMBOL=FVT
TOKEN_DECIMALS=18

# Staking Parameters
LOCK_PERIOD_DAYS=30
APY_PERCENTAGE=10
`;

  const envPath = path.join(__dirname, "..", ".env");
  fs.writeFileSync(envPath, envContent);
  console.log("Environment file generated at:", envPath);
  
  // Also create a contracts.json file for easy import
  const contractsJson = {
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    contracts: {
      MockERC20: {
        address: tokenAddress,
        name: "FinVerse Token",
        symbol: "FVT",
        decimals: 18
      },
      StakeVault: {
        address: stakeVaultAddress,
        stakingToken: tokenAddress,
        lockPeriod: "30 days",
        apy: "10%"
      }
    },
    deployer: deployerAddress
  };
  
  const contractsPath = path.join(__dirname, "..", "contracts.json");
  fs.writeFileSync(contractsPath, JSON.stringify(contractsJson, null, 2));
  console.log("Contracts JSON generated at:", contractsPath);

  // Copy contracts.json to frontend public/contracts directory
  const frontendPublicDir = path.join(__dirname, "..", "..", "finverse_ui", "public");
  const frontendContractsDir = path.join(frontendPublicDir, "contracts");
  
  try {
    // Ensure the contracts directory exists
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
      console.log("Created contracts directory in frontend public folder");
    }
    
    // Copy to the correct location: public/contracts/contracts.json
    const frontendContractsPath = path.join(frontendContractsDir, "contracts.json");
    fs.writeFileSync(frontendContractsPath, JSON.stringify(contractsJson, null, 2));
    console.log("✅ Contracts JSON copied to frontend at:", frontendContractsPath);
    
    // Also copy to root public directory as fallback
    const frontendRootContractsPath = path.join(frontendPublicDir, "contracts.json");
    fs.writeFileSync(frontendRootContractsPath, JSON.stringify(contractsJson, null, 2));
    console.log("✅ Contracts JSON also copied to fallback location:", frontendRootContractsPath);
    
    // Verify the file was written correctly
    const writtenData = JSON.parse(fs.readFileSync(frontendContractsPath, 'utf8'));
    if (writtenData.contracts.MockERC20.address === tokenAddress) {
      console.log("✅ File verification passed - contracts.json is valid");
    } else {
      console.warn("⚠️ File verification failed - data mismatch");
    }
    
  } catch (copyError) {
    console.error("❌ Failed to copy contracts.json to frontend:", copyError.message);
    console.error("Please manually copy the file from blockchain/contracts.json to finverse_ui/public/contracts/contracts.json");
  }
}

// Handle errors
main()
  .then((result) => {
    console.log("\n🎉 All contracts deployed successfully!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
