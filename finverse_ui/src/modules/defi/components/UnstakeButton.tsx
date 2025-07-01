import React, { useState } from 'react';
import { Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { StakeProfile } from '@/services/stakingService';
import { UnstakeModal } from './UnstakeModal';

interface UnstakeButtonProps {
  position: StakeProfile;
  onUnstakeSuccess: () => void;
  className?: string;
}

export function UnstakeButton({ position, onUnstakeSuccess, className }: UnstakeButtonProps) {
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);

  // Check if position is unlocked (eligible for unstaking)
  const isUnlocked = position.isUnlocked;
  const daysRemaining = position.daysRemaining;
  const isAlreadyUnstaked = position.status === 'UNSTAKED';

  // Calculate countdown for locked stakes
  const getCountdownText = () => {
    if (daysRemaining === null || daysRemaining === 0) {
      return 'Unlocked';
    }
    
    if (daysRemaining === 1) {
      return '1 day remaining';
    }
    
    return `${daysRemaining} days remaining`;
  };

  // If already unstaked, show status badge
  if (isAlreadyUnstaked) {
    return (
      <Badge variant="secondary" className={className}>
        <AlertCircle className="w-3 h-3 mr-1" />
        Unstaked
      </Badge>
    );
  }

  // If locked, show early withdrawal button with penalty warning
  if (!isUnlocked) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnstakeModal(true)}
                className={`${className} border-orange-300 text-orange-700 hover:bg-orange-50`}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Early Unstake
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-center">
                <p className="font-medium text-orange-600">Early Withdrawal</p>
                <p className="text-sm text-muted-foreground">
                  {getCountdownText()}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  10% penalty applies
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {showUnstakeModal && (
          <UnstakeModal
            position={position}
            isOpen={showUnstakeModal}
            onClose={() => setShowUnstakeModal(false)}
            onSuccess={() => {
              setShowUnstakeModal(false);
              onUnstakeSuccess();
            }}
          />
        )}
      </>
    );
  }

  // If unlocked, show enabled unstake button
  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowUnstakeModal(true)}
        className={className}
      >
        <Unlock className="w-4 h-4 mr-2" />
        Unstake
      </Button>

      {showUnstakeModal && (
        <UnstakeModal
          position={position}
          isOpen={showUnstakeModal}
          onClose={() => setShowUnstakeModal(false)}
          onSuccess={() => {
            setShowUnstakeModal(false);
            onUnstakeSuccess();
          }}
        />
      )}
    </>
  );
} 