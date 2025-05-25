import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Drawer as MuiDrawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import { 
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as AccountsIcon,
  ReceiptLong as TransactionsIcon,
  Assessment as TrendsIcon,
  DonutSmall as BudgetIcon,
  AccountBalance as StakingIcon,
  Person as ProfileIcon,
  Flag as GoalsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';
import { useMainLayout } from '../../MainLayout/MainLayoutContext';

interface DrawerProps {
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}

const DRAWER_WIDTH = 280;

// Define navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, authRequired: true },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: <TransactionsIcon />, authRequired: true },
  { id: 'accounts', label: 'Accounts', path: '/accounts', icon: <AccountsIcon />, authRequired: true },
  { id: 'budget', label: 'Budget', path: '/budget', icon: <BudgetIcon />, authRequired: true },
  { id: 'goals', label: 'Goals', path: '/goals', icon: <GoalsIcon />, authRequired: true },
  { id: 'staking', label: 'Staking', path: '/staking', icon: <StakingIcon />, authRequired: true },
  { id: 'trends', label: 'Trends', path: '/trends', icon: <TrendsIcon />, authRequired: true },
  { id: 'profile', label: 'Profile', path: '/profile', icon: <ProfileIcon />, authRequired: true },
];

const Drawer: React.FC<DrawerProps> = ({ toggleColorMode, mode }) => {
  const { isDrawerOpen, closeDrawer } = useMainLayout(); 
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Helper functions for user display with loading states
  const getDisplayName = (): string => {
    if (isLoading) return 'Loading...';
    if (!user) return 'Guest';
    return user.full_name || user.name || user.username || 'User';
  };

  const getUserEmail = (): string => {
    if (isLoading) return 'Loading...';
    if (!user) return '';
    return user.email || 'user@example.com';
  };
  
  // Show all navigation items
  const drawerItems = navItems;
  
  return (
    <MuiDrawer
      variant="temporary"
      open={isDrawerOpen}
      onClose={closeDrawer}
      ModalProps={{
        keepMounted: true, 
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Typography variant="h6" component="div" fontWeight={700}>
          FinVerse
        </Typography>
        <IconButton
          onClick={closeDrawer}
          color="inherit"
          aria-label="close drawer"
          edge="end"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* User info section */}
      <Box sx={{ p: 2, bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
        <Typography variant="subtitle1" fontWeight={500}>
          {getDisplayName()}
        </Typography>
        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
          {getUserEmail()}
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ pt: 1 }} component="nav" aria-label="main navigation">
        {drawerItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive}
                onClick={closeDrawer}
                sx={{
                  py: 1.5,
                  ...(isActive && {
                    bgcolor: theme => 
                      theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                  }),
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40, 
                  color: isActive ? 'primary.main' : 'inherit' 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontWeight: isActive ? 500 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Divider sx={{ mt: 'auto' }} />
      
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </Typography>
        <IconButton
          color="inherit"
          onClick={toggleColorMode}
          aria-label={mode === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
          size="small"
        >
          {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Box>
    </MuiDrawer>
  );
};

export default Drawer;
