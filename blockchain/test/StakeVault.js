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
    stakeVault = await StakeVault.deploy(token.target);

    // Mint tokens to users for testing
    await token.mint(user1.address, ethers.parseEther("10000"));
    await token.mint(user2.address, ethers.parseEther("5000"));
    
    // Deposit reward tokens to vault
    await token.mint(stakeVault.target, ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set the correct staking token", async function () {
      expect(await stakeVault.stakingToken()).to.equal(token.target);
    });

    it("Should set the correct constants", async function () {
      expect(await stakeVault.LOCK_PERIOD()).to.equal(30 * 24 * 60 * 60);
      expect(await stakeVault.APY_PERCENTAGE()).to.equal(10);
    });
  });

  describe("Staking Functionality", function () {
    it("Should transfer tokens and update stake info when staking", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const initialUserBalance = await token.balanceOf(user1.address);
      const initialVaultBalance = await token.balanceOf(stakeVault.target);
      
      // Approve and stake tokens
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      
      const stakeTx = await stakeVault.connect(user1).stake(stakeAmount);
      const blockTime = await time.latest();
      
      // Verify token transfers
      expect(await token.balanceOf(user1.address)).to.equal(initialUserBalance - stakeAmount);
      expect(await token.balanceOf(stakeVault.target)).to.equal(initialVaultBalance + stakeAmount);
      
      // Verify stake info updates
      expect(await stakeVault.totalStaked(user1.address)).to.equal(stakeAmount);
      expect(await stakeVault.totalStakedAmount()).to.equal(stakeAmount);
      expect(await stakeVault.getUserStakeCount(user1.address)).to.equal(1);
      
      // Verify stake details
      const userStake = await stakeVault.getUserStake(user1.address, 0);
      expect(userStake.amount).to.equal(stakeAmount);
      expect(userStake.timestamp).to.equal(blockTime);
      expect(userStake.claimed).to.be.false;
      
      // Verify event emission
      await expect(stakeTx)
        .to.emit(stakeVault, "Staked")
        .withArgs(user1.address, stakeAmount, blockTime, 0);
    });

    it("Should allow multiple stakes from same user", async function () {
      const firstStake = ethers.parseEther("500");
      const secondStake = ethers.parseEther("300");
      
      // First stake
      await token.connect(user1).approve(stakeVault.target, firstStake);
      await stakeVault.connect(user1).stake(firstStake);
      
      // Second stake
      await token.connect(user1).approve(stakeVault.target, secondStake);
      await stakeVault.connect(user1).stake(secondStake);
      
      expect(await stakeVault.getUserStakeCount(user1.address)).to.equal(2);
      expect(await stakeVault.totalStaked(user1.address)).to.equal(firstStake + secondStake);
      expect(await stakeVault.totalStakedAmount()).to.equal(firstStake + secondStake);
    });

    it("Should revert when staking 0 tokens", async function () {
      await expect(stakeVault.connect(user1).stake(0))
        .to.be.revertedWith("StakeVault: Amount must be greater than 0");
    });

    it("Should revert when insufficient allowance", async function () {
      await expect(stakeVault.connect(user1).stake(ethers.parseEther("100")))
        .to.be.revertedWith("StakeVault: Transfer failed");
    });
  });

  describe("Time Simulation and Reward Calculation", function () {
    beforeEach(async function () {
      // Setup a stake for testing
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount);
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
      
      const oneDayReward = await stakeVault.calculateReward(stakeAmount, initialStake.timestamp);
      const expectedOneDayReward = (stakeAmount * 10n * BigInt(24 * 60 * 60)) / (365n * 24n * 60n * 60n * 100n);
      expect(oneDayReward).to.equal(expectedOneDayReward);
      
      // Test 90 days
      await network.provider.send("evm_increaseTime", [89 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      const ninetyDayReward = await stakeVault.calculateReward(stakeAmount, initialStake.timestamp);
      const expectedNinetyDayReward = (stakeAmount * 10n * BigInt(90 * 24 * 60 * 60)) / (365n * 24n * 60n * 60n * 100n);
      expect(ninetyDayReward).to.equal(expectedNinetyDayReward);
    });

    it("Should return zero reward for zero time elapsed", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const currentTime = await time.latest();
      
      const reward = await stakeVault.calculateReward(stakeAmount, currentTime);
      expect(reward).to.equal(0);
    });
  });

  describe("Claiming Functionality", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount);
    });

    it("Should allow claiming rewards and only work once", async function () {
      // Fast forward 30 days
      await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      const initialBalance = await token.balanceOf(user1.address);
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      
      expect(pendingReward).to.be.gt(0);
      
      // First claim should succeed
      const claimTx = await stakeVault.connect(user1).claim(0);
      
      // Verify reward was transferred
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance + pendingReward);
      
      // Verify stake is marked as claimed
      const userStake = await stakeVault.getUserStake(user1.address, 0);
      expect(userStake.claimed).to.be.true;
      
      // Verify pending reward is now zero
      expect(await stakeVault.getPendingReward(user1.address, 0)).to.equal(0);
      
      // Verify event emission
      await expect(claimTx)
        .to.emit(stakeVault, "Claimed")
        .withArgs(user1.address, pendingReward, 0);
      
      // Second claim should fail
      await expect(stakeVault.connect(user1).claim(0))
        .to.be.revertedWith("StakeVault: Already claimed");
    });

    it("Should not allow claiming with invalid stake index", async function () {
      await expect(stakeVault.connect(user1).claim(999))
        .to.be.revertedWith("StakeVault: Invalid stake index");
    });

    it("Should not allow claiming zero rewards", async function () {
      // Try to claim immediately without time passing
      await expect(stakeVault.connect(user1).claim(0))
        .to.be.revertedWith("StakeVault: No rewards available");
    });
  });

  describe("Unstaking Functionality", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount);
    });

    it("Should refund user after lock period and include rewards", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const initialBalance = await token.balanceOf(user1.address);
      
      // Fast forward past lock period (31 days)
      await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      // Check can unstake
      expect(await stakeVault.canUnstake(user1.address, 0)).to.be.true;
      
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      expect(pendingReward).to.be.gt(0);
      
      // Unstake
      const unstakeTx = await stakeVault.connect(user1).unstake(0);
      
      // Verify user received staked amount + rewards
      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + pendingReward);
      
      // Verify stake info is updated
      expect(await stakeVault.totalStaked(user1.address)).to.equal(0);
      expect(await stakeVault.totalStakedAmount()).to.equal(0);
      
      // Verify stake is reset
      const userStake = await stakeVault.getUserStake(user1.address, 0);
      expect(userStake.amount).to.equal(0);
      expect(userStake.claimed).to.be.true;
      
      // Verify event emission
      await expect(unstakeTx)
        .to.emit(stakeVault, "Unstaked")
        .withArgs(user1.address, stakeAmount, pendingReward, 0);
    });

    it("Should prevent unstaking before lock period", async function () {
      // Try to unstake immediately
      expect(await stakeVault.canUnstake(user1.address, 0)).to.be.false;
      
      await expect(stakeVault.connect(user1).unstake(0))
        .to.be.revertedWith("StakeVault: Tokens still locked");
      
      // Try after 29 days (still locked)
      await network.provider.send("evm_increaseTime", [29 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      expect(await stakeVault.canUnstake(user1.address, 0)).to.be.false;
      
      await expect(stakeVault.connect(user1).unstake(0))
        .to.be.revertedWith("StakeVault: Tokens still locked");
    });

    it("Should handle unstaking after rewards already claimed", async function () {
      const stakeAmount = ethers.parseEther("1000");
      const initialBalance = await token.balanceOf(user1.address);
      
      // Fast forward and claim rewards first
      await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      const pendingReward = await stakeVault.getPendingReward(user1.address, 0);
      await stakeVault.connect(user1).claim(0);
      
      // Now unstake (should only get principal back)
      await stakeVault.connect(user1).unstake(0);
      
      const finalBalance = await token.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance + pendingReward);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complete staking lifecycle", async function () {
      const stakeAmount = ethers.parseEther("2000");
      const initialBalance = await token.balanceOf(user1.address);
      
      // 1. Stake tokens
      await token.connect(user1).approve(stakeVault.target, stakeAmount);
      await stakeVault.connect(user1).stake(stakeAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(initialBalance - stakeAmount);
      
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

    it("Should handle multiple users staking simultaneously", async function () {
      const user1Stake = ethers.parseEther("1000");
      const user2Stake = ethers.parseEther("500");
      
      // Both users stake
      await token.connect(user1).approve(stakeVault.target, user1Stake);
      await stakeVault.connect(user1).stake(user1Stake);
      
      await token.connect(user2).approve(stakeVault.target, user2Stake);
      await stakeVault.connect(user2).stake(user2Stake);
      
      expect(await stakeVault.totalStakedAmount()).to.equal(user1Stake + user2Stake);
      
      // Fast forward past lock period
      await network.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await network.provider.send("evm_mine");
      
      // Both users unstake
      const user1InitialBalance = await token.balanceOf(user1.address);
      const user2InitialBalance = await token.balanceOf(user2.address);
      
      const user1Reward = await stakeVault.getPendingReward(user1.address, 0);
      const user2Reward = await stakeVault.getPendingReward(user2.address, 0);
      
      await stakeVault.connect(user1).unstake(0);
      await stakeVault.connect(user2).unstake(0);
      
      expect(await token.balanceOf(user1.address)).to.equal(user1InitialBalance + user1Reward);
      expect(await token.balanceOf(user2.address)).to.equal(user2InitialBalance + user2Reward);
      expect(await stakeVault.totalStakedAmount()).to.equal(0);
    });
  });
});
