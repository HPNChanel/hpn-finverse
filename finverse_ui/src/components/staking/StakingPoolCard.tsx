import { Clock, Users, DollarSign, TrendingUp, Lock } from 'lucide-react';
import { StakingPool } from '@/services/stakingService';
import { formatCurrency } from '@/lib/utils';

interface StakingPoolCardProps {
  pool: StakingPool;
  onStake: (pool: StakingPool) => void;
}

export function StakingPoolCard({ pool, onStake }: StakingPoolCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPoolIcon = (poolName: string) => {
    if (poolName.includes('Flexible')) return '🌊';
    if (poolName.includes('30-Day')) return '📅';
    if (poolName.includes('90-Day')) return '🔒';
    return '💎';
  };

  const getPoolColor = (apy: number) => {
    if (apy >= 10) return 'from-purple-500 to-pink-500';
    if (apy >= 7) return 'from-blue-500 to-cyan-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getPoolIcon(pool.name)}</div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {pool.name}
            </h3>
            <p className="text-sm text-muted-foreground">{pool.description}</p>
          </div>
        </div>
        {pool.lock_period > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
            <Lock className="w-3 h-3" />
            <span>{pool.lock_period}d</span>
          </div>
        )}
      </div>

      {/* APY Highlight */}
      <div className={`p-4 rounded-lg bg-gradient-to-r ${getPoolColor(pool.apy)} mb-4`}>
        <div className="text-center text-white">
          <p className="text-sm opacity-90">Annual Percentage Yield</p>
          <p className="text-3xl font-bold">{pool.apy}%</p>
        </div>
      </div>

      {/* Pool Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>Min Stake</span>
          </div>
          <span className="font-medium">{formatCurrency(pool.min_stake)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Max Stake</span>
          </div>
          <span className="font-medium">{formatCurrency(pool.max_stake)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Participants</span>
          </div>
          <span className="font-medium">{formatNumber(pool.participants)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Lock Period</span>
          </div>
          <span className="font-medium">
            {pool.lock_period === 0 ? 'Flexible' : `${pool.lock_period} days`}
          </span>
        </div>
      </div>

      {/* Total Value Locked */}
      <div className="p-3 bg-muted/50 rounded-lg mb-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Value Locked</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(pool.total_staked)}
          </p>
        </div>
      </div>

      {/* Stake Button */}
      <button
        onClick={() => onStake(pool)}
        disabled={!pool.is_active}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          pool.is_active
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        }`}
      >
        {pool.is_active ? 'Stake Now' : 'Pool Inactive'}
      </button>
    </div>
  );
}
