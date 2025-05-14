import React from 'react';
import { Grid } from '@mui/material';
import type { GridProps } from '@mui/material/Grid';

// This component wraps MUI Grid to handle the 'item' prop issue
interface GridItemProps extends Omit<GridProps, 'item'> {
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
}

const GridItem: React.FC<GridItemProps> = (props) => {
  // Use Grid directly with props and add item=true
  return <Grid item {...props} />;
};

export default GridItem;
