// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StakeVault
 * @dev A staking contract that allows users to stake ETH and earn rewards
 */
contract StakeVault is Ownable, ReentrancyGuard {
    uint256 public constant LOCK_PERIOD = 30 days;
    uint256 public constant APY_PERCENTAGE = 10;
    uint256 public constant YEAR_IN_SECONDS = 365 days;
    uint256 public constant PERCENTAGE_DENOMINATOR = 100;
    
    struct StakingPool {
        uint256 minStake;       // minimum stake amount
        uint256 maxStake;       // maximum stake amount
        uint256 apy;            // annual percentage yield
        bool isActive;          // whether pool accepts new stakes
        string name;            // pool name
    }
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        bool claimed;
        uint256 poolId;         // which pool this stake belongs to
    }
    
    mapping(uint256 => StakingPool) public stakingPools;
    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public totalStaked; // user => total ETH amount
    uint256 public totalStakedETH; // total ETH staked in contract
    uint256 public poolCount;
    
    event PoolCreated(uint256 indexed poolId, string name, uint256 apy);
    event PoolUpdated(uint256 indexed poolId, bool isActive);
    event Staked(address indexed user, uint256 amount, uint256 timestamp, uint256 stakeIndex, uint256 poolId);
    event Claimed(address indexed user, uint256 reward, uint256 stakeIndex);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 stakeIndex);
    
    constructor() Ownable(msg.sender) {
        // Create default ETH pools
        _createPool(1 ether, 1000 ether, 8, true, "ETH Flexible Pool");
        _createPool(5 ether, 5000 ether, 12, true, "ETH Premium Pool");
    }
    
    /**
     * @dev Create a new staking pool
     */
    function createPool(
        uint256 minStake,
        uint256 maxStake,
        uint256 apy,
        bool isActive,
        string memory name
    ) external onlyOwner returns (uint256) {
        return _createPool(minStake, maxStake, apy, isActive, name);
    }
    
    function _createPool(
        uint256 minStake,
        uint256 maxStake,
        uint256 apy,
        bool isActive,
        string memory name
    ) internal returns (uint256) {
        require(minStake > 0 && maxStake >= minStake, "StakeVault: Invalid stake limits");
        require(apy > 0 && apy <= 10000, "StakeVault: Invalid APY"); // Max 100x APY
        
        uint256 poolId = poolCount++;
        stakingPools[poolId] = StakingPool({
            minStake: minStake,
            maxStake: maxStake,
            apy: apy,
            isActive: isActive,
            name: name
        });
        
        emit PoolCreated(poolId, name, apy);
        return poolId;
    }
    
    /**
     * @dev Stake ETH to a specific pool
     * @param poolId ID of the staking pool
     */
    function stakeToPool(uint256 poolId) external payable nonReentrant {
        require(poolId < poolCount, "StakeVault: Invalid pool ID");
        require(msg.value > 0, "StakeVault: Must send ETH to stake");
        
        StakingPool memory pool = stakingPools[poolId];
        require(pool.isActive, "StakeVault: Pool is not active");
        
        uint256 stakeAmount = msg.value;
        
        require(stakeAmount >= pool.minStake, 
            string(abi.encodePacked(
                "StakeVault: ETH amount below minimum stake. Required: ",
                _formatEther(pool.minStake),
                " ETH, Provided: ",
                _formatEther(stakeAmount),
                " ETH"
            ))
        );
        require(stakeAmount <= pool.maxStake, 
            string(abi.encodePacked(
                "StakeVault: ETH amount above maximum stake. Maximum: ",
                _formatEther(pool.maxStake),
                " ETH, Provided: ",
                _formatEther(stakeAmount),
                " ETH"
            ))
        );
        
        // Create new stake
        userStakes[msg.sender].push(Stake({
            amount: stakeAmount,
            timestamp: block.timestamp,
            claimed: false,
            poolId: poolId
        }));
        
        totalStaked[msg.sender] += stakeAmount;
        totalStakedETH += stakeAmount;
        
        uint256 stakeIndex = userStakes[msg.sender].length - 1;
        emit Staked(msg.sender, stakeAmount, block.timestamp, stakeIndex, poolId);
    }
    
    /**
     * @dev Stake ETH with pool selection
     * @param poolId ID of the staking pool to stake to
     */
    function stake(uint256 poolId) external payable nonReentrant {
        require(poolId < poolCount, "StakeVault: Invalid pool ID");
        require(msg.value > 0, "StakeVault: Must send ETH to stake");
        
        StakingPool memory pool = stakingPools[poolId];
        require(pool.isActive, "StakeVault: Pool is not active");
        
        uint256 stakeAmount = msg.value;
        
        require(stakeAmount >= pool.minStake, 
            string(abi.encodePacked(
                "StakeVault: ETH amount below minimum stake. Required: ",
                _formatEther(pool.minStake),
                " ETH, Provided: ",
                _formatEther(stakeAmount),
                " ETH"
            ))
        );
        require(stakeAmount <= pool.maxStake, 
            string(abi.encodePacked(
                "StakeVault: ETH amount above maximum stake. Maximum: ",
                _formatEther(pool.maxStake),
                " ETH, Provided: ",
                _formatEther(stakeAmount),
                " ETH"
            ))
        );
        
        // Create new stake
        userStakes[msg.sender].push(Stake({
            amount: stakeAmount,
            timestamp: block.timestamp,
            claimed: false,
            poolId: poolId
        }));
        
        totalStaked[msg.sender] += stakeAmount;
        totalStakedETH += stakeAmount;
        
        uint256 stakeIndex = userStakes[msg.sender].length - 1;
        emit Staked(msg.sender, stakeAmount, block.timestamp, stakeIndex, poolId);
    }
    
    /**
     * @dev Helper function to format ether amounts for error messages
     */
    function _formatEther(uint256 amount) internal pure returns (string memory) {
        // Simple formatting: convert wei to ether with 4 decimal places
        uint256 wholePart = amount / 1 ether;
        uint256 fractionalPart = (amount % 1 ether) / 1e14; // 4 decimal places
        
        if (fractionalPart == 0) {
            return string(abi.encodePacked(_uint2str(wholePart)));
        } else {
            return string(abi.encodePacked(_uint2str(wholePart), ".", _uint2str(fractionalPart)));
        }
    }
    
    /**
     * @dev Helper function to convert uint to string
     */
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @dev Get pool information for validation
     */
    function getPoolInfo(uint256 poolId) external view returns (
        uint256 minStake,
        uint256 maxStake,
        uint256 apy,
        bool isActive,
        string memory name
    ) {
        require(poolId < poolCount, "StakeVault: Invalid pool ID");
        StakingPool memory pool = stakingPools[poolId];
        return (
            pool.minStake,
            pool.maxStake,
            pool.apy,
            pool.isActive,
            pool.name
        );
    }
    
    function claim(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < userStakes[msg.sender].length, "StakeVault: Invalid stake index");
        
        Stake storage userStake = userStakes[msg.sender][stakeIndex];
        require(!userStake.claimed, "StakeVault: Already claimed");
        require(userStake.amount > 0, "StakeVault: No stake found");
        
        StakingPool memory pool = stakingPools[userStake.poolId];
        uint256 reward = calculateReward(userStake.amount, userStake.timestamp, pool.apy);
        require(reward > 0, "StakeVault: No rewards available");
        
        userStake.claimed = true;
        
        // Transfer ETH reward
        require(address(this).balance >= reward, "StakeVault: Insufficient ETH for rewards");
        payable(msg.sender).transfer(reward);
        
        emit Claimed(msg.sender, reward, stakeIndex);
    }
    
    /**
     * @dev Unstake ETH and claim rewards
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
            StakingPool memory pool = stakingPools[userStake.poolId];
            reward = calculateReward(userStake.amount, userStake.timestamp, pool.apy);
        }
        
        // Update state
        totalStaked[msg.sender] -= stakedAmount;
        totalStakedETH -= stakedAmount;
        
        // Reset stake
        userStake.amount = 0;
        userStake.claimed = true;
        
        // Transfer ETH (staked amount + rewards)
        uint256 totalAmount = stakedAmount + reward;
        require(address(this).balance >= totalAmount, "StakeVault: Insufficient ETH balance");
        payable(msg.sender).transfer(totalAmount);
        
        emit Unstaked(msg.sender, stakedAmount, reward, stakeIndex);
    }
    
    /**
     * @dev Calculate reward with custom APY
     */
    function calculateReward(uint256 amount, uint256 stakeTimestamp, uint256 apy) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - stakeTimestamp;
        return (amount * apy * timeElapsed) / (YEAR_IN_SECONDS * PERCENTAGE_DENOMINATOR);
    }
    
    /**
     * @dev Legacy calculateReward for backward compatibility
     */
    function calculateReward(uint256 amount, uint256 stakeTimestamp) public view returns (uint256) {
        return calculateReward(amount, stakeTimestamp, APY_PERCENTAGE);
    }
    
    /**
     * @dev Get user stakes
     */
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }
    
    /**
     * @dev Get total staked amount for user
     */
    function getTotalStaked(address user) external view returns (uint256) {
        return totalStaked[user];
    }
    
    /**
     * @dev Get contract ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Allow owner to fund contract with ETH for rewards
     */
    function fundRewards() external payable onlyOwner {
        // Contract now accepts ETH for reward payments
    }
    
    /**
     * @dev Emergency withdraw function for owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "StakeVault: No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Update pool status
     */
    function updatePoolStatus(uint256 poolId, bool isActive) external onlyOwner {
        require(poolId < poolCount, "StakeVault: Invalid pool ID");
        stakingPools[poolId].isActive = isActive;
        emit PoolUpdated(poolId, isActive);
    }
}
