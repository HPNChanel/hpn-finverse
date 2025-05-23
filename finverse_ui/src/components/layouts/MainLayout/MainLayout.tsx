import React from 'react';
import { Box, useTheme, type PaletteMode, CssBaseline } from '@mui/material';
import { MainLayoutProvider, useMainLayout } from './MainLayoutContext';
import Navbar from '../navigation/Navbar/Navbar';
import Drawer from '../navigation/Drawer/Drawer'; // This is the mobile Drawer
import Sidebar from '../navigation/Sidebar/Sidebar'; // The collapsible Sidebar

// Define constants for sidebar widths
const SIDEBAR_WIDTH_OPEN = 280;
const SIDEBAR_WIDTH_COLLAPSED = 88; 

interface MainLayoutProps {
  children: React.ReactNode;
  toggleColorMode: () => void;
  mode: PaletteMode;
}

const LayoutContent: React.FC<MainLayoutProps> = ({ children, toggleColorMode, mode }) => {
  const theme = useTheme();
  const { isMobile, isSidebarOpen, toggleSidebar, toggleDrawer } = useMainLayout();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <CssBaseline />

      {/* Always render Navbar (Top Bar) */}
      <Navbar 
        toggleColorMode={toggleColorMode} 
        mode={mode} 
        isSidebarOpen={!isMobile && isSidebarOpen}
        toggleSidebar={toggleSidebar}
        toggleDrawer={toggleDrawer}
      />

      {/* Desktop/Tablet Collapsible Sidebar */}
      {!isMobile && <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} isMobile={isMobile} />}
      
      {/* Mobile-only Drawer */}
      {isMobile && <Drawer toggleColorMode={toggleColorMode} mode={mode} />}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: `${theme.mixins.toolbar.minHeight}px`,
          mt: { xs: '56px', sm: '64px' }, // Adjust if toolbar height differs
          pb: 2,        
          width: '100%',
          overflowY: 'auto',
          marginLeft: isMobile ? 0 : (isSidebarOpen ? `${SIDEBAR_WIDTH_OPEN}px` : `${SIDEBAR_WIDTH_COLLAPSED}px`),
          transition: theme.transitions.create('margin-left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// The MainLayout component now just wraps LayoutContent with the provider
const MainLayout: React.FC<MainLayoutProps> = (props) => {
  return (
    <MainLayoutProvider>
      <LayoutContent {...props} />    
    </MainLayoutProvider>
  );
};    

export default MainLayout;
