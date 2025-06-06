// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakeVault
 * @dev A staking contract that allows users to stake ERC20 tokens and earn 10% APY rewards
 */
contract StakeVault is Ownable, ReentrancyGuard {
    IERC20 public immutable stakingToken;
    
    uint256 public constant LOCK_PERIOD = 30 days;
    uint256 public constant APY_PERCENTAGE = 10;
    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }
    
    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public totalStaked;
    uint256 public totalStakedAmount;
    
    event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 stakeIndex);
    event Claimed(address indexed user, uint256 reward, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeIndex);
    
    constructor(address _stakingToken) Ownable(msg.sender) {
        require(_stakingToken != address(0), "StakeVault: Invalid token address");
        stakingToken = IERC20(_stakingToken);
    }
    
    /**
     * @dev Stake tokens for rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "StakeVault: Amount must be greater than 0");
        
        // Transfer tokens from user to contract
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "StakeVault: Transfer failed"
        );
        
        // Create new stake
        userStakes[msg.sender].push(Stake({
            amount: amount,
            timestamp: block.timestamp,
            claimed: false
        }));
        
        totalStaked[msg.sender] += amount;
        totalStakedAmount += amount;
        
        uint256 stakeIndex = userStakes[msg.sender].length - 1;
        emit Staked(msg.sender, amount, block.timestamp, stakeIndex);
    }
    
    /**
     * @dev Claim rewards for a specific stake
     * @param stakeIndex Index of the stake to claim rewards for
     */
    function claim(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "StakeVault: Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(!userStake.claimed, "StakeVault: Already claimed");
        require(userStake.amount > 0, "StakeVault: No stake found");
        
        uint256 reward = calculateReward(userStake.amount, userStake.timestamp);
        require(reward > 0, "StakeVault: No rewards available");
        
        userStake.claimed = true;
        
        // Transfer reward to user
        require(
            stakingToken.transfer(msg.sender, reward),
            "StakeVault: Reward transfer failed"
        );
        
        emit Claimed(msg.sender, reward, stakeIndex);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param stakeIndex Index of the stake to unstake
     */
    function unstake(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "StakeVault: Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(userStake.amount > 0, "StakeVault: No stake found");
        require(
            block.timestamp >= userStake.timestamp + LOCK_PERIOD,
            "StakeVault: Tokens still locked"
        );
        
        uint256 stakedAmount = userStake.amount;
        uint256 reward = 0;
        
        // Calculate reward if not claimed
        if (!userStake.claimed) {
            reward = calculateReward(userStake.amount, userStake.timestamp);
        }
        
        // Update state
        totalStaked[msg.sender] -= stakedAmount;
        totalStakedAmount -= stakedAmount;
        
        // Reset stake
        userStake.amount = 0;
        userStake.claimed = true;
        
        // Transfer staked amount back to user
        require(
            stakingToken.transfer(msg.sender, stakedAmount),
            "StakeVault: Stake transfer failed"
        );
        
        // Transfer reward if any
        if (reward > 0) {
            require(
                stakingToken.transfer(msg.sender, reward),
                "StakeVault: Reward transfer failed"
            );
        }
        
        emit Unstaked(msg.sender, stakedAmount, reward, stakeIndex);
    }
    
    /**
     * @dev Calculate reward for a stake
     * @param amount Staked amount
     * @param stakeTimestamp When the stake was created
     * @return Calculated reward amount
     */
    function calculateReward(uint256 amount, uint256 stakeTimestamp) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - stakeTimestamp;
        
        // Reward = amount * apy * time_elapsed / 365_days / 100
        return (amount * APY_PERCENTAGE * timeElapsed) / (YEAR_IN_SECONDS * PERCENTAGE_DENOMINATOR);
    }
    
    /**
     * @dev Get user's stake information
     * @param user User address
     * @param stakeIndex Index of the stake
     * @return Stake information
     */
    function getUserStake(address user, uint256 stakeIndex) external view returns (Stake memory) {
        require(stakeIndex < userStakes[user].length, "StakeVault: Invalid stake index");
        return userStakes[user][stakeIndex];
    }
    
    /**
     * @dev Get number of stakes for a user
     * @param user User address
     * @return Number of stakes
     */
    function getUserStakeCount(address user) external view returns (uint256) {
        return userStakes[user].length;
    }
    
    /**
     * @dev Get pending reward for a specific stake
     * @param user User address
     * @param stakeIndex Index of the stake
     * @return Pending reward amount
     */
    function getPendingReward(address user, uint256 stakeIndex) external view returns (uint256) {
        require(stakeIndex < userStakes[user].length, "StakeVault: Invalid stake index");
        
        Stake memory userStake = userStakes[user][stakeIndex];
        if (userStake.claimed || userStake.amount == 0) {
            return 0;
        }
        
        return calculateReward(userStake.amount, userStake.timestamp);
    }
    
    /**
     * @dev Check if a stake can be unstaked
     * @param user User address
     * @param stakeIndex Index of the stake
     * @return True if stake can be unstaked
     */
    function canUnstake(address user, uint256 stakeIndex) external view returns (bool) {
        if (stakeIndex >= userStakes[user].length) {
            return false;
        }
        
        Stake memory userStake = userStakes[user][stakeIndex];
        return userStake.amount > 0 && 
               block.timestamp >= userStake.timestamp + LOCK_PERIOD;
    }
    
    /**
     * @dev Get all stake IDs (indexes) for a user
     * @param user User address
     * @return Array of stake indexes
     */
    function getUserStakeIds(address user) external view returns (uint256[] memory) {
        uint256 stakeCount = userStakes[user].length;
        uint256[] memory stakeIds = new uint256[](stakeCount);
        
        for (uint256 i = 0; i < stakeCount; i++) {
            stakeIds[i] = i;
        }
        
        return stakeIds;
    }
    
    function getUserStakesDetails(address user, uint256[] calldata stakeIndexes) 
        external view returns (
            uint256[] memory amounts,
            uint256[] memory timestamps,
            bool[] memory claimed,
            uint256[] memory rewards,
            bool[] memory canUnstakeStatus
        ) 
    {
        amounts = new uint256[](stakeIndexes.length);
        timestamps = new uint256[](stakeIndexes.length);
        claimed = new bool[](stakeIndexes.length);
        rewards = new uint256[](stakeIndexes.length);
        canUnstakeStatus = new bool[](stakeIndexes.length);
        
        for (uint256 i = 0; i < stakeIndexes.length; i++) {
            require(stakeIndexes[i] < userStakes[user].length, "StakeVault: Invalid stake index");
            
            Stake memory userStake = userStakes[user][stakeIndexes[i]];
            amounts[i] = userStake.amount;
            timestamps[i] = userStake.timestamp;
            claimed[i] = userStake.claimed;
            
            if (!userStake.claimed && userStake.amount > 0) {
                rewards[i] = calculateReward(userStake.amount, userStake.timestamp);
            } else {
                rewards[i] = 0;
            }
            
            canUnstakeStatus[i] = userStake.amount > 0 && 
                                 block.timestamp >= userStake.timestamp + LOCK_PERIOD;
        }
    }
    
    /**
     * @dev Owner function to deposit reward tokens
     * @param amount Amount of tokens to deposit as rewards
     */
    function depositRewards(uint256 amount) external onlyOwner {
        require(amount > 0, "StakeVault: Amount must be greater than 0");
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "StakeVault: Transfer failed"
        );
    }
    
    /**
     * @dev Emergency function to withdraw tokens (only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "StakeVault: Amount must be greater than 0");
        require(
            stakingToken.transfer(msg.sender, amount),
            "StakeVault: Transfer failed"
        );
    }
}
