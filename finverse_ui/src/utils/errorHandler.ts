export class ErrorHandler {
  /**
   * Extract error message from various error types
   */
  static extractErrorMessage(error: unknown): string {
    if (!error) return 'An unknown error occurred';

    // Handle Axios errors
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { 
        response?: { 
          status: number; 
          data?: { detail?: string; message?: string } 
        };
        message?: string;
      };

      if (axiosError.response) {
        const { status, data } = axiosError.response;
        
        // Handle specific HTTP status codes
        switch (status) {
          case 401:
            return 'Authentication required. Please log in again.';
          case 403:
            return 'Access denied. You do not have permission to perform this action.';
          case 404:
            return 'The requested resource was not found.';
          case 422:
            // Handle validation errors with more detail
                         if (data?.detail) {
               if (typeof data.detail === 'string') {
                 return data.detail;
               } else if (Array.isArray(data.detail)) {
                 // Handle FastAPI validation errors
                 const validationErrors = (data.detail as Array<{ loc?: string[]; msg: string }>).map((err) => {
                   const field = err.loc?.join('.') || 'field';
                   return `${field}: ${err.msg}`;
                 }).join(', ');
                 return `Validation error: ${validationErrors}`;
               }
             }
            return 'Invalid request data. Please check your input.';
          case 429:
            return 'Too many requests. Please try again later.';
          case 500:
            return 'Server error. Please try again later.';
          case 503:
            return 'Service temporarily unavailable. Please try again later.';
          default:
            return data?.detail || data?.message || `Request failed with status ${status}`;
        }
      }

      // Network or other errors
      return axiosError.message || 'Network error. Please check your connection.';
    }

    // Handle Error objects
    if (error instanceof Error) {
      return error.message;
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Fallback
    return 'An unexpected error occurred';
  }

  /**
   * Check if error is authentication related
   */
  static isAuthError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { status: number } };
      return axiosError.response?.status === 401 || axiosError.response?.status === 403;
    }
    return false;
  }

  /**
   * Check if error is validation related
   */
  static isValidationError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { status: number } };
      return axiosError.response?.status === 422;
    }
    return false;
  }

  /**
   * Log error with context
   */
  static logError(error: unknown, context?: string): void {
    const message = this.extractErrorMessage(error);
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(`${prefix} ${message}`, error);
  }

  /**
   * Handle API errors with user-friendly messages
   */
  static handleApiError(error: unknown, context?: string): {
    message: string;
    isAuth: boolean;
    isValidation: boolean;
  } {
    const message = this.extractErrorMessage(error);
    const isAuth = this.isAuthError(error);
    const isValidation = this.isValidationError(error);
    
    this.logError(error, context);
    
    return {
      message,
      isAuth,
      isValidation
    };
  }
} 