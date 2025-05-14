import React from 'react';
import { Box, Skeleton as MuiSkeleton, Paper, Grid } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface CardSkeletonProps {
  count?: number;
  height?: number;
  sx?: SxProps<Theme>;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  count = 3,
  height = 200,
  sx
}) => {
  return (
    <Grid container spacing={3} sx={sx}>
      {Array.from(new Array(count)).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Paper sx={{ p: 2, height: height }}>
            <MuiSkeleton variant="rectangular" height={40} />
            <MuiSkeleton variant="text" sx={{ mt: 2 }} />
            <MuiSkeleton variant="text" />
            <MuiSkeleton variant="rectangular" height={60} sx={{ mt: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <MuiSkeleton variant="rectangular" width={100} height={30} />
              <MuiSkeleton variant="rectangular" width={100} height={30} />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
  sx?: SxProps<Theme>;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowCount = 5,
  columnCount = 4,
  sx
}) => {
  return (
    <Paper sx={sx}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex' }}>
        {Array.from(new Array(columnCount)).map((_, index) => (
          <Box key={index} sx={{ flex: 1, px: 1 }}>
            <MuiSkeleton variant="rectangular" height={30} />
          </Box>
        ))}
      </Box>
      
      {/* Rows */}
      {Array.from(new Array(rowCount)).map((_, rowIndex) => (
        <Box key={rowIndex} sx={{ p: 2, display: 'flex' }}>
          {Array.from(new Array(columnCount)).map((_, colIndex) => (
            <Box key={colIndex} sx={{ flex: 1, px: 1 }}>
              <MuiSkeleton variant="text" />
            </Box>
          ))}
        </Box>
      ))}
    </Paper>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      <MuiSkeleton variant="rectangular" height={50} width="50%" sx={{ mb: 4 }} />
      
      <Grid container spacing={3}>
        {Array.from(new Array(3)).map((_, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper sx={{ p: 3, height: 140 }}>
              <MuiSkeleton variant="text" width="60%" />
              <MuiSkeleton variant="rectangular" height={40} sx={{ mt: 2 }} />
              <MuiSkeleton variant="text" width="40%" sx={{ mt: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
