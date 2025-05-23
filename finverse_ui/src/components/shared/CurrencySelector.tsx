import React from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useCurrency } from '../../contexts/CurrencyContext';

interface CurrencySelectorProps {
  variant?: 'standard' | 'compact';
  label?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  variant = 'standard',
  label = 'Currency'
}) => {
  const { currency, setCurrency } = useCurrency();
  
  const handleChange = (
    _: React.MouseEvent<HTMLElement>,
    newCurrency: 'USD' | 'VND' | null,
  ) => {
    if (newCurrency !== null) {
      setCurrency(newCurrency);
    }
  };
  
  return (
    <Box>
      {variant === 'standard' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      <ToggleButtonGroup
        value={currency}
        exclusive
        onChange={handleChange}
        aria-label="currency selection"
        size={variant === 'compact' ? 'small' : 'medium'}
      >
        <ToggleButton value="USD" aria-label="US Dollar">
          USD ($)
        </ToggleButton>
        <ToggleButton value="VND" aria-label="Vietnamese Dong">
          VND (₫)
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default CurrencySelector;
