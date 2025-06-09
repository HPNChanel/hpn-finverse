import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface AppStateContextType {
  // Refresh triggers
  refreshDashboard: () => void;
  refreshStaking: () => void;
  refreshWallet: () => void;
  refreshAll: () => void;
  
  // Network state
  lastNetworkChange: number | null;
  lastAccountChange: number | null;
  
  // Manual refresh flags
  isManualRefresh: boolean;
  setIsManualRefresh: (value: boolean) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [lastNetworkChange, setLastNetworkChange] = useState<number | null>(null);
  const [lastAccountChange, setLastAccountChange] = useState<number | null>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  
  const { currentAccount, chainId } = useWallet();

  // Track network changes
  useEffect(() => {
    if (chainId) {
      setLastNetworkChange(Date.now());
      console.log('🔗 Network change detected, updating timestamp');
    }
  }, [chainId]);

  // Track account changes
  useEffect(() => {
    if (currentAccount) {
      setLastAccountChange(Date.now());
      console.log('👤 Account change detected, updating timestamp');
    }
  }, [currentAccount]);

  // Emit custom events instead of causing reloads
  const refreshDashboard = useCallback(() => {
    console.log('🔄 Triggering dashboard refresh via event');
    window.dispatchEvent(new CustomEvent('refreshDashboard', {
      detail: { timestamp: Date.now(), manual: isManualRefresh }
    }));
  }, [isManualRefresh]);

  const refreshStaking = useCallback(() => {
    console.log('🔄 Triggering staking refresh via event');
    window.dispatchEvent(new CustomEvent('refreshStaking', {
      detail: { timestamp: Date.now(), manual: isManualRefresh }
    }));
  }, [isManualRefresh]);

  const refreshWallet = useCallback(() => {
    console.log('🔄 Triggering wallet refresh via event');
    window.dispatchEvent(new CustomEvent('refreshWallet', {
      detail: { timestamp: Date.now(), manual: isManualRefresh }
    }));
  }, [isManualRefresh]);

  const refreshAll = useCallback(() => {
    console.log('🔄 Triggering full app refresh via events');
    const timestamp = Date.now();
    window.dispatchEvent(new CustomEvent('refreshDashboard', {
      detail: { timestamp, manual: isManualRefresh }
    }));
    window.dispatchEvent(new CustomEvent('refreshStaking', {
      detail: { timestamp, manual: isManualRefresh }
    }));
    window.dispatchEvent(new CustomEvent('refreshWallet', {
      detail: { timestamp, manual: isManualRefresh }
    }));
  }, [isManualRefresh]);

  const value: AppStateContextType = {
    refreshDashboard,
    refreshStaking,
    refreshWallet,
    refreshAll,
    lastNetworkChange,
    lastAccountChange,
    isManualRefresh,
    setIsManualRefresh,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
} 