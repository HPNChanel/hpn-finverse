import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  Stack,
} from '@mui/material';
type PaletteMode = 'light' | 'dark';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';

interface NavbarProps {
  toggleColorMode: () => void;
  mode: PaletteMode;
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
  toggleDrawer?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  toggleColorMode,
  mode,
  isSidebarOpen = true,
  toggleSidebar = () => {},
  toggleDrawer = () => {}
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  
  // Handle user menu
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Handle notifications
  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };
  
  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };
  
  // Get user initials with loading fallback
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
    return user.email || '';
  };

  // Navigation items
  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Accounts', path: '/accounts' },
    { label: 'Transactions', path: '/transactions' },
    { label: 'Goals', path: '/goals' },
  ];
  
  return (
    <AppBar 
      position="fixed"
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        {/* Mobile menu toggle */}
        <IconButton
          color="inherit"
          aria-label="toggle drawer"
          edge="start"
          onClick={toggleDrawer}
          sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Desktop sidebar toggle */}
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
        >
          {isSidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
        
        {/* Logo */}
        <Typography
          variant="h5"
          component={RouterLink}
          to="/dashboard"
          sx={{
            mr: 4,
            fontWeight: 700,
            color: 'primary.main',
            textDecoration: 'none',
            letterSpacing: '-0.025em',
          }}
        >
          FinVerse
        </Typography>
        
        {/* Desktop navigation */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              color="inherit"
              variant={location.pathname === item.path ? 'contained' : 'text'}
              sx={{ 
                fontWeight: 500,
                px: 2,
                py: 1,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        
        {/* Action buttons */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {/* Theme toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}>
            <IconButton color="inherit" onClick={toggleColorMode}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleOpenNotifications}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User menu */}
          <Tooltip title="Open user menu">
            <IconButton onClick={handleOpenUserMenu} disabled={isLoading}>
              {user?.avatar_url ? (
                <Avatar 
                  src={user.avatar_url}
                  sx={{ 
                    width: 36, 
                    height: 36,
                  }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: isLoading ? 'grey.400' : 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {getUserInitials()}
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Stack>

        {/* User dropdown menu */}
        <Menu
          anchorEl={anchorElUser}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              elevation: 8,
              sx: {
                minWidth: 220,
                mt: 1,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {getDisplayName()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getUserEmail()}
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => { navigate('/settings'); handleCloseUserMenu(); }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
        
        {/* Notifications menu */}
        <Menu
          anchorEl={anchorElNotifications}
          open={Boolean(anchorElNotifications)}
          onClose={handleCloseNotifications}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{
            paper: {
              sx: {
                width: 360,
                maxHeight: 400,
                mt: 1,
                borderRadius: 2,
              },
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
