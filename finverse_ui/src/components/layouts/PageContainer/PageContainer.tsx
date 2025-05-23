import React from 'react';
import { Container, Box, Typography, Breadcrumbs, Link, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMainLayout } from '../MainLayout/MainLayoutContext';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  // breadcrumbs can be an array of objects like { label: string, path?: string }
  breadcrumbs?: Array<{ label: string; path?: string }>; 
  action?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disableAnimation?: boolean;
}

// Animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  title, 
  breadcrumbs,
  action,
  maxWidth = 'lg',
  disableAnimation = false
}) => {
  const theme = useTheme();
  const location = useLocation();
  const { isMobile } = useMainLayout();

  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = () => {
    if (breadcrumbs) return breadcrumbs;
    
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return [];
    
    return paths.map((path, index) => {
      const url = `/${paths.slice(0, index + 1).join('/')}`;
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      
      return {
        label,
        path: index < paths.length - 1 ? url : undefined
      };
    });
  };

  const currentBreadcrumbs = generateBreadcrumbs();
  
  return (
    <motion.div
      initial={disableAnimation ? undefined : 'initial'}
      animate={disableAnimation ? undefined : 'in'}
      exit={disableAnimation ? undefined : 'out'}
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%' }}
    >
      <Container maxWidth={maxWidth} sx={{ py: 3 }}>
        {/* Header Section */}
        {(title || breadcrumbs || action) && (
          <Box mb={3}>
            {/* Breadcrumbs */}
            {currentBreadcrumbs.length > 0 && (
              <Breadcrumbs 
                aria-label="breadcrumb" 
                sx={{ mb: 1 }}
              >
                <Link
                  component={RouterLink}
                  to="/"
                  color="inherit"
                  underline="hover"
                >
                  Home
                </Link>
                {currentBreadcrumbs.map((crumb, index) => {
                  const isLast = index === currentBreadcrumbs.length - 1;
                  
                  if (isLast || !crumb.path) {
                    return (
                      <Typography 
                        key={index} 
                        color="text.primary"
                        variant="body2"
                        sx={{ fontWeight: 500 }}
                      >
                        {crumb.label}
                      </Typography>
                    );
                  }
                  
                  return (
                    <Link 
                      key={index} 
                      component={RouterLink} 
                      to={crumb.path} 
                      color="inherit"
                      underline="hover"
                      variant="body2"
                    >
                      {crumb.label}
                    </Link>
                  );
                })}
              </Breadcrumbs>
            )}
            
            {/* Title and Actions */}
            <Box 
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 2 : 0,
              }}
            >
              {title && (
                <Typography 
                  variant={isMobile ? 'h5' : 'h4'} 
                  component="h1" 
                  fontWeight={600}
                  sx={{ color: theme.palette.text.primary }}
                >
                  {title}
                </Typography>
              )}
              
              {action && (
                <Box sx={{ 
                  width: isMobile ? '100%' : 'auto',
                }}>
                  {action}
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* Main Content */}
        <Box>{children}</Box>
      </Container>
    </motion.div>
  );
};

export default PageContainer;