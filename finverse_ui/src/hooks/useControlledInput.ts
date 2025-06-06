import { useState, useCallback } from 'react';

/**
 * Hook to ensure controlled inputs never become uncontrolled
 * @param initialValue - Initial value for the input
 * @param validation - Optional validation function
 */
export function useControlledInput<T = string>(
  initialValue: T,
  validation?: (value: T) => boolean
) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string>('');

  const handleChange = useCallback((newValue: T) => {
    // Ensure the value is never undefined/null for string inputs
    const safeValue = newValue ?? initialValue;
    
    if (validation && !validation(safeValue)) {
      setError('Invalid value');
      return;
    }
    
    setError('');
    setValue(safeValue);
  }, [initialValue, validation]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError('');
  }, [initialValue]);

  return {
    value: value ?? initialValue, // Ensure never undefined
    setValue: handleChange,
    error,
    reset
  };
}

/**
 * Specific hook for string inputs that ensures empty string default
 */
export function useControlledStringInput(initialValue: string = '') {
  return useControlledInput(initialValue, (value: string) => typeof value === 'string');
}

/**
 * Specific hook for number inputs that ensures 0 default
 */
export function useControlledNumberInput(initialValue: number = 0) {
  return useControlledInput(initialValue, (value: number) => !isNaN(value));
}
