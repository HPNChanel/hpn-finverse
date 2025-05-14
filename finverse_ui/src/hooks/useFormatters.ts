import { useCallback } from 'react';

interface FormattersReturn {
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (dateString: string, options?: Intl.DateTimeFormatOptions) => string;
  formatPercentage: (value: number) => string;
  truncateAddress: (address: string, startChars?: number, endChars?: number) => string;
}

/**
 * Hook for various data formatting utilities
 */

export interface UseFormattersReturn {
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (dateString: string) => string;
  formatPercentage: (value: number) => string;
}

export const useFormatters = (): UseFormattersReturn => {
  const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  return {
    formatCurrency,
    formatDate,
    formatPercentage,
  };
};
