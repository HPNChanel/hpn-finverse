import React from 'react';

/**
 * Utility functions for handling error objects in React components
 */

export const isTimeoutError = (error: any): boolean => {
  return (
    error?.code === 'ECONNABORTED' ||
    error?.code === 'TIMEOUT' ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('Timeout')
  );
};

/**
 * Extract error message from various error formats
 */
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    !error?.response && 
    (error?.code === 'ENOTFOUND' || 
     error?.code === 'ECONNREFUSED' || 
     error?.code === 'NETWORK_ERROR' ||
     error?.message?.includes('Network Error'))
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};

/**
 * Format error for display in UI components
 */
export const formatErrorForDisplay = (error: any): { title: string; message: string } => {
  const message = extractErrorMessage(error);
  
  if (isAuthError(error)) {
    return {
      title: 'Authentication Error',
      message: 'Please log in again to continue.'
    };
  }
  
  if (isNetworkError(error)) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.'
    };
  }
  
  if (isTimeoutError(error)) {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.'
    };
  }
  
  return {
    title: 'Error',
    message: message
  };
};

export const safeRenderError = (error: any): React.ReactNode => {
  const message = extractErrorMessage(error);
  
  return React.createElement(
    'div',
    { className: 'p-4 bg-destructive/10 border border-destructive/20 rounded-lg' },
    React.createElement(
      'div',
      { className: 'flex items-center gap-2' },
      React.createElement(
        'svg',
        {
          className: 'w-5 h-5 text-destructive',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        })
      ),
      React.createElement(
        'span',
        { className: 'text-destructive font-medium' },
        'Error'
      )
    ),
    React.createElement(
      'p',
      { className: 'text-destructive mt-2' },
      message
    )
  );
};

export const createSafeToastMessage = (error: any): string => {
  return extractErrorMessage(error);
};

export function safeNumber(value: any, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

export function safeToFixed(value: any, decimals: number = 2, fallback: number = 0): string {
  const num = safeNumber(value, fallback);
  try {
    return num.toFixed(decimals);
  } catch (error) {
    return fallback.toFixed(decimals);
  }
}

export function safeArray<T>(value: any, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return fallback;
}

export function safeString(value: any, fallback: string = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value !== null && value !== undefined) {
    return String(value);
  }
  return fallback;
}
