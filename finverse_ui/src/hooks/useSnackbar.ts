import { useState, useCallback } from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

interface UseSnackbarReturn {
  snackbar: {
    open: boolean;
    message: string;
    severity: SnackbarSeverity;
  };
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  hideSnackbar: () => void;
}

export const useSnackbar = (): UseSnackbarReturn => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as SnackbarSeverity
  });

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  return {
    snackbar,
    showSnackbar,
    hideSnackbar
  };
};
