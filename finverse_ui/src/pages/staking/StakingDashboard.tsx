import React from 'react';
import { StakingDashboard as StakingDashboardComponent } from '../../components/staking';

// This is just a wrapper around the now modularized StakingDashboard component
const StakingDashboard: React.FC = () => {
  return <StakingDashboardComponent />;
};

export default StakingDashboard;
