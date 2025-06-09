const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeVault", function () {
  let stakeVault, token, owner, user1, user2;
  
  // Deploy contracts before each test
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy(
      "FinVerse Token",
      "FVT",
      ethers.parseEther("1000000"), // 1M tokens initial supply
      18
    );

    // Deploy StakeVault
    const StakeVault = await ethers.getContractFactory("StakeVault");
    stakeVault = await StakeVault.deploy();

    // Create ERC20 staking pool for the token
    await stakeVault.createPool(
      token.target,
      ethers.parseEther("1"), // 1 FVT minimum
      ethers.parseEther("10000"), // 10,000 FVT maximum
      10, // 10% APY
      true,
      "FVT Test Pool"
    );

    // Mint tokens to users for testing
    await token.mint(user1.address, ethers.parseEther("10000"));
    await token.mint(user2.address, ethers.parseEther("5000"));
    
    // Deposit reward tokens to vault
    await token.mint(owner.address, ethers.parseEther("100000"));
    await token.approve(stakeVault.target, ethers.parseEther("100000"));
    await stakeVault.depositRewards(ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set the correct staking token", async function () {
      expect(await stakeVault.stakingToken()).to.equal(token.target);
    });

    it("Should set the correct constants", async function () {
      expect(await stakeVault.LOCK_PERIOD()).to.equal(30 * 24 * 60 * 60);
      expect(await stakeVault.APY_PERCENTAGE()).to.equal(10);
    });

    it("Should have created the ERC20 pool", async function () {
      const poolCount = await stakeVault.poolCount();
      expect(poolCount).to.equal(3); // 2 ETH pools + 1 FVT pool
      
      const fvtPool = await stakeVault.stakingPools(2);
      expect(fvtPool.tokenAddress).to.equal(token.target);
      expect(fvtPool.isActive).to.be.true;
      expect(fvtPool.apy).to.equal(10);
    });
  });

  describe("Staking Functionality", function () {
    it("Should transfer tokens and update stake info when staking to ERC20 pool", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const initialUserBalance = await token.balanceOf(user1.address);
      const initialVaultBalance = await token.balanceOf(stakeVault.target);
      
      // Approve and stake tokens to ERC20 pool (pool ID 2)
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      
      const stakeTx = await stakeVault.connect(user1).stake(stakeAmount, 2); // Pool 2 is FVT pool
      const blockTime = await time.latest();
      
      // Verify token transfers
      expect(await token.balanceOf(user1.address)).to.equal(initialUserBalance - stakeAmount);
      expect(await token.balanceOf(stakeVault.target)).to.equal(initialVaultBalance + stakeAmount);
      
      // Verify stake info updates
      expect(await stakeVault.getTotalStaked(user1.address)).to.equal(stakeAmount);
      expect(await stakeVault.totalStakedAmount()).to.equal(stakeAmount);
      expect(await stakeVault.getUserStakeCount(user1.address)).to.equal(1);
      
      // Verify stake details
      const userStake = await stakeVault.getUserStake(user1.address, 0);
      expect(userStake.amount).to.equal(stakeAmount);
      expect(userStake.timestamp).to.equal(blockTime);
      expect(userStake.claimed).to.be.false;
      expect(userStake.poolId).to.equal(2);
      
      // Verify event emission with updated parameters
      await expect(stakeTx)
        .to.emit(stakeVault, "Staked")
        .withArgs(user1.address, stakeAmount, blockTime, 0, 2, token.target);
    });

    it("Should allow ETH staking to ETH pool", async function () {
      const ethAmount = ethers.parseEther("1");
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      
      // Stake ETH to pool 0 (ETH Flexible Pool)
      const stakeTx = await stakeVault.connect(user1).stake(ethAmount, 0, { value: ethAmount });
      const receipt = await stakeTx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Verify ETH was deducted (including gas)
      const finalUserBalance = await ethers.provider.getBalance(user1.address);
      expect(finalUserBalance).to.be.closeTo(
        initialUserBalance - ethAmount - gasUsed,
        ethers.parseEther("0.001") // Allow small variance for gas calculation
      );
      
      // Verify stake was created
      expect(await stakeVault.getUserStakeCount(user1.address)).to.equal(1);
      
      const userStake = await stakeVault.getUserStake(user1.address, 0);
      expect(userStake.amount).to.equal(ethAmount);
      expect(userStake.tokenAddress).to.equal(ethers.ZeroAddress); // ETH_ADDRESS
      expect(userStake.poolId).to.equal(0);
    });

    it("Should allow multiple stakes from same user to different pools", async function () {
      const erc20StakeAmount = ethers.parseEther("500");
      const ethStakeAmount = ethers.parseEther("0.5");
      
      // First stake: ERC20 to pool 2
      await token.connect(user1).approve(stakeVault.target, erc20StakeAmount);
      await stakeVault.connect(user1).stake(erc20StakeAmount, 2);
      
      // Second stake: ETH to pool 0
      await stakeVault.connect(user1).stake(ethStakeAmount, 0, { value: ethStakeAmount });
      
      expect(await stakeVault.getUserStakeCount(user1.address)).to.equal(2);
      
      // Check individual stakes
      const stake1 = await stakeVault.getUserStake(user1.address, 0);
      const stake2 = await stakeVault.getUserStake(user1.address, 1);
      
      expect(stake1.amount).to.equal(erc20StakeAmount);
      expect(stake1.tokenAddress).to.equal(token.target);
      expect(stake1.poolId).to.equal(2);
      
      expect(stake2.amount).to.equal(ethStakeAmount);
      expect(stake2.tokenAddress).to.equal(ethers.ZeroAddress);
      expect(stake2.poolId).to.equal(0);
    });

    it("Should revert when staking 0 tokens to ERC20 pool", async function () {
      await expect(stakeVault.connect(user1).stake(0, 2))
        .to.be.revertedWith("StakeVault: Amount must be greater than 0 for ERC20 staking");
    });

    it("Should revert when staking 0 ETH to ETH pool", async function () {
      await expect(stakeVault.connect(user1).stake(0, 0))
        .to.be.revertedWith("StakeVault: Must send ETH to stake");
    });

    it("Should revert when insufficient allowance for ERC20", async function () {
      await expect(stakeVault.connect(user1).stake(ethers.parseEther("100"), 2))
        .to.be.revertedWith("StakeVault: Insufficient token allowance");
    });
  });

  describe("Time Simulation and Reward Calculation", function () {
    beforeEach(async function () {
      // Setup a stake for testing - use pool-based staking
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount, 2); // Stake to FVT pool
    });

    it("Should return correct reward after 30 days using evm_increaseTime", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const thirtyDays = 30 * 24 * 60 * 60;
      
      // Get initial stake timestamp
      const initialStake = await stakeVault.getUserStake(user1.address, 0);
      
      // Simulate 30 days passing
      await network.provider.send("evm_increaseTime", [thirtyDays]);
      await network.provider.send("evm_mine");
      
      // Calculate expected reward: amount * apy * time_elapsed / 365_days / 100
      // For 30 days: 1000 * 10 * (30 * 24 * 60 * 60) / (365 * 24 * 60 * 60) / 100
      const expectedReward = (stakeAmount * 10n * BigInt(thirtyDays)) / (365n * 24n * 60n * 60n * 100n);
      
      const calculatedReward = await stakeVault.calculateReward(stakeAmount, initialStake.timestamp);
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      
      expect(calculatedReward).to.equal(expectedReward);
      expect(pendingReward).to.equal(expectedReward);
    });

    it("Should calculate proportional rewards for different time periods", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const initialStake = await stakeVault.getUserStake(user1.address, 0);
      
      // Test 1 day
      await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      const oneDayReward = await stakeVault.getPendingReward(user1.address, 0);
      
      // Test 7 days total (6 more days)
      await network.provider.send("evm_increaseTime", [6 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      const sevenDayReward = await stakeVault.getPendingReward(user1.address, 0);
      
      // Verify that 7-day reward is approximately 7x the 1-day reward
      const expectedSevenDayReward = oneDayReward * 7n;
      expect(sevenDayReward).to.be.closeTo(expectedSevenDayReward, ethers.parseEther("0.1"));
    });
  });

  describe("Claiming Functionality", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount, 2); // Stake to FVT pool
    });

    it("Should allow claiming rewards after time passes", async function () {
      // Wait some time
      await network.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 15 days
      await network.provider.send("evm_mine");
      
      const initialBalance = await token.balanceOf(user1.address);
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      
      await stakeVault.connect(user1).claim(0);
      
      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + pendingReward);
      
      // Should not be able to claim again
      await expect(stakeVault.connect(user1).claim(0))
        .to.be.revertedWith("StakeVault: Already claimed");
    });

    it("Should not allow claiming rewards before any time passes", async function () {
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      expect(pendingReward).to.equal(0);
    });

    it("Should revert when claiming non-existent stake", async function () {
      await expect(stakeVault.connect(user1).claim(999))
        .to.be.revertedWith("StakeVault: Invalid stake index");
    });
  });

  describe("Unstaking Functionality", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount, 2); // Stake to FVT pool
    });

    it("Should not allow unstaking before lock period", async function () {
      await expect(stakeVault.connect(user1).unstake(0))
        .to.be.revertedWith("StakeVault: Tokens still locked");
    });

    it("Should allow unstaking after lock period", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const stakeAmount = ethers.parseEther("1000");
      
      // Wait for lock period
      await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]); // 31 days
      await network.provider.send("evm_mine");
      
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      
      await stakeVault.connect(user1).unstake(0);
      
      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + stakeAmount + pendingReward);
    });

    it("Should handle unstaking with already claimed rewards", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      const stakeAmount = ethers.parseEther("1000");
      
      // Wait some time and claim
      await network.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 15 days
      await network.provider.send("evm_mine");
      
      const midReward = await stakeVault.getPendingReward(user1.address, 0);
      await stakeVault.connect(user1).claim(0);
      
      // Wait for lock period to complete
      await network.provider.send("evm_increaseTime", [16 * 24 * 60 * 60]); // 16 more days
      await network.provider.send("evm_mine");
      
      const balanceAfterClaim = await token.balanceOf(user1.address);
      await stakeVault.connect(user1).unstake(0);
      
      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.equal(balanceAfterClaim + stakeAmount); // Only principal, no additional reward
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete staking lifecycle with pool-based staking", async function () {
      const erc20Amount = ethers.parseEther("2000");
      const initialBalance = await token.balanceOf(user1.address);
      
      // 1. Stake tokens to ERC20 pool
      await token.connect(user1).approve(stakeVault.target, erc20Amount);
      await stakeVault.connect(user1).stake(erc20Amount, 2); // FVT pool
      
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - erc20Amount);
      
      // 2. Wait and claim rewards
      await network.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 15 days
      await network.provider.send("evm_mine");
      
      const midReward = await stakeVault.getPendingReward(user1.address, 0);
      await stakeVault.connect(user1).claim(0);
      
      // 3. Wait for lock period and unstake
      await network.provider.send("evm_increaseTime", [16 * 24 * 60 * 60]); // 16 more days
      await network.provider.send("evm_mine");
      
      await stakeVault.connect(user1).unstake(0);
      
      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + midReward);
    });

    it("Should handle multiple users staking to different pools simultaneously", async function () {
      const user1ERC20Stake = ethers.parseEther("1000");
      const user2ETHStake = ethers.parseEther("1");
      
      // User 1 stakes ERC20 to pool 2
      await token.connect(user1).approve(stakeVault.target, user1ERC20Stake);
      await stakeVault.connect(user1).stake(user1ERC20Stake, 2);
      
      // User 2 stakes ETH to pool 0
      await stakeVault.connect(user2).stake(user2ETHStake, 0, { value: user2ETHStake });
      
      // Verify stakes exist
      expect(await stakeVault.getUserStakeCount(user1.address)).to.equal(1);
      expect(await stakeVault.getUserStakeCount(user2.address)).to.equal(1);
      
      // Fast forward past lock period
      await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      // Both users unstake
      const user1InitialBalance = await token.balanceOf(user1.address);
      const user2InitialETHBalance = await ethers.provider.getBalance(user2.address);
      
      const user1Reward = await stakeVault.getPendingReward(user1.address, 0);
      const user2Reward = await stakeVault.getPendingReward(user2.address, 0);
      
      await stakeVault.connect(user1).unstake(0);
      const unstakeTx = await stakeVault.connect(user2).unstake(0);
      const receipt = await unstakeTx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      // Verify final balances
      expect(await token.balanceOf(user1.address)).to.equal(user1InitialBalance + user1Reward);
      
      const user2FinalETHBalance = await ethers.provider.getBalance(user2.address);
      expect(user2FinalETHBalance).to.be.closeTo(
        user2InitialETHBalance + user2Reward - gasUsed,
        ethers.parseEther("0.001") // Allow for gas variance
      );
    });
  });
});
