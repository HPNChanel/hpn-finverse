/**
 * Staking Rewards Calculation Utilities - ETH Only
 * All staking rewards are distributed in ETH, for ETH staking.
 */

// ETH-only reward calculation - no conversion needed

/**
 * Reward calculation interface
 */
export interface RewardCalculation {
  dailyReward: number;
  monthlyReward: number;
  totalReward: number;
  rewardToken: string;
  principalToken: string;
  apy: number;
  duration: number;
}

/**
 * Calculate staking rewards in ETH
 * @param amount - Amount staked
 * @param apy - Annual Percentage Yield
 * @param days - Duration in days
 * @param principalToken - Token being staked (always ETH)
 * @returns Reward calculation details
 */
export function calculateStakingRewards(
  amount: number,
  apy: number,
  days: number,
  principalToken: string = 'ETH'
): RewardCalculation {
  if (amount <= 0 || apy <= 0 || days <= 0) {
    return {
      dailyReward: 0,
      monthlyReward: 0,
      totalReward: 0,
      rewardToken: 'ETH',
      principalToken,
      apy,
      duration: days,
    };
  }

  // Calculate base reward in ETH
  const annualReward = amount * (apy / 100);
  const dailyRewardRate = annualReward / 365;
  const totalReward = dailyRewardRate * days;

  return {
    dailyReward: dailyRewardRate,
    monthlyReward: dailyRewardRate * 30,
    totalReward,
    rewardToken: 'ETH',
    principalToken,
    apy,
    duration: days,
  };
}

/**
 * Format reward amount for display
 * @param amount - Reward amount
 * @param showSymbol - Whether to show ETH symbol
 * @returns Formatted string
 */
export function formatRewardAmount(amount: number, showSymbol: boolean = true): string {
  if (amount === 0) return showSymbol ? '0 ETH' : '0';
  
  let formatted: string;
  
  if (amount < 0.0001) {
    formatted = '< 0.0001';
  } else if (amount < 1) {
    formatted = amount.toFixed(6);
  } else if (amount < 1000) {
    formatted = amount.toFixed(4);
  } else if (amount < 1000000) {
    formatted = (amount / 1000).toFixed(2) + 'K';
  } else {
    formatted = (amount / 1000000).toFixed(2) + 'M';
  }
  
  return showSymbol ? `${formatted} ETH` : formatted;
}

/**
 * Get default reward calculation for zero state
 */
export function getDefaultRewardCalculation(): RewardCalculation {
  return {
    dailyReward: 0,
    monthlyReward: 0,
    totalReward: 0,
    rewardToken: 'ETH',
    principalToken: 'ETH',
    apy: 0,
    duration: 0,
  };
}

/**
 * Get reward description text
 * @param calculation - Reward calculation
 * @returns Description string
 */
export function getRewardDescription(calculation: RewardCalculation): string {
  if (calculation.totalReward === 0) {
    return 'No rewards calculated yet.';
  }

  return `ETH staking rewards are distributed in ETH tokens (1:1 ratio).`;
}

/**
 * Calculate compound rewards with reinvestment
 * @param principal - Initial amount
 * @param apy - Annual Percentage Yield
 * @param days - Duration in days
 * @param compoundFrequency - How often to compound (daily = 365, monthly = 12)
 * @returns Compound reward calculation
 */
export function calculateCompoundRewards(
  principal: number,
  apy: number,
  days: number,
  compoundFrequency: number = 365
): RewardCalculation {
  if (principal <= 0 || apy <= 0 || days <= 0) {
    return getDefaultRewardCalculation();
  }

  const rate = apy / 100;
  const periodsPerYear = compoundFrequency;
  const years = days / 365;
  
  // Compound interest formula: A = P(1 + r/n)^(nt)
  const finalAmount = principal * Math.pow(1 + rate / periodsPerYear, periodsPerYear * years);
  const totalReward = finalAmount - principal;
  
  return {
    dailyReward: totalReward / days,
    monthlyReward: totalReward / (days / 30),
    totalReward,
    rewardToken: 'ETH',
    principalToken: 'ETH',
    apy,
    duration: days,
  };
}

/**
 * Get reward summary text
 * @param calculation - Reward calculation
 * @returns Summary string
 */
export function getRewardSummary(calculation: RewardCalculation): string {
  if (calculation.totalReward === 0) {
    return 'No rewards to display.';
  }

  return `Earn ${formatRewardAmount(calculation.totalReward)} in ETH tokens.`;
} 