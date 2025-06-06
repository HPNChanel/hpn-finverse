import { Award, Clock, TrendingUp } from 'lucide-react';
import { RewardHistory } from '@/services/stakingService';

interface RewardsPanelProps {
  rewards: RewardHistory[];
  claimableAmount: number;
  onClaim: () => void;
}

export function RewardsPanel({ rewards, claimableAmount, onClaim }: RewardsPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalEarned = rewards.reduce((sum, reward) => sum + reward.reward_amount, 0);
  const recentRewards = rewards.slice(0, 5);

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-foreground">Rewards Summary</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600 mb-1">Total Earned</p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(totalEarned)}
          </p>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-600 mb-1">Claimable</p>
          <p className="text-lg font-bold text-orange-700">
            {formatCurrency(claimableAmount)}
          </p>
        </div>
      </div>

      {/* Claim Button */}
      {claimableAmount > 0 && (
        <button
          onClick={onClaim}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 mb-4 font-medium"
        >
          Claim {formatCurrency(claimableAmount)}
        </button>
      )}

      {/* Recent Rewards */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Rewards
        </h4>
        {recentRewards.length > 0 ? (
          <div className="space-y-2">
            {recentRewards.map((reward, index) => (
              <div key={`${reward.stake_id}-${reward.date}-${index}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Stake #{reward.stake_id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(reward.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">
                    +{formatCurrency(reward.reward_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    10% APY
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <Award className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rewards yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
