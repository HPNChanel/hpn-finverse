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
  Stack,
  useTheme,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  EmojiEvents as GoalDefaultIcon,
} from '@mui/icons-material';
import type { FinancialGoal } from '../../types';

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
  const theme = useTheme();
  const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
  
  const daysRemaining = differenceInDays(
    parseISO(goal.target_date),
    new Date()
  );
  
  // Helper functions for displaying status and priority
  const getStatusConfig = (status: number) => {
    switch (status) {
      case 1: return { text: 'Ongoing', color: 'primary' as const };
      case 2: return { text: 'Completed', color: 'success' as const };
      case 3: return { text: 'Cancelled', color: 'error' as const };
      default: return { text: 'Unknown', color: 'default' as const };
    }
  };
  
  const getPriorityConfig = (priority: number) => {
    switch (priority) {
      case 1: return { text: 'Low', color: theme.palette.success.main };
      case 2: return { text: 'Medium', color: theme.palette.warning.main };
      case 3: return { text: 'High', color: theme.palette.error.main };
      default: return { text: 'Unknown', color: theme.palette.grey[500] };
    }
  };

  const statusConfig = getStatusConfig(goal.status);
  const priorityConfig = getPriorityConfig(goal.priority);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Determine icon
  const goalIcon = () => {
    if (goal.icon && typeof goal.icon === 'string' && goal.icon.length > 0) {
      return <Typography variant="h6" component="span">{goal.icon}</Typography>;
    }
    if (goal.name) {
      return <Typography variant="h6" component="span" fontWeight={600}>
        {goal.name.charAt(0).toUpperCase()}
      </Typography>;
    }
    return <GoalDefaultIcon />;
  };

  return (
    <Card 
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${priorityConfig.color}, ${priorityConfig.color}88)`,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with icon and title */}
        <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
          <Box 
            sx={{ 
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: goal.color || priorityConfig.color,
              color: theme.palette.getContrastText(goal.color || priorityConfig.color),
              flexShrink: 0,
            }}
          >
            {goalIcon()}
          </Box>
          <Box flexGrow={1} minWidth={0}>
            <Typography 
              variant="h6" 
              component="h3" 
              fontWeight={600}
              noWrap
              mb={0.5}
            >
              {goal.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={statusConfig.text} 
                color={statusConfig.color}
                size="small"
                variant="filled"
              />
              <Chip 
                label={priorityConfig.text}
                size="small"
                variant="outlined"
                sx={{ 
                  borderColor: priorityConfig.color,
                  color: priorityConfig.color,
                }}
              />
            </Stack>
          </Box>
        </Box>
        
        {/* Progress section */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="h6" fontWeight={600} color={progress >= 100 ? 'success.main' : 'primary.main'}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={progress >= 100 ? "success" : "primary"}
            sx={{ mb: 2 }}
          />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Current
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatCurrency(goal.current_amount)}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" display="block">
                Target
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatCurrency(goal.target_amount)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Time remaining */}
        {goal.status === 1 && (
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1}
            p={1.5}
            borderRadius={1}
            bgcolor="action.hover"
            mb={2}
          >
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {daysRemaining > 0 
                ? `${daysRemaining} days remaining` 
                : daysRemaining === 0 
                  ? "Due today!" 
                  : `${Math.abs(daysRemaining)} days overdue`}
            </Typography>
          </Box>
        )}
        
        {/* Description */}
        {goal.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {goal.description}
          </Typography>
        )}
      </CardContent>
      
      <CardActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end' }}>
        <Tooltip title="Edit goal">
          <IconButton 
            size="small" 
            onClick={() => onEdit(goal.id)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete goal">
          <IconButton 
            size="small" 
            onClick={() => onDelete(goal.id)}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'error.main' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default GoalCard;