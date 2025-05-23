import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MainLayoutContextProps {
  isMobile: boolean;
  isSidebarOpen: boolean;
  isDrawerOpen: boolean;
  toggleSidebar: () => void;
  toggleDrawer: () => void;
  closeDrawer: () => void;
}

const MainLayoutContext = createContext<MainLayoutContextProps>({
  isMobile: false,
  isSidebarOpen: true,
  isDrawerOpen: false,
  toggleSidebar: () => {},
  toggleDrawer: () => {},
  closeDrawer: () => {},
});

interface MainLayoutProviderProps {
  children: ReactNode;
}

export const MainLayoutProvider: React.FC<MainLayoutProviderProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 900);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(!isMobile);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      
      // If switching to mobile view, ensure sidebar is closed
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      // If switching to desktop view, ensure sidebar is open
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarOpen]);

  // Toggle sidebar open/closed state
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Toggle mobile drawer open/closed state
  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev);
  };

  // Close mobile drawer
  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <MainLayoutContext.Provider
      value={{
        isMobile,
        isSidebarOpen,
        isDrawerOpen,
        toggleSidebar,
        toggleDrawer,
        closeDrawer
      }}
    >
      {children}
    </MainLayoutContext.Provider>
  );
};

// Custom hook for using the MainLayout context
export const useMainLayout = (): MainLayoutContextProps => {
  const context = useContext(MainLayoutContext);
  
  if (!context) {
    throw new Error('useMainLayout must be used within a MainLayoutProvider');
  }
  
  return context;
};
