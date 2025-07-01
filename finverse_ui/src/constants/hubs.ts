import { 
  Wallet, 
  PiggyBank, 
  BarChart3,
  Coins
} from 'lucide-react';

export interface FeatureHub {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  hoverColor: string;
  features: string[];
  tag?: string;
  status: 'active' | 'beta' | 'coming-soon';
}

export const featureHubs: FeatureHub[] = [
  {
    id: 'personal-finance',
    name: 'Personal Finance',
    description: 'Manage accounts, budgets, and daily spending with intelligent insights and automated tracking.',
    icon: Wallet,
    path: '/hubs/personal-finance',
    color: 'from-blue-500 via-blue-600 to-indigo-600',
    hoverColor: 'from-blue-600 via-blue-700 to-indigo-700',
    features: ['Account Management', 'Smart Budgeting', 'Transaction Tracking', 'Goal Setting'],
    status: 'active'
  },
  {
    id: 'savings-loans',
    name: 'Savings & Loans',
    description: 'Plan your savings journey, explore loan options, and optimize your financial growth strategy.',
    icon: PiggyBank,
    path: '/hubs/savings-loans',
    color: 'from-emerald-500 via-green-600 to-teal-600',
    hoverColor: 'from-emerald-600 via-green-700 to-teal-700',
    features: ['Savings Plans', 'Loan Simulator', 'Interest Calculator', 'Growth Tracking'],
    status: 'active'
  },
  {
    id: 'defi-staking',
    name: 'DeFi & Staking',
    description: 'Stake tokens, earn rewards, and explore crypto tools with real-time blockchain integration.',
    icon: Coins,
    path: '/hubs/defi-staking',
    color: 'from-purple-500 via-violet-600 to-purple-600',
    hoverColor: 'from-purple-600 via-violet-700 to-purple-700',
    features: ['Token Staking', 'Reward Tracking', 'DeFi Analytics', 'Blockchain Sync'],
    tag: 'Beta',
    status: 'beta'
  },
  {
    id: 'analytics',
    name: 'Analytics & Insights',
    description: 'Deep insights into your financial patterns, trends, and performance with advanced analytics.',
    icon: BarChart3,
    path: '/hubs/analytics',
    color: 'from-orange-500 via-amber-600 to-yellow-600',
    hoverColor: 'from-orange-600 via-amber-700 to-yellow-700',
    features: ['Spending Analysis', 'Trend Reports', 'Custom Charts', 'AI Insights'],
    tag: 'Coming Soon',
    status: 'coming-soon'
  }
]; 