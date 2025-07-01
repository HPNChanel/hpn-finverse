import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator } from 'lucide-react';
import { formatRewardAmount } from '@/utils/stakingRewards';

export function StakingSimulator() {
  const [amount, setAmount] = useState<string>('1.0');
  const [apy, setApy] = useState<number>(12);
  const [duration, setDuration] = useState<number>(365);
  const [compoundFrequency, setCompoundFrequency] = useState<number>(365);

  // Calculate rewards
  const rewards = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    
    if (numAmount <= 0) {
      return {
        simple: 0,
        compound: 0,
        dailyReward: 0,
        monthlyReward: 0,
        totalReward: 0,
        principalToken: 'ETH',
        rewardToken: 'ETH'
      };
    }

    // Simple interest calculation
    const simpleInterest = (numAmount * (apy / 100) * duration) / 365;
    
    // Compound interest calculation
    const rate = apy / 100;
    const periodsPerYear = compoundFrequency;
    const years = duration / 365;
    const compoundAmount = numAmount * Math.pow(1 + rate / periodsPerYear, periodsPerYear * years);
    const compoundInterest = compoundAmount - numAmount;

    // ETH rewards (1:1 ratio)
    const simpleInterestETH = simpleInterest;
    const compoundInterestETH = compoundInterest;

    return {
      simple: simpleInterestETH,
      compound: compoundInterestETH,
      dailyReward: simpleInterestETH / duration,
      monthlyReward: (simpleInterestETH / duration) * 30,
      totalReward: compoundInterestETH,
      principalToken: 'ETH',
      rewardToken: 'ETH'
    };
  }, [amount, apy, duration, compoundFrequency]);

  const handleTokenChange = (newToken: string) => {
    // ETH-only - no token change needed
    if (newToken === 'ETH') {
      setAmount('1.0');
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <CardTitle>ETH Staking Simulator</CardTitle>
        </div>
        <CardDescription>
          Calculate potential rewards from ETH staking with different parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Selection - ETH Only */}
        <div className="space-y-2">
          <Label>Staking Token</Label>
          <Select value="ETH" onValueChange={handleTokenChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ETH">
                <div className="flex items-center gap-2">
                  <span>Ethereum (ETH)</span>
                  <Badge variant="secondary">Native</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Stake Amount (ETH)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount to stake in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        {/* APY Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Annual Percentage Yield (APY)</Label>
            <Badge variant="outline">{apy}%</Badge>
          </div>
          <Slider
            value={[apy]}
            onValueChange={(value) => setApy(value[0])}
            max={50}
            min={1}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Duration Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Staking Duration</Label>
            <Badge variant="outline">{duration} days</Badge>
          </div>
          <Slider
            value={[duration]}
            onValueChange={(value) => setDuration(value[0])}
            max={1095} // 3 years
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Compound Frequency */}
        <div className="space-y-2">
          <Label>Compound Frequency</Label>
          <Select value={compoundFrequency.toString()} onValueChange={(value) => setCompoundFrequency(parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="365">Daily</SelectItem>
              <SelectItem value="52">Weekly</SelectItem>
              <SelectItem value="12">Monthly</SelectItem>
              <SelectItem value="4">Quarterly</SelectItem>
              <SelectItem value="1">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold">Reward Projections</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="text-sm text-blue-600 font-medium">Simple Interest</div>
              <div className="text-lg font-bold text-blue-900">
                {formatRewardAmount(rewards.simple)}
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border">
              <div className="text-sm text-green-600 font-medium">Compound Interest</div>
              <div className="text-lg font-bold text-green-900">
                {formatRewardAmount(rewards.compound)}
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border">
              <div className="text-sm text-purple-600 font-medium">Daily Rewards</div>
              <div className="text-lg font-bold text-purple-900">
                {formatRewardAmount(rewards.dailyReward)}
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border">
              <div className="text-sm text-orange-600 font-medium">Monthly Rewards</div>
              <div className="text-lg font-bold text-orange-900">
                {formatRewardAmount(rewards.monthlyReward)}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-600 mb-2">Summary</div>
            <div className="text-sm text-gray-800">
              Staking <strong>{amount || '0'} ETH</strong> at <strong>{apy}% APY</strong> for{' '}
              <strong>{duration} days</strong> will earn approximately{' '}
              <strong className="text-green-600">{formatRewardAmount(rewards.compound)}</strong> in ETH rewards.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
