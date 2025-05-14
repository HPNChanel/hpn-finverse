import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Container,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  AccountCircle as ProfileIcon,
  AccountBalance as AccountIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  toggleColorMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleColorMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  
  // Handle user menu open
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  
  // Handle user menu close
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
    navigate('/login');
  };

  // Handle logo click
  const handleLogoClick = (e: React.MouseEvent) => {
    if (isAuthenticated) {
      e.preventDefault();
      // If authenticated, stay on current page
      return;
    }
    // Otherwise navigate to landing page (default behavior)
  };

  // Handle theme change
  const handleThemeChange = () => {
    toggleColorMode();
    handleCloseUserMenu();
  };
  
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo/Brand */}
          <Typography
            variant="h6"
            component={RouterLink}
            to={isAuthenticated ? location.pathname : "/"}
            sx={{
              mr: 2,
              display: 'flex',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
            onClick={handleLogoClick}
          >
            FinVerse
          </Typography>
          
          {/* Desktop Navigation Links */}
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            {isAuthenticated && (
              <>
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  color="inherit"
                >
                  Dashboard
                </Button>
                <Button
                  component={RouterLink}
                  to="/budgets"
                  color="inherit"
                >
                  Budget
                </Button>
                <Button
                  component={RouterLink}
                  to="/transfer"
                  color="inherit"
                >
                  Transfer
                </Button>
                <Button
                  component={RouterLink}
                  to="/transactions"
                  color="inherit"
                >
                  Transactions
                </Button>
                <Button
                  component={RouterLink}
                  to="/recurring-transactions"
                  color="inherit"
                >
                  Recurring
                </Button>
                <Button
                  component={RouterLink}
                  to="/staking"
                  color="inherit"
                >
                  Staking
                </Button>
              </>
            )}
          </Box>
          
          {/* Auth Actions */}
          <Box sx={{ ml: 2 }}>
            {isAuthenticated ? (
              <>
                <Tooltip title={user?.username || 'Profile'}>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, mr: 2 }}>
                    <ProfileIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem component={RouterLink} to="/accounts" onClick={handleCloseUserMenu}>
                    <ListItemIcon>
                      <AccountIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Accounts" />
                  </MenuItem>
                  
                  <MenuItem component={RouterLink} to="/profile" onClick={handleCloseUserMenu}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                  </MenuItem>
                  
                  <MenuItem onClick={handleThemeChange}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Toggle Theme" />
                  </MenuItem>
                  
                  <Divider />
                  
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  color="inherit"
                  sx={{ mr: 1 }}
                >
                  Login
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="secondary"
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;