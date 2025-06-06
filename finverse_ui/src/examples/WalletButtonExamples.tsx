import { ConnectWalletButton } from '@/components/ConnectWalletButton';

// Basic usage
export function BasicExample() {
  return <ConnectWalletButton />;
}

// Compact mode for navbar
export function NavbarExample() {
  return (
    <ConnectWalletButton 
      compact 
      variant="outline" 
      size="sm"
      className="ml-auto"
    />
  );
}

// Minimal mode without balances
export function MinimalExample() {
  return (
    <ConnectWalletButton 
      showBalances={false}
      showNetworkInfo={false}
      variant="ghost"
    />
  );
}

// Custom styled for staking page
export function StakingExample() {
  return (
    <ConnectWalletButton 
      variant="default"
      size="lg"
      className="w-full max-w-md mx-auto"
      showBalances={true}
      showNetworkInfo={true}
    />
  );
}
