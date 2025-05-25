import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Avatar,
  Typography,
  IconButton,
  useTheme
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  CreditCard as TransactionsIcon,
  AccountBalanceWallet as AccountsIcon,
  Savings as BudgetIcon,
  Flag as GoalsIcon,
  TrendingUp as StakingIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';

// Define sidebar width constants (same as in MainLayout)
const SIDEBAR_WIDTH_OPEN = 280;
const SIDEBAR_WIDTH_COLLAPSED = 88;

// Define navigation items
const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { id: 'accounts', label: 'Accounts', path: '/accounts', icon: <AccountsIcon /> },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: <TransactionsIcon /> },
  { id: 'budget', label: 'Budget', path: '/budget', icon: <BudgetIcon /> },
  { id: 'goals', label: 'Goals', path: '/goals', icon: <GoalsIcon /> },
  { id: 'staking', label: 'Staking', path: '/staking', icon: <StakingIcon /> },
];

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarOpen, 
  toggleSidebar,
  isMobile
}) => {
  const theme = useTheme();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  
  // Get initials for avatar with loading fallback
  const getUserInitials = (): string => {
    if (isLoading) return '...';
    if (!user) return '?';
    
    // Try full_name first, then name, then username, then email
    const displayName = user.full_name || user.name || user.username || user.email;
    
    if (displayName) {
      const nameParts = displayName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return displayName[0].toUpperCase();
    }
    
    return '?';
  };
  
  // Get display name for user with loading fallback
  const getDisplayName = (): string => {
    if (isLoading) return 'Loading...';
    if (!user) return 'Guest';
    return user.full_name || user.name || user.username || 'User';
  };
  
  // Get user email with loading fallback
  const getUserEmail = (): string => {
    if (isLoading) return 'Loading...';
    if (!user) return '';
    return user.username || 'user';
  };
  
  return (
    <Drawer
      variant="permanent"
      open={isSidebarOpen}
      sx={{
        width: isSidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isSidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          mt: '64px', // Adjust based on AppBar height
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* User profile section */}
        {isSidebarOpen && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            {user?.avatar_url ? (
              <Avatar 
                src={user.avatar_url}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  mr: 2
                }}
              />
            ) : (
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: isLoading ? 'grey.400' : 'primary.main',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  mr: 2
                }}
              >
                {getUserInitials()}
              </Avatar>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {getDisplayName()}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {getUserEmail()}
              </Typography>
            </Box>
          </Box>
        )}
        
        <Divider />
        
        {/* Always show navigation list */}
        <List sx={{ px: 1, py: 1.5 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.id} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                <Tooltip 
                  title={!isSidebarOpen ? item.label : ''} 
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      minHeight: 48,
                      justifyContent: isSidebarOpen ? 'initial' : 'center',
                      px: 2.5,
                      py: 1,
                      borderRadius: theme.shape.borderRadius,
                      ...(isActive && {
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)',
                      }),
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isSidebarOpen ? 2 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? 'primary.main' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {isSidebarOpen && (
                      <ListItemText 
                        primary={item.label} 
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'primary.main' : 'inherit',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Sidebar collapse/expand button */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={toggleSidebar}>
            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;