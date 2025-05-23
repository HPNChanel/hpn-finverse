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
  useTheme
} from '@mui/material';
// Replace PaletteMode import with manual type definition
type PaletteMode = 'light' | 'dark';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
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
  const { isAuthenticated, user, logout } = useAuth();
  
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  
  // Handle user menu open
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  // Handle user menu close
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Handle notifications menu open
  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };
  
  // Handle notifications menu close
  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };
  
  // Handle profile navigation
  const handleProfile = () => {
    navigate('/profile');
    handleCloseUserMenu();
  };
  
  // Handle settings navigation
  const handleSettings = () => {
    navigate('/settings');
    handleCloseUserMenu();
  };
  
  // Get initials from user name or email
  const getUserInitials = (): string => {
    if (!user) return '?';
    
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return '?';
  };
  
  return (
    <AppBar 
      position="fixed"
      elevation={0}
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        {isAuthenticated ? (
          // Mobile menu toggle button
          <>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Desktop sidebar toggle button */}
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              edge="start"
              onClick={toggleSidebar}
              sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
            >
              {isSidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </>
        ) : null}
        
        {/* Logo */}
        <Typography
          variant="h6"
          component={RouterLink}
          to={isAuthenticated ? '/dashboard' : '/'}
          sx={{
            mr: 2,
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
            letterSpacing: '.1rem',
          }}
        >
          FINVERSE
        </Typography>
        
        {/* Desktop navigation links - only shown if authenticated */}
        {isAuthenticated && (
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              component={RouterLink}
              to="/dashboard"
              color="inherit"
              sx={{ 
                mx: 1,
                position: 'relative',
                '&::after': location.pathname === '/dashboard' ? {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '3px',
                  bottom: 0,
                  left: 0,
                  backgroundColor: 'primary.light',
                  borderRadius: '2px 2px 0 0',
                } : {}
              }}
            >
              Dashboard
            </Button>
            <Button
              component={RouterLink}
              to="/accounts"
              color="inherit"
              sx={{ 
                mx: 1,
                position: 'relative',
                '&::after': location.pathname === '/accounts' ? {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '3px',
                  bottom: 0,
                  left: 0,
                  backgroundColor: 'primary.light',
                  borderRadius: '2px 2px 0 0',
                } : {}
              }}
            >
              Accounts
            </Button>
            <Button
              component={RouterLink}
              to="/transactions"
              color="inherit"
              sx={{ 
                mx: 1,
                position: 'relative',
                '&::after': location.pathname === '/transactions' ? {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '3px',
                  bottom: 0,
                  left: 0,
                  backgroundColor: 'primary.light',
                  borderRadius: '2px 2px 0 0',
                } : {}
              }}
            >
              Transactions
            </Button>
            <Button
              component={RouterLink}
              to="/goals"
              color="inherit"
              sx={{ 
                mx: 1,
                position: 'relative',
                '&::after': location.pathname === '/goals' ? {
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  height: '3px',
                  bottom: 0,
                  left: 0,
                  backgroundColor: 'primary.light',
                  borderRadius: '2px 2px 0 0',
                } : {}
              }}
            >
              Goals
            </Button>
          </Box>
        )}
        
        {/* Action buttons - adjusts based on auth state */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Theme toggle button */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}>
            <IconButton color="inherit" onClick={toggleColorMode} sx={{ ml: 1 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton 
                  color="inherit" 
                  onClick={handleOpenNotifications}
                  sx={{ ml: 1 }}
                >
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              {/* User menu */}
              <Tooltip title="Open user menu">
                <IconButton 
                  onClick={handleOpenUserMenu} 
                  sx={{ ml: 1 }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              
              {/* User dropdown menu */}
              <Menu
                id="user-menu"
                anchorEl={anchorElUser}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    minWidth: 200,
                    mt: 1.5,
                    borderRadius: 2,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {user?.name || user?.username || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user?.email || ''}
                  </Typography>
                </Box>
                
                <Divider />
                
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                
                <MenuItem onClick={handleSettings}>
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
              
              {/* Notifications dropdown */}
              <Menu
                id="notifications-menu"
                anchorEl={anchorElNotifications}
                open={Boolean(anchorElNotifications)}
                onClose={handleCloseNotifications}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    width: 320,
                    maxHeight: 400,
                    mt: 1.5,
                    borderRadius: 2,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Notifications
                  </Typography>
                  <Button size="small">Mark all as read</Button>
                </Box>
                
                <Divider />
                
                {/* Notification items */}
                <MenuItem onClick={handleCloseNotifications}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="New Transaction Added" 
                    secondary="Transaction of $250.00 was recorded" 
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </MenuItem>
                
                <MenuItem onClick={handleCloseNotifications}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Budget Limit Reached" 
                    secondary="Entertainment budget reached 90%" 
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </MenuItem>
                
                <MenuItem onClick={handleCloseNotifications}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Goal Progress Updated" 
                    secondary="Vacation fund reached 50%" 
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </MenuItem>
                
                <Divider />
                
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    onClick={() => {
                      navigate('/notifications');
                      handleCloseNotifications();
                    }}
                  >
                    View All Notifications
                  </Button>
                </Box>
              </Menu>
            </>
          ) : (
            /* Login/Register buttons for logged out state */
            <>
              <Button 
                component={RouterLink} 
                to="/login" 
                color="inherit"
                sx={{ mx: 1 }}
              >
                Login
              </Button>
              <Button 
                component={RouterLink} 
                to="/register" 
                variant="contained" 
                color="secondary"
                sx={{ ml: 1 }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
