import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions,
  Typography, 
  LinearProgress, 
  Box, 
  Chip,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import type { FinancialGoal } from '../../utils/importFixes';
import GridItem from './GridItem';

// Mock implementation of date functions if date-fns is not available
const differenceInDays = (date1: Date, date2: Date): number => {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const parseISO = (dateString: string): Date => new Date(dateString);

interface GoalCardProps {
  goal: FinancialGoal;
  onEdit: (goalId: number) => void;
  onDelete: (goalId: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete }) => {
  // Calculate progress percentage
  const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
  
  // Calculate days remaining
  const daysRemaining = differenceInDays(
    parseISO(goal.target_date),
    new Date()
  );
  
  // Helper functions for displaying status and priority
  const getStatusText = (status: number): string => {
    switch (status) {
      case 1: return 'Ongoing';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };
  
  const getStatusColor = (status: number): 'primary' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 1: return 'primary';
      case 2: return 'success';
      case 3: return 'error';
      default: return 'default';
    }
  };
  
  const getPriorityText = (priority: number): string => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      default: return 'Unknown';
    }
  };
  
  const getPriorityColor = (priority: number): string => {
    switch (priority) {
      case 1: return '#4caf50'; // Green
      case 2: return '#ff9800'; // Orange
      case 3: return '#f44336'; // Red
      default: return '#757575'; // Grey
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: '4px solid',
        borderColor: getPriorityColor(goal.priority),
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Goal name and icon */}
        <Box display="flex" alignItems="center" mb={1}>
          <Box 
            sx={{ 
              backgroundColor: goal.color || '#1976d2',
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              mr: 1
            }}
          >
            {goal.icon || goal.name.charAt(0).toUpperCase()}
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {goal.name}
          </Typography>
        </Box>
        
        {/* Status badge */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Chip 
            label={getStatusText(goal.status)} 
            color={getStatusColor(goal.status)}
            size="small"
          />
          <Chip 
            label={`Priority: ${getPriorityText(goal.priority)}`}
            sx={{ 
              backgroundColor: getPriorityColor(goal.priority),
              color: 'white'
            }}
            size="small"
          />
        </Box>
        
        {/* Amount and progress */}
        <Box mb={1}>
          <Grid container justifyContent="space-between" alignItems="center">
            <GridItem xs={6}>
              <Typography variant="body2" color="text.secondary">
                Current
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ${goal.current_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </GridItem>
            <GridItem xs={6}>
              <Typography variant="body2" color="text.secondary" align="right">
                Target
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold" align="right">
                ${goal.target_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </GridItem>
          </Grid>
          <Box mt={1}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              color={progress >= 100 ? "success" : "primary"}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" align="right" mt={0.5}>
              {progress}% complete
            </Typography>
          </Box>
        </Box>
        
        {/* Time remaining */}
        {goal.status === 1 && (
          <Box display="flex" alignItems="center" mt={2}>
            <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {daysRemaining > 0 
                ? `${daysRemaining} days remaining` 
                : daysRemaining === 0 
                  ? "Due today!" 
                  : `${Math.abs(daysRemaining)} days overdue`}
            </Typography>
          </Box>
        )}
        
        {/* Description (if any) */}
        {goal.description && (
          <Typography variant="body2" color="text.secondary" mt={1} sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {goal.description}
          </Typography>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit(goal.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={() => onDelete(goal.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default GoalCard; 