import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Typography,
  IconButton,
  Icon,
  Tooltip,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import type { AccountType } from '../../services/accountService';

interface NewAccountDialogProps {
  isOpen: boolean;
  closeDialog: () => void;
  formError: string | null;
  isSubmitting: boolean;
  accountTypes: AccountType[];
  accountTypesLoading: boolean;
  handleCreateAccount: (accountData: CreateAccountFormData) => Promise<void>;
}

// Export the type separately to ensure it can be imported elsewhere
export interface CreateAccountFormData {
  name: string;
  type: string;
  initialBalance: number;
  note?: string;
  icon: string;
  color: string;
  currency: string;
}

const NewAccountDialog: React.FC<NewAccountDialogProps> = ({
  isOpen,
  closeDialog,
  formError,
  isSubmitting,
  accountTypes,
  accountTypesLoading,
  handleCreateAccount,
}) => {
  // Form state
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('wallet');
  const [initialBalance, setInitialBalance] = useState<number | ''>('');
  const [accountNote, setAccountNote] = useState('');
  const [accountIcon, setAccountIcon] = useState('account_balance_wallet');
  const [accountColor, setAccountColor] = useState('#1976d2');
  const [currency, setCurrency] = useState('USD');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get available material icons
  const materialIcons = [
    "account_balance_wallet", "savings", "trending_up", "emoji_events", 
    "paid", "attach_money", "credit_card", "account_balance",
    "request_quote", "receipt_long", "shopping_cart", "redeem",
    "card_giftcard", "stars", "favorite", "school", "home", "flight"
  ];
  
  // Color options including MUI palette colors
  const colorOptions = [
    { name: "Blue", value: "#1976d2" },
    { name: "Green", value: "#2e7d32" },
    { name: "Purple", value: "#9c27b0" },
    { name: "Orange", value: "#ff9800" },
    { name: "Red", value: "#f44336" },
    { name: "Teal", value: "#009688" },
    { name: "Indigo", value: "#3f51b5" },
    { name: "Pink", value: "#e91e63" }
  ];

  // Currency options
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong" }
  ];

  // Reset form when opening dialog
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Update icon and color when account type changes
  useEffect(() => {
    const selectedType = accountTypes.find(type => type.type === accountType);
    if (selectedType) {
      setAccountIcon(selectedType.icon || accountIcon);
      setAccountColor(selectedType.color || accountColor);
    }
  }, [accountType, accountTypes]);

  const resetForm = () => {
    setAccountName('');
    setAccountType('wallet');
    setInitialBalance('');
    setAccountNote('');
    setAccountIcon('account_balance_wallet');
    setAccountColor('#1976d2');
    setCurrency('USD');
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!accountName.trim()) {
      errors.name = 'Account name is required';
    }

    if (!accountType) {
      errors.type = 'Account type is required';
    }

    if (initialBalance !== '' && (isNaN(Number(initialBalance)) || Number(initialBalance) < 0)) {
      errors.balance = 'Initial balance must be a positive number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await handleCreateAccount({
        name: accountName.trim(),
        type: accountType,
        initialBalance: initialBalance === '' ? 0 : Number(initialBalance),
        note: accountNote.trim() || undefined,
        icon: accountIcon,
        color: accountColor,
        currency: currency
      });

      resetForm();
    } catch (error) {
      console.error('Error in form submission:', error);
      // Error will be handled by the parent component
    }
  };

  return (
    <Dialog open={isOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Account</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {formError}
          </Alert>
        )}
        
        <TextField
          autoFocus
          margin="normal"
          label="Account Name"
          type="text"
          fullWidth
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          disabled={isSubmitting}
          error={!!validationErrors.name}
          helperText={validationErrors.name}
          variant="outlined"
          sx={{ mb: 2, mt: 1 }}
        />
        
        <FormControl fullWidth margin="normal" error={!!validationErrors.type} sx={{ mb: 2 }}>
          <InputLabel id="account-type-label">Account Type</InputLabel>
          <Select
            labelId="account-type-label"
            id="account-type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            disabled={isSubmitting || accountTypesLoading}
            label="Account Type"
          >
            {accountTypesLoading ? (
              <MenuItem disabled>Loading account types...</MenuItem>
            ) : (
              accountTypes.map((type) => (
                <MenuItem key={type.type} value={type.type}>
                  <Box display="flex" alignItems="center">
                    <Icon sx={{ mr: 1, color: type.color }}>{type.icon}</Icon>
                    {type.label}
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
          {validationErrors.type && (
            <FormHelperText>{validationErrors.type}</FormHelperText>
          )}
        </FormControl>
        
        <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
          <InputLabel id="currency-label">Currency</InputLabel>
          <Select
            labelId="currency-label"
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={isSubmitting}
            label="Currency"
          >
            {currencies.map((curr) => (
              <MenuItem key={curr.code} value={curr.code}>
                <Box display="flex" alignItems="center">
                  <Typography variant="body1" sx={{ mr: 1 }}>{curr.symbol}</Typography>
                  {curr.name} ({curr.code})
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Icon
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {materialIcons.map((icon) => (
              <Tooltip key={icon} title={icon}>
                <IconButton 
                  onClick={() => setAccountIcon(icon)}
                  sx={{ 
                    border: icon === accountIcon ? `2px solid ${accountColor}` : '2px solid transparent',
                    color: icon === accountIcon ? accountColor : 'text.secondary' 
                  }}
                >
                  <Icon>{icon}</Icon>
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Color
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {colorOptions.map((color) => (
              <Tooltip key={color.value} title={color.name}>
                <IconButton 
                  onClick={() => setAccountColor(color.value)}
                  sx={{ 
                    bgcolor: color.value, 
                    border: color.value === accountColor ? '2px solid black' : '2px solid transparent',
                    '&:hover': { bgcolor: color.value },
                    width: 36,
                    height: 36
                  }}
                >
                  {color.value === accountColor && <CheckIcon sx={{ color: 'white' }} />}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>
        
        <TextField
          margin="normal"
          label="Initial Balance"
          type="number"
          fullWidth
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={isSubmitting}
          error={!!validationErrors.balance}
          helperText={validationErrors.balance || "Leave empty to start with 0.00"}
          variant="outlined"
          inputProps={{ min: 0, step: 0.01 }}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="normal"
          label="Note (Optional)"
          type="text"
          fullWidth
          multiline
          rows={2}
          value={accountNote}
          onChange={(e) => setAccountNote(e.target.value)}
          disabled={isSubmitting}
          variant="outlined"
          helperText="Add a note for this account (optional)"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewAccountDialog;
