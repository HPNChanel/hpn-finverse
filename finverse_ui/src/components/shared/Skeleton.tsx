import React from 'react';
import { 
  Skeleton as MuiSkeleton, 
  Box, 
  Grid, 
  Card, 
  CardHeader, 
  CardContent, 
  useTheme,
  type SkeletonProps as MuiSkeletonProps,
  type GridProps
} from '@mui/material';

interface SkeletonProps extends MuiSkeletonProps {
  // Additional props specific to our custom Skeleton
  count?: number;
  spacing?: number;
}

// Basic skeleton component with count option
const Skeleton: React.FC<SkeletonProps> = ({ 
  count = 1, 
  variant = 'text',
  spacing = 1,
  ...props 
}) => {
  return (
    <>
      {Array.from(new Array(count)).map((_, index) => (
        <MuiSkeleton 
          key={index} 
          variant={variant} 
          {...props} 
          sx={{ 
            mb: index < count - 1 ? spacing : 0,
            ...props.sx 
          }} 
        />
      ))}
    </>
  );
};

// Card skeleton for data displays
export const CardSkeleton: React.FC<{ headerHeight?: number }> = ({ headerHeight = 72 }) => {
  return (
    <Card>
      <CardHeader
        title={<MuiSkeleton height={20} width="60%" />}
        subheader={<MuiSkeleton height={16} width="40%" />}
        sx={{ height: headerHeight, pb: 1 }}
      />
      <CardContent>
        <MuiSkeleton height={20} />
        <MuiSkeleton height={20} width="80%" />
        <MuiSkeleton height={20} width="60%" />
        <Box sx={{ mt: 2 }}>
          <MuiSkeleton height={120} variant="rectangular" />
        </Box>
      </CardContent>
    </Card>
  );
};

// Grid of cards skeleton
export const GridSkeleton: React.FC<{ 
  count?: number, 
  xs?: number, 
  sm?: number, 
  md?: number,
  cardHeight?: number | string,
  spacing?: number,
  gridProps?: GridProps
}> = ({ 
  count = 4, 
  xs = 12, 
  sm = 6, 
  md = 3, 
  cardHeight = 200,
  spacing = 3,
  gridProps = {}
}) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={spacing} {...gridProps}>
      {Array.from(new Array(count)).map((_, index) => (
        <Grid item key={index} xs={xs} sm={sm} md={md}>
          <Card sx={{ height: cardHeight }}>
            <CardContent>
              <MuiSkeleton height={24} width="70%" />
              <MuiSkeleton height={16} width="50%" sx={{ mb: 1.5 }}/>
              <MuiSkeleton height={60} variant="rectangular" sx={{ borderRadius: theme.shape.borderRadius }} />
              <Box mt={2}>
                <MuiSkeleton height={16} />
                <MuiSkeleton height={16} width="80%" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Table skeleton for data tables
export const TableSkeleton: React.FC<{ 
  rowCount?: number, 
  columnCount?: number,
  headerHeight?: number,
  rowHeight?: number
}> = ({ 
  rowCount = 5, 
  columnCount = 4,
  headerHeight = 50,
  rowHeight = 40
}) => {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        mb: 1, 
        height: headerHeight, 
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        {Array.from(new Array(columnCount)).map((_, index) => (
          <Box key={`header-${index}`} sx={{ flex: 1, px: 1 }}>
            <MuiSkeleton height={20} width={`${Math.random() * 50 + 30}%`} />
          </Box>
        ))}
      </Box>
      
      {/* Rows */}
      {Array.from(new Array(rowCount)).map((_, rowIndex) => (
        <Box 
          key={`row-${rowIndex}`} 
          sx={{ 
            display: 'flex', 
            py: 1, 
            height: rowHeight,
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            '&:last-child': {
              borderBottom: 0
            }
          }}
        >
          {Array.from(new Array(columnCount)).map((_, colIndex) => (
            <Box key={`cell-${rowIndex}-${colIndex}`} sx={{ flex: 1, px: 1 }}>
              <MuiSkeleton height={16} width={`${Math.random() * 70 + 30}%`} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array.from(new Array(4)).map((_, index) => (
          <Grid item key={`stat-${index}`} xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <MuiSkeleton height={16} width={80} />
                  <MuiSkeleton height={32} width={100} sx={{ mt: 1 }} />
                  <MuiSkeleton height={14} width={60} sx={{ mt: 1 }} />
                </Box>
                <MuiSkeleton variant="circular" width={40} height={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Main content area with chart and table */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={<MuiSkeleton height={20} width="40%" />}
              subheader={<MuiSkeleton height={16} width="20%" />}
            />
            <CardContent>
              <MuiSkeleton variant="rectangular" height={250} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title={<MuiSkeleton height={20} width="60%" />} />
            <CardContent>
              <MuiSkeleton height={16} />
              <MuiSkeleton height={16} />
              <MuiSkeleton height={16} />
              <MuiSkeleton height={16} />
              <MuiSkeleton height={16} width="80%" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Skeleton;
