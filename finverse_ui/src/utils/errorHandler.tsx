import { useState, useCallback } from 'react';
import { extractErrorMessage } from './errorHelpers';

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
  static handleApiError(error: any, context?: string): string {
    this.logError(error, context);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

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

    if (error.request) {
      return 'Network error. Please check your connection.';
    }

    return this.extractErrorMessage(error);
  }

  /**
   * Handle staking-specific errors
   */
  static handleStakingError(error: any, operation: string): string {
    console.error(`Staking ${operation} error:`, error);

    // MetaMask/Wallet errors
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      return 'Transaction rejected by user';
    }

    if (error.code === 'INSUFFICIENT_FUNDS' || error.code === -32000) {
      return 'Insufficient ETH for gas fees';
    }

    if (error.code === 'NETWORK_ERROR') {
      return 'Network connection error. Please check your connection.';
    }

    // Contract-specific errors
    if (error.reason) {
      if (error.reason.includes('Amount must be greater than 0')) {
        return 'Stake amount must be greater than 0';
      }
      if (error.reason.includes('Transfer failed')) {
        return 'Insufficient token balance or allowance';
      }
      if (error.reason.includes('Tokens still locked')) {
        return 'Tokens are still in lock period';
      }
      if (error.reason.includes('Already claimed')) {
        return 'Rewards already claimed for this stake';
      }
      return error.reason;
    }

    // API/Backend errors
    if (error.response?.status === 409) {
      return 'Transaction already recorded in database';
    }

    if (error.response?.status === 400) {
      return error.response.data?.detail || 'Invalid request parameters';
    }

    if (error.response?.status >= 500) {
      return 'Backend service temporarily unavailable';
    }

    // Generic errors
    if (error.message) {
      if (error.message.includes('insufficient')) {
        return 'Insufficient balance for this transaction';
      }
      if (error.message.includes('network')) {
        return 'Network error. Please try again.';
      }
      return error.message;
    }

    return `${operation} failed. Please try again.`;
  }

  /**
   * Handle wallet connection errors
   */
  static handleWalletError(error: any): string {
    if (error.code === 4001) {
      return 'Connection rejected by user';
    }

    if (error.code === -32002) {
      return 'MetaMask is already processing a request. Please wait.';
    }

    if (error.message?.includes('MetaMask')) {
      return 'MetaMask error: ' + this.extractErrorMessage(error);
    }

    return this.extractErrorMessage(error);
  }

  /**
   * Check if error is a timeout error
   */
  static isTimeoutError(error: any): boolean {
    return error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
  }

  /**
   * Check if error is a network error
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message || error.toString();
    const code = error.code;
    
    return (
      code === 'NETWORK_ERROR' ||
      code === 'ENOTFOUND' ||
      code === 'ECONNREFUSED' ||
      code === 'ECONNABORTED' ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout')
    );
  }

  /**
   * Handle blockchain-specific contract errors
   */
  static handleContractError(error: any, operation: string): string {
    console.error(`Contract ${operation} error:`, error);

    // Handle specific contract error codes
    if (error.code) {
      switch (error.code) {
        case 'CALL_EXCEPTION':
          return 'Smart contract call failed. Please check your inputs.';
        case 'UNPREDICTABLE_GAS_LIMIT':
          return 'Unable to estimate gas. Transaction may fail.';
        case 'REPLACEMENT_UNDERPRICED':
          return 'Transaction replacement underpriced. Try with higher gas.';
        case 'NONCE_EXPIRED':
          return 'Transaction nonce expired. Please try again.';
        case 'ALREADY_KNOWN':
          return 'Transaction already known to network.';
        default:
          break;
      }
    }

    // Handle contract revert reasons
    if (error.reason) {
      // Common staking contract errors
      if (error.reason.includes('ERC20: insufficient allowance')) {
        return 'Please approve tokens before staking';
      }
      if (error.reason.includes('ERC20: transfer amount exceeds balance')) {
        return 'Insufficient token balance';
      }
      if (error.reason.includes('Tokens still locked')) {
        return 'Cannot unstake: tokens are still in lock period';
      }
      if (error.reason.includes('No rewards to claim')) {
        return 'No rewards available to claim';
      }
      if (error.reason.includes('Already claimed')) {
        return 'Rewards have already been claimed';
      }
      
      return error.reason;
    }

    // Handle data field (for newer error formats)
    if (error.data) {
      return 'Contract execution reverted. Please check transaction parameters.';
    }

    return this.extractErrorMessage(error) || `${operation} operation failed`;
  }

  /**
   * Handle transaction errors with user-friendly messages
   */
  static handleTransactionError(error: any, txType: string = 'Transaction'): string {
    // User rejection
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return `${txType} was cancelled by user`;
    }

    // Insufficient funds for gas
    if (error.code === -32000 || error.code === 'INSUFFICIENT_FUNDS') {
      return 'Insufficient ETH balance to pay for gas fees';
    }

    // Network issues
    if (this.isNetworkError(error)) {
      return 'Network connection error. Please check your internet connection.';
    }

    // Gas estimation failed
    if (error.message?.includes('gas required exceeds allowance')) {
      return 'Transaction requires more gas than available. Please try with a lower amount.';
    }

    // Transaction timeout
    if (this.isTimeoutError(error)) {
      return `${txType} timed out. Please check the transaction status on the blockchain.`;
    }

    // Generic transaction failure
    return this.handleContractError(error, txType);
  }

  /**
   * Format error for UI display with appropriate severity
   */
  static formatForUI(error: any, context?: string): {
    title: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    canRetry: boolean;
  } {
    const message = this.extractErrorMessage(error);
    
    // User cancellation - less severe
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return {
        title: 'Transaction Cancelled',
        message: 'You cancelled the transaction',
        severity: 'info',
        canRetry: true
      };
    }

    // Network errors - can retry
    if (this.isNetworkError(error)) {
      return {
        title: 'Connection Issue',
        message: 'Network connection error. Please try again.',
        severity: 'warning',
        canRetry: true
      };
    }

    // Insufficient funds - need action
    if (error.code === -32000 || message.includes('insufficient')) {
      return {
        title: 'Insufficient Balance',
        message,
        severity: 'error',
        canRetry: false
      };
    }

    // Generic error
    return {
      title: context ? `${context} Failed` : 'Operation Failed',
      message,
      severity: 'error',
      canRetry: true
    };
  }

  /**
   * Create a standardized error response for API consistency
   */
  static createErrorResponse(error: any, operation: string) {
    return {
      success: false,
      error: {
        message: this.extractErrorMessage(error),
        operation,
        timestamp: new Date().toISOString(),
        code: error.code || 'UNKNOWN',
        canRetry: !this.isTimeoutError(error) && error.code !== -32000
      }
    };
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
