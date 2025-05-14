import { useState, useCallback } from 'react';

interface UseFormDialogReturn {
  isOpen: boolean;
  formError: string | null;
  isSubmitting: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  setFormError: (error: string | null) => void;
  startSubmitting: () => void;
  stopSubmitting: () => void;
}

export const useFormDialog = (): UseFormDialogReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openDialog = useCallback(() => {
    setIsOpen(true);
    setFormError(null);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setFormError(null);
    setIsSubmitting(false);
  }, []);

  const startSubmitting = useCallback(() => {
    setIsSubmitting(true);
  }, []);

  const stopSubmitting = useCallback(() => {
    setIsSubmitting(false);
  }, []);

  return {
    isOpen,
    formError,
    isSubmitting,
    openDialog,
    closeDialog,
    setFormError,
    startSubmitting,
    stopSubmitting
  };
};
