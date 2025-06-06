import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from './useWallet';
import { useToast } from '@/hooks/use-toast';
import { stakingService, StakedEventData } from '@/services/stakingService';
import { stakingApi } from '@/lib/api';

interface UseStakingEventsReturn {
  recentStakedEvents: StakedEventData[];
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearEvents: () => void;
}

export const useStakingEvents = (): UseStakingEventsReturn => {
  const [recentStakedEvents, setRecentStakedEvents] = useState<StakedEventData[]>([]);
  const [isListening, setIsListening] = useState(false);
  const { accountAddress, isConnected, isCorrectNetwork } = useWallet();
  const { toast } = useToast();
  const listenerRef = useRef<boolean>(false);

  // Enhanced event handler for new Staked events with backend sync
  const handleStakedEvent = useCallback(async (eventData: StakedEventData) => {
    // Only process events for the current user
    if (accountAddress && eventData.user.toLowerCase() === accountAddress.toLowerCase()) {
      console.log('🎉 New stake detected for current user:', eventData);
      
      try {
        // Sync to backend database via API
        const syncData = {
          user_id: accountAddress, // Using wallet address as user identifier
          stake_id: eventData.stakeIndex,
          amount: eventData.amount,
          duration: eventData.lockPeriod || 0,
          tx_hash: eventData.txHash,
          pool_id: eventData.poolId || 'default-pool',
          timestamp: new Date().toISOString()
        };

        console.log('📡 Syncing stake to backend:', syncData);
        
        // Call the new sync endpoint
        await stakingApi.syncStakeEvent(syncData);
        
        console.log('✅ Successfully synced stake to backend');
        
      } catch (error) {
        console.error('❌ Failed to sync stake to backend:', error);
        
        toast({
          title: "Sync Warning",
          description: "Stake successful but failed to sync with backend. Data may be inconsistent.",
          variant: "destructive",
          duration: 8000,
        });
      }
      
      // Add to recent events (keep only last 10)
      setRecentStakedEvents(prev => {
        const updated = [eventData, ...prev].slice(0, 10);
        return updated;
      });

      // Show toast notification
      toast({
        title: "Stake Confirmed! 🎉",
        description: `Successfully staked ${eventData.amount} FVT tokens`,
        duration: 5000,
      });
    }
  }, [accountAddress, toast]);

  // Start listening to events
  const startListening = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork || !accountAddress || listenerRef.current) {
      return;
    }

    try {
      await stakingService.initialize();
      await stakingService.startListeningToStakedEvents(handleStakedEvent);
      
      // Load past events for context (last 50 blocks)
      const pastEvents = await stakingService.getPastStakedEvents(accountAddress, -50);
      setRecentStakedEvents(pastEvents.slice(0, 10));
      
      setIsListening(true);
      listenerRef.current = true;
      
      console.log('🎧 Started listening to staking events');
    } catch (error) {
      console.error('Failed to start listening to events:', error);
      toast({
        title: "Event Listening Error",
        description: "Failed to start listening to blockchain events",
        variant: "destructive",
      });
    }
  }, [isConnected, isCorrectNetwork, accountAddress, handleStakedEvent, toast]);

  // Stop listening to events
  const stopListening = useCallback(() => {
    if (listenerRef.current) {
      stakingService.stopListeningToEvents();
      setIsListening(false);
      listenerRef.current = false;
      console.log('🔇 Stopped listening to staking events');
    }
  }, []);

  // Clear events
  const clearEvents = useCallback(() => {
    setRecentStakedEvents([]);
  }, []);

  // Auto-start/stop listening based on wallet connection
  useEffect(() => {
    if (isConnected && isCorrectNetwork && accountAddress) {
      startListening();
    } else {
      stopListening();
    }

    // Cleanup on unmount
    return () => {
      stopListening();
    };
  }, [isConnected, isCorrectNetwork, accountAddress, startListening, stopListening]);

  return {
    recentStakedEvents,
    isListening,
    startListening,
    stopListening,
    clearEvents
  };
};
