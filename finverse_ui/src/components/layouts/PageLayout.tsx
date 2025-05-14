import React, { ReactNode } from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  breadcrumbs?: Array<{
    label: string;
    path?: string;
  }>;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  maxWidth = 'lg',
  breadcrumbs,
  action,
  sx = {},
}) => {
  return (
    <Container 
      maxWidth={maxWidth} 
      sx={{ 
        mt: { xs: 2, sm: 3, md: 4 }, 
        mb: { xs: 4, sm: 6, md: 8 },
        px: { xs: 2, sm: 3 },
        ...sx
      }}
    >
      {(title || action || breadcrumbs) && (
        <Box mb={4}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                
                if (isLast || !crumb.path) {
                  return (
                    <Typography key={index} color="text.primary">
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
                  >
                    {crumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          )}
          
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
          >
            {title && (
              <Typography variant="h4" component="h1" gutterBottom>
                {title}
              </Typography>
            )}
            
            {action && (
              <Box sx={{ ml: 2 }}>
                {action}
              </Box>
            )}
          </Box>
        </Box>
      )}
      
      {children}
    </Container>
  );
};

export default PageLayout;
