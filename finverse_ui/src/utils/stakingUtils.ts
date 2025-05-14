/**
 * Utilities for staking functionality
 */

/**
 * Format wallet address for display
 * @param address Wallet address to format
 * @returns Formatted wallet address with ellipsis in the middle
 */
export function formatWalletAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 12) return address;
  
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Calculate staking rewards
 * @param amount The amount staked
 * @param days Days staked
 * @param apy Annual Percentage Yield (default: 5.0)
 * @returns Calculated reward amount
 */
export function calculateRewards(amount: number, days: number, apy: number = 5.0): number {
  // Calculate rewards: principal * (1 + APY/100)^(days/365) - principal
  const yearFraction = days / 365;
  const multiplier = Math.pow(1 + apy / 100, yearFraction);
  const totalWithRewards = amount * multiplier;
  const rewardsEarned = totalWithRewards - amount;
  
  return parseFloat(rewardsEarned.toFixed(2)); // Round to 2 decimal places
}

/**
 * Generate a deterministic wallet address from a string input
 * This is used for demo purposes only
 */
export function generateWalletAddress(input: string): string {
  if (!input) return '';
  
  // Simple deterministic function for demo purposes
  const stringToBytes = (str: string): number[] => {
    const result = [];
    for (let i = 0; i < str.length; i++) {
      result.push(str.charCodeAt(i));
    }
    return result;
  };
  
  const bytes = stringToBytes(input);
  
  // Generate 40 hex characters (20 bytes) for an Ethereum-like address
  let hexString = '';
  for (let i = 0; i < 20; i++) {
    const byte = bytes[i % bytes.length] ^ bytes[(i * 3) % bytes.length];
    hexString += byte.toString(16).padStart(2, '0');
  }
  
  return `0x${hexString}`;
}
