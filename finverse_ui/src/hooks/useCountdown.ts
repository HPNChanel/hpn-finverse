import { useState, useEffect, useCallback } from 'react';

interface CountdownResult {
  timeLeft: string;
  isUnlocked: boolean;
  progress: number; // 0-100 percentage of time elapsed
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const useCountdown = (unlockTime: Date | string | null, startTime?: Date | string): CountdownResult => {
  const [countdown, setCountdown] = useState<CountdownResult>({
    timeLeft: '',
    isUnlocked: true,
    progress: 100,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });

  // Stabilize the unlockTime by converting to timestamp
  const unlockTimestamp = unlockTime ? new Date(unlockTime).getTime() : null;
  const startTimestamp = startTime ? new Date(startTime).getTime() : null;

  const calculateCountdown = useCallback(() => {
    if (!unlockTimestamp) {
      return {
        timeLeft: 'No lock period',
        isUnlocked: true,
        progress: 100,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
      };
    }

    const now = new Date().getTime();
    const timeDiff = unlockTimestamp - now;

    if (timeDiff <= 0) {
      return {
        timeLeft: 'Unlocked',
        isUnlocked: true,
        progress: 100,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0
      };
    }

    // Calculate time components
    const totalSeconds = Math.floor(timeDiff / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    // Format time left string
    let timeLeft = '';
    if (days > 0) {
      timeLeft = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      timeLeft = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeLeft = `${minutes}m ${seconds}s`;
    } else {
      timeLeft = `${seconds}s`;
    }

    // Calculate progress if start time is provided
    let progress = 0;
    if (startTimestamp) {
      const totalDuration = unlockTimestamp - startTimestamp;
      const elapsed = now - startTimestamp;
      progress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
    }

    return {
      timeLeft,
      isUnlocked: false,
      progress,
      days,
      hours,
      minutes,
      seconds,
      totalSeconds
    };
  }, [unlockTimestamp, startTimestamp]); // Only depend on stable values

  useEffect(() => {
    // Calculate initial state
    const newCountdown = calculateCountdown();
    setCountdown(newCountdown);

    // Only set up interval if there's an active countdown
    if (!newCountdown.isUnlocked && unlockTimestamp) {
      const interval = setInterval(() => {
        const updatedCountdown = calculateCountdown();
        setCountdown(prev => {
          // Only update if values actually changed to prevent unnecessary re-renders
          if (
            prev.totalSeconds !== updatedCountdown.totalSeconds ||
            prev.isUnlocked !== updatedCountdown.isUnlocked
          ) {
            return updatedCountdown;
          }
          return prev;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [calculateCountdown, unlockTimestamp]); // Stable dependencies

  return countdown;
};

// Helper function for color coding countdown progress
export const getCountdownColor = (progress: number): string => {
  if (progress >= 100) return 'text-green-600';
  if (progress >= 75) return 'text-yellow-600';
  if (progress >= 50) return 'text-orange-600';
  return 'text-red-600';
};

// Helper function to format countdown time
export const formatCountdownTime = (countdown: CountdownResult): string => {
  if (countdown.isUnlocked) {
    return 'Ready to unstake';
  }
  return countdown.timeLeft;
};
