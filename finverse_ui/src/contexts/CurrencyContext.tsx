import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type CurrencyCode = 'USD' | 'VND';

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  convertAmount: (amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode) => number;
  exchangeRate: { USD_TO_VND: number };
  getAmountInCurrency: (amount: number, sourceCurrency: CurrencyCode) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Current exchange rate (can be fetched from an API in a production environment)
const USD_TO_VND_RATE = 23500; 

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const exchangeRate = { USD_TO_VND: USD_TO_VND_RATE };

  const getCurrencySymbol = useCallback((code: CurrencyCode): string => {
    switch (code) {
      case 'USD':
        return '$';
      case 'VND':
        return '₫';
      default:
        return '$';
    }
  }, []);

  const convertAmount = useCallback((amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number => {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && toCurrency === 'VND') {
      return amount * exchangeRate.USD_TO_VND;
    } else if (fromCurrency === 'VND' && toCurrency === 'USD') {
      return amount / exchangeRate.USD_TO_VND;
    }
    
    return amount;
  }, [exchangeRate.USD_TO_VND]);

  const getAmountInCurrency = useCallback((amount: number, sourceCurrency: CurrencyCode): number => {
    return convertAmount(amount, sourceCurrency, currency);
  }, [currency, convertAmount]);

  const formatCurrency = useCallback((amount: number): string => {
    const symbol = getCurrencySymbol(currency);
    
    if (currency === 'VND') {
      // VND doesn't use decimal places and uses thousand separators
      return `${symbol}${Math.round(amount).toLocaleString('vi-VN')}`;
    } else {
      // USD uses 2 decimal places
      return `${symbol}${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    }
  }, [currency, getCurrencySymbol]);

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        formatCurrency,
        currencySymbol: getCurrencySymbol(currency),
        convertAmount,
        exchangeRate,
        getAmountInCurrency
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
