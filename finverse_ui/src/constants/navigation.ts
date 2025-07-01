import { 
  Home,
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  FolderOpen, 
  Target, 
  TrendingUp, 
  PieChart,
  PiggyBank,
  Calculator,
  BarChart3,
  TrendingDown,
  DollarSign,
  Shield,
  Zap,
  Award
} from 'lucide-react';

export interface NavigationSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  available: boolean;
}

export interface NavigationHub {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  subItems: NavigationSubItem[];
}

export const navigationHubs: NavigationHub[] = [
  {
    name: 'Personal Finance',
    href: '/hubs/personal-finance',
    icon: Wallet,
    description: 'Manage accounts, transactions, budgets, and goals',
    subItems: [
      {
        name: 'Accounts',
        href: '/accounts',
        icon: Wallet,
        description: 'Manage all your financial accounts',
        available: true
      },
      {
        name: 'Transactions',
        href: '/transactions',
        icon: CreditCard,
        description: 'Track and categorize transactions',
        available: true
      },
      {
        name: 'Categories',
        href: '/categories',
        icon: FolderOpen,
        description: 'Organize transaction categories',
        available: true
      },
      {
        name: 'Budget',
        href: '/budgets',
        icon: PieChart,
        description: 'Create and manage budgets',
        available: true
      },
      {
        name: 'Goals',
        href: '/goals',
        icon: Target,
        description: 'Set and track financial goals',
        available: true
      },
      {
        name: 'Investments',
        href: '/investments',
        icon: TrendingUp,
        description: 'Track investment portfolio',
        available: false
      }
    ]
  },
  {
    name: 'DeFi & Staking',
    href: '/hubs/defi-staking',
    icon: TrendingUp,
    description: 'Decentralized finance and staking operations',
    subItems: [
      {
        name: 'Staking',
        href: '/staking',
        icon: TrendingUp,
        description: 'Stake tokens and earn rewards',
        available: true
      },
      {
        name: 'Rewards',
        href: '/staking/rewards',
        icon: Award,
        description: 'View staking rewards and history',
        available: true
      },
      {
        name: 'Send ETH',
        href: '/send-eth',
        icon: Zap,
        description: 'Transfer ETH to other addresses',
        available: true
      },
      {
        name: 'DeFi Pools',
        href: '/defi/pools',
        icon: Shield,
        description: 'Liquidity pool management',
        available: false
      },
      {
        name: 'Yield Farming',
        href: '/defi/yield',
        icon: TrendingDown,
        description: 'Maximize yield through farming',
        available: false
      }
    ]
  },
  {
    name: 'Savings & Loans',
    href: '/hubs/savings-loans',
    icon: PiggyBank,
    description: 'Savings plans and loan management',
    subItems: [
      {
        name: 'Savings',
        href: '/savings',
        icon: PiggyBank,
        description: 'Manage savings plans and projections',
        available: true
      },
      {
        name: 'Loans',
        href: '/loans',
        icon: Calculator,
        description: 'Apply for and manage loans',
        available: true
      },
      {
        name: 'Investment Plans',
        href: '/investment-plans',
        icon: TrendingUp,
        description: 'Long-term investment strategies',
        available: false
      },
      {
        name: 'Credit Score',
        href: '/credit-score',
        icon: BarChart3,
        description: 'Monitor and improve credit score',
        available: false
      }
    ]
  },
  {
    name: 'Analytics',
    href: '/hubs/analytics',
    icon: BarChart3,
    description: 'Financial insights and reporting',
    subItems: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Overview of all financial data',
        available: true
      },
      {
        name: 'Spending Analysis',
        href: '/analytics/spending',
        icon: PieChart,
        description: 'Detailed spending analysis',
        available: false
      },
      {
        name: 'Financial Reports',
        href: '/analytics/reports',
        icon: BarChart3,
        description: 'Generate comprehensive reports',
        available: false
      },
      {
        name: 'AI Insights',
        href: '/analytics/ai',
        icon: Zap,
        description: 'AI-powered financial insights',
        available: false
      }
    ]
  }
];

// Quick access items that appear outside of hubs
export const quickAccessItems = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    description: 'Return to homepage'
  }
]; 