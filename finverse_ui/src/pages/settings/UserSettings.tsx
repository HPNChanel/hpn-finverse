import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  useTheme
} from '@mui/material';
import { SettingsOutlined as SettingsIcon } from '@mui/icons-material';
import { PageContainer } from '../../components/layouts';
import CurrencySelector from '../../components/shared/CurrencySelector';
import { useCurrency } from '../../hooks/useCurrency';

const UserSettings: React.FC = () => {
  const theme = useTheme();
  const { currency, exchangeRate } = useCurrency();

  return (
    <PageContainer title="Settings">
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: '12px',
              border: '1px solid',
              borderColor: theme.palette.divider 
            }}
          >
            <Box display="flex" alignItems="center" mb={2}>
              <SettingsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">General Settings</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Box mb={4}>
              <Typography variant="subtitle1" mb={2}>Currency Settings</Typography>
              <CurrencySelector />
              
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Current exchange rate: 1 USD = {exchangeRate.USD_TO_VND} VND
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  All amounts will be displayed in {currency} throughout the app.
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" mb={2}>Notifications</Typography>
              
              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Email Notifications" 
                    secondary="Receive email updates about your account activity"
                  />
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label=""
                    sx={{ ml: 2 }}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Budget Alerts" 
                    secondary="Receive notifications when you approach budget limits"
                  />
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label=""
                    sx={{ ml: 2 }}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Transaction Alerts" 
                    secondary="Get notified about new transactions in your account"
                  />
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label=""
                    sx={{ ml: 2 }}
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              border: '1px solid',
              borderColor: theme.palette.divider 
            }}
          >
            <Typography variant="h6" mb={2}>Currency Exchange Information</Typography>
            <Typography variant="body2" paragraph>
              The app uses real-time exchange rates to convert between currencies. You can select your preferred currency in the settings.
            </Typography>
            
            <Typography variant="subtitle2" mt={2}>Available Currencies:</Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="USD - US Dollar ($)" 
                  secondary="Base currency for all transactions"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="VND - Vietnamese Dong (₫)" 
                  secondary={`Current rate: ${exchangeRate.USD_TO_VND} VND per USD`}
                />
              </ListItem>
            </List>
            
            <Typography variant="body2" color="text.secondary" mt={2}>
              Exchange rates are updated hourly to ensure accuracy.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default UserSettings;
