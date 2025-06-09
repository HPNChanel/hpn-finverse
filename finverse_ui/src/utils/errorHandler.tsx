import { useState, useCallback } from 'react';

/**
 * Centralized error handling utility for FinVerse
 */
export class ErrorHandler {
  /**
   * Extract a user-friendly error message from various error types
   */
  static extractErrorMessage(error: any): string {
    // Handle null/undefined
    if (!error) return 'An unknown error occurred';

    // Handle string errors
    if (typeof error === 'string') return error;

    // Handle Error objects with message
    if (error.message) {
      // Check for common blockchain errors
      if (error.message.includes('user rejected')) {
        return 'Transaction rejected by user';
      }
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient funds for transaction';
      }
      if (error.message.includes('network')) {
        return 'Network connection error';
      }
      return error.message;
    }

    // Handle contract revert reasons
    if (error.reason) {
      return error.reason;
    }

    // Handle API response errors
    if (error.response?.data) {
      if (error.response.data.detail) {
        return error.response.data.detail;
      }
      if (error.response.data.message) {
        return error.response.data.message;
      }
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
    }

    // Handle array of errors
    if (Array.isArray(error)) {
      return error
        .map((e: any) => this.extractErrorMessage(e))
        .filter(Boolean)
        .join(', ') || 'Multiple errors occurred';
    }

    // Handle error code
    if (error.code) {
      switch (error.code) {
        case 4001:
        case 'ACTION_REJECTED':
          return 'Transaction rejected by user';
        case -32000:
        case 'INSUFFICIENT_FUNDS':
          return 'Insufficient ETH for gas fees';
        case 'NETWORK_ERROR':
          return 'Network connection error';
        case 'ECONNABORTED':
          return 'Request timeout';
        case 'ENOTFOUND':
        case 'ECONNREFUSED':
          return 'Unable to connect to server';
        default:
          return `Error code: ${error.code}`;
      }
    }

    // Fallback
    return 'An unexpected error occurred';
  }

  /**
   * Log error to console with context
   */
  static logError(error: any, context?: string): void {
    const message = this.extractErrorMessage(error);
    const contextMsg = context ? `[${context}] ` : '';
    console.error(`${contextMsg}${message}`, error);

    // TODO: Send error details to backend logging service
  }

  /**
   * Handle API errors with proper status code handling
   */
  static handleApiError(error: unknown, context?: string): string {
    this.logError(error, context);

    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { status: number; data: { detail?: string; message?: string } } };
      const status = apiError.response.status;
      const data = apiError.response.data;

      switch (status) {
        case 400:
          return data?.detail || data?.message || 'Invalid request parameters';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'Access denied. Insufficient permissions.';
        case 404:
          return 'Resource not found';
        case 409:
          return data?.detail || 'Conflict: Resource already exists';
        case 422:
          return data?.detail || 'Validation error';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again.';
        case 502:
        case 503:
          return 'Service temporarily unavailable';
        default:
          return data?.detail || data?.message || 'Request failed';
      }
    }

    if (error && typeof error === 'object' && 'request' in error) {
      return 'Network error. Please check your connection.';
    }

    return this.extractErrorMessage(error);
  }

  /**
   * Handle staking-specific errors
   */
  static handleStakingError(error: unknown, context?: string): string {
    this.logError(error, context);

    if (error && typeof error === 'object') {
      if ('code' in error) {
        const ethError = error as { code: number | string; reason?: string; message?: string };

        switch (ethError.code) {
          case 4001:
          case 'ACTION_REJECTED':
            return 'Transaction rejected by user';
          case 'INSUFFICIENT_FUNDS':
            return 'Insufficient funds for transaction';
          case 'NETWORK_ERROR':
            return 'Network error. Please check your connection.';
          case 'TIMEOUT':
            return 'Transaction timed out. Please try again.';
          default:
            return ethError.reason || ethError.message || 'Staking operation failed';
        }
      }
    }

    return this.extractErrorMessage(error);
  }
}

/**
 * React hook for API error handling
 */
export const useApiError = () => {
  const [error, setError] = useState<string>('');

  const handleError = useCallback((error: any, context?: string): string => {
    const message = extractErrorMessage(error);
    const contextMessage = context ? `${context}: ${message}` : message;
    setError(contextMessage);
    return contextMessage;
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError
  };
};
