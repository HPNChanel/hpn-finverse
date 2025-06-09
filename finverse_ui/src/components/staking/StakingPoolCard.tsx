import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Lock,
  Coins,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface StakingPool {
  id: string;
  name: string;
  apy: number;
  lockPeriodDays: number;
  minStake: number;
  maxStake: number;
  totalStaked: number;
  maxCapacity: number;
  activeStakers: number;
  description: string;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  bonusFeatures?: string[];
}

interface StakingPoolCardProps {
  pool: StakingPool;
  onStake: (poolId: string) => void;
  userStakedAmount?: number;
  isUserStaked?: boolean;
}

export function StakingPoolCard({ 
  pool, 
  onStake, 
  userStakedAmount = 0,
  isUserStaked = false 
}: StakingPoolCardProps) {
  const utilizationPercentage = (pool.totalStaked / pool.maxCapacity) * 100;
  const canStake = pool.isActive && utilizationPercentage < 100;
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${!canStake ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              {pool.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {pool.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={getRiskColor(pool.riskLevel)}>
              {pool.riskLevel.toUpperCase()} RISK
            </Badge>
            {isUserStaked && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                STAKED
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">APY</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{pool.apy}%</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Lock Period</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{pool.lockPeriodDays}d</p>
          </div>
        </div>

        {/* Pool Statistics */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pool Utilization</span>
            <span className="font-medium">{utilizationPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={utilizationPercentage} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Staked:</span>
              <span className="font-medium">{formatCurrency(pool.totalStaked)} FVT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity:</span>
              <span className="font-medium">{formatCurrency(pool.maxCapacity)} FVT</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              Active Stakers:
            </span>
            <span className="font-medium">{pool.activeStakers}</span>
          </div>
        </div>

        {/* Stake Limits */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Stake Limits</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Min: {formatCurrency(pool.minStake)} FVT</span>
            <span className="text-muted-foreground">Max: {formatCurrency(pool.maxStake)} FVT</span>
          </div>
        </div>

        {/* User's Stake (if any) */}
        {isUserStaked && userStakedAmount > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Your Stake</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(userStakedAmount)} FVT
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Earning ~{((userStakedAmount * pool.apy) / 365 / 100).toFixed(4)} FVT daily
            </p>
          </div>
        )}

        {/* Bonus Features */}
        {pool.bonusFeatures && pool.bonusFeatures.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Bonus Features:</span>
            <div className="flex flex-wrap gap-1">
              {pool.bonusFeatures.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Status & Action */}
        <div className="pt-2 border-t">
          {!pool.isActive ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Pool is currently inactive</span>
            </div>
          ) : utilizationPercentage >= 100 ? (
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span>Pool is at full capacity</span>
            </div>
          ) : (
            <Button 
              onClick={() => onStake(pool.id)}
              className="w-full"
              disabled={!canStake}
            >
              <Lock className="w-4 h-4 mr-2" />
              Stake in this Pool
            </Button>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            Expected daily return: ~{((100 * pool.apy) / 365 / 100).toFixed(4)}% of stake
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
